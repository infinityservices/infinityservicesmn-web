import { Injectable } from '@angular/core';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Activity, Client, Invoice, InvoiceDraft, Lead, LeadStatus, Project, Subscription, TimeEntry } from './models';

function unwrap<T>(result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.data as T;
}

/** All admin reads and writes. Row-level security enforces admin-only access. */
@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private get db() {
    return supabase();
  }

  // Leads
  async leads(): Promise<Lead[]> {
    return unwrap(await this.db.from('leads').select('*').order('created_at', { ascending: false }));
  }

  async updateLead(id: string, patch: Partial<Pick<Lead, 'status' | 'notes' | 'client_id'>>) {
    unwrap(await this.db.from('leads').update(patch).eq('id', id));
  }

  /** Creates a client from a lead, marks the lead won, and logs it. Returns the client ID. */
  async convertLead(lead: Lead): Promise<string> {
    const client = unwrap(
      await this.db
        .from('clients')
        .insert({ name: lead.name, email: lead.email, notes: null })
        .select('id')
        .single(),
    ) as { id: string };
    await this.updateLead(lead.id, { status: 'won' as LeadStatus, client_id: client.id });
    await this.addActivity({
      client_id: client.id,
      lead_id: lead.id,
      kind: 'note',
      body: `Converted from a ${lead.kind === 'project' ? 'project planner' : 'contact form'} lead.\n\n${lead.message}`,
    });
    return client.id;
  }

  // Clients
  async clients(): Promise<Client[]> {
    return unwrap(await this.db.from('clients').select('*').order('name'));
  }

  async client(id: string): Promise<Client> {
    return unwrap(await this.db.from('clients').select('*').eq('id', id).single());
  }

  async createClient(values: Partial<Client>): Promise<string> {
    const row = unwrap(await this.db.from('clients').insert(values).select('id').single()) as { id: string };
    return row.id;
  }

  async updateClient(id: string, patch: Partial<Client>) {
    unwrap(await this.db.from('clients').update(patch).eq('id', id));
  }

  async deleteClient(id: string) {
    unwrap(await this.db.from('clients').delete().eq('id', id));
  }

  // Projects
  async projects(clientId?: string): Promise<Project[]> {
    let query = this.db.from('projects').select('*, clients(name, business)');
    if (clientId) query = query.eq('client_id', clientId);
    return unwrap(await query.order('due_date', { ascending: true, nullsFirst: false }));
  }

  async createProject(values: Partial<Project>): Promise<void> {
    unwrap(await this.db.from('projects').insert(values));
  }

  async updateProject(id: string, patch: Partial<Project>) {
    unwrap(await this.db.from('projects').update(patch).eq('id', id));
  }

  async deleteProject(id: string) {
    unwrap(await this.db.from('projects').delete().eq('id', id));
  }

  // Activity
  async activity(filter: { clientId?: string; leadId?: string }): Promise<Activity[]> {
    let query = this.db.from('activity').select('*');
    if (filter.clientId) query = query.eq('client_id', filter.clientId);
    if (filter.leadId) query = query.eq('lead_id', filter.leadId);
    return unwrap(await query.order('created_at', { ascending: false }));
  }

  async addActivity(values: Partial<Activity>) {
    unwrap(await this.db.from('activity').insert(values));
  }

  // Billing
  async invoices(clientId?: string): Promise<Invoice[]> {
    let query = this.db.from('invoices').select('*, clients(name)');
    if (clientId) query = query.eq('client_id', clientId);
    return unwrap(await query.order('due_date', { ascending: false, nullsFirst: false }));
  }

  /** Creates a draft Square invoice for a project (nothing is emailed yet). */
  async createProjectInvoice(projectId: string, draft: InvoiceDraft): Promise<void> {
    await this.callApi('/api/project-invoice', { action: 'create', projectId, ...draft });
  }

  /** Publishes a draft invoice; Square then emails it to the client. */
  async sendInvoice(squareInvoiceId: string): Promise<void> {
    await this.callApi('/api/project-invoice', { action: 'send', invoiceId: squareInvoiceId });
  }

  private async callApi(path: string, body: unknown): Promise<unknown> {
    const { data } = await this.db.auth.getSession();
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session?.access_token ?? ''}`,
      },
      body: JSON.stringify(body),
    });
    const json = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) throw new Error(json.error ?? `Request failed (${response.status}).`);
    return json;
  }

  async subscriptions(clientId?: string): Promise<Subscription[]> {
    let query = this.db.from('subscriptions').select('*, clients(name)');
    if (clientId) query = query.eq('client_id', clientId);
    return unwrap(await query.order('created_at', { ascending: false }));
  }

  async linkInvoice(id: string, clientId: string | null) {
    unwrap(await this.db.from('invoices').update({ client_id: clientId }).eq('id', id));
  }

  // Time entries
  async timeEntries(filter: { clientId?: string; from: string; to: string }): Promise<TimeEntry[]> {
    let query = this.db
      .from('time_entries')
      .select('*')
      .gte('work_date', filter.from)
      .lte('work_date', filter.to);
    if (filter.clientId) query = query.eq('client_id', filter.clientId);
    return unwrap(await query.order('work_date', { ascending: false }).order('created_at', { ascending: false }));
  }

  async addTimeEntry(values: Omit<TimeEntry, 'id' | 'created_at'>) {
    unwrap(await this.db.from('time_entries').insert(values));
  }

  async deleteTimeEntry(id: string) {
    unwrap(await this.db.from('time_entries').delete().eq('id', id));
  }
}
