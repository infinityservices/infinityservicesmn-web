import { randomUUID } from 'node:crypto';
import { invoiceRow, type SquareInvoice } from './square';
import { eq, type SupabaseRest } from './supabase-rest';

/** Jobs at or above this amount are billed 50% up front, 50% on completion. */
export const SPLIT_THRESHOLD = 500;

/**
 * The publishable key is public (it ships in the browser bundle). It is used
 * here only to ask Supabase whether the caller's own login is an admin.
 */
export const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_e6cm95-aqZtNaGSophD8zg_fO7aisnK';

const SQUARE_VERSION = '2025-10-16';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Confirms the caller's own Supabase login is an admin (their token + am_i_admin). */
export async function assertAdmin(
  accessToken: string | undefined,
  supabaseUrl: string,
  publishableKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (!accessToken) throw new HttpError(401, 'Sign in first.');
  const res = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/am_i_admin`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  if (!res.ok || (await res.json().catch(() => false)) !== true) {
    throw new HttpError(403, 'Only the admin can create invoices.');
  }
}

export interface SquareConfig {
  accessToken: string;
  locationId?: string;
  sandbox: boolean;
}

export function getSquareConfig(env: NodeJS.ProcessEnv = process.env): SquareConfig | null {
  const accessToken = env['SQUARE_ACCESS_TOKEN'];
  if (!accessToken) return null;
  return {
    accessToken,
    locationId: env['SQUARE_LOCATION_ID'] || undefined,
    sandbox: env['SQUARE_ENVIRONMENT'] === 'sandbox',
  };
}

/** Thin Square REST client: just the calls invoicing needs. */
export class SquareApi {
  constructor(
    private readonly config: SquareConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private get base() {
    return this.config.sandbox
      ? 'https://connect.squareupsandbox.com/v2'
      : 'https://connect.squareup.com/v2';
  }

  async request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
    const res = await this.fetchImpl(`${this.base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Square-Version': SQUARE_VERSION,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      errors?: Array<{ detail?: string; code?: string }>;
    };
    if (!res.ok) {
      const detail = json.errors?.[0]?.detail ?? json.errors?.[0]?.code ?? `HTTP ${res.status}`;
      throw new HttpError(res.status === 404 ? 404 : 502, `Square said: ${detail}`);
    }
    return json as T;
  }

  /** The configured location, or the account's first active one. */
  async locationId(): Promise<string> {
    if (this.config.locationId) return this.config.locationId;
    const { locations = [] } = await this.request<{
      locations?: Array<{ id: string; status?: string }>;
    }>('GET', '/locations');
    const location = locations.find((l) => l.status === 'ACTIVE') ?? locations[0];
    if (!location) throw new HttpError(502, 'Your Square account has no locations.');
    return location.id;
  }
}

interface ClientRow {
  id: string;
  name: string;
  business: string | null;
  email: string | null;
  square_customer_id: string | null;
}

interface ProjectRow {
  id: string;
  title: string;
  quoted_amount: number | null;
  client_id: string;
  clients: ClientRow | null;
}

export interface CreateInvoiceInput {
  projectId: unknown;
  amount: unknown;
  split: unknown;
  depositDue: unknown;
  balanceDue: unknown;
  description: unknown;
}

/** Validates and normalises the admin's invoice form. */
export function parseCreateInput(input: CreateInvoiceInput, today: string) {
  const projectId = typeof input.projectId === 'string' ? input.projectId : '';
  if (!UUID.test(projectId)) throw new HttpError(400, 'Missing project.');

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < 1 || amount > 100_000) {
    throw new HttpError(400, 'Enter an amount between $1 and $100,000.');
  }
  const cents = Math.round(amount * 100);

  const split = input.split === true;
  const balanceDue = typeof input.balanceDue === 'string' ? input.balanceDue : '';
  const depositDue =
    typeof input.depositDue === 'string' && input.depositDue ? input.depositDue : today;
  if (!DATE.test(balanceDue)) throw new HttpError(400, 'Pick a due date.');
  if (balanceDue < today) throw new HttpError(400, 'The due date is in the past.');
  if (split) {
    if (!DATE.test(depositDue) || depositDue < today)
      throw new HttpError(400, 'Pick a deposit due date.');
    if (depositDue > balanceDue)
      throw new HttpError(400, 'The deposit must be due before the final payment.');
  }

  const description =
    typeof input.description === 'string' && input.description.trim()
      ? input.description.trim().slice(0, 1000)
      : null;

  return { projectId, cents, split, depositDue, balanceDue, description };
}

/** Square payment requests: one balance, or a 50% deposit plus the balance. */
export function paymentRequests(split: boolean, depositDue: string, balanceDue: string) {
  const balance = { request_type: 'BALANCE', due_date: balanceDue, tipping_enabled: false };
  if (!split) return [balance];
  return [
    {
      request_type: 'DEPOSIT',
      due_date: depositDue,
      percentage_requested: '50',
      tipping_enabled: false,
    },
    balance,
  ];
}

