import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
  });

  it('creates the navbar', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the logo mark and brand name', () => {
    const brand = (fixture.nativeElement as HTMLElement).querySelector('.brand')!;
    expect(brand.querySelector('img')?.getAttribute('src')).toBe('logo-mark.svg');
    expect(brand.textContent?.replace(/\s+/g, ' ').trim()).toBe('Infinity Services');
  });

  it('toggles the mobile menu open state', () => {
    const component = fixture.componentInstance;
    expect(component.mobileMenuOpen()).toBe(false);

    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBe(true);

    component.closeMobileMenu();
    expect(component.mobileMenuOpen()).toBe(false);
  });
});
