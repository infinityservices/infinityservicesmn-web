import { Routes } from '@angular/router';
import { portalGuard } from './portal-auth';

export const PORTAL_ROUTES: Routes = [
  {
    path: 'login',
    title: 'Sign in | Client portal | Infinity Services',
    loadComponent: () => import('./login/login.component').then((m) => m.PortalLoginComponent),
  },
  {
    path: '',
    canActivate: [portalGuard],
    title: 'Client portal | Infinity Services',
    loadComponent: () => import('./home/home.component').then((m) => m.PortalHomeComponent),
  },
];
