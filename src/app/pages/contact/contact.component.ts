import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BETA_TOPIC } from '../../shared/projects';
import { ProjectWizardComponent } from './project-wizard/project-wizard.component';
import { sendContact } from './send-contact';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';
export type ContactMode = 'project' | 'quick';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, ProjectWizardComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  readonly state = signal<SubmitState>('idle');
  readonly errorMessage = signal('');

  readonly isBetaSignup = signal(false);
  /** The guided planner is the default; the quick form is one click away. */
  readonly mode = signal<ContactMode>('project');

  private readonly fb = new FormBuilder();
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.maxLength(4000)]],
    website: [''],
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('mode') === 'quick') {
      this.mode.set('quick');
    }
    if (params.get('topic') === BETA_TOPIC) {
      this.isBetaSignup.set(true);
      this.mode.set('quick');
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
      await sendContact({
        ...this.form.getRawValue(),
        kind: this.isBetaSignup() ? 'beta' : 'quick',
      });
      this.state.set('success');
      this.form.reset();
    } catch (err) {
      this.state.set('error');
      this.errorMessage.set(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }
}