/** Finds or creates the client's Square customer, and remembers it on the client. */
async function squareCustomerFor(
  client: ClientRow,
  square: SquareApi,
  db: SupabaseRest,
): Promise<string> {
  if (client.square_customer_id) return client.square_customer_id;
  if (!client.email)
    throw new HttpError(400, 'Add an email for this client first, so Square can send the invoice.');

  const found = await square.request<{ customers?: Array<{ id: string }> }>(
    'POST',
    '/customers/search',
    {
      query: { filter: { email_address: { exact: client.email } } },
      limit: 1,
    },
  );
  let customerId = found.customers?.[0]?.id;
  if (!customerId) {
    const [given, ...rest] = client.name.trim().split(/\s+/);
    const created = await square.request<{ customer: { id: string } }>('POST', '/customers', {
      idempotency_key: randomUUID(),
      given_name: given,
      family_name: rest.join(' ') || undefined,
      company_name: client.business ?? undefined,
      email_address: client.email,
      reference_id: client.id,
    });
    customerId = created.customer.id;
  }
  await db.update('clients', `id=${eq(client.id)}`, { square_customer_id: customerId });
  return customerId;
}

/**
 * Creates a draft Square invoice for a project. Nothing is emailed until the
 * admin sends it (see sendInvoice), so it can be reviewed in Square first.
 */
export async function createProjectInvoice(
  input: CreateInvoiceInput,
  deps: { square: SquareApi; db: SupabaseRest; today: string },
) {
  const req = parseCreateInput(input, deps.today);
  const { square, db } = deps;

  const [project] = await db.select<ProjectRow>(
    `projects?select=id,title,quoted_amount,client_id,clients(id,name,business,email,square_customer_id)&id=${eq(req.projectId)}`,
  );
  if (!project?.clients) throw new HttpError(404, 'That project no longer exists.');

  const open = await db.select<{ invoice_number: string | null; status: string }>(
    `invoices?select=invoice_number,status&project_id=${eq(project.id)}&status=not.in.(canceled,failed)`,
  );
  if (open.length) {
    const label = open[0].invoice_number
      ? `#${open[0].invoice_number}`
      : `a ${open[0].status} invoice`;
    throw new HttpError(
      409,
      `This project already has ${label}. Cancel it in Square to make a new one.`,
    );
  }

  const customerId = await squareCustomerFor(project.clients, square, db);
  const locationId = await square.locationId();

  const { order } = await square.request<{ order: { id: string } }>('POST', '/orders', {
    idempotency_key: randomUUID(),
    order: {
      location_id: locationId,
      customer_id: customerId,
      reference_id: project.id,
      line_items: [
        {
          name: project.title.slice(0, 500),
          quantity: '1',
          base_price_money: { amount: req.cents, currency: 'USD' },
        },
      ],
    },
  });

  const { invoice } = await square.request<{ invoice: SquareInvoice }>('POST', '/invoices', {
    idempotency_key: randomUUID(),
    invoice: {
      location_id: locationId,
      order_id: order.id,
      primary_recipient: { customer_id: customerId },
      title: project.title.slice(0, 255),
      description: req.description ?? undefined,
      delivery_method: 'EMAIL',
      accepted_payment_methods: { card: true, bank_account: true, square_gift_card: false },
      payment_requests: paymentRequests(req.split, req.depositDue, req.balanceDue),
    },
  });

  const row = { ...invoiceRow(invoice), client_id: project.client_id, project_id: project.id };
  await db.upsert('invoices', row, 'square_invoice_id');
  await db.insert('activity', {
    client_id: project.client_id,
    project_id: project.id,
    kind: 'note',
    body: `Drafted a ${formatCents(req.cents)} Square invoice for “${project.title}”${req.split ? ' (50% deposit, 50% on completion)' : ''}.`,
  });
  return { invoiceId: invoice.id, status: row.status };
}

const INVOICE_ID = /^[A-Za-z0-9:_-]{1,192}$/;

/** Square statuses that can still change, so are worth re-checking. */
export const OPEN_STATUSES = ['draft', 'unpaid', 'scheduled', 'partially_paid', 'payment_pending'];

function invoicePath(id: string) {
  return `/invoices/${encodeURIComponent(id)}`;
}

/**
 * Re-reads invoices from Square and updates their rows, for when a change made
 * in Square hasn't arrived by webhook. With no IDs, re-checks every invoice
 * that is still open. Returns how many rows changed status.
 */
