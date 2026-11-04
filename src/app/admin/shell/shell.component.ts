import { Component, OnDestroy, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { supabase } from '../supabase';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  // Shared admin styles (tables, cards, forms) live here and apply to every admin page.
  styleUrl: './shell.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ShellComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  readonly email = signal('');
  readonly menuOpen = signal(false);

  readonly nav = [
    { path: '/admin', label: 'Dashboard', exact: true },
    { path: '/admin/leads', label: 'Leads', exact: false },
    { path: '/admin/clients', label: 'Clients', exact: false },
    { path: '/admin/projects', label: 'Projects', exact: false },
    { path: '/admin/billing', label: 'Billing', exact: false },
  ];

  async ngOnInit() {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    const { data } = await supabase().auth.getUser();
    this.email.set(data.user?.email ?? '');
  }

  ngOnDestroy() {
    this.meta.removeTag('name="robots"');
  }

  async signOut() {
    await supabase().auth.signOut();
    await this.router.navigate(['/admin/login']);
  }
}
