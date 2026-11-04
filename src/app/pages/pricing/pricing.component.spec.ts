import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PricingComponent } from './pricing.component';

describe('PricingComponent', () => {
  let fixture: ComponentFixture<PricingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PricingComponent);
    fixture.detectChanges();
  });

  it('renders the job menu and support plans', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.job-card').length).toBe(4);
    expect(el.querySelectorAll('.plan-card').length).toBe(3);
  });

  it('keeps the draft page out of search results', () => {
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain(
      'noindex',
    );
  });
});
