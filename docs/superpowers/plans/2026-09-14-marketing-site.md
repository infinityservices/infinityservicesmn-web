# Infinity Services Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public Angular marketing site for Infinity Services MN — home, services, products (InfiniHerd/InfiniTrack), about, and contact pages, deployable to Vercel.

**Architecture:** Angular 20 standalone-component app with lazy-loaded routes, plain SCSS using a shared CSS-custom-property design token system (no Angular Material), a Vercel Node serverless function (`/api/contact`) handling the contact form's email delivery.

**Tech Stack:** Angular 20, TypeScript strict mode, SCSS, Angular Router, Karma/Jasmine (component tests), Vitest (API function tests), Vercel (hosting + serverless functions), Resend (transactional email — see Task 9 for how this is confirmed, not assumed).

**Spec:** `docs/superpowers/specs/2026-09-14-marketing-site-design.md`

## Global Constraints

- Angular version: `^20.0.0` (matches InfiniHerd/InfiniTrack).
- No Angular Material. No dark mode. Light-mode-only CSS custom properties.
- Font: Inter (300–700 weights), loaded the same way as the sibling apps.
- Palette tokens (from the spec): navy `#16232f`, azure primary `#1565c0`, azure-dark `#05306C`, gold accent `#d4a30a`, gold-dark `#b8860b`, slate neutrals `#f8fafc`…`#0f172a`.
- Deployment target: Vercel, `framework: angular`, output at `dist/infinity-services/browser`.
- Test commands mirror the sibling apps: `npm test` (watch), `npm run test:ci` (`ng test --watch=false --browsers=ChromeHeadless`), `npm run test:api` (`vitest run`).

---

### Task 1: Scaffold the Angular workspace

**Files:**
- Create: entire Angular 20 workspace at the repo root (`angular.json`, `package.json`, `tsconfig*.json`, `src/**`)

**Interfaces:**
- Produces: a working `ng serve` / `ng build` / `ng test` workspace named `infinity-services`, with routing enabled and SCSS as the stylesheet format. All later tasks add to `src/app/`.

- [ ] **Step 1: Scaffold with the Angular CLI**

Run from the repo root (`C:\PersonalApplications\Infinity Services`, which already has `.git`, `.gitignore`, and `docs/` — none of which conflict with generated files):

```bash
npx -p @angular/cli@20 ng new infinity-services --directory=. --routing --style=scss --skip-git --package-manager=npm --ssr=false --interactive=false
```

If the CLI refuses because the directory isn't empty, rerun with `--force` appended.

- [ ] **Step 2: Verify the dev server runs**

Run: `npm start`
Expected: Angular dev server starts on `http://localhost:4200` and the default "Hello, infinity-services" scaffold page loads with no console errors. Stop the server (Ctrl+C) once confirmed.

- [ ] **Step 3: Verify the default test suite passes**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: the scaffolded `app.component.spec.ts` tests pass (PASS, 0 failures).

- [ ] **Step 4: Verify the production build succeeds**

