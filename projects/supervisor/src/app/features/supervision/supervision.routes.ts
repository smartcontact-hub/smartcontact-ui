import { Routes } from '@angular/router';

const placeholder = () =>
  import('../../core/layout/placeholder-page/placeholder-page.component').then(
    (m) => m.PlaceholderPageComponent,
  );

/**
 * Supervision routes — top-level routes from the prototype that are placeholders
 * in the React source (Dashboard, Servicios, Conversaciones, etc.). They are
 * preserved here so the navigation tree stays intact; real implementations are
 * out of scope for the Admin/Config-focused migration.
 */
export const supervisionRoutes: Routes = [
  { path: 'dashboard', loadComponent: placeholder },
  { path: 'servicios', loadComponent: placeholder },
  { path: 'nodo-ia', loadComponent: placeholder },
  { path: 'campanas', loadComponent: placeholder },
  {
    path: 'conversaciones',
    loadChildren: () => import('../memory/memory.routes').then((m) => m.memoryRoutes),
  },
  { path: 'informes', loadComponent: placeholder },
  { path: 'analizador', loadComponent: placeholder },
  { path: 'scc', loadComponent: placeholder },
  { path: 'vui-designer', loadComponent: placeholder },
];
