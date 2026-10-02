import type { NavIconKey } from '../../icons/nav-icons';

export interface NavItem {
  /** i18n key resolved by the TranslateModule. */
  readonly labelKey: string;
  readonly icon: NavIconKey;
  /**
   * Logo de producto en lugar del icono, de `public/logos/<logo>.svg`: la fila lo pinta como máscara
   * con el color de la fila. `icon` sigue sirviendo a la paleta de comandos.
   */
  readonly logo?: string;
  readonly path?: string;
  readonly children?: readonly NavItem[];
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
        children: [
          {
            labelKey: 'sidebar.dashboard',
            icon: 'layout-dashboard',
            path: '/dashboard',
          },
          {
            labelKey: 'sidebar.servicios',
            icon: 'radio',
            path: '/servicios',
          },
          {
            labelKey: 'sidebar.nodo_ia',
            icon: 'brain-circuit',
            children: [
              {
                labelKey: 'sidebar.intenciones',
                icon: 'data-object',
                path: '/nodo-ia/intenciones',
              },
              {
                labelKey: 'sidebar.monitor_ia',
                icon: 'table-eye',
                path: '/nodo-ia/monitor',
              },
              {
                labelKey: 'sidebar.agentic_ai',
                icon: 'robot',
                path: '/nodo-ia/agentic-ai',
              },
            ],
          },
          {
            labelKey: 'sidebar.tipificaciones',
            icon: 'check-check',
            path: '/tipificaciones',
          },
          {
            labelKey: 'sidebar.campanas',
            icon: 'megaphone',
            path: '/campanas',
          },
          {
            labelKey: 'sidebar.conversaciones',
            icon: 'messages-square',
            path: '/conversaciones',
          },
          {
            labelKey: 'sidebar.estadisticas',
            icon: 'chart-no-axes-combined',
            children: [
              {
                labelKey: 'sidebar.informes',
                icon: 'file-text',
                path: '/informes',
              },
              {
                labelKey: 'sidebar.analizador',
                icon: 'route',
                path: '/analizador',
              },
            ],
          },
          {
            labelKey: 'sidebar.scc',
            icon: 'table-2',
            /* SCC es CusCare: lleva su logo del DS (Figma 13775:62831), no un icono (DD-137). */
            logo: 'cuscare-isotype',
            path: '/scc',
          },
        ],
      },
      {
        labelKey: 'sidebar.vui_designer',
        icon: 'workflow',
        path: '/vui-designer',
      },
      {
        labelKey: 'sidebar.centro_control',
        icon: 'monitor-heart',
        path: '/centro-control',
      },
      {
        labelKey: 'sidebar.mask_manager',
        icon: 'theater-comedy',
        path: '/mask-manager',
      },
    ],
  },
  {
    titleKey: 'sidebar.settings',
    items: [
      {
        labelKey: 'sidebar.administration',
        icon: 'users-round',
        children: [
          {
            labelKey: 'sidebar.users',
            icon: 'user-round',
            path: '/admin/usuarios',
          },
          {
            labelKey: 'sidebar.groups',
            icon: 'users',
            path: '/admin/grupos',
          },
          {
            labelKey: 'sidebar.agents',
            icon: 'headphones',
            path: '/admin/agentes',
          },
          {
            labelKey: 'sidebar.repositories',
            icon: 'folder-open',
            path: '/admin/repositorios',
          },
        ],
      },
      {
        labelKey: 'sidebar.configuration',
        icon: 'settings',
        children: [
          {
            labelKey: 'sidebar.security',
            icon: 'shield',
            path: '/config/seguridad',
          },
          {
            labelKey: 'sidebar.personalization',
            icon: 'paintbrush',
            path: '/config/personalizacion',
          },
          {
            labelKey: 'sidebar.aed',
            icon: 'database',
            path: '/config/aed',
          },
          {
            labelKey: 'sidebar.integrations',
            icon: 'plug',
            path: '/config/integraciones',
          },
          {
            labelKey: 'sidebar.system',
            icon: 'settings',
            path: '/config/sistema',
          },
        ],
      },
    ],
  },
];