Run: `npm run build`
Expected: build completes, emitting `dist/infinity-services/browser/`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Scaffold Angular 20 workspace for infinity-services"
```

---

### Task 2: Global design tokens and base styles

**Files:**
- Modify: `src/styles.scss`
- Modify: `src/index.html` (Inter font `<link>` tags)

**Interfaces:**
- Produces: CSS custom properties (`--color-*`, `--shadow-*`, `--radius-*`) and base element resets that every component in later tasks relies on. No component should hardcode a hex color — always reference these tokens.

- [ ] **Step 1: Add the Inter font link tags to `index.html`**

Add inside `<head>`, before the closing tag:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Replace the contents of `src/styles.scss`**

```scss
:root {
  color-scheme: light;

  --color-navy: #16232f;
  --color-primary: #1565c0;
  --color-primary-dark: #05306C;
  --color-primary-light: #dbeafe;
  --color-accent: #d4a30a;
  --color-accent-dark: #b8860b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  --color-slate-50: #f8fafc;
  --color-slate-100: #f1f5f9;
  --color-slate-200: #e2e8f0;
  --color-slate-300: #cbd5e1;
  --color-slate-400: #94a3b8;
  --color-slate-500: #64748b;
  --color-slate-600: #475569;
  --color-slate-700: #334155;
  --color-slate-800: #1e293b;
  --color-slate-900: #0f172a;

  --color-surface: #ffffff;
  --color-text: var(--color-slate-900);
  --color-text-secondary: var(--color-slate-600);
  --color-text-muted: var(--color-slate-400);
  --color-border: var(--color-slate-200);

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

body {
  font-family: 'Inter', 'Roboto', "Helvetica Neue", sans-serif;
  background-color: var(--color-surface);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: var(--color-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

h1, h2, h3, h4 {
  letter-spacing: -0.02em;
  font-weight: 700;
  color: var(--color-slate-900);
}

.container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.1s ease;
  text-decoration: none;

  &:hover {
    text-decoration: none;
    box-shadow: var(--shadow-md);
  }

  &:active {
    transform: translateY(1px);
  }
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: #fff;
}

.btn-secondary {
  background: #fff;
  color: var(--color-slate-900);
  border: 1px solid var(--color-slate-300);
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}
```

- [ ] **Step 3: Verify visually**

Run: `npm start`, open `http://localhost:4200`. Expected: page background is white, text uses Inter (check DevTools computed font-family), no layout change needed yet since no components use these classes.

- [ ] **Step 4: Commit**

```bash
git add src/styles.scss src/index.html
git commit -m "Add shared design tokens and base styles"
```

---

### Task 3: Shared layout (Navbar, Footer) and routing skeleton

**Files:**
- Create: `src/app/shared/navbar/navbar.component.ts`
- Create: `src/app/shared/navbar/navbar.component.html`
- Create: `src/app/shared/navbar/navbar.component.scss`
- Create: `src/app/shared/navbar/navbar.component.spec.ts`
- Create: `src/app/shared/footer/footer.component.ts`
- Create: `src/app/shared/footer/footer.component.html`
- Create: `src/app/shared/footer/footer.component.scss`
- Create: `src/app/shared/footer/footer.component.spec.ts`
- Create: `src/app/pages/home/home.component.ts` (stub — fleshed out in Task 4)
- Create: `src/app/pages/services/services.component.ts` (stub — Task 5)
- Create: `src/app/pages/products/products.component.ts` (stub — Task 6)
- Create: `src/app/pages/about/about.component.ts` (stub — Task 7)
- Create: `src/app/pages/contact/contact.component.ts` (stub — Task 8)
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/app.component.ts`
- Modify: `src/app/app.component.html`
- Modify: `src/app/app.component.spec.ts`

**Interfaces:**
- Produces: `NavbarComponent` (selector `app-navbar`), `FooterComponent` (selector `app-footer`) — both standalone, no inputs. Route paths: `''`, `'services'`, `'products'`, `'about'`, `'contact'`, each lazy-loading a standalone page component via `loadComponent`. Unmatched paths redirect to `''`.
- Consumes: design tokens from Task 2 (`--color-*` custom properties).

- [ ] **Step 1: Create the Navbar component files**

`src/app/shared/navbar/navbar.component.ts`:

```typescript
import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  readonly mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
```

`src/app/shared/navbar/navbar.component.html`:

```html
<header class="navbar">
  <div class="container navbar-inner">
    <a routerLink="/" class="brand" (click)="closeMobileMenu()">
      <span class="brand-dot">●</span> INFINITY SERVICES
    </a>

    <nav class="nav-links" [class.open]="mobileMenuOpen()">
      <a routerLink="/services" routerLinkActive="active" (click)="closeMobileMenu()">Services</a>
      <a routerLink="/products" routerLinkActive="active" (click)="closeMobileMenu()">Products</a>
      <a routerLink="/about" routerLinkActive="active" (click)="closeMobileMenu()">About</a>
      <a routerLink="/contact" routerLinkActive="active" (click)="closeMobileMenu()" class="btn btn-primary nav-cta">Contact</a>
    </nav>

    <button
      type="button"
      class="menu-toggle"
      (click)="toggleMobileMenu()"
      [attr.aria-expanded]="mobileMenuOpen()"
      aria-label="Toggle navigation menu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>
</header>
```

`src/app/shared/navbar/navbar.component.scss`:

```scss
.navbar {
  background: #fff;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 50;
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}

.brand {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.02em;
  color: var(--color-slate-900);

  &:hover {
    text-decoration: none;
  }
}

.brand-dot {
  color: var(--color-accent);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 28px;

  a {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-slate-600);

    &:hover {
      text-decoration: none;
      color: var(--color-slate-900);
    }

    &.active {
      color: var(--color-primary-dark);
    }
  }

  .nav-cta {
    color: #fff;
    padding: 8px 18px;

    &:hover {
      color: #fff;
    }
  }
}

.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;

  span {
    width: 22px;
    height: 2px;
    background: var(--color-slate-900);
  }
}

@media (max-width: 768px) {
  .nav-links {
    position: absolute;
    top: 72px;
    left: 0;
    right: 0;
    background: #fff;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    border-bottom: 1px solid var(--color-border);
    display: none;

    &.open {
      display: flex;
    }

    a {
      width: 100%;
      padding: 14px 24px;
    }

    .nav-cta {
      margin: 12px 24px;
      width: calc(100% - 48px);
    }
  }

  .menu-toggle {
    display: flex;
  }
}
```

`src/app/shared/navbar/navbar.component.spec.ts`:

```typescript
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

  it('toggles the mobile menu open state', () => {
    const component = fixture.componentInstance;
    expect(component.mobileMenuOpen()).toBe(false);

    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBe(true);

    component.closeMobileMenu();
    expect(component.mobileMenuOpen()).toBe(false);
  });
});
```

- [ ] **Step 2: Run the navbar tests**

Run: `npm test -- --watch=false --browsers=ChromeHeadless --include='**/navbar.component.spec.ts'`
Expected: PASS, 2 specs.

- [ ] **Step 3: Create the Footer component files**

`src/app/shared/footer/footer.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
```

`src/app/shared/footer/footer.component.html`:

```html
<footer class="footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <span class="brand-dot">●</span> INFINITY SERVICES
      <p>Custom software for Minnesota businesses.</p>
    </div>

    <nav class="footer-links">
      <a routerLink="/services">Services</a>
      <a routerLink="/products">Products</a>
      <a routerLink="/about">About</a>
      <a routerLink="/contact">Contact</a>
    </nav>
  </div>

  <div class="container footer-legal">
    <p>&copy; {{ year }} Infinity Services MN. All rights reserved.</p>
  </div>
