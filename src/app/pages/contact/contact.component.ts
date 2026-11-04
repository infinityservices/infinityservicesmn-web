import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BETA_TOPIC } from '../../shared/projects';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  readonly state = signal<SubmitState>('idle');
  readonly errorMessage = signal('');

  readonly isBetaSignup = signal(false);

  private readonly fb = new FormBuilder();
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.maxLength(4000)]],
    website: [''],
  });

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('topic') === BETA_TOPIC) {
      this.isBetaSignup.set(true);
      this.form.controls.message.setValue(
        "I'd like to try the InfiniHerd beta. A bit about my operation: ",
      );
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.form.getRawValue()),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Something went wrong.' }));
        throw new Error(body.error ?? 'Something went wrong.');
      }

      this.state.set('success');
      this.form.reset();
    } catch (err) {
      this.state.set('error');
      if (err instanceof TypeError) {
        this.errorMessage.set('Network error — please check your connection and try again.');
      } else {
        this.errorMessage.set(err instanceof Error ? err.message : 'Something went wrong.');
      }
    }
  }
}
