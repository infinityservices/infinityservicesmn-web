import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectWizardComponent } from './project-wizard.component';

describe('ProjectWizardComponent', () => {
  let fixture: ComponentFixture<ProjectWizardComponent>;
  let wizard: ProjectWizardComponent;

  function fillAll(): void {
    wizard.form.patchValue({
      need: 'Connect my tools',
      problem: 'I copy orders into a spreadsheet every Friday.',
      success: 'A restock list ready on Monday.',
      timing: 'In the next 1–3 months',
      budget: '$500–$1,500',
      name: 'Jane Doe',
      email: 'jane@example.com',
      business: 'Jane’s Jams',
      otherTools: 'Old Access database',
    });
    wizard.toggleTool('Square');
    wizard.toggleTool('QuickBooks');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProjectWizardComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProjectWizardComponent);
    wizard = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts on the first step', () => {
    expect(wizard.step()).toBe(0);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('What do you need?');
  });

  it('will not advance past a step with a missing answer', () => {
    wizard.next();
    expect(wizard.step()).toBe(0);
    expect(wizard.stepError()).not.toBe('');
  });

  it('advances, goes back, and lets the tools step be skipped', () => {
    wizard.form.controls.need.setValue('Quick fix');
    wizard.next();
    expect(wizard.step()).toBe(1);
    wizard.next();
    expect(wizard.step()).toBe(2);
    wizard.back();
    expect(wizard.step()).toBe(1);
  });

  it('toggles tools on and off', () => {
    wizard.toggleTool('Wix');
    expect(wizard.isToolSelected('Wix')).toBe(true);
    wizard.toggleTool('Wix');
    expect(wizard.isToolSelected('Wix')).toBe(false);
  });

  it('builds a readable email body from the answers', () => {
    fillAll();
    const message = wizard.buildMessage();
    expect(message).toContain('What they need: Connect my tools');
    expect(message).toContain('Tools today: Square, QuickBooks, Old Access database');
    expect(message).toContain('Business: Jane’s Jams');
    expect(message).toContain('I copy orders into a spreadsheet every Friday.');
    expect(message).toContain('Timing: In the next 1–3 months');
    expect(message).toContain('Budget: $500–$1,500');
  });

  it('sends a project request and shows a thank-you', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    fillAll();
    await wizard.submit();

    const body = JSON.parse(fetchSpy.calls.mostRecent().args[1]!.body as string);
    expect(body.kind).toBe('project');
    expect(body.name).toBe('Jane Doe');
    expect(body.message).toContain('Connect my tools');
    expect(wizard.state()).toBe('success');
  });

  it('jumps back to the first incomplete step instead of sending', async () => {
    const fetchSpy = spyOn(window, 'fetch');
    fillAll();
    wizard.form.controls.problem.setValue('');
    wizard.goTo(wizard.reviewStep);
    await wizard.submit();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(wizard.step()).toBe(2);
  });

  it('keeps answers and shows the error when sending fails', async () => {
    spyOn(window, 'fetch').and.resolveTo(
      new Response(JSON.stringify({ error: 'Email delivery failed.' }), { status: 502 }),
    );
    fillAll();
    await wizard.submit();
    expect(wizard.state()).toBe('error');
    expect(wizard.errorMessage()).toBe('Email delivery failed.');
    expect(wizard.form.controls.problem.value).toContain('spreadsheet');
  });
});
