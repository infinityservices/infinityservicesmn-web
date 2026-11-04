import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { getSupabaseConfig, saveLead } from './_lib/save-lead';
import { isHoneypotTriggered, validateContactPayload, type ContactPayload } from './_lib/validate-contact';

const SUBJECTS: Record<ContactPayload['kind'], (name: string) => string> = {
  quick: (name) => `New contact form message from ${name}`,
  project: (name) => `New project request from ${name}`,
  beta: (name) => `InfiniHerd beta signup from ${name}`,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (isHoneypotTriggered(req.body)) {
    res.status(200).json({ ok: true });
    return;
  }

  const result = validateContactPayload(req.body);
  if (!result.valid) {
    res.status(400).json({ error: result.error });
    return;
  }

  const toEmail = process.env['CONTACT_TO_EMAIL'];
  const fromEmail = process.env['CONTACT_FROM_EMAIL'];
  const apiKey = process.env['RESEND_API_KEY'];
  const emailConfigured = Boolean(toEmail && fromEmail && apiKey);
  const supabase = getSupabaseConfig();

  if (!emailConfigured) {
    console.error('Missing contact form email configuration.');
  }
  if (!supabase) {
    console.error('Missing Supabase configuration; lead will not be saved.');
  }
  if (!emailConfigured && !supabase) {
    res.status(500).json({ error: 'Contact form is temporarily unavailable.' });
    return;
  }

  const lead = result.data;

  // Email and database save run side by side. Either one succeeding means the
  // inquiry reached Jeremy, so the visitor sees success.
  const sendEmail = async () => {
    if (!emailConfigured) {
      throw new Error('Email not configured.');
    }
    const sendResult = await new Resend(apiKey).emails.send({
      from: fromEmail!,
      to: toEmail!,
      replyTo: lead.email,
      subject: SUBJECTS[lead.kind](lead.name),
      text: `From: ${lead.name} <${lead.email}>\n\n${lead.message}`,
    });
    if (sendResult.error) {
      throw sendResult.error;
    }
  };

  const storeLead = async () => {
    if (!supabase) {
      throw new Error('Supabase not configured.');
    }
    await saveLead(lead, supabase);
  };

  const [emailOutcome, saveOutcome] = await Promise.allSettled([sendEmail(), storeLead()]);

  if (emailOutcome.status === 'rejected' && emailConfigured) {
    console.error('Failed to send contact email:', emailOutcome.reason);
  }
  if (saveOutcome.status === 'rejected' && supabase) {
    console.error('Failed to save lead:', saveOutcome.reason);
  }

  if (emailOutcome.status === 'rejected' && saveOutcome.status === 'rejected') {
    res.status(502).json({ error: 'Failed to send your message. Please try again.' });
    return;
  }

  res.status(200).json({ ok: true });
}