</footer>
```

`src/app/shared/footer/footer.component.scss`:

```scss
.footer {
  background: var(--color-navy);
  color: rgba(255, 255, 255, 0.85);
  margin-top: 80px;
}

.footer-inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 24px;
  padding: 48px 24px 32px;
}

.footer-brand {
  font-weight: 700;
  font-size: 14px;

  .brand-dot {
    color: var(--color-accent);
  }

  p {
    margin-top: 8px;
    font-weight: 400;
    font-size: 13px;
    opacity: 0.7;
  }
}

.footer-links {
  display: flex;
  gap: 24px;

  a {
    color: rgba(255, 255, 255, 0.75);
    font-size: 14px;

    &:hover {
      color: #fff;
    }
  }
}

.footer-legal {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 24px;
  font-size: 12px;
  opacity: 0.6;
}
```

`src/app/shared/footer/footer.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
  });

  it('creates the footer', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the current year in the legal line', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(String(new Date().getFullYear()));
  });
});
```

- [ ] **Step 4: Run the footer tests**

Run: `npm test -- --watch=false --browsers=ChromeHeadless --include='**/footer.component.spec.ts'`
Expected: PASS, 2 specs.

- [ ] **Step 5: Create stub page components**

Each of the following follows the same minimal pattern. Create all five:

`src/app/pages/home/home.component.ts`:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `<div class="container"><p>Home — content added in a later task.</p></div>`,
})
export class HomeComponent {}
```

`src/app/pages/services/services.component.ts`:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-services',
  standalone: true,
  template: `<div class="container"><p>Services — content added in a later task.</p></div>`,
})
export class ServicesComponent {}
```

`src/app/pages/products/products.component.ts`:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-products',
  standalone: true,
  template: `<div class="container"><p>Products — content added in a later task.</p></div>`,
})
export class ProductsComponent {}
```

`src/app/pages/about/about.component.ts`:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  template: `<div class="container"><p>About — content added in a later task.</p></div>`,
})
export class AboutComponent {}
```

`src/app/pages/contact/contact.component.ts`:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  template: `<div class="container"><p>Contact — content added in a later task.</p></div>`,
})
export class ContactComponent {}
```

- [ ] **Step 6: Wire up routing**

Replace `src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services.component').then((m) => m.ServicesComponent),
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.component').then((m) => m.ProductsComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent),
  },
  { path: '**', redirectTo: '' },
];
```

- [ ] **Step 7: Wire up the app shell**

Replace `src/app/app.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
```

Replace `src/app/app.component.html`:

```html
<app-navbar></app-navbar>
<main>
  <router-outlet></router-outlet>
</main>
<app-footer></app-footer>
```

Replace `src/app/app.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('creates the app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the navbar and footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });
});
```

- [ ] **Step 8: Run the full test suite**

Run: `npm run test:ci`
Expected: all specs pass, including navbar, footer, and app component specs.

- [ ] **Step 9: Verify in the browser**

Run: `npm start`, open `http://localhost:4200`. Expected: navbar with "INFINITY SERVICES" brand and links, stub "Home" text, dark footer. Click each nav link — confirm each route renders its stub text and the URL changes.

- [ ] **Step 10: Commit**

```bash
git add src/app
git commit -m "Add shared navbar/footer and route skeleton for all pages"
```

---

### Task 4: Home page content

**Files:**
- Modify: `src/app/pages/home/home.component.ts`
- Create: `src/app/pages/home/home.component.html`
- Create: `src/app/pages/home/home.component.scss`
- Create: `src/app/pages/home/home.component.spec.ts`

**Interfaces:**
- Consumes: `.container`, `.btn`, `.btn-primary`, `.btn-secondary`, `.chip` from `styles.scss` (Task 2); `RouterLink` for internal links.

- [ ] **Step 1: Update `home.component.ts`**

```typescript
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly services = [
    {
      title: 'Custom Web Applications',
      description: 'From internal tools to customer-facing products, built around how your business actually works.',
    },
    {
      title: 'Systems Integration',
      description: 'Connect the tools you already use — payments, e-commerce, accounting — into one coherent workflow.',
    },
    {
      title: 'Automation & Reporting',
      description: 'Replace manual spreadsheets and repetitive tasks with software that does it for you.',
    },
  ];
}
```

- [ ] **Step 2: Create `home.component.html`**

