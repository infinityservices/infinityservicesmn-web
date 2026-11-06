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

  it('lists the ballpark prices', () => {
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('.price-row');
    expect(rows.length).toBe(4);
  });

  it('links to the contact page for a quote', () => {
    const cta = (fixture.nativeElement as HTMLElement).querySelector('.cta-band a');
    expect(cta?.getAttribute('href')).toBe('/contact');
  });
});
