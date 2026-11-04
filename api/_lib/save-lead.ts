import type { ContactPayload } from './validate-contact';

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

/** Reads Supabase settings from the environment, or null when not configured. */
export function getSupabaseConfig(env: NodeJS.ProcessEnv = process.env): SupabaseConfig | null {
  const url = env['SUPABASE_URL'];
  const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !serviceRoleKey) {
    return null;
  }
  return { url: url.replace(/\/+$/, ''), serviceRoleKey };
}

/**
 * New-style secret keys (sb_secret_...) go only in the apikey header; legacy
 * service_role JWTs also need to be sent as the bearer token.
 */
export function authHeaders(key: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };
  if (key.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${key}`;
  }
  return headers;
}

/**
 * Inserts a contact submission into the leads table through Supabase's REST API.
 * Throws on any failure so the caller can decide how to handle it.
 */
export async function saveLead(
  lead: ContactPayload,
  config: SupabaseConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(`${config.url}/rest/v1/leads`, {
    method: 'POST',
    headers: authHeaders(config.serviceRoleKey),
    body: JSON.stringify({
      kind: lead.kind,
      name: lead.name,
      email: lead.email,
      message: lead.message,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Supabase insert failed (${response.status}): ${detail}`);
  }
}
