import { createHmac, timingSafeEqual } from 'node:crypto';
import { eq, ieq, SupabaseRest } from './supabase-rest';

/**
 * Verifies Square's `x-square-hmacsha256-signature` header: base64
 * HMAC-SHA256 of the notification URL followed by the raw body.
 */
export function verifySquareSignature(
  rawBody: string,
  header: string | undefined,
  signatureKey: string,
  notificationUrl: string,
): boolean {
  if (!header) return false;
  const expected = createHmac('sha256', signatureKey).update(notificationUrl + rawBody).digest();
  const given = Buffer.from(header, 'base64');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

interface SquareMoney {
  amount?: number;
}

export interface SquareInvoice {
  id: string;
  invoice_number?: string;
  title?: string;
  status?: string;
  public_url?: string;
  updated_at?: string;
  primary_recipient?: {
    customer_id?: string;
    given_name?: string;
    family_name?: string;
    company_name?: string;
    email_address?: string;
  };
  payment_requests?: Array<{
    due_date?: string;
    computed_amount_money?: SquareMoney;
    total_completed_amount_money?: SquareMoney;
  }>;
}

export interface SquareEvent {
  type: string;
  data?: { object?: { invoice?: SquareInvoice } };
}

/** Maps a Square invoice to a row for the `invoices` table. */
export function invoiceRow(invoice: SquareInvoice) {
  const recipient = invoice.primary_recipient ?? {};
  const requests = invoice.payment_requests ?? [];
  const cents = requests.reduce((sum, r) => sum + (r.computed_amount_money?.amount ?? 0), 0);
  const dueDates = requests.map((r) => r.due_date).filter((d): d is string => Boolean(d)).sort();
  const name = [recipient.given_name, recipient.family_name].filter(Boolean).join(' ');
  const status = (invoice.status ?? 'unknown').toLowerCase();
  return {
    square_invoice_id: invoice.id,
    square_customer_id: recipient.customer_id ?? null,
    invoice_number: invoice.invoice_number ?? null,
    title: invoice.title ?? null,
    recipient_name: name || recipient.company_name || null,
    recipient_email: recipient.email_address ?? null,
    amount: requests.length ? cents / 100 : null,
    status,
    due_date: dueDates.at(-1) ?? null,
    paid_at: status === 'paid' ? (invoice.updated_at ?? new Date().toISOString()) : null,
    public_url: invoice.public_url ?? null,
  };
}

/**
 * Applies one Square invoice event. The invoice is attached to the client with
 * the same Square customer ID; failing that, to the one client with the same
 * email, which also records that client's Square customer ID for next time.
 */
export async function handleSquareEvent(event: SquareEvent, db: SupabaseRest): Promise<'saved' | 'ignored'> {
  const invoice = event.data?.object?.invoice;
  if (!event.type.startsWith('invoice.') || !invoice?.id) return 'ignored';

  const row = invoiceRow(invoice);
  let clientId: string | null = null;

  if (row.square_customer_id) {
    const byId = await db.select<{ id: string }>(
      `clients?select=id&square_customer_id=${eq(row.square_customer_id)}`,
    );
    clientId = byId[0]?.id ?? null;
  }
  if (!clientId && row.recipient_email) {
    const byEmail = await db.select<{ id: string; square_customer_id: string | null }>(
      `clients?select=id,square_customer_id&email=${ieq(row.recipient_email)}`,
    );
    if (byEmail.length === 1) {
      clientId = byEmail[0].id;
      if (!byEmail[0].square_customer_id && row.square_customer_id) {
        await db.update('clients', `id=${eq(clientId)}`, {
          square_customer_id: row.square_customer_id,
        });
      }
    }
  }

  // Leave client_id out when unknown, so a manual link made in the admin
  // isn't wiped by a later webhook for the same invoice.
  await db.upsert('invoices', clientId ? { ...row, client_id: clientId } : row, 'square_invoice_id');
  return 'saved';
}
