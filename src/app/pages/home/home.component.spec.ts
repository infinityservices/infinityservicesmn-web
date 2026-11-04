import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('creates the home page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders both service teasers', () => {
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.service-card');
    expect(cards.length).toBe(2);
  });

  it('points the main call to action at the contact page', () => {
    const cta = (fixture.nativeElement as HTMLElement).querySelector('.hero .btn-primary');
    expect(cta?.getAttribute('href')).toBe('/contact');
  });

  it('shows InfiniTrack and InfiniHerd projects', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('InfiniHerd');
    expect(text).toContain('InfiniTrack');
  });
});
