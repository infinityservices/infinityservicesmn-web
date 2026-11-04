import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../admin/supabase';

let client: SupabaseClient | null = null;

/**
 * Supabase client for the client portal. It keeps its own session, separate
 * from the admin's, and picks up the session from magic-link redirects.
 * Clients can only call portal_overview(), which returns their own data.
 */
export function portalSupabase(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'is-portal-auth',
    },
  });
  return client;
}
