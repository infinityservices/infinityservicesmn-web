import type { ProjectKind, ProjectStatus, SupportTier } from '../admin/models';

/** What portal_overview() returns: client-safe columns only. */
export interface PortalOverview {
  clients: PortalClient[];
  projects: PortalProject[];
  invoices: PortalInvoice[];
  subscriptions: PortalSubscription[];
}

export interface PortalClient {
  id: string;
  name: string;
  business: string | null;
  support_tier: SupportTier;
}

export interface PortalProject {
  id: string;
  client_id: string;
  title: string;
  kind: ProjectKind;
  status: ProjectStatus;
  quoted_amount: number | null;
  start_date: string | null;
  due_date: string | null;
  updated_at: string;
}

export interface PortalInvoice {
  id: string;
  client_id: string;
  project_id: string | null;
  invoice_number: string | null;
  title: string | null;
  amount: number | null;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  public_url: string | null;
}

export interface PortalSubscription {
  id: string;
  client_id: string;
  plan_name: string | null;
  amount: number | null;
  billing_interval: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export const EMPTY_OVERVIEW: PortalOverview = { clients: [], projects: [], invoices: [], subscriptions: [] };

/** Badge colors used by the shared .badge styles. */
export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'gray';

/** Project status in the client's words. */
export const PROJECT_STATUS_TEXT: Record<ProjectStatus, { label: string; tone: Tone }> = {
  quoted: { label: 'Quoted', tone: 'gray' },
  active: { label: 'In progress', tone: 'blue' },
  waiting: { label: 'Waiting on you', tone: 'amber' },
  done: { label: 'Done', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'gray' },
};

export const PROJECT_KIND_TEXT: Record<ProjectKind, string> = {
  quick_fix: 'Quick fix',
  small_task: 'Small task',
  integration: 'Integration',
  custom_tool: 'Custom tool',
  hourly: 'Hourly work',
};

export const SUPPORT_TIER_TEXT: Record<SupportTier, string> = {
  none: 'No support plan',
  basic: 'Basic support',
  standard: 'Standard support',
  priority: 'Priority support',
};

const INVOICE_STATUS_TEXT: Record<string, { label: string; tone: Tone }> = {
  unpaid: { label: 'Due', tone: 'amber' },
  scheduled: { label: 'Scheduled', tone: 'blue' },
  partially_paid: { label: 'Partly paid', tone: 'amber' },
  payment_pending: { label: 'Processing', tone: 'blue' },
  paid: { label: 'Paid', tone: 'green' },
  partially_refunded: { label: 'Partly refunded', tone: 'gray' },
  refunded: { label: 'Refunded', tone: 'gray' },
  canceled: { label: 'Canceled', tone: 'gray' },
  failed: { label: 'Payment failed', tone: 'red' },
};

export function invoiceStatus(status: string, overdue = false): { label: string; tone: Tone } {
  if (overdue) return { label: 'Past due', tone: 'red' };
  return INVOICE_STATUS_TEXT[status] ?? { label: status.replace(/_/g, ' '), tone: 'gray' };
}

const SUBSCRIPTION_STATUS_TEXT: Record<string, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'green' },
  trialing: { label: 'Trial', tone: 'blue' },
  past_due: { label: 'Payment past due', tone: 'red' },
  unpaid: { label: 'Unpaid', tone: 'red' },
  incomplete: { label: 'Setting up', tone: 'amber' },
  paused: { label: 'Paused', tone: 'gray' },
  canceled: { label: 'Ended', tone: 'gray' },
};

export function subscriptionStatus(sub: Pick<PortalSubscription, 'status' | 'cancel_at_period_end'>) {
  if (sub.status === 'active' && sub.cancel_at_period_end) {
    return { label: 'Ends at period end', tone: 'amber' as Tone };
  }
  return SUBSCRIPTION_STATUS_TEXT[sub.status] ?? { label: sub.status.replace(/_/g, ' '), tone: 'gray' as Tone };
}

/** "/mo", "/yr" etc. for a Stripe billing interval. */
export function perInterval(interval: string | null): string {
  switch (interval) {
    case 'year':
      return '/yr';
    case 'week':
      return '/wk';
    case 'day':
      return '/day';
    case 'month':
      return '/mo';
    default:
      return '';
  }
}

/** Projects still in play, then finished ones. */
export function splitProjects(projects: PortalProject[]) {
  const closed: ProjectStatus[] = ['done', 'cancelled'];
  return {
    open: projects.filter((p) => !closed.includes(p.status)),
    closed: projects.filter((p) => closed.includes(p.status)),
  };
}
