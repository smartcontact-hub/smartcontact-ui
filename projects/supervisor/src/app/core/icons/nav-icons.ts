/**
 * Material Symbols icon registry for navigation and chrome.
 *
 * Maps kebab-case keys → Material Symbols names (snake_case), consumidos por
 * `<sc-icon [name]="...">`. Los componentes que renderizan iconos dinámicos por
 * clave (nav-data, command palette) resuelven `iconKey -> material name`.
 *
 * GitHub (icono de marca) NO vive aquí — no existe glifo Material; su único
 * consumer (footer del sidebar) usa Lucide directamente (migración S60).
 */
export const NAV_ICONS = {
  activity: 'monitoring',
  'arrow-up-right': 'arrow_outward',
  'bar-chart-3': 'bar_chart',
  'book-open': 'menu_book',
  brain: 'psychology',
  'brain-circuit': 'neurology',
  'chart-no-axes-combined': 'analytics',
  'check-check': 'done_all',
  'chevron-down': 'expand_more',
  'chevron-right': 'chevron_right',
  database: 'database',
  'file-text': 'description',
  'folder-open': 'folder_open',
  headphones: 'headphones',
  'help-circle': 'help',
  'layout-dashboard': 'space_dashboard',
  'log-out': 'logout',
  megaphone: 'campaign',
  'message-square': 'chat_bubble',
  'messages-square': 'forum',
  paintbrush: 'brush',
  phone: 'call',
  plug: 'power',
  radio: 'cell_tower',
  route: 'route',
  settings: 'settings',
  shield: 'shield',
  'table-2': 'table_chart',
  user: 'person',
  'user-cog': 'manage_accounts',
  'user-round': 'person',
  users: 'group',
  'users-round': 'groups',
  workflow: 'account_tree',
} as const;

export type NavIconKey = keyof typeof NAV_ICONS;
