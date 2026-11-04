import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Public connection details for the Infinity Services Business project.
 * The publishable key is safe in the browser: row-level security only lets
 * emails listed in private.admin_users read or change anything.
 */
export const SUPABASE_URL = 'https://kfdvbtgltzztqmkoqxqs.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_e6cm95-aqZtNaGSophD8zg_fO7aisnK';

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'is-admin-auth' },
  });
  return client;
}
