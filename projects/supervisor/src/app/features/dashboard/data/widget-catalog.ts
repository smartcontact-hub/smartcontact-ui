import type { AgentPresence, DashboardWidget } from './dashboard.types';

/*
 * Catálogo de tipos de widget que este Dashboard sabe pintar.
 *
 * El Supervisor real tiene 63 (medido el 2026-09-14 recorriendo su asistente con Playwright;
 * catálogo completo en `~/Documents/Claude/2026-09 dashboard monitor/catalogo-widgets.json`).
 * Aquí entran los que caben en nuestras seis formas, con el TAMAÑO del original: un tipo grande
 * solo va en una caja entera y uno pequeño solo en un hueco de una caja partida. Nombres y
 * descripciones salen de los textos del propio Supervisor.
 */

export type WidgetCategory = 'services' | 'groups' | 'agents' | 'ai' | 'typifications' | 'campaigns';
export type WidgetSize = 'big' | 'small';

/** Qué detalle se abre al pulsar la cifra principal del widget. */
export type DetailKind = 'waiting' | 'in-progress' | 'agents';

export interface WidgetTypeDef {
  readonly id: string;
  readonly category: WidgetCategory;
  readonly size: WidgetSize;
  readonly kind: DashboardWidget['kind'];
  /** Si ofrece «Canales y tipos» en el ⋮ (en el original, no todos). */
  readonly filterable: boolean;
  readonly presence?: AgentPresence;
  readonly unit?: 'percent';
  readonly detail?: DetailKind;
}

export const WIDGET_CATEGORIES: readonly WidgetCategory[] = ['services', 'groups', 'agents', 'ai', 'typifications', 'campaigns'];

export const CATEGORY_ICON: Readonly<Record<WidgetCategory, string>> = {
  services: 'call',
  groups: 'groups',
  agents: 'support_agent',
  ai: 'psychology',
  typifications: 'label',
  campaigns: 'campaign',
};

export const WIDGET_TYPES: readonly WidgetTypeDef[] = [
  { id: 'services-current-conv', category: 'services', size: 'small', kind: 'kpi-trend', filterable: false, detail: 'in-progress' },
  { id: 'services-total-conv', category: 'services', size: 'small', kind: 'kpi-trend', filterable: false },
  { id: 'services-max-peak', category: 'services', size: 'small', kind: 'kpi-simple', filterable: false },
  { id: 'groups-on-hold', category: 'groups', size: 'small', kind: 'kpi-trend', filterable: true, detail: 'waiting' },
  { id: 'groups-attended', category: 'groups', size: 'small', kind: 'kpi-simple', filterable: true },
  { id: 'groups-abandoned', category: 'groups', size: 'small', kind: 'kpi-simple', filterable: true },
  { id: 'groups-service-level', category: 'groups', size: 'small', kind: 'kpi-simple', filterable: true, unit: 'percent' },
  { id: 'groups', category: 'groups', size: 'big', kind: 'group-panel', filterable: true },
  { id: 'agents-available', category: 'agents', size: 'small', kind: 'agents-state', filterable: false, presence: 'available', detail: 'agents' },
  { id: 'agents-paused', category: 'agents', size: 'small', kind: 'agents-state', filterable: false, presence: 'paused', detail: 'agents' },
  { id: 'agents-table', category: 'agents', size: 'big', kind: 'agents-table', filterable: true },
  { id: 'ai-intents', category: 'ai', size: 'big', kind: 'ranked-list', filterable: false },
  { id: 'typification', category: 'typifications', size: 'small', kind: 'kpi-simple', filterable: true },
  { id: 'typifications', category: 'typifications', size: 'big', kind: 'ranked-list', filterable: true },
  { id: 'campaigns-useful-closure', category: 'campaigns', size: 'small', kind: 'kpi-simple', filterable: false },
  { id: 'campaigns-conversion', category: 'campaigns', size: 'small', kind: 'kpi-simple', filterable: false, unit: 'percent' },
];

const BY_ID = new Map(WIDGET_TYPES.map((t) => [t.id, t]));

export function widgetType(id: string): WidgetTypeDef {
  const def = BY_ID.get(id);
  if (!def) throw new Error(`Tipo de widget desconocido: ${id}`);
  return def;
}

/** Clave i18n del nombre y de la descripción de un tipo. */
export const typeTitleKey = (id: string) => `dashboard.catalog.${id}.name`;
export const typeDescriptionKey = (id: string) => `dashboard.catalog.${id}.description`;
export const categoryKey = (c: WidgetCategory) => `dashboard.categories.${c}`;
