import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductsComponent } from './products.component';

describe('ProductsComponent', () => {
  let fixture: ComponentFixture<ProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
  });

  it('creates the projects page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders InfiniTrack and InfiniHerd', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('InfiniHerd');
    expect(text).toContain('InfiniTrack');
  });

  it('links only InfiniTrack to its own domain', () => {
    const hrefs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a[target="_blank"]'),
    ).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['https://infinitrack.app']);
  });

  it('marks InfiniTrack as in beta', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.status-beta')?.textContent).toContain('Beta');
    expect(el.querySelector('.status-live')).toBeNull();
  });

  it('marks InfiniHerd as coming soon with a beta signup link', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.status-soon')?.textContent).toContain('Coming soon');
    const beta = Array.from(el.querySelectorAll<HTMLAnchorElement>('a')).find((a) =>
      a.textContent?.includes('beta'),
    );
    expect(beta?.getAttribute('href')).toBe('/contact?topic=infiniherd-beta');
  });
});
