import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { handleSquareEvent, invoiceRow, verifySquareSignature } from './square';
import { handleStripeEvent, subscriptionRow, verifyStripeSignature } from './stripe';
import type { SupabaseRest } from './supabase-rest';

function fakeDb(selectResults: unknown[][] = []) {
  const queue = [...selectResults];
  return {
    select: vi.fn(async () => queue.shift() ?? []),
    upsert: vi.fn(async () => undefined),
    update: vi.fn(async () => undefined),
  };
}

describe('verifyStripeSignature', () => {
  const secret = 'whsec_test';
  const body = '{"id":"evt_1"}';
  const now = 1_800_000_000;
  const sign = (t: number) =>
    createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');

  it('accepts a valid signature', () => {
    expect(verifyStripeSignature(body, `t=${now},v1=${sign(now)}`, secret, now)).toBe(true);
  });

  it('rejects a tampered body', () => {
    expect(verifyStripeSignature(body + ' ', `t=${now},v1=${sign(now)}`, secret, now)).toBe(false);
  });

  it('rejects an old timestamp', () => {
    expect(verifyStripeSignature(body, `t=${now - 600},v1=${sign(now - 600)}`, secret, now)).toBe(false);
  });

  it('rejects a missing header', () => {
    expect(verifyStripeSignature(body, undefined, secret, now)).toBe(false);
  });
});

describe('verifySquareSignature', () => {
  const key = 'sq_key';
  const url = 'https://www.infinityservicesmn.com/api/square-webhook';
  const body = '{"type":"invoice.paid"}';
  const sig = createHmac('sha256', key).update(url + body).digest('base64');

  it('accepts a valid signature', () => {
    expect(verifySquareSignature(body, sig, key, url)).toBe(true);
  });

  it('rejects a signature made for a different URL', () => {
    expect(verifySquareSignature(body, sig, key, url + '/')).toBe(false);
  });
});

describe('subscriptionRow', () => {
  it('maps price, period end (item-level) and customer', () => {
    const row = subscriptionRow({
      id: 'sub_1',
      customer: 'cus_1',
      status: 'active',
      items: {
        data: [
          {
            price: { nickname: 'Standard support', unit_amount: 15000, recurring: { interval: 'month' } },
            current_period_end: 1_800_000_000,
          },
        ],
      },
    });
    expect(row).toMatchObject({
      stripe_subscription_id: 'sub_1',
      stripe_customer_id: 'cus_1',
      plan_name: 'Standard support',
      amount: 150,
      billing_interval: 'month',
      status: 'active',
      cancel_at_period_end: false,
    });
    expect(row.current_period_end).toBe(new Date(1_800_000_000_000).toISOString());
  });
});

describe('handleStripeEvent', () => {
  const subEvent = {
    type: 'customer.subscription.updated',
    data: { object: { id: 'sub_1', customer: 'cus_1', status: 'active' } },
  };

  it('saves a subscription for a linked client', async () => {
    const db = fakeDb([[{ id: 'client-1' }]]);
    expect(await handleStripeEvent(subEvent, db as unknown as SupabaseRest)).toBe('saved');
    expect(db.upsert).toHaveBeenCalledWith(
      'subscriptions',
      expect.objectContaining({ stripe_subscription_id: 'sub_1', client_id: 'client-1' }),
      'stripe_subscription_id',
    );
  });

  it('ignores subscriptions from customers who are not clients (e.g. InfiniTrack)', async () => {
    const db = fakeDb([[]]);
    expect(await handleStripeEvent(subEvent, db as unknown as SupabaseRest)).toBe('ignored');
    expect(db.upsert).not.toHaveBeenCalled();
  });

  it('links a client by email when a customer is created', async () => {
    const db = fakeDb([[{ id: 'client-1' }]]);
    const outcome = await handleStripeEvent(
      { type: 'customer.created', data: { object: { id: 'cus_9', email: 'a@b.co' } } },
      db as unknown as SupabaseRest,
    );
    expect(outcome).toBe('linked');
    expect(db.update).toHaveBeenCalledWith('clients', 'id=eq.client-1', { stripe_customer_id: 'cus_9' });
  });
});

describe('invoiceRow', () => {
  it('sums payment requests and uses the last due date', () => {
    const row = invoiceRow({
      id: 'inv_1',
      invoice_number: '000012',
      status: 'UNPAID',
      primary_recipient: { customer_id: 'C1', given_name: 'Jane', family_name: 'Doe', email_address: 'j@x.co' },
      payment_requests: [
        { due_date: '2026-11-10', computed_amount_money: { amount: 25000 } },
        { due_date: '2026-12-10', computed_amount_money: { amount: 25000 } },
      ],
    });
    expect(row).toMatchObject({
      square_invoice_id: 'inv_1',
      square_customer_id: 'C1',
      recipient_name: 'Jane Doe',
      amount: 500,
      status: 'unpaid',
      due_date: '2026-12-10',
      paid_at: null,
    });
  });
});

describe('handleSquareEvent', () => {
  const event = {
    type: 'invoice.payment_made',
    data: {
      object: {
        invoice: {
          id: 'inv_1',
          status: 'PAID',
          updated_at: '2026-11-04T10:00:00Z',
          primary_recipient: { customer_id: 'C1', email_address: 'j@x.co' },
        },
      },
    },
  };

  it('attaches to the client with the same Square customer ID', async () => {
    const db = fakeDb([[{ id: 'client-1' }]]);
    await handleSquareEvent(event, db as unknown as SupabaseRest);
    expect(db.upsert).toHaveBeenCalledWith(
      'invoices',
      expect.objectContaining({ client_id: 'client-1', status: 'paid', paid_at: '2026-11-04T10:00:00Z' }),
      'square_invoice_id',
    );
  });

  it('falls back to email and records the Square customer ID on the client', async () => {
    const db = fakeDb([[], [{ id: 'client-2', square_customer_id: null }]]);
    await handleSquareEvent(event, db as unknown as SupabaseRest);
    expect(db.update).toHaveBeenCalledWith('clients', 'id=eq.client-2', { square_customer_id: 'C1' });
    expect(db.upsert).toHaveBeenCalledWith(
      'invoices',
      expect.objectContaining({ client_id: 'client-2' }),
      'square_invoice_id',
    );
  });

  it('saves unmatched invoices without a client_id', async () => {
    const db = fakeDb([[], []]);
    await handleSquareEvent(event, db as unknown as SupabaseRest);
    const row = db.upsert.mock.calls[0][1] as Record<string, unknown>;
    expect(row).not.toHaveProperty('client_id');
  });

  it('ignores non-invoice events', async () => {
    const db = fakeDb();
    expect(await handleSquareEvent({ type: 'payment.created' }, db as unknown as SupabaseRest)).toBe('ignored');
  });
});
