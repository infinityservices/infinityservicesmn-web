import { Routes } from '@angular/router';
import { adminGuard } from './admin-auth';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    title: 'Sign in | Admin',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        title: 'Dashboard | Admin',
        loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'leads',
        title: 'Leads | Admin',
        loadComponent: () => import('./leads/leads.component').then((m) => m.LeadsComponent),
      },
      {
        path: 'clients',
        title: 'Clients | Admin',
        loadComponent: () => import('./clients/clients.component').then((m) => m.ClientsComponent),
      },
      {
        path: 'clients/:id',
        title: 'Client | Admin',
        loadComponent: () =>
          import('./client-detail/client-detail.component').then((m) => m.ClientDetailComponent),
      },
      {
        path: 'projects',
        title: 'Projects | Admin',
        loadComponent: () => import('./projects/projects.component').then((m) => m.ProjectsComponent),
      },
      {
        path: 'billing',
        title: 'Billing | Admin',
        loadComponent: () => import('./billing/billing.component').then((m) => m.BillingComponent),
      },
    ],
  },
];
