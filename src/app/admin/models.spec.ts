import { Invoice, invoiceDraftFor, isOverdue, isUnpaid, monthlyAmount, openInvoiceFor } from './models';

describe('admin billing helpers', () => {
  const today = new Date('2026-11-04T12:00:00Z');

  it('flags unpaid invoices past their due date as overdue', () => {
    expect(isOverdue({ status: 'unpaid', due_date: '2026-11-01' }, today)).toBeTrue();
    expect(isOverdue({ status: 'unpaid', due_date: '2026-11-10' }, today)).toBeFalse();
    expect(isOverdue({ status: 'paid', due_date: '2026-11-01' }, today)).toBeFalse();
    expect(isOverdue({ status: 'unpaid', due_date: null }, today)).toBeFalse();
  });

  it('treats scheduled and partially paid invoices as unpaid', () => {
    expect(isUnpaid({ status: 'scheduled' })).toBeTrue();
    expect(isUnpaid({ status: 'partially_paid' })).toBeTrue();
    expect(isUnpaid({ status: 'canceled' })).toBeFalse();
  });

  it('normalizes subscription amounts to a monthly figure', () => {
    expect(monthlyAmount({ amount: 150, billing_interval: 'month' })).toBe(150);
    expect(monthlyAmount({ amount: 1200, billing_interval: 'year' })).toBe(100);
    expect(monthlyAmount({ amount: null, billing_interval: 'month' })).toBe(0);
  });
});

import { formatMinutes, monthRange, parseDuration, planUsage } from './models';

describe('support hours helpers', () => {
  it('computes the calendar month range', () => {
    expect(monthRange(new Date(2026, 1, 14))).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(monthRange(new Date(2026, 11, 31))).toEqual({ start: '2026-12-01', end: '2026-12-31' });
  });

  it('counts only support entries against the plan allowance', () => {
    const usage = planUsage(
      [
        { minutes: 60, category: 'support' },
        { minutes: 45, category: 'support' },
        { minutes: 300, category: 'project' },
      ],
      'standard',
    );
    expect(usage.used).toBe(105);
    expect(usage.allowance).toBe(90);
    expect(usage.overage).toBe(15);
    expect(usage.remaining).toBe(0);
    expect(usage.overageCharge).toBe(25); // 15 min at $100/hr
  });

  it('reports remaining time under the allowance', () => {
    const usage = planUsage([{ minutes: 20, category: 'support' }], 'priority');
    expect(usage.remaining).toBe(160);
    expect(usage.overage).toBe(0);
    expect(usage.ratio).toBeCloseTo(20 / 180);
  });

  it('formats minutes', () => {
    expect(formatMinutes(30)).toBe('30 min');
    expect(formatMinutes(120)).toBe('2 hr');
    expect(formatMinutes(95)).toBe('1 hr 35 min');
  });

  it('parses durations', () => {
    expect(parseDuration('90')).toBe(90);
    expect(parseDuration('45m')).toBe(45);
    expect(parseDuration('1:30')).toBe(90);
    expect(parseDuration('1.5')).toBe(90);
    expect(parseDuration('1.5h')).toBe(90);
    expect(parseDuration('2 hours')).toBe(120);
    expect(parseDuration('.25')).toBe(15);
    expect(parseDuration('abc')).toBeNull();
    expect(parseDuration('0')).toBeNull();
  });
});

describe('project invoice helpers', () => {
  const today = new Date(2026, 10, 5);

  it('splits jobs of $500 or more and uses the project due date', () => {
    expect(invoiceDraftFor({ quoted_amount: 800, due_date: '2026-11-20' }, today)).toEqual({
      amount: 800,
      split: true,
      depositDue: '2026-11-05',
      balanceDue: '2026-11-20',
      description: '',
    });
  });

  it('bills small jobs in one payment due in two weeks when there is no future due date', () => {
    const draft = invoiceDraftFor({ quoted_amount: 125, due_date: '2026-10-01' }, today);
    expect(draft.split).toBeFalse();
    expect(draft.balanceDue).toBe('2026-11-19');
  });

  it('ignores canceled invoices when finding a project invoice', () => {
    const base = { square_invoice_id: 'x', project_id: 'p1' } as Invoice;
    expect(openInvoiceFor('p1', [{ ...base, status: 'canceled' }])).toBeUndefined();
    expect(openInvoiceFor('p1', [{ ...base, status: 'draft' }])?.status).toBe('draft');
  });
});
