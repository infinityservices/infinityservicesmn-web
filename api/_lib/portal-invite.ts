import { authHeaders, type SupabaseConfig } from './save-lead';

/**
 * The publishable key is public (it ships in the browser bundle). It is used
 * here only to ask Supabase whether the caller's own login is an admin.
 */
export const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_e6cm95-aqZtNaGSophD8zg_fO7aisnK';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface InviteRequest {
  accessToken: string | undefined;
  clientId: unknown;
  email: unknown;
  /** Where the email's link should land, e.g. https://infinityservicesmn.com/portal */
  redirectTo: string;
}

export type InviteResult =
  | { ok: true; status: 200; outcome: 'invited' | 'login_link_sent' }
  | { ok: false; status: 400 | 401 | 403 | 404 | 502; error: string };

export interface InviteDeps {
  config: SupabaseConfig;
  publishableKey: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

/**
 * Gives an email access to one client's portal and emails them a way in.
 *
 * 1. Confirms the caller is signed in as an admin (their own token + am_i_admin).
 * 2. Records the email in portal_members for that client.
 * 3. New login: sends Supabase's invite email. Existing login: sends a
 *    magic sign-in link instead. Both land on `redirectTo`.
 */
export async function invitePortalMember(req: InviteRequest, deps: InviteDeps): Promise<InviteResult> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const { url, serviceRoleKey } = deps.config;

  if (!req.accessToken) {
    return { ok: false, status: 401, error: 'Sign in first.' };
  }
  const adminCheck = await fetchImpl(`${url}/rest/v1/rpc/am_i_admin`, {
    method: 'POST',
    headers: {
      apikey: deps.publishableKey,
      Authorization: `Bearer ${req.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  if (!adminCheck.ok || (await adminCheck.json().catch(() => false)) !== true) {
    return { ok: false, status: 403, error: 'Only the admin can invite portal users.' };
  }

  const clientId = typeof req.clientId === 'string' ? req.clientId.trim() : '';
  const email = typeof req.email === 'string' ? req.email.trim().toLowerCase() : '';
  if (!UUID.test(clientId)) {
    return { ok: false, status: 400, error: 'Missing client.' };
  }
  if (!EMAIL.test(email) || email.length > 254) {
    return { ok: false, status: 400, error: 'Enter a valid email address.' };
  }

  const service = authHeaders(serviceRoleKey);

  const clientRes = await fetchImpl(
    `${url}/rest/v1/clients?select=id&id=eq.${encodeURIComponent(clientId)}`,
    { method: 'GET', headers: { ...service, Prefer: 'return=representation' } },
  );
  if (!clientRes.ok) {
    return { ok: false, status: 502, error: 'Could not reach the database.' };
  }
  if (((await clientRes.json()) as unknown[]).length === 0) {
    return { ok: false, status: 404, error: 'That client no longer exists.' };
  }

  const memberRes = await fetchImpl(`${url}/rest/v1/portal_members?on_conflict=client_id,email`, {
    method: 'POST',
    headers: { ...service, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      client_id: clientId,
      email,
      invited_at: (deps.now?.() ?? new Date()).toISOString(),
    }),
  });
  if (!memberRes.ok) {
    return { ok: false, status: 502, error: 'Could not save portal access.' };
  }

  const redirect = `redirect_to=${encodeURIComponent(req.redirectTo)}`;
  const inviteRes = await fetchImpl(`${url}/auth/v1/invite?${redirect}`, {
    method: 'POST',
    headers: service,
    body: JSON.stringify({ email }),
  });
  if (inviteRes.ok) {
    return { ok: true, status: 200, outcome: 'invited' };
  }

  // Already has a login (422 "email_exists"): send a sign-in link instead.
  if (inviteRes.status === 422) {
    const otpRes = await fetchImpl(`${url}/auth/v1/otp?${redirect}`, {
      method: 'POST',
      headers: service,
      body: JSON.stringify({ email, create_user: false }),
    });
    if (otpRes.ok) {
      return { ok: true, status: 200, outcome: 'login_link_sent' };
    }
    console.error('Portal sign-in link failed:', otpRes.status, await otpRes.text().catch(() => ''));
  } else {
    console.error('Portal invite failed:', inviteRes.status, await inviteRes.text().catch(() => ''));
  }
  return {
    ok: false,
    status: 502,
    error: 'Access saved, but the email did not send. Check Supabase Auth email settings.',
  };
}

/**
 * Picks the portal URL for the email link from the admin's own browser origin,
 * limited to known hosts so the link always points at a real copy of the site.
 */
export function portalRedirect(origin: string | undefined, fallback = 'https://infinityservicesmn.com'): string {
  let base = fallback;
  if (origin) {
    try {
      const u = new URL(origin);
      const host = u.hostname;
      const known =
        host === 'infinityservicesmn.com' ||
        host.endsWith('.infinityservicesmn.com') ||
        host.endsWith('.vercel.app') ||
        host === 'localhost';
      if (known) base = u.origin;
    } catch {
      // fall back
    }
  }
  return `${base}/portal`;
}
