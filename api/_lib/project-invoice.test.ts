import { describe, expect, it, vi } from 'vitest';
import {
  HttpError,
  SquareApi,
  assertAdmin,
  createProjectInvoice,
  parseCreateInput,
  paymentRequests,
  sendInvoice,
} from './project-invoice';
import type { SupabaseRest } from './supabase-rest';

const TODAY = '2026-11-05';
const PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const CLIENT_ID = '22222222-2222-4222-8222-222222222222';

function fakeDb(selectResults: unknown[][]) {
  const queue = [...selectResults];
  const db = {
    select: vi.fn(async () => queue.shift() ?? []),
    upsert: vi.fn(async () => undefined),
    update: vi.fn(async () => undefined),
    insert: vi.fn(async () => undefined),
  };
  return db as typeof db & SupabaseRest;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** A fake Square API that answers by path and records every call. */
function fakeSquare(routes: Record<string, unknown>) {
  const calls: Array<{ method: string; path: string; body: any }> = [];
  const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const path = String(url).replace('https://connect.squareup.com/v2', '');
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method: init?.method ?? 'GET', path, body });
    const key = `${init?.method ?? 'GET'} ${path}`;
    if (!(key in routes)) return json({ errors: [{ detail: `no route ${key}` }] }, 404);
    return json(routes[key]);
  });
  return { api: new SquareApi({ accessToken: 'tok', sandbox: false }, fetchImpl as typeof fetch), calls };
}

const input = (over: Record<string, unknown> = {}) => ({
  projectId: PROJECT_ID,
  amount: 800,
  split: true,
  depositDue: TODAY,
  balanceDue: '2026-11-30',
  description: '',
  ...over,
});

describe('parseCreateInput', () => {
  it('converts dollars to cents and defaults the deposit date to today', () => {
    const r = parseCreateInput(input({ amount: '412.5', depositDue: '' }), TODAY);
    expect(r.cents).toBe(41250);
    expect(r.depositDue).toBe(TODAY);
  });

  it.each([
    [{ projectId: 'nope' }, 'Missing project.'],
    [{ amount: 0 }, 'Enter an amount'],
    [{ balanceDue: '2026-11-01' }, 'in the past'],
    [{ depositDue: '2026-12-15' }, 'deposit must be due before'],
  ])('rejects %o', (over, message) => {
    expect(() => parseCreateInput(input(over), TODAY)).toThrow(message);
  });
});

describe('paymentRequests', () => {
  it('asks for a 50% deposit then the balance when split', () => {
    expect(paymentRequests(true, TODAY, '2026-11-30')).toEqual([
      { request_type: 'DEPOSIT', due_date: TODAY, percentage_requested: '50', tipping_enabled: false },
      { request_type: 'BALANCE', due_date: '2026-11-30', tipping_enabled: false },
    ]);
  });

  it('asks for one payment otherwise', () => {
    expect(paymentRequests(false, TODAY, '2026-11-30')).toHaveLength(1);
  });
});

describe('assertAdmin', () => {
  it('rejects a missing token without calling Supabase', async () => {
    const f = vi.fn();
    await expect(assertAdmin(undefined, 'https://x', 'pk', f)).rejects.toMatchObject({ status: 401 });
    expect(f).not.toHaveBeenCalled();
  });

  it('rejects a signed-in non-admin', async () => {
    const f = vi.fn(async () => json(false));
    await expect(assertAdmin('jwt', 'https://x', 'pk', f as typeof fetch)).rejects.toMatchObject({ status: 403 });
  });

  it('accepts an admin, checking with the caller’s own token', async () => {
    const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => json(true));
    await assertAdmin('jwt', 'https://x', 'pk', f as typeof fetch);
    const headers = f.mock.calls[0][1]!.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer jwt');
    expect(headers['apikey']).toBe('pk');
  });
});

const project = (client: Record<string, unknown> = {}) => ({
  id: PROJECT_ID,
  title: 'Booking page',
  quoted_amount: 800,
  client_id: CLIENT_ID,
  clients: { id: CLIENT_ID, name: 'Ann Lee', business: 'Lee Farms', email: 'ann@example.com', square_customer_id: null, ...client },
});

const draftInvoice = {
  id: 'inv:1',
  status: 'DRAFT',
  title: 'Booking page',
  primary_recipient: { customer_id: 'CUST1', email_address: 'ann@example.com' },
  payment_requests: [{ computed_amount_money: { amount: 40000 } }, { computed_amount_money: { amount: 40000 } }],
};

