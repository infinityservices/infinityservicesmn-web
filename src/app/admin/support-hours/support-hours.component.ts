import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../admin-data.service';
import {
  Client,
  Project,
  TIME_CATEGORIES,
  TimeCategory,
  TimeEntry,
  formatMinutes,
  labelFor,
  monthRange,
  parseDuration,
  planUsage,
} from '../models';

/** Log time for a client and see support use against their plan, month by month. */
@Component({
  selector: 'app-support-hours',
  standalone: true,
  imports: [FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './support-hours.component.html',
})
export class SupportHoursComponent implements OnInit {
  private readonly data = inject(AdminDataService);

  readonly client = input.required<Client>();
  readonly projects = input<Project[]>([]);

  readonly month = signal(new Date());
  readonly entries = signal<TimeEntry[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');

  readonly categories = TIME_CATEGORIES;
  readonly fmt = formatMinutes;

  draft = { work_date: '', duration: '', category: 'support' as TimeCategory, project_id: '', description: '' };

  readonly usage = computed(() => planUsage(this.entries(), this.client().support_tier));
  readonly otherMinutes = computed(() =>
    this.entries()
      .filter((e) => e.category !== 'support')
      .reduce((sum, e) => sum + e.minutes, 0),
  );
  readonly isCurrentMonth = computed(() => monthRange(this.month()).start === monthRange(new Date()).start);
  readonly barPercent = computed(() => Math.min(100, Math.round(this.usage().ratio * 100)));
  readonly barClass = computed(() => {
    const r = this.usage().ratio;
    return r > 1 ? 'over' : r >= 0.8 ? 'near' : '';
  });

  categoryLabel(c: TimeCategory) {
    return labelFor(this.categories, c);
  }

  projectTitle(id: string | null) {
    return id ? this.projects().find((p) => p.id === id)?.title : undefined;
  }

  async ngOnInit() {
    this.draft = this.emptyDraft();
    await this.load();
  }

  async shiftMonth(delta: number) {
    const d = this.month();
    this.month.set(new Date(d.getFullYear(), d.getMonth() + delta, 1));
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const { start, end } = monthRange(this.month());
      this.entries.set(await this.data.timeEntries({ clientId: this.client().id, from: start, to: end }));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Could not load time entries.');
    } finally {
      this.loading.set(false);
    }
  }

  async add() {
    const minutes = parseDuration(this.draft.duration);
    if (!minutes) {
      this.error.set('Enter the time like 30, 45m, 1.5h or 1:15.');
      return;
    }
    if (!this.draft.description.trim()) return;
    await this.run(async () => {
      await this.data.addTimeEntry({
        client_id: this.client().id,
        project_id: this.draft.project_id || null,
        work_date: this.draft.work_date,
        minutes,
        category: this.draft.category,
        description: this.draft.description.trim(),
      });
      const keepCategory = this.draft.category;
      this.draft = { ...this.emptyDraft(), category: keepCategory };
      await this.load();
    });
  }

  async remove(entry: TimeEntry) {
    if (!confirm(`Delete ${formatMinutes(entry.minutes)} on ${entry.work_date}?`)) return;
    await this.run(async () => {
      await this.data.deleteTimeEntry(entry.id);
      this.entries.update((list) => list.filter((e) => e.id !== entry.id));
    });
  }

  private emptyDraft() {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      work_date: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
      duration: '',
      category: (this.client().support_tier === 'none' ? 'hourly' : 'support') as TimeCategory,
      project_id: '',
      description: '',
    };
  }

  private async run(work: () => Promise<void>) {
    this.busy.set(true);
    this.error.set('');
    try {
      await work();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      this.busy.set(false);
    }
  }
}
