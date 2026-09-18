import { Routes } from '@angular/router';

import { formDirtyGuard } from '@core/guards';

/** Groups feature routes — list + create + edit. */
export const GROUPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/groups-list-page.component').then((m) => m.GroupsListPageComponent),
  },
  {
    /* Con qué nace un grupo nuevo. Vive con Grupos y no en Configuración del AED (Rafa, 2026-09-18). */
    path: 'valores-por-defecto',
    data: { breadcrumb: { labelKey: 'groups.defaults.breadcrumb' } },
    loadComponent: () =>
      import('./pages/group-defaults-page.component').then((m) => m.GroupDefaultsPageComponent),
    canDeactivate: [formDirtyGuard],
  },
  {
    path: 'crear',
    data: { breadcrumb: { labelKey: 'groups.form.create_breadcrumb' } },
    loadComponent: () =>
      import('./pages/group-form-page.component').then((m) => m.GroupFormPageComponent),
    canDeactivate: [formDirtyGuard],
  },
  {
    path: 'editar/:id',
    data: { breadcrumb: { labelKey: 'groups.form.edit_breadcrumb' } },
    loadComponent: () =>
      import('./pages/group-form-page.component').then((m) => m.GroupFormPageComponent),
    canDeactivate: [formDirtyGuard],
  },
];
