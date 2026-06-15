import type { NavIconKey } from '../../icons/nav-icons';

export interface NavItem {
  /** i18n key resolved by the TranslateModule. */
  readonly labelKey: string;
  readonly icon: NavIconKey;
  /** Pixel size for the icon. Sidebar uses 16 for level 0, 14 for level 1, 13 for level 2+. */
  readonly iconSize?: number;
  readonly path?: string;
  readonly children?: readonly NavItem[];
  /** When true the parent renders expanded on first paint. */
  readonly defaultExpanded?: boolean;
}

export interface NavSection {
  readonly titleKey: string;
  readonly items: readonly NavItem[];
}

/**
 * Sidebar navigation tree for SmartContact.
 *
 * Mirrors the prototype's `navSections` 1:1 (labels via i18n keys, icons via
 * the lucide registry). Adding a section here is the only step required to
 * surface it in the chrome — the sidebar consumer is fully data-driven.
 */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    titleKey: 'sidebar.tools',
    items: [
      {
        labelKey: 'sidebar.supervision',
        icon: 'activity',
        iconSize: 16,
        children: [
          {
            labelKey: 'sidebar.dashboard',
            icon: 'layout-dashboard',
            iconSize: 14,
            path: '/dashboard',
          },
          {
            labelKey: 'sidebar.servicios',
            icon: 'radio',
            iconSize: 14,
            path: '/servicios',
          },
          {
            labelKey: 'sidebar.nodo_ia',
            icon: 'brain',
            iconSize: 14,
            path: '/nodo-ia',
          },
          {
            labelKey: 'sidebar.campanas',
            icon: 'megaphone',
            iconSize: 14,
            path: '/campanas',
          },
          {
            labelKey: 'sidebar.conversaciones',
            icon: 'messages-square',
            iconSize: 14,
            path: '/conversaciones',
          },
          {
            labelKey: 'sidebar.estadisticas',
            icon: 'chart-no-axes-combined',
            iconSize: 14,
            children: [
              {
                labelKey: 'sidebar.informes',
                icon: 'file-text',
                iconSize: 13,
                path: '/informes',
              },
              {
                labelKey: 'sidebar.analizador',
                icon: 'route',
                iconSize: 13,
                path: '/analizador',
              },
            ],
          },
          {
            labelKey: 'sidebar.scc',
            icon: 'table-2',
            iconSize: 14,
            path: '/scc',
          },
        ],
      },
      {
        labelKey: 'sidebar.vui_designer',
        icon: 'workflow',
        iconSize: 16,
        path: '/vui-designer',
      },
    ],
  },
  {
    titleKey: 'sidebar.settings',
    items: [
      {
        labelKey: 'sidebar.administration',
        icon: 'users',
        iconSize: 16,
        defaultExpanded: true,
        children: [
          {
            labelKey: 'sidebar.users',
            icon: 'user-round',
            iconSize: 14,
            path: '/admin/usuarios',
          },
          {
            labelKey: 'sidebar.groups',
            icon: 'users-round',
            iconSize: 14,
            path: '/admin/grupos',
          },
          {
            labelKey: 'sidebar.agents',
            icon: 'headphones',
            iconSize: 14,
            path: '/admin/agentes',
          },
          {
            labelKey: 'sidebar.repositories',
            icon: 'folder-open',
            iconSize: 14,
            path: '/admin/repositorios',
          },
        ],
      },
      {
        labelKey: 'sidebar.configuration',
        icon: 'settings',
        iconSize: 16,
        children: [
          {
            labelKey: 'sidebar.security',
            icon: 'shield',
            iconSize: 14,
            path: '/config/seguridad',
          },
          {
            labelKey: 'sidebar.personalization',
            icon: 'paintbrush',
            iconSize: 14,
            path: '/config/personalizacion',
          },
          {
            labelKey: 'sidebar.aed',
            icon: 'database',
            iconSize: 14,
            path: '/config/aed',
          },
          {
            labelKey: 'sidebar.integrations',
            icon: 'plug',
            iconSize: 14,
            path: '/config/integraciones',
          },
          {
            labelKey: 'sidebar.system',
            icon: 'settings',
            iconSize: 14,
            path: '/config/sistema',
          },
        ],
      },
    ],
  },
];
