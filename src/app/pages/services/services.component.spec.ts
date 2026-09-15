import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ServicesComponent } from './services.component';

describe('ServicesComponent', () => {
  let fixture: ComponentFixture<ServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ServicesComponent);
    fixture.detectChanges();
  });

  it('creates the services page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders all four offering cards', () => {
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.offering-card');
    expect(cards.length).toBe(4);
  });
});
