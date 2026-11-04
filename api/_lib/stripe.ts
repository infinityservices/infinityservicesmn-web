import { createHmac, timingSafeEqual } from 'node:crypto';
import { eq, ieq, SupabaseRest } from './supabase-rest';

const TOLERANCE_SECONDS = 300;

/** Verifies a `Stripe-Signature` header against the raw body (Stripe's v1 scheme). */
export function verifyStripeSignature(
  rawBody: string,
  header: string | undefined,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!header) return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const timestamp = Number(parts.find(([k]) => k === 't')?.[1]);
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v ?? '');
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - timestamp) > TOLERANCE_SECONDS) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest();
  return signatures.some((sig) => {
    const given = Buffer.from(sig, 'hex');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

interface StripePrice {
  nickname?: string | null;
  lookup_key?: string | null;
  unit_amount?: number | null;
  recurring?: { interval?: string } | null;
  product?: string | { name?: string } | null;
}

interface StripeSubscription {
  id: string;
  customer: string | { id: string };
  status: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  items?: { data?: Array<{ price?: StripePrice; current_period_end?: number }> };
}

interface StripeCustomer {
  id: string;
  email?: string | null;
}

export interface StripeEvent {
  type: string;
  data: { object: unknown };
}

/** Maps a Stripe subscription to a row for the `subscriptions` table. */
export function subscriptionRow(sub: StripeSubscription) {
  const item = sub.items?.data?.[0];
  const price = item?.price;
  const productName = typeof price?.product === 'object' ? price.product?.name : undefined;
  const periodEnd = item?.current_period_end ?? sub.current_period_end;
  return {
    stripe_subscription_id: sub.id,
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    plan_name: price?.nickname ?? productName ?? price?.lookup_key ?? null,
    amount: price?.unit_amount != null ? price.unit_amount / 100 : null,
    billing_interval: price?.recurring?.interval ?? null,
    status: sub.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
  };
}

export type StripeOutcome = 'saved' | 'linked' | 'ignored';

/**
 * Applies one Stripe event to the database.
 * - customer.created/updated: links a client with the same email (no ID yet).
 * - customer.subscription.*: saves the subscription, but only for customers
 *   linked to a client, so other products on the same Stripe account
 *   (InfiniTrack, InfiniHerd) don't show up as support plans.
 */
export async function handleStripeEvent(event: StripeEvent, db: SupabaseRest): Promise<StripeOutcome> {
  if (event.type === 'customer.created' || event.type === 'customer.updated') {
    const customer = event.data.object as StripeCustomer;
    if (!customer.email) return 'ignored';
    const matches = await db.select<{ id: string }>(
      `clients?select=id&email=${ieq(customer.email)}&stripe_customer_id=is.null`,
    );
    if (matches.length !== 1) return 'ignored';
    await db.update('clients', `id=${eq(matches[0].id)}`, { stripe_customer_id: customer.id });
    return 'linked';
  }

  if (event.type.startsWith('customer.subscription.')) {
    const row = subscriptionRow(event.data.object as StripeSubscription);
    const clients = await db.select<{ id: string }>(
      `clients?select=id&stripe_customer_id=${eq(row.stripe_customer_id)}`,
    );
    if (clients.length === 0) return 'ignored';
    await db.upsert('subscriptions', { ...row, client_id: clients[0].id }, 'stripe_subscription_id');
    return 'saved';
  }

  return 'ignored';
}
