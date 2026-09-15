import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
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
});