```html
<section class="hero">
  <div class="container hero-inner">
    <h1>Custom <span class="accent">software</span> that runs your business.</h1>
    <p class="pitch">
      We design and build the tools Minnesota businesses actually need — from
      livestock management to inventory tracking — and we can build yours next.
    </p>
    <div class="cta-row">
      <a routerLink="/contact" class="btn btn-primary">Start a Project</a>
      <a routerLink="/products" class="btn btn-secondary">See Our Work</a>
    </div>
    <div class="chip-row">
      <span class="chip">InfiniHerd — Livestock Management</span>
      <span class="chip">InfiniTrack — Inventory Management</span>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <h2>What we do</h2>
    <div class="services-grid">
      @for (service of services; track service.title) {
        <div class="service-card">
          <h3>{{ service.title }}</h3>
          <p>{{ service.description }}</p>
        </div>
      }
    </div>
    <a routerLink="/services" class="link-more">See all services &rarr;</a>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <h2>Products we've built</h2>
    <p class="section-lead">Real software, running in production for real Minnesota operations.</p>
    <a routerLink="/products" class="link-more">Explore our products &rarr;</a>
  </div>
</section>

<section class="cta-band">
  <div class="container">
    <h2>Have a project in mind?</h2>
    <p>Tell us what you're trying to solve — we'll tell you how we'd build it.</p>
    <a routerLink="/contact" class="btn btn-primary">Get in Touch</a>
  </div>
</section>
```

- [ ] **Step 3: Create `home.component.scss`**

```scss
.hero {
  background: var(--color-slate-50);
  padding: 96px 0 72px;
}

.hero-inner {
  max-width: 720px;
}

h1 {
  font-size: 44px;
  line-height: 1.15;
  margin-bottom: 20px;

  .accent {
    color: var(--color-primary);
  }
}

.pitch {
  font-size: 18px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: 32px;
  max-width: 560px;
}

.cta-row {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.chip-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.section {
  padding: 72px 0;
}

.section-alt {
  background: var(--color-slate-50);
}

.section-lead {
  color: var(--color-text-secondary);
  margin: 8px 0 24px;
  max-width: 560px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin: 32px 0;
}

.service-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 28px;

  h3 {
    font-size: 18px;
    margin-bottom: 10px;
  }

  p {
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.6;
  }
}

.link-more {
  font-weight: 600;
  font-size: 15px;
}

.cta-band {
  background: var(--color-navy);
  color: #fff;
  padding: 64px 0;
  text-align: center;

  h2 {
    color: #fff;
    margin-bottom: 12px;
  }

  p {
    opacity: 0.85;
    margin-bottom: 28px;
  }
}

@media (max-width: 600px) {
  h1 {
    font-size: 32px;
  }
}
```

- [ ] **Step 4: Create `home.component.spec.ts`**

```typescript
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
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- --watch=false --browsers=ChromeHeadless --include='**/home.component.spec.ts'`
Expected: PASS, 3 specs.

- [ ] **Step 6: Verify in the browser**

Run: `npm start`, open `http://localhost:4200/`. Expected: hero headline with blue "software" accent, two CTA buttons, two chips, three service cards below, navy CTA band at the bottom.

- [ ] **Step 7: Commit**

```bash
git add src/app/pages/home
git commit -m "Build out home page content"
```

---

### Task 5: Services page content

**Files:**
- Modify: `src/app/pages/services/services.component.ts`
- Create: `src/app/pages/services/services.component.html`
- Create: `src/app/pages/services/services.component.scss`
- Create: `src/app/pages/services/services.component.spec.ts`

**Interfaces:**
- Consumes: `.container`, `.btn`, `.btn-primary` from `styles.scss`; `RouterLink`.

- [ ] **Step 1: Update `services.component.ts`**

```typescript
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent {
  readonly offerings = [
    {
      title: 'Custom Web Applications',
      description:
        'Purpose-built software for how your business actually operates — not a generic template stretched to fit. We handle everything from data modeling to the interface your team uses every day.',
    },
    {
      title: 'Systems Integration',
      description:
        'Your business already runs on a handful of tools — point of sale, accounting, e-commerce. We connect them so data moves automatically instead of getting re-typed by hand.',
    },
    {
      title: 'Workflow Automation',
      description:
        'If a task is repetitive, predictable, and currently done by a person in a spreadsheet, it is a candidate for automation. We find those tasks and build the software to replace them.',
    },
    {
      title: 'Ongoing Support & Maintenance',
      description:
        'Software is never really "done." We stay on as your team grows and your needs change, with the same people who built it in the first place.',
    },
  ];
}
```

- [ ] **Step 2: Create `services.component.html`**

```html
<section class="page-header">
  <div class="container">
    <h1>Services</h1>
    <p>Custom software built around your business, not the other way around.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="offerings-grid">
      @for (offering of offerings; track offering.title) {
        <div class="offering-card">
          <h3>{{ offering.title }}</h3>
          <p>{{ offering.description }}</p>
        </div>
      }
    </div>

    <div class="cta-block">
      <p>Not sure which of these fits what you need? Let's talk it through.</p>
      <a routerLink="/contact" class="btn btn-primary">Start a Conversation</a>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Create `services.component.scss`**

```scss
.page-header {
  background: var(--color-slate-50);
  padding: 64px 0 48px;

  p {
    color: var(--color-text-secondary);
    font-size: 17px;
    margin-top: 8px;
  }
}

.section {
  padding: 64px 0;
}

.offerings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.offering-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 32px;

  h3 {
    font-size: 19px;
    margin-bottom: 12px;
  }

  p {
    color: var(--color-text-secondary);
    line-height: 1.65;
    font-size: 15px;
  }
}

