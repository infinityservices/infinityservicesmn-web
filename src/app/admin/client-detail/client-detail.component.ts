import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminDataService } from '../admin-data.service';
import {
  Activity,
  ActivityKind,
  Client,
  Invoice,
  PROJECT_KINDS,
  PROJECT_STATUSES,
  PortalMember,
  Project,
  ProjectKind,
  ProjectStatus,
  SUPPORT_TIERS,
  Subscription,
  isOverdue,
  labelFor,
} from '../models';

@Component({
  selector: 'app-admin-client-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './client-detail.component.html',
})
export class ClientDetailComponent implements OnInit {
  private readonly data = inject(AdminDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly saved = signal(false);
  readonly busy = signal(false);
  readonly client = signal<Client | null>(null);
  readonly projects = signal<Project[]>([]);
  readonly invoices = signal<Invoice[]>([]);
  readonly subscriptions = signal<Subscription[]>([]);
  readonly activity = signal<Activity[]>([]);
  readonly showProjectForm = signal(false);
  readonly portalMembers = signal<PortalMember[]>([]);
  readonly portalMessage = signal('');

  readonly tiers = SUPPORT_TIERS;
  readonly projectKinds = PROJECT_KINDS;
  readonly projectStatuses = PROJECT_STATUSES;
  readonly isOverdue = isOverdue;

  form: Partial<Client> = {};
  projectDraft = this.emptyProject();
  note = { kind: 'note' as ActivityKind, body: '' };
  portalEmail = '';

  private get id(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  kindLabel(kind: ProjectKind) {
    return labelFor(this.projectKinds, kind);
  }

  statusLabel(status: ProjectStatus) {
    return labelFor(this.projectStatuses, status);
  }

  async ngOnInit() {
    try {
      const [client, projects, invoices, subscriptions, activity, members] = await Promise.all([
        this.data.client(this.id),
        this.data.projects(this.id),
        this.data.invoices(this.id),
        this.data.subscriptions(this.id),
        this.data.activity({ clientId: this.id }),
        this.data.portalMembers(this.id),
      ]);
      this.portalMembers.set(members);
      if (!members.length) this.portalEmail = client.email ?? '';
      this.client.set(client);
      this.form = { ...client };
      this.projects.set(projects);
      this.invoices.set(invoices);
      this.subscriptions.set(subscriptions);
      this.activity.set(activity);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Could not load this client.');
    } finally {
      this.loading.set(false);
    }
  }

  async save() {
    await this.run(async () => {
      const blank = (v: string | null | undefined) => (v?.trim() ? v.trim() : null);
      const patch: Partial<Client> = {
        name: this.form.name?.trim() || this.client()!.name,
        business: blank(this.form.business),
        email: blank(this.form.email),
        phone: blank(this.form.phone),
        website: blank(this.form.website),
        hosting_notes: blank(this.form.hosting_notes),
        support_tier: this.form.support_tier ?? 'none',
        square_customer_id: blank(this.form.square_customer_id),
        stripe_customer_id: blank(this.form.stripe_customer_id),
        notes: blank(this.form.notes),
      };
      await this.data.updateClient(this.id, patch);
      this.client.update((c) => (c ? { ...c, ...patch } : c));
      // Linking a Square or Stripe ID can attach billing records, so refresh them.
      this.invoices.set(await this.data.invoices(this.id));
      this.subscriptions.set(await this.data.subscriptions(this.id));
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
    });
  }

  async addProject() {
    if (!this.projectDraft.title.trim()) return;
    await this.run(async () => {
      await this.data.createProject({
        client_id: this.id,
        title: this.projectDraft.title.trim(),
        kind: this.projectDraft.kind,
        status: this.projectDraft.status,
        quoted_amount: this.projectDraft.quoted_amount ?? null,
        due_date: this.projectDraft.due_date || null,
      });
      await this.data.addActivity({
        client_id: this.id,
        kind: 'status_change',
        body: `Added project “${this.projectDraft.title.trim()}”.`,
      });
      this.projectDraft = this.emptyProject();
      this.showProjectForm.set(false);
      await this.refreshProjectsAndActivity();
    });
  }

  async setProjectStatus(project: Project, status: ProjectStatus) {
    await this.run(async () => {
      await this.data.updateProject(project.id, { status });
      await this.data.addActivity({
        client_id: this.id,
        project_id: project.id,
        kind: 'status_change',
        body: `“${project.title}” moved to ${this.statusLabel(status)}.`,
      });
      await this.refreshProjectsAndActivity();
    });
  }

  async addNote() {
    const body = this.note.body.trim();
    if (!body) return;
    await this.run(async () => {
      await this.data.addActivity({ client_id: this.id, kind: this.note.kind, body });
      this.note = { kind: 'note', body: '' };
      this.activity.set(await this.data.activity({ clientId: this.id }));
    });
  }

  async invite(email: string) {
    const address = email.trim().toLowerCase();
    if (!address) return;
    this.portalMessage.set('');
    await this.run(async () => {
      const outcome = await this.data.invitePortalMember(this.id, address);
      this.portalMessage.set(
        outcome === 'invited'
          ? `Invite sent to ${address}.`
          : `${address} already had a login, so I sent them a sign-in link.`,
      );
      await this.data.addActivity({
        client_id: this.id,
        kind: 'email',
        body: `Sent client portal ${outcome === 'invited' ? 'invite' : 'sign-in link'} to ${address}.`,
      });
      this.portalEmail = '';
      const [members, activity] = await Promise.all([
        this.data.portalMembers(this.id),
        this.data.activity({ clientId: this.id }),
      ]);
      this.portalMembers.set(members);
      this.activity.set(activity);
    });
  }

  async removePortalMember(member: PortalMember) {
    if (!confirm(`Remove portal access for ${member.email}? They won't see this client's account anymore.`)) {
      return;
    }
    this.portalMessage.set('');
    await this.run(async () => {
      await this.data.removePortalMember(member.id);
      this.portalMembers.update((list) => list.filter((m) => m.id !== member.id));
    });
  }

  async remove() {
    const c = this.client();
    if (!c || !confirm(`Delete ${c.name}? Their projects and notes are deleted too. Invoices stay, unlinked.`)) {
      return;
    }
    await this.run(async () => {
      await this.data.deleteClient(this.id);
      await this.router.navigate(['/admin/clients']);
    });
  }

  private async refreshProjectsAndActivity() {
    const [projects, activity] = await Promise.all([
      this.data.projects(this.id),
      this.data.activity({ clientId: this.id }),
    ]);
    this.projects.set(projects);
    this.activity.set(activity);
  }

  private emptyProject() {
    return {
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
