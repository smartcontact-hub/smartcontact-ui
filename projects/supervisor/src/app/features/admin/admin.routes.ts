import { Routes } from '@angular/router';

/**
 * Admin routes — composes per-feature route tables. Each feature owns its
 * own `<feature>.routes.ts`; this file just stitches them under `/admin/*`.
 *
 * Repositories load with `path: ''` because the 9 instance pages live at
 * the admin root (`/admin/agendas`, `/admin/horarios`, …) rather than nested
 * under `/admin/repositorios/`. The hub itself is registered there.
 */
export const adminRoutes: Routes = [
  {
    path: 'usuarios',
    data: { breadcrumb: { labelKey: 'sidebar.users' } },
    loadChildren: () => import('./users/users.routes').then((m) => m.USERS_ROUTES),
  },
  {
    path: 'grupos',
    data: { breadcrumb: { labelKey: 'sidebar.groups' } },
    loadChildren: () => import('./groups/groups.routes').then((m) => m.GROUPS_ROUTES),
  },
  {
    path: 'agentes',
    data: { breadcrumb: { labelKey: 'sidebar.agents' } },
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
