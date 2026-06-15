import { Routes } from '@angular/router';

/**
 * Repository routes — hub at `/admin/repositorios` plus 9 instance pages
 * each at `/admin/<instance>`. The instance pages live at the admin root
 * (not nested under `/repositorios/`) for backwards compatibility with the
 * URLs of the React prototype.
 */
/**
 * Each instance route declares its breadcrumb as a 2-element array:
 * `[Repositorios → <instance>]`. The "Repositorios" crumb links back to
 * the hub. The hub itself is a leaf — declares only its own crumb.
 */
const repoInstance = (labelKey: string) => ({
  breadcrumb: [
    { labelKey: 'sidebar.repositories', link: '/admin/repositorios' as const },
    { labelKey },
  ],
});

export const REPOSITORIES_ROUTES: Routes = [
  {
    path: 'repositorios',
    data: { breadcrumb: { labelKey: 'sidebar.repositories' } },
    loadComponent: () =>
      import('./pages/repositorios-hub-page.component').then((m) => m.RepositoriosHubPageComponent),
  },
  {
    path: 'agendas',
    data: repoInstance('repositories.agendas.title'),
    loadComponent: () => import('./instances/agendas').then((m) => m.AgendasPageComponent),
  },
  {
    path: 'horarios',
    data: repoInstance('repositories.horarios.title'),
    loadComponent: () => import('./instances/horarios').then((m) => m.HorariosPageComponent),
  },
  {
    path: 'tipificaciones',
    data: repoInstance('repositories.tipificaciones.title'),
    loadComponent: () =>
      import('./instances/tipificaciones').then((m) => m.TipificacionesPageComponent),
  },
  {
    path: 'variables',
    data: repoInstance('repositories.variables.title'),
    loadComponent: () => import('./instances/variables').then((m) => m.VariablesPageComponent),
  },
  {
    path: 'entidades',
    data: repoInstance('repositories.entidades.title'),
    loadComponent: () => import('./instances/entidades').then((m) => m.EntidadesPageComponent),
  },
  {
    path: 'intenciones',
    data: repoInstance('repositories.intenciones.title'),
    loadComponent: () => import('./instances/intenciones').then((m) => m.IntencionesPageComponent),
  },
  {
    path: 'reglas-ia',
    data: repoInstance('repositories.reglas_ia.title'),
    loadComponent: () => import('./instances/reglas-ia').then((m) => m.ReglasIAPageComponent),
  },
  {
    path: 'entidades-ia',
    data: repoInstance('repositories.entidades_ia.title'),
    loadComponent: () => import('./instances/entidades-ia').then((m) => m.EntidadesIAPageComponent),
  },
  {
    path: 'clasificacion-ia',
    data: repoInstance('repositories.clasificacion_ia.title'),
    loadComponent: () =>
      import('./instances/clasificacion-ia').then((m) => m.ClasificacionIAPageComponent),
  },
];
