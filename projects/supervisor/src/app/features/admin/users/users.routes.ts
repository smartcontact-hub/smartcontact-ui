import { Routes } from '@angular/router';

import { formDirtyGuard } from '@core/guards';

/** Users feature routes — list + create + edit. */
export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/users-list-page.component').then((m) => m.UsersListPageComponent),
  },
  {
    path: 'crear',
    data: { breadcrumb: { labelKey: 'users.form.create_breadcrumb' } },
    loadComponent: () =>
      import('./pages/user-form-page.component').then((m) => m.UserFormPageComponent),
    canDeactivate: [formDirtyGuard],
  },
  {
    path: 'editar/:id',
    data: { breadcrumb: { labelKey: 'users.form.edit_breadcrumb' } },
    loadComponent: () =>
      import('./pages/user-form-page.component').then((m) => m.UserFormPageComponent),
    canDeactivate: [formDirtyGuard],
  },
];
