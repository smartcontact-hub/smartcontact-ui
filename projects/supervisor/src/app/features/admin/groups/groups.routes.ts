import { Routes } from '@angular/router';

import { formDirtyGuard } from '@core/guards';

/** Groups feature routes — list + create + edit (el alta y la edición son la misma ficha). */
export const GROUPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/groups-list-page.component').then((m) => m.GroupsListPageComponent),
  },
  {
    /* Con qué nace un grupo nuevo se fija en Contact Center › Grupos desde el 2026-09-29 (DD-135). La página que
     * vivía aquí, junto al listado, la sustituye; su dirección sigue llevando a donde se fija ahora. */
    path: 'valores-por-defecto',
    redirectTo: '/config/aed/grupos',
  },
  {
    /* El alta es la MISMA ficha en modo alta (visión de producto de grupos, 2026-09-25; DD-121): durante
     * la creación quedan definidos canales, distribución, colas y recursos. Fue un diálogo sobre la lista
     * del 2026-09-23 al 2026-09-26; duplicar conserva el suyo. */
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
