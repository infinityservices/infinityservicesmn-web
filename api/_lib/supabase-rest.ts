import { authHeaders, type SupabaseConfig } from './save-lead';

/** Minimal Supabase REST (PostgREST) client for server-side functions. */
export class SupabaseRest {
  constructor(
    private readonly config: SupabaseConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async request(path: string, init: RequestInit & { prefer?: string }): Promise<unknown> {
    const headers = authHeaders(this.config.serviceRoleKey);
    headers['Prefer'] = init.prefer ?? 'return=minimal';
    const response = await this.fetchImpl(`${this.config.url}/rest/v1/${path}`, {
      ...init,
      headers,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Supabase ${init.method ?? 'GET'} ${path} failed (${response.status}): ${detail}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  /** Returns rows matching a PostgREST query string, e.g. `clients?select=id&email=eq.x`. */
  async select<T>(query: string): Promise<T[]> {
    return ((await this.request(query, { method: 'GET', prefer: 'return=representation' })) ??
      []) as T[];
  }

  /** Inserts or updates one row, matched on the given unique column. */
  async upsert(table: string, row: Record<string, unknown>, onConflict: string): Promise<void> {
    await this.request(`${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: JSON.stringify(row),
    });
  }

  /** Inserts one row. */
  async insert(table: string, row: Record<string, unknown>): Promise<void> {
    await this.request(table, { method: 'POST', body: JSON.stringify(row) });
  }

  /** Updates rows matching a PostgREST filter, e.g. `id=eq.123`. */
  async update(table: string, filter: string, patch: Record<string, unknown>): Promise<void> {
    await this.request(`${table}?${filter}`, { method: 'PATCH', body: JSON.stringify(patch) });
  }
}

/** Escapes a value for use inside a PostgREST `eq.` filter. */
export function eq(value: string): string {
  return `eq.${encodeURIComponent(value)}`;
}

/** Case-insensitive exact match (`ilike` with wildcards escaped), for emails. */
export function ieq(value: string): string {
  return `ilike.${encodeURIComponent(value.replace(/[\\%_]/g, (c) => `\\${c}`))}`;
}