export async function refreshInvoices(
  squareInvoiceIds: unknown,
  deps: { square: SquareApi; db: SupabaseRest },
) {
  const { square, db } = deps;
  let rows: Array<{ square_invoice_id: string; status: string }>;
  if (Array.isArray(squareInvoiceIds) && squareInvoiceIds.length) {
    const ids = squareInvoiceIds.filter((id): id is string => typeof id === 'string' && INVOICE_ID.test(id));
    if (ids.length !== squareInvoiceIds.length || ids.length > 50) throw new HttpError(400, 'Bad invoice list.');
    rows = await db.select(
      `invoices?select=square_invoice_id,status&square_invoice_id=in.(${ids.map((id) => `"${id}"`).join(',')})`,
    );
  } else {
    rows = await db.select(
      `invoices?select=square_invoice_id,status&status=in.(${OPEN_STATUSES.join(',')})&limit=50`,
    );
  }

  let changed = 0;
  for (const row of rows) {
    try {
      const { invoice } = await square.request<{ invoice: SquareInvoice }>('GET', invoicePath(row.square_invoice_id));
      const fresh = invoiceRow(invoice);
      if (fresh.status !== row.status) changed++;
      await db.upsert('invoices', fresh, 'square_invoice_id');
    } catch (err) {
      // Deleted drafts no longer exist in Square.
      if (err instanceof HttpError && err.status === 404 && row.status === 'draft') {
        await db.update('invoices', `square_invoice_id=${eq(row.square_invoice_id)}`, { status: 'canceled' });
        changed++;
        continue;
      }
      throw err;
    }
  }
  return { checked: rows.length, changed };
}

/**
 * Cancels an invoice in Square. Sent invoices are canceled (Square tells the
 * client); drafts were never sent, so they are deleted instead.
 */
export async function cancelInvoice(squareInvoiceId: unknown, deps: { square: SquareApi; db: SupabaseRest }) {
  if (typeof squareInvoiceId !== 'string' || !INVOICE_ID.test(squareInvoiceId)) {
    throw new HttpError(400, 'Missing invoice.');
  }
  const { square, db } = deps;
  const [known] = await db.select<{ client_id: string | null; project_id: string | null; title: string | null }>(
    `invoices?select=client_id,project_id,title&square_invoice_id=${eq(squareInvoiceId)}`,
  );
  if (!known) throw new HttpError(404, 'That invoice is not in the admin.');

  const path = invoicePath(squareInvoiceId);
  const { invoice: current } = await square.request<{ invoice: SquareInvoice & { version?: number } }>('GET', path);
  const status = (current.status ?? '').toUpperCase();

  let note: string;
  if (status === 'CANCELED') {
    note = '';
  } else if (status === 'DRAFT') {
    await square.request('DELETE', `${path}?version=${current.version ?? 0}`);
    note = `Deleted draft invoice “${known.title ?? ''}”.`;
  } else if (['UNPAID', 'SCHEDULED', 'PARTIALLY_PAID'].includes(status)) {
    await square.request('POST', `${path}/cancel`, { version: current.version });
    note = `Canceled invoice${current.invoice_number ? ` #${current.invoice_number}` : ''} “${known.title ?? ''}”.`;
  } else {
    throw new HttpError(409, `A ${status.toLowerCase().replace('_', ' ')} invoice can't be canceled. Refund it in Square instead.`);
  }

  await db.update('invoices', `square_invoice_id=${eq(squareInvoiceId)}`, { status: 'canceled' });
  if (note && known.client_id) {
    await db.insert('activity', { client_id: known.client_id, project_id: known.project_id, kind: 'note', body: note });
  }
  return { status: 'canceled' };
}

/** Publishes a draft invoice, which makes Square email it to the client. */
export async function sendInvoice(
  squareInvoiceId: unknown,
  deps: { square: SquareApi; db: SupabaseRest },
) {
  if (typeof squareInvoiceId !== 'string' || !INVOICE_ID.test(squareInvoiceId)) {
    throw new HttpError(400, 'Missing invoice.');
  }
  const { square, db } = deps;
  const [known] = await db.select<{
    client_id: string | null;
    project_id: string | null;
    title: string | null;
  }>(`invoices?select=client_id,project_id,title&square_invoice_id=${eq(squareInvoiceId)}`);
  if (!known) throw new HttpError(404, 'That invoice is not in the admin.');

  const path = invoicePath(squareInvoiceId);
  const { invoice: current } = await square.request<{
    invoice: SquareInvoice & { version?: number };
  }>('GET', path);
  if (current.status !== 'DRAFT') throw new HttpError(409, 'This invoice was already sent.');

  const { invoice } = await square.request<{ invoice: SquareInvoice }>('POST', `${path}/publish`, {
    version: current.version,
    idempotency_key: randomUUID(),
  });
  await db.upsert('invoices', invoiceRow(invoice), 'square_invoice_id');
  if (known.client_id) {
    await db.insert('activity', {
      client_id: known.client_id,
      project_id: known.project_id,
      kind: 'email',
      body: `Sent invoice${invoice.invoice_number ? ` #${invoice.invoice_number}` : ''} “${known.title ?? ''}” through Square.`,
    });
  }
  return {
    status: (invoice.status ?? 'unknown').toLowerCase(),
    publicUrl: invoice.public_url ?? null,
  };
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0 })}`;
}