.cta-block {
  margin-top: 56px;
  text-align: center;

  p {
    color: var(--color-text-secondary);
    margin-bottom: 16px;
  }
}
```

- [ ] **Step 4: Create `services.component.spec.ts`**

```typescript
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
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- --watch=false --browsers=ChromeHeadless --include='**/services.component.spec.ts'`
Expected: PASS, 2 specs.

- [ ] **Step 6: Commit**

```bash
git add src/app/pages/services
git commit -m "Build out services page content"
```

---

### Task 6: Products page content

**Files:**
- Modify: `src/app/pages/products/products.component.ts`
- Create: `src/app/pages/products/products.component.html`
- Create: `src/app/pages/products/products.component.scss`
- Create: `src/app/pages/products/products.component.spec.ts`

**Interfaces:**
- Consumes: `.container` from `styles.scss`.

- [ ] **Step 1: Update `products.component.ts`**

Descriptions below are drawn from each app's own `README.md` / `package.json` description (see spec's "Products" section).

```typescript
import { Component } from '@angular/core';

interface Product {
  name: string;
  tagline: string;
  description: string;
  features: string[];
  // TODO: confirm each app's production URL once its custom domain is
  // live (spec: "Open items to confirm during implementation"). These
  // placeholders point at the apps' default Vercel deployment URLs.
  url: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  readonly products: Product[] = [
    {
      name: 'InfiniHerd',
      tagline: 'Livestock management for Minnesota feedlots',
      description:
        'A livestock management app covering animals, breeding, hay and feed inventory, health and vaccination tracking (including bulk/mass vaccination), reporting, and Minnesota/Goodhue County feedlot Animal Unit compliance.',
      features: [
        'Animal, breeding, and health records',
        'Feed and hay inventory tracking',
        'Bulk vaccination workflows',
        'MN feedlot Animal Unit compliance reporting',
      ],
      url: 'https://infiniherd.vercel.app',
    },
    {
      name: 'InfiniTrack',
      tagline: 'Inventory management with FIFO cost tracking',
      description:
        'Inventory management with FIFO COGS calculations and Wix integration, built to keep stock counts, costs, and online storefronts in sync automatically.',
      features: [
        'FIFO cost-of-goods-sold calculations',
        'Wix storefront integration',
        'Barcode generation and scanning',
        'Automated reporting exports',
      ],
      url: 'https://infinitrack.vercel.app',
    },
  ];
}
```

- [ ] **Step 2: Create `products.component.html`**

```html
<section class="page-header">
  <div class="container">
    <h1>Products</h1>
    <p>Real software we've built and run in production for Minnesota businesses.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="products-grid">
      @for (product of products; track product.name) {
        <article class="product-card">
          <h2>{{ product.name }}</h2>
          <p class="tagline">{{ product.tagline }}</p>
          <p class="description">{{ product.description }}</p>
          <ul class="feature-list">
            @for (feature of product.features; track feature) {
              <li>{{ feature }}</li>
            }
          </ul>
          <a [href]="product.url" target="_blank" rel="noopener" class="btn btn-primary">
            Visit {{ product.name }}
          </a>
        </article>
      }
    </div>
  </div>
</section>
```

- [ ] **Step 3: Create `products.component.scss`**

```scss
.page-header {
  background: var(--color-slate-50);
  padding: 64px 0 48px;

  p {
    color: var(--color-text-secondary);
    font-size: 17px;
    margin-top: 8px;
  }
}

.section {
  padding: 64px 0;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 32px;
}

.product-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 36px;
  display: flex;
  flex-direction: column;

  h2 {
    font-size: 24px;
    margin-bottom: 4px;
  }

  .tagline {
    color: var(--color-primary-dark);
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 16px;
  }

  .description {
    color: var(--color-text-secondary);
    line-height: 1.65;
    font-size: 15px;
    margin-bottom: 20px;
  }

  .feature-list {
    list-style: none;
    margin-bottom: 28px;
    flex: 1;

    li {
      font-size: 14px;
      color: var(--color-text-secondary);
      padding-left: 20px;
      position: relative;
      margin-bottom: 8px;

      &::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: var(--color-accent-dark);
        font-weight: 700;
      }
    }
  }

  .btn {
    align-self: flex-start;
  }
}
```

- [ ] **Step 4: Create `products.component.spec.ts`**

```typescript
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
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- --watch=false --browsers=ChromeHeadless --include='**/products.component.spec.ts'`
Expected: PASS, 3 specs.

- [ ] **Step 6: Commit**

```bash
git add src/app/pages/products
git commit -m "Build out products page content"
```

---

### Task 7: About page content

**Files:**
- Modify: `src/app/pages/about/about.component.ts`
- Create: `src/app/pages/about/about.component.html`
- Create: `src/app/pages/about/about.component.scss`
- Create: `src/app/pages/about/about.component.spec.ts`

**Interfaces:**
- Consumes: `.container`, `.btn`, `.btn-primary` from `styles.scss`; `RouterLink`.

- [ ] **Step 1: Update `about.component.ts`**

```typescript
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {}
```

- [ ] **Step 2: Create `about.component.html`**

```html
<section class="page-header">
  <div class="container">
    <h1>About Infinity Services</h1>
    <p>Minnesota-based software, built by people who use it too.</p>
  </div>
</section>

