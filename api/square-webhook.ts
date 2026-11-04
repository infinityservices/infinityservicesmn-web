import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readRawBody } from './_lib/raw-body';
import { getSupabaseConfig } from './_lib/save-lead';
import { handleSquareEvent, verifySquareSignature, type SquareEvent } from './_lib/square';
import { SupabaseRest } from './_lib/supabase-rest';

export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const signatureKey = process.env['SQUARE_WEBHOOK_SIGNATURE_KEY'];
  const notificationUrl = process.env['SQUARE_WEBHOOK_URL'];
  const supabase = getSupabaseConfig();
  if (!signatureKey || !notificationUrl || !supabase) {
    console.error('Square webhook is missing its signature key, URL, or Supabase configuration.');
    res.status(500).json({ error: 'Not configured.' });
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers['x-square-hmacsha256-signature'];
  const header = Array.isArray(signature) ? signature[0] : signature;
  if (!verifySquareSignature(rawBody, header, signatureKey, notificationUrl)) {
    res.status(400).json({ error: 'Invalid signature.' });
    return;
  }

  try {
    const outcome = await handleSquareEvent(JSON.parse(rawBody) as SquareEvent, new SupabaseRest(supabase));
    res.status(200).json({ received: true, outcome });
  } catch (err) {
    console.error('Square webhook failed:', err);
    res.status(500).json({ error: 'Failed to process event.' });
  }
}
