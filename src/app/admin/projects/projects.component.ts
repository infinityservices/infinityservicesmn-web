import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminDataService } from '../admin-data.service';
import {
  ACTIVE_JOB_LIMIT,
  Client,
  PROJECT_KINDS,
  PROJECT_STATUSES,
  Project,
  ProjectKind,
  ProjectStatus,
  labelFor,
} from '../models';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './projects.component.html',
})
export class ProjectsComponent implements OnInit {
  private readonly data = inject(AdminDataService);

  readonly projects = signal<Project[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly showForm = signal(false);
  readonly showClosed = signal(false);

  readonly kinds = PROJECT_KINDS;
  readonly statuses = PROJECT_STATUSES;
  readonly jobLimit = ACTIVE_JOB_LIMIT;

  draft = this.empty();

  readonly groups = computed(() => {
    const order: ProjectStatus[] = this.showClosed()
      ? ['active', 'waiting', 'quoted', 'done', 'cancelled']
      : ['active', 'waiting', 'quoted'];
    return order.map((status) => ({
      status,
      label: labelFor(this.statuses, status),
      items: this.projects().filter((p) => p.status === status),
    }));
  });

  readonly activeCount = computed(
    () => this.projects().filter((p) => p.status === 'active' || p.status === 'waiting').length,
  );

  kindLabel(kind: ProjectKind) {
    return labelFor(this.kinds, kind);
  }

  async ngOnInit() {
    try {
      const [projects, clients] = await Promise.all([this.data.projects(), this.data.clients()]);
      this.projects.set(projects);
      this.clients.set(clients);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Could not load projects.');
    } finally {
      this.loading.set(false);
    }
  }

  async create() {
    if (!this.draft.title.trim() || !this.draft.client_id) return;
    await this.run(async () => {
      await this.data.createProject({
        client_id: this.draft.client_id,
        title: this.draft.title.trim(),
        kind: this.draft.kind,
        status: this.draft.status,
        quoted_amount: this.draft.quoted_amount ?? null,
        due_date: this.draft.due_date || null,
      });
      this.draft = this.empty();
      this.showForm.set(false);
      this.projects.set(await this.data.projects());
    });
  }

  async setStatus(project: Project, status: ProjectStatus) {
    await this.run(async () => {
      await this.data.updateProject(project.id, { status });
      await this.data.addActivity({
        client_id: project.client_id,
        project_id: project.id,
        kind: 'status_change',
        body: `“${project.title}” moved to ${labelFor(this.statuses, status)}.`,
      });
      this.projects.update((list) => list.map((p) => (p.id === project.id ? { ...p, status } : p)));
    });
  }

  private empty() {
    return {
      client_id: '',
      title: '',
      kind: 'small_task' as ProjectKind,
      status: 'quoted' as ProjectStatus,
      quoted_amount: null as number | null,
      due_date: '',
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
