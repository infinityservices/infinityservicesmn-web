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

export interface PortalMember {
  id: string;
  created_at: string;
  client_id: string;
  email: string;
  invited_at: string | null;
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

// Support hours ---------------------------------------------------------

export type TimeCategory = 'support' | 'project' | 'hourly';

export interface TimeEntry {
  id: string;
  created_at: string;
  client_id: string;
  project_id: string | null;
  work_date: string;
  minutes: number;
  category: TimeCategory;
  description: string;
}

export const TIME_CATEGORIES: { value: TimeCategory; label: string }[] = [
  { value: 'support', label: 'Support plan' },
  { value: 'project', label: 'Project work' },
  { value: 'hourly', label: 'Hourly (billable)' },
];

/** Monthly support time included in each plan, from the fee schedule draft. */
export const PLAN_ALLOWANCE_MINUTES: Record<SupportTier, number> = {
  none: 0,
  basic: 30,
  standard: 90,
  priority: 180,
};

/**
 * Hourly rate used to estimate support time beyond a plan's allowance (and
 * hourly work for clients without a plan). Matches the pricing page; change
 * it here and every estimate in the admin follows.
 */
export const HOURLY_RATE = 100;

/** First and last day (YYYY-MM-DD) of the calendar month containing `date`, in local time. */
export function monthRange(date: Date): { start: string; end: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = date.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  return { start: `${y}-${pad(m + 1)}-01`, end: `${y}-${pad(m + 1)}-${pad(last)}` };
}

export interface PlanUsage {
  used: number;
  allowance: number;
  remaining: number;
  overage: number;
  /** Share of the allowance used, 0–1+ (capped at 1 for bars via Math.min). */
  ratio: number;
  /** Estimated charge for time over the allowance, at HOURLY_RATE. */
  overageCharge: number;
}

/** Support minutes used in a month against the client's plan allowance. */
export function planUsage(entries: Pick<TimeEntry, 'minutes' | 'category'>[], tier: SupportTier): PlanUsage {
  const used = entries.filter((e) => e.category === 'support').reduce((sum, e) => sum + e.minutes, 0);
  const allowance = PLAN_ALLOWANCE_MINUTES[tier];
  const overage = Math.max(0, used - allowance);
  return {
    used,
    allowance,
    remaining: Math.max(0, allowance - used),
    overage,
    ratio: allowance > 0 ? used / allowance : used > 0 ? 1 : 0,
    overageCharge: Math.round((overage / 60) * HOURLY_RATE * 100) / 100,
  };
}

/** 95 → "1 hr 35 min", 30 → "30 min", 120 → "2 hr". */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/** Parses "1:30", "1.5", "1.5h", "90", "90m" into minutes (bare numbers are minutes). */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  let minutes: number;
  const clock = /^(\d+):([0-5]\d)$/.exec(s);
  if (clock) {
    minutes = Number(clock[1]) * 60 + Number(clock[2]);
  } else if (/^\d+(\.\d+)?\s*(h|hr|hrs|hours?)$/.test(s)) {
    minutes = parseFloat(s) * 60;
  } else if (/^\d+\s*(m|min|mins|minutes?)?$/.test(s)) {
    minutes = parseFloat(s);
  } else if (/^\d*\.\d+$/.test(s)) {
    minutes = parseFloat(s) * 60;
  } else {
    return null;
  }
  minutes = Math.round(minutes);
  return minutes > 0 && minutes <= 1440 ? minutes : null;
}

// Project invoices ---------------------------------------------------------

/** Jobs at or above this amount are billed 50% up front, 50% on completion. */
export const SPLIT_THRESHOLD = 500;

export interface InvoiceDraft {
  amount: number | null;
  split: boolean;
  depositDue: string;
  balanceDue: string;
  description: string;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Starting values for a project's invoice: the quoted amount, split 50/50 at
 * $500 or more, deposit due today, and the rest due on the project's due date
 * (or in two weeks when it has none, or it has passed).
 */
export function invoiceDraftFor(project: Pick<Project, 'quoted_amount' | 'due_date'>, today = new Date()): InvoiceDraft {
  const todayIso = isoDate(today);
  const inTwoWeeks = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);
  const due = project.due_date && project.due_date >= todayIso ? project.due_date : isoDate(inTwoWeeks);
  const amount = project.quoted_amount ?? null;
  return {
    amount,
    split: (amount ?? 0) >= SPLIT_THRESHOLD,
    depositDue: todayIso,
    balanceDue: due,
    description: '',
  };
}

/** The project's invoice that still counts (not canceled or failed), if any. */
export function openInvoiceFor(projectId: string, invoices: Invoice[]): Invoice | undefined {
  return invoices.find((i) => i.project_id === projectId && !['canceled', 'failed'].includes(i.status));
}
