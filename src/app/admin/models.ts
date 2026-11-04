export type LeadKind = 'quick' | 'project' | 'beta';
export type LeadStatus = 'new' | 'contacted' | 'won' | 'lost' | 'spam';
export type SupportTier = 'none' | 'basic' | 'standard' | 'priority';
export type ProjectKind = 'quick_fix' | 'small_task' | 'integration' | 'custom_tool' | 'hourly';
export type ProjectStatus = 'quoted' | 'active' | 'waiting' | 'done' | 'cancelled';
export type ActivityKind = 'note' | 'call' | 'email' | 'status_change';

export interface Lead {
  id: string;
  created_at: string;
  kind: LeadKind;
  name: string;
  email: string;
  message: string;
  status: LeadStatus;
  notes: string | null;
  client_id: string | null;
}

export interface Client {
  id: string;
  created_at: string;
  name: string;
  business: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  hosting_notes: string | null;
  support_tier: SupportTier;
  square_customer_id: string | null;
  stripe_customer_id: string | null;
  notes: string | null;
}

export interface Project {
  id: string;
  created_at: string;
  client_id: string;
  title: string;
  kind: ProjectKind;
  status: ProjectStatus;
  quoted_amount: number | null;
  start_date: string | null;
  due_date: string | null;
  notes: string | null;
  clients?: { name: string; business: string | null } | null;
}

export interface Activity {
  id: string;
  created_at: string;
  client_id: string | null;
  lead_id: string | null;
  project_id: string | null;
  kind: ActivityKind;
  body: string;
}

export interface Invoice {
  id: string;
  square_invoice_id: string;
  square_customer_id: string | null;
  client_id: string | null;
  project_id: string | null;
  invoice_number: string | null;
  title: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  amount: number | null;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  public_url: string | null;
  clients?: { name: string } | null;
}

export interface Subscription {
  id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  client_id: string | null;
  plan_name: string | null;
  amount: number | null;
  billing_interval: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  clients?: { name: string } | null;
}

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'spam', label: 'Spam' },
];

export const LEAD_KIND_LABELS: Record<LeadKind, string> = {
  quick: 'Quick message',
  project: 'Project planner',
  beta: 'InfiniHerd beta',
};

/** Support plans from the 2026 fee schedule draft. */
export const SUPPORT_TIERS: { value: SupportTier; label: string; monthly: number }[] = [
  { value: 'none', label: 'No plan', monthly: 0 },
  { value: 'basic', label: 'Basic ($75/mo)', monthly: 75 },
  { value: 'standard', label: 'Standard ($150/mo)', monthly: 150 },
  { value: 'priority', label: 'Priority ($275/mo)', monthly: 275 },
];

export const PROJECT_KINDS: { value: ProjectKind; label: string }[] = [
  { value: 'quick_fix', label: 'Quick fix' },
  { value: 'small_task', label: 'Small task' },
  { value: 'integration', label: 'Simple integration' },
  { value: 'custom_tool', label: 'Small custom tool' },
  { value: 'hourly', label: 'Hourly' },
];

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'quoted', label: 'Quoted' },
  { value: 'active', label: 'Active' },
  { value: 'waiting', label: 'Waiting on client' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Jeremy takes on at most two active jobs at a time. */
export const ACTIVE_JOB_LIMIT = 2;

export function labelFor<T extends string>(list: { value: T; label: string }[], value: T): string {
  return list.find((item) => item.value === value)?.label ?? value;
}

export function isOverdue(invoice: Pick<Invoice, 'status' | 'due_date'>, today = new Date()): boolean {
  if (!invoice.due_date || !isUnpaid(invoice)) return false;
  return invoice.due_date < today.toISOString().slice(0, 10);
}

export function isUnpaid(invoice: Pick<Invoice, 'status'>): boolean {
  return ['unpaid', 'scheduled', 'partially_paid', 'payment_pending'].includes(invoice.status);
}

/** Monthly value of a subscription, whatever its billing interval. */
export function monthlyAmount(sub: Pick<Subscription, 'amount' | 'billing_interval'>): number {
  const amount = sub.amount ?? 0;
  switch (sub.billing_interval) {
    case 'year':
      return amount / 12;
    case 'week':
      return (amount * 52) / 12;
    case 'day':
      return (amount * 365) / 12;
    default:
      return amount;
  }
}
