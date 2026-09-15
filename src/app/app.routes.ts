import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Infinity Services | Custom Software for Minnesota Businesses',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'services',
    title: 'Services | Infinity Services',
    loadComponent: () => import('./pages/services/services.component').then((m) => m.ServicesComponent),
  },
  {
    path: 'products',
    title: 'Products | Infinity Services',
    loadComponent: () => import('./pages/products/products.component').then((m) => m.ProductsComponent),
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
  { path: '**', redirectTo: '' },
];
