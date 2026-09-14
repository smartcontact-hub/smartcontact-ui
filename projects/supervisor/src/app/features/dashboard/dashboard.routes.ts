import { Routes } from '@angular/router';

/** Dashboard, montado bajo `/dashboard` desde supervision.routes.ts. */
export const dashboardRoutes: Routes = [
  {
    path: '',
    data: {
      breadcrumb: [
        // "Supervisión" es una SECCIÓN del menú, no una ruta: sin `link`.
        { labelKey: 'sidebar.supervision', link: false },
        { labelKey: 'sidebar.dashboard' },
      ],
    },
    loadComponent: () =>
      import('./pages/dashboard-page.component').then((m) => m.DashboardPageComponent),
  },
];
