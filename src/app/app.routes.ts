import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Infinity Services | Custom Software for Small Businesses',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'services',
    title: 'Services | Infinity Services',
    loadComponent: () => import('./pages/services/services.component').then((m) => m.ServicesComponent),
  },
  { path: 'products', redirectTo: 'projects' },
  {
    path: 'projects',
    title: 'Projects | Infinity Services',
    loadComponent: () => import('./pages/products/products.component').then((m) => m.ProductsComponent),
  },
  {
    // Draft: not linked from the navbar yet.
    path: 'pricing',
    title: 'Pricing | Infinity Services',
    loadComponent: () => import('./pages/pricing/pricing.component').then((m) => m.PricingComponent),
  },
  {
    path: 'about',
    title: 'About | Infinity Services',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'contact',
    title: 'Contact | Infinity Services',
    loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent),
  },
  {
    path: 'legal',
    title: 'Legal | Infinity Services',
    loadComponent: () => import('./pages/legal/legal.component').then((m) => m.LegalComponent),
  },
  {
    // Private business admin. Lazy-loaded, so public visitors never download it.
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
