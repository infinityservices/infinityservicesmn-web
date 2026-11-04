import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminDataService } from '../admin-data.service';
import { Client, SUPPORT_TIERS, SupportTier, labelFor } from '../models';

@Component({
  selector: 'app-admin-clients',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './clients.component.html',
})
export class ClientsComponent implements OnInit {
  private readonly data = inject(AdminDataService);
  private readonly router = inject(Router);

  readonly clients = signal<Client[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly tiers = SUPPORT_TIERS;

  draft = { name: '', business: '', email: '', phone: '' };

  readonly visible = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.clients();
    return this.clients().filter((c) =>
      [c.name, c.business, c.email].some((v) => v?.toLowerCase().includes(q)),
    );
  });

  tierLabel(tier: SupportTier) {
    return labelFor(this.tiers, tier);
  }

  async ngOnInit() {
    try {
      this.clients.set(await this.data.clients());
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Could not load clients.');
    } finally {
      this.loading.set(false);
    }
  }

  async create() {
    if (!this.draft.name.trim()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const id = await this.data.createClient({
        name: this.draft.name.trim(),
        business: this.draft.business.trim() || null,
        email: this.draft.email.trim() || null,
        phone: this.draft.phone.trim() || null,
      });
      await this.router.navigate(['/admin/clients', id]);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Could not create the client.');
      this.saving.set(false);
    }
  }
}
