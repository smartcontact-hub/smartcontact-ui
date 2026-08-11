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
      {
        // "Search" en el nav → ruta `customer` (comprobado navegando, no supuesto).
        path: 'customer',
        loadComponent: () =>
          import('./features/search/search-page.component').then((m) => m.SearchPageComponent),
      },
      {
        path: 'mo-management',
        loadComponent: () =>
          import('./features/mo-management/mo-management-page.component').then(
            (m) => m.MoManagementPageComponent,
          ),
      },
      {
        path: 'settings/users',
        loadComponent: () =>
          import('./features/settings/users-page.component').then((m) => m.UsersPageComponent),
      },
      {
        path: 'settings/roles',
        loadComponent: () =>
          import('./features/settings/roles-page.component').then((m) => m.RolesPageComponent),
      },
      {
        // OJO: el item del menú se llama "Groups" pero su ruta es `entities`
        // (comprobado clicándolo en la app real — no es `settings/groups`).
        path: 'settings/entities',
        loadComponent: () =>
          import('./features/settings/entities-page.component').then(
            (m) => m.EntitiesPageComponent,
          ),
      },
      {
        path: 'settings/templates',
        loadComponent: () =>
          import('./features/settings/templates-page.component').then(
            (m) => m.TemplatesPageComponent,
          ),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'private/cuscare/tickets' },
  { path: '**', redirectTo: 'private/cuscare/tickets' },
];
