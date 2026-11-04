import { describe, expect, it, vi } from 'vitest';
import { getSupabaseConfig, saveLead } from './save-lead';

const lead = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'Need a booking tool.',
  kind: 'project' as const,
};
const config = { url: 'https://abc.supabase.co', serviceRoleKey: 'service-key' };

describe('getSupabaseConfig', () => {
  it('returns null when either value is missing', () => {
    expect(getSupabaseConfig({})).toBeNull();
    expect(getSupabaseConfig({ SUPABASE_URL: 'https://abc.supabase.co' })).toBeNull();
  });

  it('strips a trailing slash from the URL', () => {
    expect(
      getSupabaseConfig({ SUPABASE_URL: 'https://abc.supabase.co/', SUPABASE_SERVICE_ROLE_KEY: 'k' }),
    ).toEqual({ url: 'https://abc.supabase.co', serviceRoleKey: 'k' });
  });
});

describe('saveLead', () => {
  it('posts the lead to the leads table with the service key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    await saveLead(lead, config, fetchMock);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://abc.supabase.co/rest/v1/leads');
    expect(init.method).toBe('POST');
    expect(init.headers.apikey).toBe('service-key');
    expect(init.headers.Authorization).toBeUndefined();
    expect(JSON.parse(init.body)).toEqual(lead);
  });

  it('also sends a legacy service_role JWT as the bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    await saveLead(lead, { ...config, serviceRoleKey: 'eyJhbGciOi.legacy' }, fetchMock);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer eyJhbGciOi.legacy');
  });

  it('throws when Supabase rejects the insert', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('bad', { status: 400 }));
    await expect(saveLead(lead, config, fetchMock)).rejects.toThrow('Supabase insert failed (400)');
  });
});
