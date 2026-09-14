import type { AgentPresence, DashboardWidget } from './dashboard.types';
import { DEMO_ENTITIES } from './demo-entities';
import type { DetailKind } from './widget-catalog';

/** Qué detalle pidió el supervisor al pulsar una cifra. */
export interface DetailRequest {
  readonly kind: DetailKind;
  /** Para `agents`: en qué estado; `null` = todos los conectados. */
  readonly presence: AgentPresence | null;
  readonly widgetId: string;
}

export type DetailChannel = 'calls' | 'chats' | 'emails';

export interface WaitingRow {
  readonly id: string;
  readonly customer: string;
  readonly channel: DetailChannel;
  readonly queue: string;
  /** Segundos esperando en el momento de abrir el panel; el panel sigue contando. */
  readonly seconds: number;
}

export interface InProgressRow {
  readonly id: string;
  readonly agent: string;
  readonly customer: string;
  readonly channel: DetailChannel;
  readonly queue: string;
  readonly seconds: number;
}

export interface AgentStateRow {
  readonly id: string;
  readonly name: string;
  readonly presence: AgentPresence;
  readonly seconds: number;
}

export type DetailRows =
  | { readonly kind: 'waiting'; readonly rows: readonly WaitingRow[] }
  | { readonly kind: 'in-progress'; readonly rows: readonly InProgressRow[] }
  | { readonly kind: 'agents'; readonly rows: readonly AgentStateRow[] };

const CHANNELS: readonly DetailChannel[] = ['calls', 'calls', 'chats', 'calls', 'emails', 'chats'];

/*
 * Filas de demostración coherentes con la cifra que se pulsó: si el widget dice 6 en espera, el
 * panel lista 6. Los clientes son un número de cliente, nunca un nombre ni un teléfono: los datos
 * de demostración no llevan nada que parezca un dato personal (`audit:seed-pii`).
 */
export function detailRows(request: DetailRequest, widget: DashboardWidget): DetailRows {
  const queues = widget.entities.length ? widget.entities : DEMO_ENTITIES.groups;
  const agents = DEMO_ENTITIES.agents;
  const customer = (i: number) => `#${(48213 + i * 7919) % 90000 + 10000}`;

  if (request.kind === 'waiting') {
    const count = widget.kind === 'group-panel' ? widget.onHold : widget.kind === 'kpi-trend' ? widget.value : 0;
    return {
      kind: 'waiting',
      rows: Array.from({ length: count }, (_, i) => ({
        id: `w${i}`,
        customer: customer(i),
        channel: CHANNELS[i % CHANNELS.length],
        queue: queues[i % queues.length],
        seconds: 12 + ((i * 37) % 170),
      })).sort((a, b) => b.seconds - a.seconds),
    };
  }

  if (request.kind === 'in-progress') {
    const count = widget.kind === 'group-panel' ? widget.inProgress : widget.kind === 'kpi-trend' ? widget.value : 0;
    return {
      kind: 'in-progress',
      rows: Array.from({ length: count }, (_, i) => ({
        id: `p${i}`,
        agent: agents[i % agents.length],
        customer: customer(i + 50),
        channel: CHANNELS[(i + 2) % CHANNELS.length],
        queue: queues[i % queues.length],
        seconds: 20 + ((i * 53) % 540),
      })).sort((a, b) => b.seconds - a.seconds),
    };
  }

  // agents
  const presence = request.presence;
  const count =
    widget.kind === 'agents-state'
      ? widget.value
      : widget.kind === 'group-panel'
        ? presence === 'available'
          ? widget.available
          : widget.connected
        : 0;
  const cycle: AgentPresence[] = ['available', 'paused', 'available', 'available', 'paused'];
  return {
    kind: 'agents',
    rows: Array.from({ length: Math.min(count, agents.length) }, (_, i) => ({
      id: `a${i}`,
      name: agents[i],
      presence: presence ?? cycle[i % cycle.length],
      seconds: 30 + ((i * 97) % 1500),
    })),
  };
}
