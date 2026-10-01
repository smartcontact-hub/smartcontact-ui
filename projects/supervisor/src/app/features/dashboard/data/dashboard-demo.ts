import { nombreDeCosa } from '@core/services/juego-de-datos';

import { buildWidget, type BuildWidgetOptions } from './build-widget';
import type { AgentRow, DashboardMonitor, DashboardWidget, WidgetFilter } from './dashboard.types';
import { DEMO_AGENTS, DEMO_ENTITIES } from './demo-entities';
import { agentesDelPanel, contarEstado, ESTADO_EN_SEMILLAS } from './presencia';

/**
 * Datos de demostración del Dashboard.
 *
 * La DISPOSICIÓN es la de «Monitor x» en el Supervisor real (medido el 2026-09-14): tabla de
 * agentes arriba a la izquierda; arriba a la derecha una caja partida con conversaciones en
 * curso y una tipificación; abajo el panel de grupos y la lista de intenciones. Uno de los dos
 * huecos que allí estaban vacíos lleva aquí «Agentes disponibles», para que se vean las seis
 * formas de widget; el otro sigue vacío a propósito. Si ese tipo se filtra por canal en el
 * original no está medido (no hay ninguno en «Monitor x»): va sin filtro.
 *
 * El segundo monitor, «Colas y agentes», no existe en el original: está para que se vean las
 * pestañas, el carrusel y las alertas. Sus cifras las pone `buildWidget`.
 *
 * Las CIFRAS son inventadas (a esa hora el original salía todo a «-»), y los nombres son los de
 * las semillas de Agentes y Grupos de esta misma app. Ningún dato sale de la extracción.
 *
 * El ESTADO de cada agente es el de sus semillas en Administración (`ESTADO_EN_SEMILLAS`): con él
 * nacen estos monitores, y al pintarlos el almacén lo vuelve a leer de Administración (DD-139).
 */

const ALL_CHANNELS: WidgetFilter = { channel: 'all', direction: 'all' };

const AGENTS = DEMO_ENTITIES.agents;
const SERVICES = DEMO_ENTITIES.services;
const GROUPS = DEMO_ENTITIES.groups;

/** Las cifras de hoy de cada agente de la demo, por su id en Administración. */
const CIFRAS_DE_HOY = new Map<number, Omit<AgentRow, 'name' | 'presence'>>([
  [1, { conversations: 18, attended: 17, rejected: 1, transferred: 2, avgSeconds: 214 }],
  [2, { conversations: 21, attended: 21, rejected: 0, transferred: 1, avgSeconds: 188 }],
  [3, { conversations: 12, attended: 11, rejected: 1, transferred: 0, avgSeconds: 256 }],
  [4, { conversations: 16, attended: 15, rejected: 1, transferred: 3, avgSeconds: 197 }],
  [5, { conversations: 4, attended: 4, rejected: 0, transferred: 0, avgSeconds: 302 }],
  [6, { conversations: 19, attended: 18, rejected: 1, transferred: 1, avgSeconds: 176 }],
  [7, { conversations: 9, attended: 9, rejected: 0, transferred: 2, avgSeconds: 241 }],
  [8, { conversations: 14, attended: 13, rejected: 1, transferred: 0, avgSeconds: 205 }],
  [9, { conversations: 11, attended: 10, rejected: 1, transferred: 1, avgSeconds: 233 }],
  [10, { conversations: 15, attended: 15, rejected: 0, transferred: 2, avgSeconds: 219 }],
]);
const SIN_CIFRAS: Omit<AgentRow, 'name' | 'presence'> = { conversations: 0, attended: 0, rejected: 0, transferred: 0, avgSeconds: 0 };

/** Un widget del catálogo con el estado de los agentes en las semillas. */
const widgetDeFabrica = (typeId: string, opts: Omit<BuildWidgetOptions, 'estadoDe'>): DashboardWidget =>
  buildWidget(typeId, { ...opts, estadoDe: ESTADO_EN_SEMILLAS });

