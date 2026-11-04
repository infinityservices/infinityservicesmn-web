import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readRawBody } from './_lib/raw-body';
import { getSupabaseConfig } from './_lib/save-lead';
import { handleStripeEvent, verifyStripeSignature, type StripeEvent } from './_lib/stripe';
import { SupabaseRest } from './_lib/supabase-rest';

export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const secret = process.env['STRIPE_WEBHOOK_SECRET'];
  const supabase = getSupabaseConfig();
  if (!secret || !supabase) {
    console.error('Stripe webhook is missing STRIPE_WEBHOOK_SECRET or Supabase configuration.');
    res.status(500).json({ error: 'Not configured.' });
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers['stripe-signature'];
  if (!verifyStripeSignature(rawBody, Array.isArray(signature) ? signature[0] : signature, secret)) {
    res.status(400).json({ error: 'Invalid signature.' });
    return;
  }

  try {
    const outcome = await handleStripeEvent(JSON.parse(rawBody) as StripeEvent, new SupabaseRest(supabase));
    res.status(200).json({ received: true, outcome });
  } catch (err) {
    console.error('Stripe webhook failed:', err);
    // A 500 makes Stripe retry later.
    res.status(500).json({ error: 'Failed to process event.' });
  }
}
