import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { isHoneypotTriggered, validateContactPayload } from './_lib/validate-contact';

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

  if (!toEmail || !fromEmail || !apiKey) {
    console.error('Missing contact form email configuration.');
    res.status(500).json({ error: 'Contact form is temporarily unavailable.' });
    return;
  }

  const resend = new Resend(apiKey);
  const { name, email, message } = result.data;

  let sendError: unknown = null;
  let sendResult: Awaited<ReturnType<typeof resend.emails.send>> | null = null;
  try {
    sendResult = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: `New contact form message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });
  } catch (err) {
    sendError = err;
  }

  if (sendError || sendResult?.error) {
    console.error('Failed to send contact email:', sendError ?? sendResult?.error);
    res.status(502).json({ error: 'Failed to send your message. Please try again.' });
    return;
  }

  res.status(200).json({ ok: true });
}
