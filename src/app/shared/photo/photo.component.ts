import { Component, input, signal } from '@angular/core';

/**
 * An image slot with a brand-colored backdrop. If the image file is missing
 * or fails to load, the backdrop shows on its own, so pages still look
 * finished while placeholder photos are being swapped for real ones.
 */
@Component({
  selector: 'app-photo',
  standalone: true,
  template: `
    <div class="photo" [class.loaded]="loaded()" [style.aspect-ratio]="ratio()">
      @if (!failed()) {
        <img
          [src]="src()"
          [alt]="alt()"
          loading="lazy"
          decoding="async"
          (load)="loaded.set(true)"
          (error)="failed.set(true)"
        />
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .photo {
      position: relative;
      width: 100%;
      overflow: hidden;
      border-radius: var(--radius-xl);
      background:
        radial-gradient(circle at 25% 30%, rgb(255 255 255 / 0.35), transparent 55%),
        linear-gradient(135deg, var(--color-primary-light) 0%, #cdd3db 100%);
      box-shadow: var(--shadow-md);
    }

    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .loaded img {
      opacity: 1;
    }
  `,
})
export class PhotoComponent {
  readonly src = input.required<string>();
  readonly alt = input('');
  readonly ratio = input('4 / 3');

  protected readonly loaded = signal(false);
  protected readonly failed = signal(false);
}
