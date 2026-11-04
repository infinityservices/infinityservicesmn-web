import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DEFAULT_PUBLISHABLE_KEY, invitePortalMember, portalRedirect } from './_lib/portal-invite';
import { getSupabaseConfig } from './_lib/save-lead';

/** Admin-only: give an email access to a client's portal and email them a link. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const config = getSupabaseConfig();
  if (!config) {
    res.status(500).json({ error: 'Supabase is not configured.' });
    return;
  }

  const auth = req.headers.authorization ?? '';
  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) ?? {};
  const origin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;

  try {
    const result = await invitePortalMember(
      {
        accessToken: auth.startsWith('Bearer ') ? auth.slice(7) : undefined,
        clientId: body.clientId,
        email: body.email,
        redirectTo: portalRedirect(origin),
      },
      { config, publishableKey: process.env['SUPABASE_PUBLISHABLE_KEY'] || DEFAULT_PUBLISHABLE_KEY },
    );
    if (result.ok) {
      res.status(200).json({ outcome: result.outcome });
    } else {
      res.status(result.status).json({ error: result.error });
    }
  } catch (err) {
    console.error('Portal invite crashed:', err);
    res.status(500).json({ error: 'Something went wrong sending the invite.' });
  }
}

function safeJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}
