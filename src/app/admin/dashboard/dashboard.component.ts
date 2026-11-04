import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminDataService } from '../admin-data.service';
import {
  ACTIVE_JOB_LIMIT,
  Client,
  Invoice,
  LEAD_KIND_LABELS,
  Lead,
  Project,
  Subscription,
  TimeEntry,
  formatMinutes,
  isOverdue,
  isUnpaid,
  monthlyAmount,
  monthRange,
  planUsage,
} from '../models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly data = inject(AdminDataService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly leads = signal<Lead[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly invoices = signal<Invoice[]>([]);
  readonly subscriptions = signal<Subscription[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly monthEntries = signal<TimeEntry[]>([]);
  readonly fmt = formatMinutes;

  readonly kindLabels = LEAD_KIND_LABELS;
  readonly jobLimit = ACTIVE_JOB_LIMIT;

  readonly newLeads = computed(() => this.leads().filter((l) => l.status === 'new'));
  readonly activeProjects = computed(() =>
    this.projects().filter((p) => p.status === 'active' || p.status === 'waiting'),
  );
  readonly unpaid = computed(() => this.invoices().filter((i) => isUnpaid(i)));
  readonly unpaidTotal = computed(() => this.unpaid().reduce((sum, i) => sum + (i.amount ?? 0), 0));
  readonly overdueCount = computed(() => this.invoices().filter((i) => isOverdue(i)).length);
  readonly activeSubs = computed(() =>
    this.subscriptions().filter((s) => s.status === 'active' || s.status === 'trialing'),
  );
  readonly monthlySupport = computed(() =>
    this.activeSubs().reduce((sum, s) => sum + monthlyAmount(s), 0),
  );
  /** Plan clients this month, most used first. */
  readonly supportUsage = computed(() =>
    this.clients()
      .filter((c) => c.support_tier !== 'none')
      .map((c) => ({
        client: c,
        usage: planUsage(this.monthEntries().filter((e) => e.client_id === c.id), c.support_tier),
      }))
      .sort((a, b) => b.usage.ratio - a.usage.ratio),
  );

  readonly upcoming = computed(() =>
    this.activeProjects()
      .filter((p) => p.due_date)
      .slice(0, 5),
  );

  async ngOnInit() {
    try {
      const { start, end } = monthRange(new Date());
      const [leads, projects, invoices, subscriptions, clients, monthEntries] = await Promise.all([
        this.data.leads(),
        this.data.projects(),
        this.data.invoices(),
        this.data.subscriptions(),
        this.data.clients(),
        this.data.timeEntries({ from: start, to: end }),
      ]);
      this.clients.set(clients);
      this.monthEntries.set(monthEntries);
      this.leads.set(leads);
      this.projects.set(projects);
      this.invoices.set(invoices);
      this.subscriptions.set(subscriptions);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Could not load the dashboard.');
    } finally {
      this.loading.set(false);
    }
  }
}