<section class="section">
  <div class="container narrow">
    <p>
      Infinity Services builds custom software for Minnesota businesses that
      need more than what an off-the-shelf tool can offer. We don't start
      from a template — we start from how your business actually runs, and
      build the software to fit.
    </p>
    <p>
      We know this works because we've done it for ourselves. InfiniHerd and
      InfiniTrack, our two flagship products, both started as tools we built
      to solve our own operational problems — livestock recordkeeping and
      inventory management — before becoming production software other
      businesses rely on every day.
    </p>
    <p>
      That's the same process we bring to client work: understand the real
      problem first, then build the smallest, sturdiest piece of software
      that solves it.
    </p>
    <a routerLink="/contact" class="btn btn-primary">Let's Talk</a>
  </div>
</section>
```

- [ ] **Step 3: Create `about.component.scss`**

```scss
.page-header {
  background: var(--color-slate-50);
  padding: 64px 0 48px;

  p {
    color: var(--color-text-secondary);
    font-size: 17px;
    margin-top: 8px;
  }
}

.section {
  padding: 64px 0;
}

.narrow {
  max-width: 680px;

  p {
    font-size: 16px;
    line-height: 1.75;
    color: var(--color-text-secondary);
    margin-bottom: 24px;
  }
}
```

- [ ] **Step 4: Create `about.component.spec.ts`**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  let fixture: ComponentFixture<AboutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
  });

  it('creates the about page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('mentions both InfiniHerd and InfiniTrack', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('InfiniHerd');
    expect(text).toContain('InfiniTrack');
  });
});
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- --watch=false --browsers=ChromeHeadless --include='**/about.component.spec.ts'`
Expected: PASS, 2 specs.

- [ ] **Step 6: Commit**

```bash
git add src/app/pages/about
git commit -m "Build out about page content"
```

---

### Task 8: Contact page — form UI and client-side validation

**Files:**
- Modify: `src/app/pages/contact/contact.component.ts`
- Create: `src/app/pages/contact/contact.component.html`
- Create: `src/app/pages/contact/contact.component.scss`
- Create: `src/app/pages/contact/contact.component.spec.ts`

**Interfaces:**
- Produces: a `POST` request to `/api/contact` with JSON body `{ name: string; email: string; message: string }`. Task 9 implements the receiving endpoint with this exact shape.
- Consumes: `.container`, `.btn`, `.btn-primary` from `styles.scss`; Angular `ReactiveFormsModule`.

- [ ] **Step 1: Update `contact.component.ts`**

```typescript
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  readonly state = signal<SubmitState>('idle');
  readonly errorMessage = signal('');

  private readonly fb = new FormBuilder();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.maxLength(4000)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.form.getRawValue()),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Something went wrong.' }));
        throw new Error(body.error ?? 'Something went wrong.');
      }

      this.state.set('success');
      this.form.reset();
    } catch (err) {
      this.state.set('error');
      this.errorMessage.set(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }
}
```

- [ ] **Step 2: Create `contact.component.html`**

```html
<section class="page-header">
  <div class="container">
    <h1>Contact</h1>
    <p>Tell us about your project — we usually reply within a business day.</p>
  </div>
</section>

<section class="section">
  <div class="container narrow">
    @if (state() === 'success') {
      <div class="alert alert-success">
        Thanks — your message has been sent. We'll be in touch soon.
      </div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (state() === 'error') {
          <div class="alert alert-error">{{ errorMessage() }}</div>
        }

        <div class="field-group">
          <label for="name">Name</label>
          <input id="name" type="text" formControlName="name" />
          @if (form.controls.name.invalid && form.controls.name.touched) {
            <span class="field-error">Please enter your name.</span>
          }
        </div>

        <div class="field-group">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" />
          @if (form.controls.email.invalid && form.controls.email.touched) {
            <span class="field-error">Please enter a valid email address.</span>
          }
        </div>

        <div class="field-group">
          <label for="message">Message</label>
          <textarea id="message" rows="6" formControlName="message"></textarea>
          @if (form.controls.message.invalid && form.controls.message.touched) {
            <span class="field-error">Please enter a message.</span>
          }
        </div>

        <button type="submit" class="btn btn-primary" [disabled]="state() === 'submitting'">
          {{ state() === 'submitting' ? 'Sending…' : 'Send Message' }}
        </button>
      </form>
    }
  </div>
</section>
```

- [ ] **Step 3: Create `contact.component.scss`**

```scss
.page-header {
  background: var(--color-slate-50);
  padding: 64px 0 48px;

  p {
    color: var(--color-text-secondary);
    font-size: 17px;
    margin-top: 8px;
  }
}

.section {
  padding: 64px 0;
}

.narrow {
  max-width: 560px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-slate-700);
  }

  input,
  textarea {
    font-family: inherit;
    font-size: 15px;
    padding: 10px 14px;
    border: 1px solid var(--color-slate-300);
    border-radius: var(--radius-md);

    &:focus {
      outline: none;
      border-color: var(--color-primary);
      border-width: 2px;
    }
  }

  textarea {
    resize: vertical;
  }
}

.field-error {
  font-size: 12px;
  color: var(--color-danger);
}

.alert {
  padding: 16px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  margin-bottom: 24px;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
}
```

