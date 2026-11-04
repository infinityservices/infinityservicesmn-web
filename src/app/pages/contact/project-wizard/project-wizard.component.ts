import { Component, ElementRef, computed, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { sendContact } from '../send-contact';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export const NEED_OPTIONS = [
  { value: 'Quick fix', hint: 'Something is broken or annoying and needs sorting out' },
  { value: 'Small task or automation', hint: 'Cut out a repetitive job, a report, or data entry' },
  { value: 'Connect my tools', hint: 'Get your store, payments, and books talking to each other' },
  { value: 'A custom app', hint: 'A tool built around how your business works' },
  { value: 'Ongoing support', hint: 'Someone to look after software you already have' },
  { value: 'Not sure yet', hint: "You know something's off, but not what the fix is" },
] as const;

export const TOOL_OPTIONS = [
  'Spreadsheets (Excel or Google Sheets)',
  'QuickBooks',
  'Square',
  'Shopify',
  'Wix',
  'Stripe',
  'Paper or a whiteboard',
] as const;

export const TIMING_OPTIONS = ['In the next few weeks', 'In the next 1–3 months', 'Just exploring'] as const;

export const BUDGET_OPTIONS = [
  'Under $500',
  '$500–$1,500',
  '$1,500–$3,000',
  'Over $3,000',
  'Not sure yet',
] as const;

export const STEP_TITLES = [
  'What do you need?',
  'What do you use today?',
  "What's the problem?",
  'Timing and budget',
  'How do I reach you?',
] as const;

@Component({
  selector: 'app-project-wizard',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './project-wizard.component.html',
  styleUrl: './project-wizard.component.scss',
})
export class ProjectWizardComponent {
  /** Lets the parent offer the quick form instead. */
  readonly switchToQuick = output<void>();

  readonly needOptions = NEED_OPTIONS;
  readonly toolOptions = TOOL_OPTIONS;
  readonly timingOptions = TIMING_OPTIONS;
  readonly budgetOptions = BUDGET_OPTIONS;
  readonly stepTitles = STEP_TITLES;

  /** 0–4 are the question steps; 5 is the review screen. */
  readonly step = signal(0);
  readonly reviewStep = STEP_TITLES.length;
  readonly state = signal<SubmitState>('idle');
  readonly errorMessage = signal('');
  readonly selectedTools = signal<string[]>([]);
  readonly stepError = signal('');

  readonly progress = computed(() => Math.min(this.step() + 1, this.reviewStep));

  private readonly fb = new FormBuilder();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly form = this.fb.nonNullable.group({
    need: ['', Validators.required],
    otherTools: ['', Validators.maxLength(200)],
    problem: ['', [Validators.required, Validators.maxLength(1500)]],
    success: ['', Validators.maxLength(800)],
    timing: ['', Validators.required],
    budget: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    business: ['', Validators.maxLength(120)],
    website: [''],
  });

  private readonly stepControls: (keyof typeof this.form.controls)[][] = [
    ['need'],
    ['otherTools'],
    ['problem', 'success'],
    ['timing', 'budget'],
    ['name', 'email', 'business'],
  ];

  private readonly stepMessages = [
    'Pick the option that fits best. "Not sure yet" is fine.',
    '',
    'A sentence or two about the problem is plenty.',
    'Pick a rough timing and budget. "Not sure yet" is fine.',
    'I need your name and a valid email to reply.',
  ];

  toggleTool(tool: string): void {
    this.selectedTools.update((tools) =>
      tools.includes(tool) ? tools.filter((t) => t !== tool) : [...tools, tool],
    );
  }

  isToolSelected(tool: string): boolean {
    return this.selectedTools().includes(tool);
  }

  next(): void {
    const controls = this.stepControls[this.step()];
    const invalid = controls.some((name) => this.form.controls[name].invalid);
    if (invalid) {
      controls.forEach((name) => this.form.controls[name].markAsTouched());
      this.stepError.set(this.stepMessages[this.step()]);
      return;
    }
    this.stepError.set('');
    this.step.update((s) => Math.min(s + 1, this.reviewStep));
    this.keepInView();
  }

  back(): void {
    this.stepError.set('');
    this.step.update((s) => Math.max(s - 1, 0));
    this.keepInView();
  }

  goTo(step: number): void {
    this.stepError.set('');
    this.step.set(step);
    this.keepInView();
  }

  /** On phones, a new step can start above the fold; bring the top of the wizard back into view. */
  private keepInView(): void {
    const el = this.host.nativeElement;
    if (typeof el.getBoundingClientRect === 'function' && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /** Every tool the visitor picked, plus anything typed in "Other". */
  tools(): string[] {
    const other = this.form.controls.otherTools.value.trim();
    return other ? [...this.selectedTools(), other] : this.selectedTools();
  }

  /** The plain-text email body Jeremy receives. */
  buildMessage(): string {
    const v = this.form.getRawValue();
    const lines = [
      'Project request (sent from the project planner)',
      '',
      `What they need: ${v.need}`,
      `Tools today: ${this.tools().join(', ') || 'Not specified'}`,
    ];
    if (v.business.trim()) {
      lines.push(`Business: ${v.business.trim()}`);
    }
    lines.push('', 'The problem:', v.problem.trim());
    if (v.success.trim()) {
      lines.push('', 'What success looks like:', v.success.trim());
    }
    lines.push('', `Timing: ${v.timing}`, `Budget: ${v.budget}`);
    return lines.join('\n');
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstBad = this.stepControls.findIndex((names) =>
        names.some((name) => this.form.controls[name].invalid),
      );
      if (firstBad >= 0) {
        this.goTo(firstBad);
        this.stepError.set(this.stepMessages[firstBad]);
      }
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set('');
    const v = this.form.getRawValue();

    try {
      await sendContact({
        name: v.name,
        email: v.email,
        message: this.buildMessage(),
        website: v.website,
        kind: 'project',
      });
      this.state.set('success');
    } catch (err) {
      this.state.set('error');
      this.errorMessage.set(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }
}
