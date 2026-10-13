import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tickets' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'tickets',
    loadComponent: () =>
      import('./features/tickets/tickets-page.component').then((m) => m.TicketsPageComponent),
  },
  // Las otras tres entradas del sidebar existen, pero su pantalla aún no está hecha.
  {
    path: 'dashboard',
    loadComponent: () => import('./core/layout/pending-page.component').then((m) => m.PendingPageComponent),
    data: { title: 'Control Panel' },
  },
  {
    path: 'search',
    loadComponent: () => import('./core/layout/pending-page.component').then((m) => m.PendingPageComponent),
    data: { title: 'Search' },
  },
  {
    path: 'mo-management',
    loadComponent: () => import('./core/layout/pending-page.component').then((m) => m.PendingPageComponent),
    data: { title: 'Manage MO in error' },
  },
  { path: '**', redirectTo: 'tickets' },
];
