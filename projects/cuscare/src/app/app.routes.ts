import { Routes } from '@angular/router';

/**
 * Rutas de CusCare — replican las del sitio real bajo `#/private/cuscare/…`.
 * Todo lazy (`loadComponent`) colgando del shell, igual que `projects/supervisor`.
 *
 * Fase 1 monta las 3 vistas núcleo; el resto llega en Fase 2 (ver el plan).
 */
export const appRoutes: Routes = [
  {
    path: 'private/cuscare',
    loadComponent: () =>
      import('./core/layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tickets' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/tickets/tickets-page.component').then((m) => m.TicketsPageComponent),
      },
      {
        path: 'tickets/ticket/:id',
        loadComponent: () =>
          import('./features/tickets/ticket-detail-page.component').then(
            (m) => m.TicketDetailPageComponent,
          ),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'private/cuscare/tickets' },
  { path: '**', redirectTo: 'private/cuscare/tickets' },
];
