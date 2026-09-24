import { Routes } from '@angular/router';

import { formDirtyGuard } from '@core/guards';

/** Groups feature routes — list (con el alta en diálogo) + edit. */
export const GROUPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/groups-list-page.component').then((m) => m.GroupsListPageComponent),
  },
  {
    /* Con qué nace un grupo nuevo. Vive con Grupos y no en Configuración del AED (decisión de producto, 2026-09-18). */
    path: 'valores-por-defecto',
    data: { breadcrumb: { labelKey: 'groups.defaults.breadcrumb' } },
    loadComponent: () =>
      import('./pages/group-defaults-page.component').then((m) => m.GroupDefaultsPageComponent),
    canDeactivate: [formDirtyGuard],
  },
  {
    /* El alta es un diálogo sobre la lista desde el 2026-09-23 (nombre y canales; lo demás, en la
     * ficha). La dirección se queda viva para la paleta de comandos y los enlaces guardados. */
    path: 'crear',
    redirectTo: '/admin/grupos?crear=1',
  },
  {
    path: 'editar/:id',
    data: { breadcrumb: { labelKey: 'groups.form.edit_breadcrumb' } },
    loadComponent: () =>
      import('./pages/group-form-page.component').then((m) => m.GroupFormPageComponent),
    canDeactivate: [formDirtyGuard],
  },
];
