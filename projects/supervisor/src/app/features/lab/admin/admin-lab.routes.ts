import type { Routes } from '@angular/router';

/**
 * Laboratorio del módulo de administración: las mismas DOS pantallas que ya existen para
 * grupos y usuarios (lista con su CTA, y formulario de alta/ficha), con las decisiones del
 * teardown de Telegram y WhatsApp dentro.
 *
 * La puerta de entrada es la LISTA, como en el producto: se crea desde donde se mira. Lo que
 * el laboratorio propone vive dentro del formulario, no en el camino para llegar a él.
 *
 * Cuelgan del shell REAL (sidebar, barra, miga), que es lo que permite ponerlas al lado de
 * `/admin/grupos` y `/admin/usuarios` y juzgar la diferencia. No están en el menú: no son
 * producto, y la miga las marca como laboratorio en su primer tramo.
 */
const LAB_SECTION = { labelKey: 'lab.admin.breadcrumb', link: false } as const;

export const ADMIN_LAB_ROUTES: Routes = [
  {
    path: 'grupos',
    data: { breadcrumb: [LAB_SECTION, { labelKey: 'sidebar.groups' }] },
    loadComponent: () =>
      import('./pages/grupos-list-page.component').then((m) => m.GruposListPageComponent),
  },
  {
    path: 'grupos/crear',
    data: {
      mode: 'create',
      breadcrumb: [
        LAB_SECTION,
        { labelKey: 'sidebar.groups', link: '/lab/admin/grupos' },
        { labelKey: 'groups.form.create_breadcrumb' },
      ],
    },
    loadComponent: () =>
      import('./pages/grupo-form-page.component').then((m) => m.GrupoFormPageComponent),
  },
  {
    path: 'grupos/editar/:id',
    data: {
      mode: 'edit',
      breadcrumb: [
        LAB_SECTION,
        { labelKey: 'sidebar.groups', link: '/lab/admin/grupos' },
        { labelKey: 'groups.form.edit_breadcrumb' },
      ],
    },
    loadComponent: () =>
      import('./pages/grupo-form-page.component').then((m) => m.GrupoFormPageComponent),
  },
  {
    path: 'usuarios',
    data: { breadcrumb: [LAB_SECTION, { labelKey: 'sidebar.users' }] },
    loadComponent: () =>
      import('./pages/usuarios-list-page.component').then((m) => m.UsuariosListPageComponent),
  },
  {
    path: 'usuarios/crear',
    data: {
      mode: 'create',
      breadcrumb: [
        LAB_SECTION,
        { labelKey: 'sidebar.users', link: '/lab/admin/usuarios' },
        { labelKey: 'users.form.create_breadcrumb' },
      ],
    },
    loadComponent: () =>
      import('./pages/usuario-form-page.component').then((m) => m.UsuarioFormPageComponent),
  },
  {
    path: 'usuarios/editar/:id',
    data: {
      mode: 'edit',
      breadcrumb: [
        LAB_SECTION,
        { labelKey: 'sidebar.users', link: '/lab/admin/usuarios' },
        { labelKey: 'users.form.edit_breadcrumb' },
      ],
    },
    loadComponent: () =>
      import('./pages/usuario-form-page.component').then((m) => m.UsuarioFormPageComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'grupos' },
];