- [ ] **Step 4: Create `contact.component.spec.ts`**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();
  });

  it('creates the contact page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('starts with an invalid, untouched form', () => {
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('does not submit when the form is invalid', async () => {
    const fetchSpy = spyOn(window, 'fetch');
    await fixture.componentInstance.submit();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.touched).toBe(true);
  });

  it('posts to /api/contact and shows success on a valid submit', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    fixture.componentInstance.form.setValue({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello there.',
    });

    await fixture.componentInstance.submit();

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/contact',
      jasmine.objectContaining({ method: 'POST' }),
    );
    expect(fixture.componentInstance.state()).toBe('success');
  });

  it('shows an inline error and preserves values when the request fails', async () => {
    spyOn(window, 'fetch').and.resolveTo(
      new Response(JSON.stringify({ error: 'Email delivery failed.' }), { status: 502 }),
    );

    fixture.componentInstance.form.setValue({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello there.',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.state()).toBe('error');
    expect(fixture.componentInstance.errorMessage()).toBe('Email delivery failed.');
    expect(fixture.componentInstance.form.getRawValue().name).toBe('Jane Doe');
  });
});
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- --watch=false --browsers=ChromeHeadless --include='**/contact.component.spec.ts'`
Expected: PASS, 5 specs.

- [ ] **Step 6: Commit**

```bash
git add src/app/pages/contact
git commit -m "Build out contact page form with client-side validation"
```

---

### Task 9: `/api/contact` serverless function

**Files:**
- Create: `api/_lib/validate-contact.ts`
- Create: `api/_lib/validate-contact.test.ts`
- Create: `api/contact.ts`
- Modify: `package.json` (add `@vercel/node`, `resend`, `vitest` — exact provider confirmed in Step 1)
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: the JSON body shape produced by `ContactComponent.submit()` in Task 8: `{ name: string; email: string; message: string }`.
- Produces: `validateContactPayload(body: unknown): { valid: true; data: { name: string; email: string; message: string } } | { valid: false; error: string }`, used by both the handler and its test.

- [ ] **Step 1: Confirm the email provider via the marketplace skill**

Before writing provider-specific code, invoke the `vercel:marketplace` skill (`Skill` tool, name `vercel:marketplace`) to discover and provision a transactional email integration for this project — do not assume a provider is already available. This plan is written against **Resend** because it is the common Vercel Marketplace choice for this use case; if the skill's discovery step selects a different provider, adapt Steps 3–4 below to that provider's Node SDK, keeping `validateContactPayload`'s signature and the handler's request/response contract identical so Task 8's frontend code needs no changes.

Once provisioned, note the environment variable names it gives you (this plan assumes `RESEND_API_KEY`) and set `CONTACT_TO_EMAIL` (where submissions should land) and `CONTACT_FROM_EMAIL` (the verified sending address) as additional Vercel project environment variables.

- [ ] **Step 2: Install dependencies**

```bash
npm install resend
npm install -D @vercel/node vitest
```

- [ ] **Step 3: Write the validation function and its test**

`api/_lib/validate-contact.ts`:

```typescript
export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export type ValidationResult =
  | { valid: true; data: ContactPayload }
  | { valid: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactPayload(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const { name, email, message } = body as Record<string, unknown>;

  if (typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: 'Name is required.' };
  }
  if (name.length > 120) {
    return { valid: false, error: 'Name is too long.' };
  }

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    return { valid: false, error: 'A valid email address is required.' };
  }
  if (email.length > 200) {
    return { valid: false, error: 'Email is too long.' };
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    return { valid: false, error: 'Message is required.' };
  }
  if (message.length > 4000) {
    return { valid: false, error: 'Message is too long.' };
  }

  return {
    valid: true,
    data: { name: name.trim(), email: email.trim(), message: message.trim() },
  };
}
```

`api/_lib/validate-contact.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { validateContactPayload } from './validate-contact';

