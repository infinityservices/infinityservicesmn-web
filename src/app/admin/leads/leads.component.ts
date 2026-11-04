import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminDataService } from '../admin-data.service';
import { LEAD_KIND_LABELS, LEAD_STATUSES, Lead, LeadStatus, labelFor } from '../models';

type Filter = LeadStatus | 'open' | 'all';

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './leads.component.html',
})
export class LeadsComponent implements OnInit {
  private readonly data = inject(AdminDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly leads = signal<Lead[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filter = signal<Filter>('open');
  readonly openId = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly notesDraft = signal('');

  readonly statuses = LEAD_STATUSES;
  readonly kindLabels = LEAD_KIND_LABELS;
  readonly filters: { value: Filter; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
    { value: 'spam', label: 'Spam' },
    { value: 'all', label: 'All' },
  ];

  readonly visible = computed(() => {
    const f = this.filter();
    return this.leads().filter((l) =>
      f === 'all' ? true : f === 'open' ? l.status === 'new' || l.status === 'contacted' : l.status === f,
    );
  });

  count(f: Filter): number {
    return this.leads().filter((l) =>
      f === 'all' ? true : f === 'open' ? l.status === 'new' || l.status === 'contacted' : l.status === f,
    ).length;
  }

  statusLabel(status: LeadStatus) {
    return labelFor(this.statuses, status);
  }

  badgeClass(status: LeadStatus) {
    return { new: 'blue', contacted: 'amber', won: 'green', lost: '', spam: 'red' }[status];
  }

  async ngOnInit() {
    await this.load();
    const open = this.route.snapshot.queryParamMap.get('open');
    if (open) {
      const lead = this.leads().find((l) => l.id === open);
      if (lead) {
        this.filter.set('all');
        this.toggle(lead);
      }
    }
  }

  async load() {
    try {
      this.leads.set(await this.data.leads());
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Could not load leads.');
    } finally {
      this.loading.set(false);
    }
  }

  toggle(lead: Lead) {
    if (this.openId() === lead.id) {
      this.openId.set(null);
    } else {
      this.openId.set(lead.id);
      this.notesDraft.set(lead.notes ?? '');
    }
  }

  private patchLocal(id: string, patch: Partial<Lead>) {
    this.leads.update((list) => list.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async setStatus(lead: Lead, status: LeadStatus) {
    await this.run(lead.id, async () => {
      await this.data.updateLead(lead.id, { status });
      this.patchLocal(lead.id, { status });
    });
  }

  async saveNotes(lead: Lead) {
    const notes = this.notesDraft().trim() || null;
    await this.run(lead.id, async () => {
      await this.data.updateLead(lead.id, { notes });
      this.patchLocal(lead.id, { notes });
    });
  }

  async convert(lead: Lead) {
    await this.run(lead.id, async () => {
      const clientId = await this.data.convertLead(lead);
      await this.router.navigate(['/admin/clients', clientId]);
    });
  }

  private async run(id: string, work: () => Promise<void>) {
    this.busyId.set(id);
    this.error.set('');
    try {
      await work();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      this.busyId.set(null);
    }
  }
}
