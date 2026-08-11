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

/** Los 4 items principales, en el orden y con las etiquetas del sitio real. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', path: '/private/cuscare/dashboard', icon: 'dashboard' },
  { label: 'Tickets', path: '/private/cuscare/tickets', icon: 'tickets' },
  { label: 'Search', path: '/private/cuscare/customer', icon: 'search' },
  { label: 'Manage MO in error', path: '/private/cuscare/mo-management', icon: 'mo' },
];

/** Submenú del engranaje. Las 4 llegan en Fase 2; el shell ya las lista. */
export const SETTINGS_ITEMS: readonly SettingsItem[] = [
  { label: 'Users', path: '/private/cuscare/settings/users' },
  { label: 'Roles', path: '/private/cuscare/settings/roles' },
  { label: 'Groups', path: '/private/cuscare/settings/groups' },
  { label: 'Templates', path: '/private/cuscare/settings/templates' },
];
