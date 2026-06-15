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
