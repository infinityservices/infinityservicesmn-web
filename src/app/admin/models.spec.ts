import { isOverdue, isUnpaid, monthlyAmount } from './models';

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