describe('createProjectInvoice', () => {
  it('creates the Square customer, order and a split draft invoice, then records it', async () => {
    const db = fakeDb([[project()], []]);
    const { api, calls } = fakeSquare({
      'POST /customers/search': {},
      'POST /customers': { customer: { id: 'CUST1' } },
      'GET /locations': { locations: [{ id: 'LOC1', status: 'ACTIVE' }] },
      'POST /orders': { order: { id: 'ORD1' } },
      'POST /invoices': { invoice: draftInvoice },
    });

    const result = await createProjectInvoice(input(), { square: api, db, today: TODAY });

    expect(result).toEqual({ invoiceId: 'inv:1', status: 'draft' });
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'POST /customers/search',
      'POST /customers',
      'GET /locations',
      'POST /orders',
      'POST /invoices',
    ]);
    expect(calls[1].body).toMatchObject({ given_name: 'Ann', family_name: 'Lee', company_name: 'Lee Farms' });
    expect(calls[3].body.order.line_items[0].base_price_money).toEqual({ amount: 80000, currency: 'USD' });
    expect(calls[4].body.invoice).toMatchObject({ order_id: 'ORD1', location_id: 'LOC1', delivery_method: 'EMAIL' });
    expect(calls[4].body.invoice.payment_requests[0].request_type).toBe('DEPOSIT');
    // No publish call: drafts are never emailed automatically.
    expect(calls.some((c) => c.path.endsWith('/publish'))).toBe(false);

    expect(db.update).toHaveBeenCalledWith('clients', `id=eq.${CLIENT_ID}`, { square_customer_id: 'CUST1' });
    expect(db.upsert).toHaveBeenCalledWith(
      'invoices',
      expect.objectContaining({ square_invoice_id: 'inv:1', client_id: CLIENT_ID, project_id: PROJECT_ID, status: 'draft', amount: 800 }),
      'square_invoice_id',
    );
    expect(db.insert).toHaveBeenCalledWith('activity', expect.objectContaining({ project_id: PROJECT_ID }));
  });

  it('reuses a linked Square customer', async () => {
    const db = fakeDb([[project({ square_customer_id: 'CUST9' })], []]);
    const { api, calls } = fakeSquare({
      'GET /locations': { locations: [{ id: 'LOC1', status: 'ACTIVE' }] },
      'POST /orders': { order: { id: 'ORD1' } },
      'POST /invoices': { invoice: draftInvoice },
    });
    await createProjectInvoice(input({ split: false }), { square: api, db, today: TODAY });
    expect(calls.some((c) => c.path.startsWith('/customers'))).toBe(false);
    expect(calls.at(-1)!.body.invoice.primary_recipient).toEqual({ customer_id: 'CUST9' });
    expect(db.update).not.toHaveBeenCalled();
  });

  it('refuses a second open invoice for the same project', async () => {
    const db = fakeDb([[project()], [{ invoice_number: '0007', status: 'unpaid' }]]);
    const { api, calls } = fakeSquare({});
    await expect(createProjectInvoice(input(), { square: api, db, today: TODAY })).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('#0007'),
    });
    expect(calls).toHaveLength(0);
  });

  it('needs a client email when there is no Square customer yet', async () => {
    const db = fakeDb([[project({ email: null })], []]);
    const { api } = fakeSquare({});
    await expect(createProjectInvoice(input(), { square: api, db, today: TODAY })).rejects.toThrow('Add an email');
  });

  it('passes Square errors through as 502s', async () => {
    const db = fakeDb([[project({ square_customer_id: 'CUST9' })], []]);
    const { api } = fakeSquare({ 'GET /locations': { locations: [{ id: 'LOC1' }] } });
    const err = await createProjectInvoice(input(), { square: api, db, today: TODAY }).catch((e) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(502);
    expect(err.message).toContain('Square said');
  });
});

describe('sendInvoice', () => {
  it('publishes the current version of a draft and logs it', async () => {
    const db = fakeDb([[{ client_id: CLIENT_ID, project_id: PROJECT_ID, title: 'Booking page' }]]);
    const { api, calls } = fakeSquare({
      'GET /invoices/inv%3A1': { invoice: { ...draftInvoice, version: 3 } },
      'POST /invoices/inv%3A1/publish': {
        invoice: { ...draftInvoice, status: 'UNPAID', invoice_number: '0008', public_url: 'https://sq/pay' },
      },
    });
    const result = await sendInvoice('inv:1', { square: api, db });
    expect(result).toEqual({ status: 'unpaid', publicUrl: 'https://sq/pay' });
    expect(calls[1].body.version).toBe(3);
    expect(db.upsert).toHaveBeenCalledWith('invoices', expect.objectContaining({ status: 'unpaid' }), 'square_invoice_id');
    expect(db.insert).toHaveBeenCalledWith('activity', expect.objectContaining({ kind: 'email' }));
  });

  it('does not re-send an invoice that is no longer a draft', async () => {
    const db = fakeDb([[{ client_id: CLIENT_ID, project_id: null, title: 'x' }]]);
    const { api, calls } = fakeSquare({ 'GET /invoices/inv%3A1': { invoice: { ...draftInvoice, status: 'UNPAID' } } });
    await expect(sendInvoice('inv:1', { square: api, db })).rejects.toMatchObject({ status: 409 });
    expect(calls).toHaveLength(1);
  });

  it('only sends invoices the admin knows about', async () => {
    const { api, calls } = fakeSquare({});
    await expect(sendInvoice('inv:zzz', { square: api, db: fakeDb([[]]) })).rejects.toMatchObject({ status: 404 });
    expect(calls).toHaveLength(0);
  });
});
