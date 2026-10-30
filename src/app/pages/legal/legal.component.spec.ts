import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LegalComponent } from './legal.component';

describe('LegalComponent', () => {
  let fixture: ComponentFixture<LegalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalComponent);
    fixture.detectChanges();
  });

  it('creates the legal page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('links to the InfiniTrack terms and privacy policy', () => {
    const anchors = (fixture.nativeElement as HTMLElement).querySelectorAll('a');
    const hrefs = Array.from(anchors).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('https://infinitrack.app/terms');
    expect(hrefs).toContain('https://infinitrack.app/privacy');
  });
});
