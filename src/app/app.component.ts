import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly router = inject(Router);

  /** The admin area and client portal have their own layouts, without the public navbar and footer. */
  readonly ownLayout = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => hasOwnLayout(e.urlAfterRedirects)),
    ),
    { initialValue: typeof location !== 'undefined' && hasOwnLayout(location.pathname) },
  );
}

export function hasOwnLayout(url: string): boolean {
  return /^\/(admin|portal)(\/|\?|#|$)/.test(url);
}
