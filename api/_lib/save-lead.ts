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
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
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
