import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { isSignedInAdmin } from '../admin-auth';
import { supabase } from '../supabase';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  readonly busy = signal(false);
  readonly error = signal('');

  async signIn() {
    this.busy.set(true);
    this.error.set('');
    const { error } = await supabase().auth.signInWithPassword({
      email: this.email.trim(),
      password: this.password,
    });
    if (error) {
      this.busy.set(false);
      this.error.set('That email and password did not work.');
      return;
    }
    if (!(await isSignedInAdmin())) {
      await supabase().auth.signOut();
      this.busy.set(false);
      this.error.set('This account does not have admin access.');
      return;
    }
    const next = this.route.snapshot.queryParamMap.get('next');
    await this.router.navigateByUrl(next?.startsWith('/admin') ? next : '/admin');
  }
}