export const DASHBOARD_DEMO_MONITOR: DashboardMonitor = {
  id: 'monitor-x',
  name: 'Monitor x',
  boxes: [
    {
      id: 'box-agents',
      layout: 'single',
      slots: [
        {
          id: 'w-agents-table',
          kind: 'agents-table',
          type: 'agents-table',
          title: null,
          entities: AGENTS,
          filter: ALL_CHANNELS,
          // Una fila por agente de la cabecera (`entities`), con su nombre y su estado en Administración, que es el
          // que cuentan el anillo de al lado y su detalle.
          rows: DEMO_AGENTS.map(({ id, nombre }) => ({
            name: nombre,
            presence: ESTADO_EN_SEMILLAS(nombre) ?? 'offline',
            ...(CIFRAS_DE_HOY.get(id) ?? SIN_CIFRAS),
          })),
        },
      ],
    },
    {
      id: 'box-kpis',
      layout: 'split',
      slots: [
        {
          id: 'w-current-conversations',
          kind: 'kpi-trend',
          type: 'services-current-conv',
          title: null,
          entities: SERVICES,
          filter: null,
          value: 23,
          trend: [12, 14, 13, 17, 19, 18, 22, 21, 25, 24, 22, 23],
        },
        {
          id: 'w-available-agents',
          kind: 'agents-state',
          type: 'agents-available',
          title: null,
          entities: AGENTS,
          filter: null,
          presence: 'available',
          // Lo que cuenta la tabla de al lado: los disponibles de los conectados.
          ...(contarEstado(AGENTS.map(ESTADO_EN_SEMILLAS), 'available') ?? { value: 0, total: 0 }),
        },
        {
          id: 'w-typification',
          kind: 'kpi-simple',
          type: 'typification',
          title: null,
          entities: [nombreDeCosa('Venta cerrada')],
          filter: ALL_CHANNELS,
          value: 41,
        },
        null,
      ],
    },
    {
      id: 'box-groups',
      layout: 'single',
      slots: [
        {
          id: 'w-groups',
          kind: 'group-panel',
          type: 'groups',
          title: null,
          entities: GROUPS,
          filter: ALL_CHANNELS,
          onHold: 3,
          inProgress: 23,
          ...agentesDelPanel(ESTADO_EN_SEMILLAS),
          total: 187,
          attended: 171,
          notAttended: 16,
          abandoned: 9,
          overflowed: 4,
          disconnected: 3,
          avgTalkSeconds: 212,
          avgPostSeconds: 38,
          avgWaitSeconds: 27,
          avgAbandonSeconds: 64,
          serviceLevel: 86,
          attentionLevel: 91,
        },
      ],
    },
    {
      id: 'box-intents',
      layout: 'single',
      slots: [
        {
          id: 'w-intents',
          kind: 'ranked-list',
          type: 'ai-intents',
          title: null,
          entities: DEMO_ENTITIES.ai,
          filter: null,
          items: [
            { label: 'Pedir cita', total: 64 },
            { label: 'Estado del pedido', total: 51 },
            { label: 'Hablar con un agente', total: 38 },
            { label: 'Consultar factura', total: 27 },
            { label: 'Incidencia técnica', total: 19 },
            { label: 'Cambiar datos de contacto', total: 11 },
            { label: 'Baja del servicio', total: 6 },
          ].map((it) => ({ ...it, label: nombreDeCosa(it.label) })),
        },
      ],
    },
  ],
};

const QUEUES = DEMO_ENTITIES.groups.slice(0, 4);

/** Fija la evolución de un widget de cifra con tendencia (para que la demo arranque con una alerta). */
const withTrend = (w: DashboardWidget, trend: number[]): DashboardWidget =>
  w.kind === 'kpi-trend' ? { ...w, trend, value: trend[trend.length - 1] } : w;

export const DASHBOARD_DEMO_QUEUES: DashboardMonitor = {
  id: 'monitor-colas',
  name: 'Colas y agentes',
  boxes: [
    {
      id: 'box-colas-kpis',
      layout: 'split',
      slots: [
        withTrend(widgetDeFabrica('groups-on-hold', { id: 'w-colas-on-hold', entities: QUEUES }), [2, 3, 3, 4, 4, 5, 4, 5, 6, 5, 6, 6]),
        widgetDeFabrica('groups-service-level', { id: 'w-colas-service-level', entities: QUEUES }),
        widgetDeFabrica('agents-available', { id: 'w-colas-available', entities: DEMO_ENTITIES.agents }),
        widgetDeFabrica('agents-paused', { id: 'w-colas-paused', entities: DEMO_ENTITIES.agents }),
      ],
    },
    {
      id: 'box-colas-groups',
      layout: 'single',
      slots: [widgetDeFabrica('groups', { id: 'w-colas-groups', entities: QUEUES })],
    },
    {
      id: 'box-colas-typifications',
      layout: 'single',
      slots: [widgetDeFabrica('typifications', { id: 'w-colas-typifications', entities: DEMO_ENTITIES.typifications })],
    },
    {
      id: 'box-colas-campaigns',
      layout: 'split',
      slots: [
        widgetDeFabrica('campaigns-conversion', { id: 'w-colas-conversion', entities: DEMO_ENTITIES.campaigns }),
        widgetDeFabrica('campaigns-useful-closure', { id: 'w-colas-useful', entities: DEMO_ENTITIES.campaigns }),
        widgetDeFabrica('groups-abandoned', { id: 'w-colas-abandoned', entities: QUEUES }),
        null,
      ],
    },
  ],
};

export const DASHBOARD_DEMO_MONITORS: readonly DashboardMonitor[] = [DASHBOARD_DEMO_MONITOR, DASHBOARD_DEMO_QUEUES];
