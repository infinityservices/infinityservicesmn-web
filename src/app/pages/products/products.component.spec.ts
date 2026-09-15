import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductsComponent } from './products.component';

describe('ProductsComponent', () => {
  let fixture: ComponentFixture<ProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
  });

  it('creates the products page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a card for InfiniHerd and InfiniTrack', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('InfiniHerd');
    expect(text).toContain('InfiniTrack');
  });

  it('renders an outbound link for each product', () => {
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('a[target="_blank"]');
    expect(links.length).toBe(2);
  });
});
