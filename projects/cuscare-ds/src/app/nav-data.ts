import type { SidebarItem } from './shared/sidebar/sidebar.component';

/**
 * Las 4 entradas del sidebar, independientes entre sí, con el orden y las etiquetas de CusCare.
 * Iconos de Material Symbols: `dashboard` (panel de control), `confirmation_number` (el ticket),
 * `search`, y `sms_failed` para «Manage MO in error» (un mensaje móvil —MO— que ha fallado).
 */
export const NAV_ITEMS: readonly (SidebarItem & { readonly path: string })[] = [
  { key: 'dashboard', label: 'Control Panel', icon: 'dashboard', path: '/dashboard' },
  { key: 'tickets', label: 'Tickets', icon: 'confirmation_number', path: '/tickets' },
  { key: 'search', label: 'Search', icon: 'search', path: '/search' },
  { key: 'mo-management', label: 'Manage MO in error', icon: 'sms_failed', path: '/mo-management' },
];
