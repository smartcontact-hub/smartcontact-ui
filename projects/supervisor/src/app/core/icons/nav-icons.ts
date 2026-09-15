/**
 * Material Symbols icon registry for navigation and chrome.
 *
 * Maps kebab-case keys → Material Symbols names (snake_case), consumidos por
 * `<sc-icon [name]="...">`. Los componentes que renderizan iconos dinámicos por
 * clave (nav-data, command palette) resuelven `iconKey -> material name`.
 */
export const NAV_ICONS = {
  activity: 'monitoring',
  'bar-chart-3': 'bar_chart',
  'book-open': 'menu_book',
  brain: 'psychology',
  'brain-circuit': 'neurology',
  'chart-no-axes-combined': 'analytics',
  'check-check': 'done_all',
  'chevron-down': 'expand_more',
  'chevron-right': 'chevron_right',
  'data-object': 'data_object',
  database: 'database',
  'file-text': 'description',
  'folder-open': 'folder_open',
  headphones: 'headphones',
  'help-circle': 'help',
  'layout-dashboard': 'space_dashboard',
  'log-out': 'logout',
  megaphone: 'campaign',
  'monitor-heart': 'monitor_heart',
  'message-square': 'chat_bubble',
  'messages-square': 'forum',
  paintbrush: 'brush',
  phone: 'call',
  plug: 'power',
  radio: 'cell_tower',
  robot: 'robot_2',
  route: 'route',
  settings: 'settings',
  shield: 'shield',
  'table-2': 'table_chart',
  'table-eye': 'table_eye',
  'theater-comedy': 'theater_comedy',
  user: 'person',
  'user-cog': 'manage_accounts',
  'user-round': 'person',
  users: 'group',
  'users-round': 'groups',
  workflow: 'account_tree',
} as const;

export type NavIconKey = keyof typeof NAV_ICONS;