describe('validateContactPayload', () => {
  it('accepts a well-formed payload', () => {
    const result = validateContactPayload({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello there.',
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).toEqual({
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Hello there.',
      });
    }
  });

  it('rejects a missing name', () => {
    const result = validateContactPayload({ email: 'jane@example.com', message: 'Hi' });
    expect(result.valid).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = validateContactPayload({
      name: 'Jane Doe',
      email: 'not-an-email',
      message: 'Hi',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects a missing message', () => {
    const result = validateContactPayload({ name: 'Jane Doe', email: 'jane@example.com' });
    expect(result.valid).toBe(false);
  });

  it('rejects a non-object body', () => {
    const result = validateContactPayload('not an object');
    expect(result.valid).toBe(false);
  });

  it('trims whitespace from valid fields', () => {
    const result = validateContactPayload({
      name: '  Jane Doe  ',
      email: '  jane@example.com  ',
      message: '  Hi  ',
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.name).toBe('Jane Doe');
    }
  });
});
```

- [ ] **Step 4: Create the Vitest config**

`vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['api/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Run the validation tests**

Run: `npx vitest run`
Expected: PASS, 6 specs.

- [ ] **Step 6: Write the serverless handler**

`api/contact.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { validateContactPayload } from './_lib/validate-contact';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const result = validateContactPayload(req.body);
  if (!result.valid) {
    res.status(400).json({ error: result.error });
    return;
  }

  const toEmail = process.env['CONTACT_TO_EMAIL'];
  const fromEmail = process.env['CONTACT_FROM_EMAIL'];
  const apiKey = process.env['RESEND_API_KEY'];

  if (!toEmail || !fromEmail || !apiKey) {
    console.error('Missing contact form email configuration.');
    res.status(500).json({ error: 'Contact form is temporarily unavailable.' });
    return;
  }

  const resend = new Resend(apiKey);
  const { name, email, message } = result.data;

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    replyTo: email,
    subject: `New contact form message from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });

  if (error) {
    console.error('Failed to send contact email:', error);
    res.status(502).json({ error: 'Failed to send your message. Please try again.' });
    return;
  }

  res.status(200).json({ ok: true });
}
```

- [ ] **Step 7: Add the `test:api` script**

In `package.json`, add to `"scripts"`:

```json
"test:api": "vitest run"
```

- [ ] **Step 8: Run the api test script**

Run: `npm run test:api`
Expected: PASS, 6 specs (same as Step 5, now run via the npm script).

- [ ] **Step 9: Commit**

```bash
git add api vitest.config.ts package.json package-lock.json
git commit -m "Add /api/contact serverless function with validated email delivery"
```

---

### Task 10: Vercel deployment config and project scripts

**Files:**
- Create: `vercel.json`
- Modify: `package.json` (scripts: `start`, `build`, `test`, `test:ci`)
- Create: `README.md`

**Interfaces:**
- Consumes: build output path from Task 1 (`dist/infinity-services/browser`) and the `/api/contact` function from Task 9.

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "framework": "angular",
  "outputDirectory": "dist/infinity-services/browser",
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Ensure `package.json` scripts match the sibling apps' convention**

Confirm (add if missing) in `"scripts"`:

```json
"start": "ng serve",
"build": "ng build",
"test": "ng test",
"test:ci": "ng test --watch=false --browsers=ChromeHeadless",
"test:api": "vitest run"
```

- [ ] **Step 3: Write `README.md`**

```markdown
# Infinity Services Marketing Site

The public marketing website for Infinity Services MN — built with Angular 20.

## Running locally

\`\`\`bash
npm install
npm start          # ng serve, http://localhost:4200
\`\`\`

## Testing

\`\`\`bash
npm run test:ci    # Angular component specs, single run for CI
npm test           # Angular component specs, watch mode
npm run test:api   # Vitest specs for the /api/contact function
\`\`\`

## Contact form configuration

\`/api/contact\` sends email via Resend (see
\`docs/superpowers/specs/2026-09-14-marketing-site-design.md\` and
\`docs/superpowers/plans/2026-09-14-marketing-site.md\` Task 9 for how this
was provisioned). Required environment variables, set in the Vercel project:

- \`RESEND_API_KEY\`
- \`CONTACT_TO_EMAIL\` — inbox that receives submissions
- \`CONTACT_FROM_EMAIL\` — verified sending address

## Deployment

\`vercel.json\` builds this app (\`framework: angular\`,
\`dist/infinity-services/browser\`) and is what Vercel deploys to
production, at infinityservicesmn.com.

## Docs

- Design spec: \`docs/superpowers/specs/2026-09-14-marketing-site-design.md\`
- Implementation plan: \`docs/superpowers/plans/2026-09-14-marketing-site.md\`
```

- [ ] **Step 4: Commit**

```bash
git add vercel.json package.json README.md
git commit -m "Add Vercel deployment config and project README"
```

---

### Task 11: Full-site smoke test

**Files:**
- No new files — verification only.

**Interfaces:**
- Consumes: every component and route built in Tasks 3–10.

- [ ] **Step 1: Run the full test suite**

Run: `npm run test:ci && npm run test:api`
Expected: all Angular component specs and all Vitest api specs pass with zero failures.

- [ ] **Step 2: Run a production build**

Run: `npm run build`
Expected: build succeeds with no errors, output at `dist/infinity-services/browser/`.

- [ ] **Step 3: Manual browser smoke test**

Run: `npm start`, open `http://localhost:4200`, and check:
- `/` — hero renders, both CTAs navigate correctly, three service cards, InfiniHerd/InfiniTrack chips, navy CTA band
- `/services` — four offering cards render
- `/products` — both product cards render with working outbound links (opens in a new tab)
- `/about` — company pitch renders, CTA button navigates to `/contact`
- `/contact` — submitting with empty fields shows inline validation errors; the actual email send cannot be verified without live `RESEND_API_KEY`/`CONTACT_TO_EMAIL`/`CONTACT_FROM_EMAIL` values, so confirm only that a request is sent to `/api/contact` (visible in the Network tab) and that a non-2xx response renders the inline error banner with entered values intact
- Resize the browser to ~400px width — confirm the navbar collapses to the hamburger menu and no section causes horizontal scrolling

- [ ] **Step 4: Fix any issues found, then final commit**

If Step 3 surfaces any issue, fix it in the relevant component from the earlier task, re-run that component's spec file, then:

```bash
git add -A
git commit -m "Fix issues found during full-site smoke test"
```

If no issues are found, no commit is needed for this task.
