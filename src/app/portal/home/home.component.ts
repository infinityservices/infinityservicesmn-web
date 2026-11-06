import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { isOverdue, isUnpaid } from '../../admin/models';
import {
  EMPTY_OVERVIEW,
  PROJECT_KIND_TEXT,
  PROJECT_STATUS_TEXT,
  SUPPORT_TIER_TEXT,
  invoiceStatus,
  perInterval,
  splitProjects,
  subscriptionStatus,
  type PortalInvoice,
  type PortalOverview,
} from '../portal.models';
import { portalSupabase } from '../portal-supabase';

export const CONTACT_EMAIL = 'info@infinityservicesmn.com';

@Component({
  selector: 'app-portal-home',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class PortalHomeComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly email = signal('');
  readonly data = signal<PortalOverview>(EMPTY_OVERVIEW);
  readonly showClosed = signal(false);

  readonly projectStatus = PROJECT_STATUS_TEXT;
  readonly projectKind = PROJECT_KIND_TEXT;
  readonly tierText = SUPPORT_TIER_TEXT;
  readonly invoiceStatus = (i: PortalInvoice) => invoiceStatus(i.status, isOverdue(i));
  readonly subscriptionStatus = subscriptionStatus;
  readonly perInterval = perInterval;
  readonly contactEmail = CONTACT_EMAIL;

  readonly hasAccess = computed(() => this.data().clients.length > 0);
  readonly heading = computed(() => {
    const names = this.data().clients.map((c) => c.business || c.name);
    return names.join(' & ');
  });
  readonly firstName = computed(() => this.data().clients[0]?.name.split(' ')[0] ?? '');
  readonly projects = computed(() => splitProjects(this.data().projects));
  readonly unpaid = computed(() => this.data().invoices.filter((i) => isUnpaid(i)));
  readonly amountDue = computed(() => this.unpaid().reduce((sum, i) => sum + (i.amount ?? 0), 0));
  readonly overdueCount = computed(() => this.unpaid().filter((i) => isOverdue(i)).length);
  readonly activeCount = computed(() => this.projects().open.filter((p) => p.status !== 'quoted').length);
  /** Support plan: the live Stripe subscription if there is one, else the tier on file. */
  readonly plans = computed(() => this.data().subscriptions.filter((s) => s.status !== 'canceled'));
  readonly tierOnFile = computed(() => this.data().clients.find((c) => c.support_tier !== 'none')?.support_tier ?? null);

  readonly requestLink = computed(
    () =>
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Request from ${this.heading() || 'a client'}`)}`,
  );

  async ngOnInit() {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    try {
      const db = portalSupabase();
      const [{ data: user }, overview] = await Promise.all([db.auth.getUser(), db.rpc('portal_overview')]);
      this.email.set(user.user?.email ?? '');
      if (overview.error) throw new Error(overview.error.message);
      this.data.set({ ...EMPTY_OVERVIEW, ...(overview.data as PortalOverview) });
    } catch {
      this.error.set('Your account info could not be loaded. Refresh the page to try again.');
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    this.meta.removeTag('name="robots"');
  }

  projectTitle(projectId: string | null): string {
    return this.data().projects.find((p) => p.id === projectId)?.title ?? '';
  }

  async signOut() {
    await portalSupabase().auth.signOut();
    await this.router.navigate(['/portal/login']);
  }
}
