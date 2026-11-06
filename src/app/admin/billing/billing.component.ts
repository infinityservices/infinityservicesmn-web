import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminDataService } from '../admin-data.service';
import { Client, Invoice, Subscription, isOverdue, isUnpaid, monthlyAmount } from '../models';

type InvoiceFilter = 'open' | 'overdue' | 'paid' | 'unlinked' | 'all';

@Component({
  selector: 'app-admin-billing',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './billing.component.html',
})
export class BillingComponent implements OnInit {
  private readonly data = inject(AdminDataService);

  readonly invoices = signal<Invoice[]>([]);
  readonly subscriptions = signal<Subscription[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly refreshing = signal(false);
  readonly refreshNote = signal('');
  readonly filter = signal<InvoiceFilter>('open');
  readonly isOverdue = isOverdue;

  readonly filters: { value: InvoiceFilter; label: string }[] = [
    { value: 'open', label: 'Unpaid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'paid', label: 'Paid' },
    { value: 'unlinked', label: 'Not linked to a client' },
    { value: 'all', label: 'All' },
  ];

  readonly visible = computed(() => this.invoices().filter((i) => this.matches(i, this.filter())));
  readonly monthlySupport = computed(() =>
    this.subscriptions()
      .filter((s) => s.status === 'active' || s.status === 'trialing')
      .reduce((sum, s) => sum + monthlyAmount(s), 0),
  );

  count(f: InvoiceFilter) {
    return this.invoices().filter((i) => this.matches(i, f)).length;
  }

  private matches(i: Invoice, f: InvoiceFilter): boolean {
    switch (f) {
      case 'open':
        return isUnpaid(i);
      case 'overdue':
        return isOverdue(i);
      case 'paid':
        return i.status === 'paid';
      case 'unlinked':
        return !i.client_id;
      default:
        return true;
    }
  }

  async ngOnInit() {
    try {
      const [invoices, subscriptions, clients] = await Promise.all([
        this.data.invoices(),
        this.data.subscriptions(),
        this.data.clients(),
      ]);
      this.invoices.set(invoices);
      this.subscriptions.set(subscriptions);
      this.clients.set(clients);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Could not load billing.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Re-reads every open invoice from Square, for changes the webhook missed. */
  async refreshFromSquare() {
    this.error.set('');
    this.refreshNote.set('');
    this.refreshing.set(true);
    try {
      const { checked, changed } = await this.data.refreshInvoices();
      this.invoices.set(await this.data.invoices());
      this.refreshNote.set(
        checked === 0 ? 'No open invoices to check.' : `Checked ${checked}; ${changed} changed.`,
      );
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Could not refresh from Square.');
    } finally {
      this.refreshing.set(false);
    }
  }

  async link(invoice: Invoice, clientId: string) {
    this.error.set('');
    try {
      await this.data.linkInvoice(invoice.id, clientId || null);
      const name = this.clients().find((c) => c.id === clientId)?.name;
      this.invoices.update((list) =>
        list.map((i) => (i.id === invoice.id ? { ...i, client_id: clientId || null, clients: name ? { name } : null } : i)),
      );
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Could not link the invoice.');
    }
  }
}
