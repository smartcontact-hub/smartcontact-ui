import { Routes } from '@angular/router';

import { formDirtyGuard } from '@core/guards';

/**
 * Repository routes — hub at `/admin/repositorios` plus 9 instance pages
 * each at `/admin/<instance>`. The instance pages live at the admin root
 * (not nested under `/repositorios/`) for backwards compatibility with the
 * URLs of the React prototype.
 */
/**
 * Each instance route declares its breadcrumb as a 2-element array:
 * `[Repositorios → <instance>]`. The "Repositorios" crumb links back to
 * the hub. The hub opens with the menu section instead, because with a
 * single crumb the bar repeated word for word the page heading that now
 * lives in the body (`.page__heading`).
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
    data: {
      breadcrumb: [
        { labelKey: 'sidebar.administration', link: false as const },
        { labelKey: 'sidebar.repositories' },
      ],
    },
    loadComponent: () =>
      import('./pages/repositorios-hub-page.component').then((m) => m.RepositoriosHubPageComponent),
  },
  {
    /* La agenda tiene su editor (DD-163), como las fichas: el alta y la edición en su ruta, con la guarda de
     * siempre. La miga de "Agendas" enlaza a la lista; la del editor es la tercera. */
    path: 'agendas',
    data: repoInstance('repositories.agendas.title'),
    children: [
      { path: '', loadComponent: () => import('./instances/agendas').then((m) => m.AgendasPageComponent) },
      {
        path: 'crear',
        data: { breadcrumb: { labelKey: 'repositories.agendas.create_breadcrumb' } },
        loadComponent: () =>
          import('./pages/agenda-editor-page.component').then((m) => m.AgendaEditorPageComponent),
        canDeactivate: [formDirtyGuard],
      },
      {
        path: 'editar/:id',
        data: { breadcrumb: { labelKey: 'repositories.agendas.edit_breadcrumb' } },
        loadComponent: () =>
          import('./pages/agenda-editor-page.component').then((m) => m.AgendaEditorPageComponent),
        canDeactivate: [formDirtyGuard],
      },
    ],
  },
  {
    path: 'horarios',
    data: repoInstance('repositories.horarios.title'),
    loadComponent: () => import('./instances/horarios').then((m) => m.HorariosPageComponent),
  },
  {
    /* La tipificación tiene su ficha (DD-173): General, Categorización y Grupos, como las
     * fichas de grupo y de agente. El listado sigue en Repositorios. */
    path: 'tipificaciones',
    data: repoInstance('repositories.tipificaciones.title'),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/tipificaciones-list-page.component').then((m) => m.TipificacionesListPageComponent),
      },
      {
        path: 'crear',
        data: { breadcrumb: { labelKey: 'repositories.tipificaciones.create_title' } },
        loadComponent: () =>
          import('./pages/tipificacion-ficha-page.component').then((m) => m.TipificacionFichaPageComponent),
        canDeactivate: [formDirtyGuard],
      },
      {
        path: 'editar/:id',
        data: { breadcrumb: { labelKey: 'repositories.tipificaciones.edit_breadcrumb' } },
        loadComponent: () =>
          import('./pages/tipificacion-ficha-page.component').then((m) => m.TipificacionFichaPageComponent),
        canDeactivate: [formDirtyGuard],
      },
    ],
  },
  {
    /* El repositorio de Email (DD-185): las cuentas de correo y los triggers, cada uno con su editor en su ruta. */
    path: 'emails',
    data: repoInstance('repositories.emails.title'),
    children: [
      { path: '', loadComponent: () => import('./pages/emails-page.component').then((m) => m.EmailsPageComponent) },
      {
        path: 'cuentas/crear',
        data: { breadcrumb: { labelKey: 'repositories.emails.mailbox.create_breadcrumb' } },
        loadComponent: () =>
          import('./pages/email-cuenta-editor-page.component').then((m) => m.EmailCuentaEditorPageComponent),
        canDeactivate: [formDirtyGuard],
      },
      {
        path: 'cuentas/editar/:id',
        data: { breadcrumb: { labelKey: 'repositories.emails.mailbox.edit_breadcrumb' } },
        loadComponent: () =>
          import('./pages/email-cuenta-editor-page.component').then((m) => m.EmailCuentaEditorPageComponent),
        canDeactivate: [formDirtyGuard],
      },
      {
        path: 'triggers/crear',
        data: { breadcrumb: { labelKey: 'repositories.emails.trigger.create_breadcrumb' } },
        loadComponent: () =>
          import('./pages/email-trigger-editor-page.component').then((m) => m.EmailTriggerEditorPageComponent),
        canDeactivate: [formDirtyGuard],
      },
      {
        path: 'triggers/editar/:id',
        data: { breadcrumb: { labelKey: 'repositories.emails.trigger.edit_breadcrumb' } },
        loadComponent: () =>
          import('./pages/email-trigger-editor-page.component').then((m) => m.EmailTriggerEditorPageComponent),
        canDeactivate: [formDirtyGuard],
      },
    ],
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
