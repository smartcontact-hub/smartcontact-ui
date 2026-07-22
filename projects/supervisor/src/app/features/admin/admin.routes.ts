import { Routes } from '@angular/router';

/**
 * Admin routes — composes per-feature route tables. Each feature owns its
 * own `<feature>.routes.ts`; this file just stitches them under `/admin/*`.
 *
 * Repositories load with `path: ''` because the 9 instance pages live at
 * the admin root (`/admin/agendas`, `/admin/horarios`, …) rather than nested
 * under `/admin/repositorios/`. The hub itself is registered there.
 */
/*
 * "Administración" abre el trail de las tres listas. No es una ruta —es la
 * sección del menú— así que va con `link: false`. Existe porque el título de
 * página volvió al cuerpo: con un solo tramo, la barra y el título repetían la
 * misma palabra ("Usuarios" sobre "Usuarios"). Los formularios que cuelgan de
 * aquí heredan el padre y quedan en tres tramos, que es su profundidad real.
 */
const ADMIN_SECTION = { labelKey: 'sidebar.administration', link: false } as const;

export const adminRoutes: Routes = [
  {
    path: 'usuarios',
    data: { breadcrumb: [ADMIN_SECTION, { labelKey: 'sidebar.users' }] },
    loadChildren: () => import('./users/users.routes').then((m) => m.USERS_ROUTES),
  },
  {
    path: 'grupos',
    data: { breadcrumb: [ADMIN_SECTION, { labelKey: 'sidebar.groups' }] },
    loadChildren: () => import('./groups/groups.routes').then((m) => m.GROUPS_ROUTES),
  },
  {
    path: 'agentes',
    data: { breadcrumb: [ADMIN_SECTION, { labelKey: 'sidebar.agents' }] },
    loadChildren: () => import('./agents/agents.routes').then((m) => m.AGENTS_ROUTES),
  },
  {
    path: 'labels',
    data: {
      breadcrumb: [
        { labelKey: 'sidebar.repositories', link: '/admin/repositorios' },
        { labelKey: 'labels.breadcrumb' },
      ],
    },
    loadChildren: () => import('./labels/labels.routes').then((m) => m.LABELS_ROUTES),
  },
  {
    path: 'plantillas',
    data: {
      breadcrumb: [
        { labelKey: 'sidebar.repositories', link: '/admin/repositorios' },
        { labelKey: 'templates.breadcrumb' },
      ],
    },
    loadChildren: () => import('./templates/templates.routes').then((m) => m.TEMPLATES_ROUTES),
  },
  {
    path: '',
    loadChildren: () =>
      import('./repositories/repositories.routes').then((m) => m.REPOSITORIES_ROUTES),
  },
];
