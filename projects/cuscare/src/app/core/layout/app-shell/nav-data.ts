/** Un item del sidebar de CusCare. */
export interface NavItem {
  readonly label: string;
  readonly path: string;
  /** Clave del glifo en `<app-nav-icon>`. */
  readonly icon: 'dashboard' | 'tickets' | 'search' | 'mo';
}

/** Item del menú del engranaje (abajo del sidebar). */
export interface SettingsItem {
  readonly label: string;
  readonly path: string;
}

/**
 * Los 4 items principales, en el orden y con las etiquetas del sitio real.
 * El icono NO se deduce del nombre de la ruta: `customer.svg` es el de
 * "Manage MO in error", y Search usa el de `iconos-general`. Resuelto cruzando
 * la Y de cada icono con la de su etiqueta en la app real.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', path: '/private/cuscare/dashboard', icon: 'dashboard' },
  { label: 'Tickets', path: '/private/cuscare/tickets', icon: 'tickets' },
  { label: 'Search', path: '/private/cuscare/customer', icon: 'search' },
  { label: 'Manage MO in error', path: '/private/cuscare/mo-management', icon: 'mo' },
];

/**
 * Submenú del engranaje. Las rutas están COMPROBADAS clicando cada item en la
 * app real — ojo con "Groups", que NO va a `settings/groups` sino a
 * `settings/entities`.
 */
export const SETTINGS_ITEMS: readonly SettingsItem[] = [
  { label: 'Users', path: '/private/cuscare/settings/users' },
  { label: 'Roles', path: '/private/cuscare/settings/roles' },
  { label: 'Groups', path: '/private/cuscare/settings/entities' },
  { label: 'Templates', path: '/private/cuscare/settings/templates' },
];
