import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  DEFAULT_PUBLISHABLE_KEY,
  HttpError,
  SquareApi,
  assertAdmin,
  createProjectInvoice,
  getSquareConfig,
  sendInvoice,
} from './_lib/project-invoice';
import { getSupabaseConfig } from './_lib/save-lead';
import { SupabaseRest } from './_lib/supabase-rest';

/**
 * Admin-only Square invoicing.
 * - { action: 'create', projectId, amount, split, depositDue, balanceDue, description }
 *   creates a draft invoice for a project.
 * - { action: 'send', invoiceId } publishes a draft, so Square emails it.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const supabase = getSupabaseConfig();
  const squareConfig = getSquareConfig();
  if (!supabase || !squareConfig) {
    res.status(500).json({ error: 'Square invoicing is not set up yet (SQUARE_ACCESS_TOKEN is missing).' });
    return;
  }

  const auth = req.headers.authorization ?? '';
  const body = ((typeof req.body === 'string' ? safeJson(req.body) : req.body) ?? {}) as Record<string, unknown>;

  try {
    await assertAdmin(
      auth.startsWith('Bearer ') ? auth.slice(7) : undefined,
      supabase.url,
      process.env['SUPABASE_PUBLISHABLE_KEY'] || DEFAULT_PUBLISHABLE_KEY,
    );
    const deps = { square: new SquareApi(squareConfig), db: new SupabaseRest(supabase) };
    if (body['action'] === 'send') {
      res.status(200).json(await sendInvoice(body['invoiceId'], deps));
    } else if (body['action'] === 'create') {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
      res.status(200).json(
        await createProjectInvoice(
          {
            projectId: body['projectId'],
            amount: body['amount'],
            split: body['split'],
            depositDue: body['depositDue'],
            balanceDue: body['balanceDue'],
            description: body['description'],
          },
          { ...deps, today },
        ),
      );
    } else {
      res.status(400).json({ error: 'Unknown action.' });
    }
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Project invoice failed:', err);
    res.status(500).json({ error: 'Something went wrong talking to Square.' });
  }
}

function safeJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}
