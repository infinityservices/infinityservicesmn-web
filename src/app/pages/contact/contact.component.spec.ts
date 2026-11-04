import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();
  });

  it('creates the contact page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('starts with an invalid, untouched form', () => {
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('does not submit when the form is invalid', async () => {
    const fetchSpy = spyOn(window, 'fetch');
    await fixture.componentInstance.submit();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.touched).toBe(true);
  });

  it('posts to /api/contact and shows success on a valid submit', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    fixture.componentInstance.form.setValue({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello there.',
      website: '',
    });

    await fixture.componentInstance.submit();

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/contact',
      jasmine.objectContaining({ method: 'POST' }),
    );
    expect(fixture.componentInstance.state()).toBe('success');
  });

  it('shows an inline error and preserves values when the request fails', async () => {
    spyOn(window, 'fetch').and.resolveTo(
      new Response(JSON.stringify({ error: 'Email delivery failed.' }), { status: 502 }),
    );

    fixture.componentInstance.form.setValue({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello there.',
      website: '',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.state()).toBe('error');
    expect(fixture.componentInstance.errorMessage()).toBe('Email delivery failed.');
    expect(fixture.componentInstance.form.getRawValue().name).toBe('Jane Doe');
  });

  it('prefills a beta signup when opened from the InfiniHerd link', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ topic: 'infiniherd-beta' }) } },
        },
      ],
    }).compileComponents();

    const betaFixture = TestBed.createComponent(ContactComponent);
    betaFixture.detectChanges();

    expect(betaFixture.componentInstance.isBetaSignup()).toBe(true);
    expect(betaFixture.componentInstance.form.controls.message.value).toContain('InfiniHerd beta');
    expect((betaFixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      'InfiniHerd beta',
    );
    expect(betaFixture.componentInstance.mode()).toBe('quick');
    expect((betaFixture.nativeElement as HTMLElement).querySelector('.tabs')).toBeNull();
  });

  it('shows the project planner by default', () => {
    expect(fixture.componentInstance.mode()).toBe('project');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-project-wizard')).toBeTruthy();
  });

  it('switches to the quick message form', () => {
    fixture.componentInstance.mode.set('quick');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-project-wizard')).toBeNull();
    expect(el.querySelector('#message')).toBeTruthy();
  });

  it('tags quick messages so the email subject is right', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    fixture.componentInstance.form.setValue({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello there.',
      website: '',
    });
    await fixture.componentInstance.submit();
    const body = JSON.parse(fetchSpy.calls.mostRecent().args[1]!.body as string);
    expect(body.kind).toBe('quick');
  });
});
