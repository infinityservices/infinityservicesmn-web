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

  it('renders all three service teasers', () => {
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.service-card');
    expect(cards.length).toBe(3);
  });

  it('renders InfiniHerd and InfiniTrack chips', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('InfiniHerd');
    expect(text).toContain('InfiniTrack');
  });
});
