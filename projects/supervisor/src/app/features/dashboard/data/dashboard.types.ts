/**
 * Modelo del Dashboard (el «Monitor» del Supervisor real).
 *
 * Calca la forma que guarda el servidor en `api/widgets/layoutList` (medido el 2026-09-14,
 * `~/Documents/Claude/2026-09 dashboard monitor/ESTUDIO.md` §2): un monitor tiene CUATRO cajas
 * en 2×2, y cada caja es de un hueco grande (`4by4` allí, `single` aquí) o de cuatro pequeños
 * (`2by2` / `split`). Un hueco vacío es `null`: el original lo pinta con borde discontinuo y
 * las acciones de añadir y de dividir o juntar.
 *
 * Los 65 tipos de widget del original se pintan con seis formas; `kind` es la forma, no el tipo.
 */

/*
 * El filtro del original son DOS grupos de opción única, no casillas sueltas (medido el
 * 2026-09-14 con Playwright, `captura/salida/menus/`): «Type» Incoming · Outgoing · All y
 * «Channel» Call · Chat · Email · All. El servidor lo guarda como booleanos por valor, pero
 * la interfaz nunca deja marcar dos a la vez.
 */
export type DashboardChannel = 'all' | 'calls' | 'chats' | 'emails';
export type DashboardDirection = 'all' | 'incoming' | 'outgoing';

export interface WidgetFilter {
  readonly channel: DashboardChannel;
  readonly direction: DashboardDirection;
}

export type AgentPresence = 'available' | 'paused' | 'offline';

interface WidgetBase {
  readonly id: string;
  /** Tipo del catálogo (`widget-catalog.ts`): de ahí salen nombre, descripción, tamaño y filtro. */
  readonly type: string;
  /** Nombre que le puso el usuario en el asistente; `null` = el nombre del tipo. */
  readonly title: string | null;
  /** Lo que vigila: agentes, servicios, grupos, tipificaciones o intenciones. */
  readonly entities: readonly string[];
  /**
   * `null` = el widget no se filtra por canal. En el original no todos lo ofrecen: la tabla de
   * agentes, la tipificación y los grupos sí; las conversaciones en curso y las intenciones no.
   */
  readonly filter: WidgetFilter | null;
}

/** Cifra con su evolución reciente (p. ej. conversaciones en curso). */
export interface KpiTrendWidget extends WidgetBase {
  readonly kind: 'kpi-trend';
  readonly value: number;
  readonly trend: readonly number[];
}

/** Cifra sola (p. ej. una tipificación, un pico, un porcentaje). */
export interface KpiSimpleWidget extends WidgetBase {
  readonly kind: 'kpi-simple';
  readonly value: number;
  readonly unit?: 'percent';
}

/** Agentes en un estado, sobre los conectados. */
export interface AgentsStateWidget extends WidgetBase {
  readonly kind: 'agents-state';
  readonly presence: AgentPresence;
  readonly value: number;
  readonly total: number;
}

export interface AgentRow {
  readonly name: string;
  readonly presence: AgentPresence;
  readonly conversations: number;
  readonly attended: number;
  readonly rejected: number;
  readonly transferred: number;
  /** Tiempo medio de conversación, en segundos. */
  readonly avgSeconds: number;
}

export interface AgentsTableWidget extends WidgetBase {
  readonly kind: 'agents-table';
  readonly rows: readonly AgentRow[];
}

/** El panel «Groups» del original: tres bandas de cifras. */
export interface GroupPanelWidget extends WidgetBase {
  readonly kind: 'group-panel';
  readonly onHold: number;
  readonly inProgress: number;
  readonly available: number;
  readonly connected: number;
  readonly total: number;
  readonly attended: number;
  readonly notAttended: number;
  readonly abandoned: number;
  readonly overflowed: number;
  readonly disconnected: number;
  readonly avgTalkSeconds: number;
  readonly avgPostSeconds: number;
  readonly avgWaitSeconds: number;
  readonly avgAbandonSeconds: number;
  /** Porcentajes, 0-100. */
  readonly serviceLevel: number;
  readonly attentionLevel: number;
}

export interface RankedItem {
  readonly label: string;
  readonly total: number;
}

/** Lista con totales (intenciones, tipificaciones). */
export interface RankedListWidget extends WidgetBase {
  readonly kind: 'ranked-list';
  readonly items: readonly RankedItem[];
}

export type DashboardWidget =
  | KpiTrendWidget
  | KpiSimpleWidget
  | AgentsStateWidget
  | AgentsTableWidget
  | GroupPanelWidget
  | RankedListWidget;

export type BoxLayout = 'single' | 'split';

export interface DashboardBox {
  readonly id: string;
  readonly layout: BoxLayout;
  /** `single`: un hueco. `split`: cuatro, en orden de lectura. */
  readonly slots: readonly (DashboardWidget | null)[];
}

export interface DashboardMonitor {
  readonly id: string;
  readonly name: string;
  readonly boxes: readonly DashboardBox[];
}

/** Máximo de caracteres del nombre de un monitor (el original corta en 24). */
export const MONITOR_NAME_MAX = 24;
