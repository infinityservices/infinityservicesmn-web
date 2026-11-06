import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { portalSupabase } from '../portal-supabase';

@Component({
  selector: 'app-portal-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class PortalLoginComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  readonly busy = signal(false);
  readonly error = signal('');
  readonly sentTo = signal('');
  readonly expired = signal(false);

  async ngOnInit() {
    this.expired.set(this.route.snapshot.queryParamMap.get('link') === 'expired');
    const { data } = await portalSupabase().auth.getSession();
    if (data.session) await this.router.navigateByUrl('/portal');
  }

  async sendLink() {
    const email = this.email.trim().toLowerCase();
    if (!email) return;
    this.busy.set(true);
    this.error.set('');
    const { error } = await portalSupabase().auth.signInWithOtp({
      email,
      options: {
        // Only people I've invited have a login; never create one here.
        shouldCreateUser: false,
        emailRedirectTo: `${location.origin}/portal`,
      },
    });
    this.busy.set(false);
    // An email with no portal login gets the same answer as one that has it,
    // so the form can't be used to check who my clients are.
    if (error && !isUnknownEmail(error)) {
      this.error.set(
        error.status === 429
          ? 'Too many sign-in emails in a short time. Wait a minute and try again.'
          : 'Something went wrong sending your link. Please try again.',
      );
      return;
    }
    this.expired.set(false);
    this.sentTo.set(email);
  }

  reset() {
    this.sentTo.set('');
    this.email = '';
  }
}

function isUnknownEmail(error: { status?: number; code?: string; message: string }): boolean {
  return (
    error.code === 'otp_disabled' ||
    error.code === 'signup_disabled' ||
    error.code === 'user_not_found' ||
    /signups? not allowed/i.test(error.message)
  );
}
