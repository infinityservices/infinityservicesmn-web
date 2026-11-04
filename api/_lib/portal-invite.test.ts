import { describe, expect, it, vi } from 'vitest';
import { invitePortalMember, portalRedirect } from './portal-invite';

const CLIENT = '11111111-2222-3333-4444-555555555555';
const config = { url: 'https://db.example', serviceRoleKey: 'sb_secret_x' };

type Reply = { status: number; body?: unknown };

/** Fake fetch that answers each URL prefix in turn and records calls. */
function fakeFetch(routes: Record<string, Reply | Reply[]>) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const key = Object.keys(routes).find((prefix) => url.startsWith(prefix));
    if (!key) throw new Error(`unexpected fetch ${url}`);
    const entry = routes[key];
    const reply = Array.isArray(entry) ? (entry.shift() as Reply) : entry;
    return new Response(reply.body === undefined ? '' : JSON.stringify(reply.body), {
      status: reply.status,
    });
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

const happy = () => ({
  'https://db.example/rest/v1/rpc/am_i_admin': { status: 200, body: true },
  'https://db.example/rest/v1/clients': { status: 200, body: [{ id: CLIENT }] },
  'https://db.example/rest/v1/portal_members': { status: 201 },
  'https://db.example/auth/v1/invite': { status: 200, body: {} },
  'https://db.example/auth/v1/otp': { status: 200, body: {} },
});

const request = (overrides: Partial<Parameters<typeof invitePortalMember>[0]> = {}) => ({
  accessToken: 'user-jwt',
  clientId: CLIENT,
  email: ' Owner@Acme.com ',
  redirectTo: 'https://infinityservicesmn.com/portal',
  ...overrides,
});

const deps = (impl: typeof fetch) => ({
  config,
  publishableKey: 'sb_publishable_x',
  fetchImpl: impl,
  now: () => new Date('2026-11-04T08:00:00Z'),
});

describe('invitePortalMember', () => {
  it('saves access and sends an invite for a new login', async () => {
    const { impl, calls } = fakeFetch(happy());
    const result = await invitePortalMember(request(), deps(impl));

    expect(result).toEqual({ ok: true, status: 200, outcome: 'invited' });
    const adminCall = calls[0];
    expect((adminCall.init.headers as Record<string, string>)['Authorization']).toBe('Bearer user-jwt');
    expect((adminCall.init.headers as Record<string, string>)['apikey']).toBe('sb_publishable_x');

    const member = calls.find((c) => c.url.includes('portal_members'))!;
    expect(JSON.parse(member.init.body as string)).toEqual({
      client_id: CLIENT,
      email: 'owner@acme.com',
      invited_at: '2026-11-04T08:00:00.000Z',
    });
    const invite = calls.find((c) => c.url.includes('/auth/v1/invite'))!;
    expect(invite.url).toContain('redirect_to=https%3A%2F%2Finfinityservicesmn.com%2Fportal');
    expect(JSON.parse(invite.init.body as string)).toEqual({ email: 'owner@acme.com' });
  });

  it('sends a sign-in link when the email already has a login', async () => {
    const routes = happy();
    routes['https://db.example/auth/v1/invite'] = { status: 422, body: { error_code: 'email_exists' } };
    const { impl, calls } = fakeFetch(routes);
    const result = await invitePortalMember(request(), deps(impl));

    expect(result).toEqual({ ok: true, status: 200, outcome: 'login_link_sent' });
    const otp = calls.find((c) => c.url.includes('/auth/v1/otp'))!;
    expect(JSON.parse(otp.init.body as string)).toEqual({ email: 'owner@acme.com', create_user: false });
  });

  it('refuses callers who are not signed in', async () => {
    const { impl, calls } = fakeFetch(happy());
    const result = await invitePortalMember(request({ accessToken: undefined }), deps(impl));
    expect(result).toMatchObject({ ok: false, status: 401 });
    expect(calls).toHaveLength(0);
  });

  it('refuses signed-in users who are not the admin', async () => {
    const routes = happy();
    routes['https://db.example/rest/v1/rpc/am_i_admin'] = { status: 200, body: false };
    const { impl, calls } = fakeFetch(routes);
    const result = await invitePortalMember(request(), deps(impl));
    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(calls).toHaveLength(1);
  });

  it('rejects a bad email or client id before writing anything', async () => {
    for (const bad of [{ email: 'nope' }, { clientId: 'x' }, { email: 42 }]) {
      const { impl, calls } = fakeFetch(happy());
      const result = await invitePortalMember(request(bad), deps(impl));
      expect(result).toMatchObject({ ok: false, status: 400 });
      expect(calls.some((c) => c.url.includes('portal_members'))).toBe(false);
    }
  });

  it('reports a missing client', async () => {
    const routes = happy();
    routes['https://db.example/rest/v1/clients'] = { status: 200, body: [] };
    const { impl } = fakeFetch(routes);
    expect(await invitePortalMember(request(), deps(impl))).toMatchObject({ ok: false, status: 404 });
  });

  it('says so when access saved but the email failed', async () => {
    const routes = happy();
    routes['https://db.example/auth/v1/invite'] = { status: 429, body: { msg: 'rate limit' } };
    const { impl } = fakeFetch(routes);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await invitePortalMember(request(), deps(impl))).toMatchObject({ ok: false, status: 502 });
  });
});

describe('portalRedirect', () => {
  it('uses the admin browser origin for known hosts', () => {
    expect(portalRedirect('https://www.infinityservicesmn.com')).toBe('https://www.infinityservicesmn.com/portal');
    expect(portalRedirect('http://localhost:4200')).toBe('http://localhost:4200/portal');
    expect(portalRedirect('https://site-git-x.vercel.app')).toBe('https://site-git-x.vercel.app/portal');
  });

  it('falls back to the live site for anything else', () => {
    expect(portalRedirect('https://evil.example')).toBe('https://infinityservicesmn.com/portal');
    expect(portalRedirect(undefined)).toBe('https://infinityservicesmn.com/portal');
    expect(portalRedirect('not a url')).toBe('https://infinityservicesmn.com/portal');
  });
});
