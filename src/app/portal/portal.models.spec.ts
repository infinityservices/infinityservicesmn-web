import { isFailedLinkRedirect } from './portal-auth';
import { hasOwnLayout } from '../app.component';
import { invoiceStatus, perInterval, splitProjects, subscriptionStatus, type PortalProject } from './portal.models';

describe('client portal helpers', () => {
  it('words invoice statuses for clients and flags past-due ones', () => {
    expect(invoiceStatus('unpaid')).toEqual({ label: 'Due', tone: 'amber' });
    expect(invoiceStatus('unpaid', true)).toEqual({ label: 'Past due', tone: 'red' });
    expect(invoiceStatus('paid').label).toBe('Paid');
    expect(invoiceStatus('something_new').label).toBe('something new');
  });

  it('shows a plan that is set to cancel', () => {
    expect(subscriptionStatus({ status: 'active', cancel_at_period_end: true }).label).toBe('Ends at period end');
    expect(subscriptionStatus({ status: 'active', cancel_at_period_end: false }).label).toBe('Active');
    expect(subscriptionStatus({ status: 'past_due', cancel_at_period_end: false }).tone).toBe('red');
  });

  it('formats billing intervals', () => {
    expect(perInterval('month')).toBe('/mo');
    expect(perInterval('year')).toBe('/yr');
    expect(perInterval(null)).toBe('');
  });

  it('splits open and finished projects', () => {
    const p = (status: PortalProject['status']) => ({ status }) as PortalProject;
    const { open, closed } = splitProjects([p('active'), p('done'), p('waiting'), p('cancelled'), p('quoted')]);
    expect(open.map((x) => x.status)).toEqual(['active', 'waiting', 'quoted']);
    expect(closed.map((x) => x.status)).toEqual(['done', 'cancelled']);
  });

  it('spots a rejected magic link in the redirect URL', () => {
    expect(isFailedLinkRedirect('#error=access_denied&error_code=otp_expired')).toBeTrue();
    expect(isFailedLinkRedirect('', '?error=access_denied')).toBeTrue();
    expect(isFailedLinkRedirect('#access_token=abc&type=magiclink')).toBeFalse();
    expect(isFailedLinkRedirect('')).toBeFalse();
  });

  it('gives the admin and portal their own layout', () => {
    expect(hasOwnLayout('/portal')).toBeTrue();
    expect(hasOwnLayout('/portal/login?link=expired')).toBeTrue();
    expect(hasOwnLayout('/admin/clients')).toBeTrue();
    expect(hasOwnLayout('/portals-of-time')).toBeFalse();
    expect(hasOwnLayout('/contact')).toBeFalse();
  });
});
