import type {
  AgentRow,
  DashboardChannel,
  DashboardDirection,
  DashboardWidget,
  GroupPanelWidget,
} from './dashboard.types';

/*
 * Qué enseña un widget cuando se filtra por canal o por tipo.
 *
 * Los datos de demostración son un total; aquí se reparte entre canales y direcciones con unas
 * proporciones fijas y creíbles para un contact center (más llamadas que chats, más entrantes que
 * salientes). Sin esto el filtro solo ponía la etiqueta y las cifras no se movían, que es lo que
 * Rafa vio el 2026-09-14: «le doy a una opción y nada cambia».
 *
 * Solo se reparten las CONVERSACIONES. Los agentes conectados o disponibles no son de un canal, y
 * los tiempos y niveles no se dividen: cambian de valor (un email tarda más en contestarse).
 */

const CHANNEL_SHARE: Readonly<Record<DashboardChannel, number>> = {
  all: 1,
  calls: 0.56,
  chats: 0.31,
  emails: 0.13,
};

const DIRECTION_SHARE: Readonly<Record<DashboardDirection, number>> = {
  all: 1,
  incoming: 0.74,
  outgoing: 0.26,
};

/** Cuánto dura una conversación de ese canal respecto a la media. */
const CHANNEL_TIME: Readonly<Record<DashboardChannel, number>> = {
  all: 1,
  calls: 0.9,
  chats: 1.35,
  emails: 2.1,
};

/** Puntos que suma o resta el canal a los niveles de servicio y atención. */
const CHANNEL_LEVEL: Readonly<Record<DashboardChannel, number>> = {
  all: 0,
  calls: 2,
  chats: 4,
  emails: -9,
};

/** Variación estable por nombre (0,7 a 1,3) para que cada agente no reparta igual que los demás. */
function jitter(seed: string): number {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return 0.7 + (Math.abs(h) % 61) / 100;
}

const share = (x: number, factor: number) => Math.round(x * factor);
const clampPct = (x: number) => Math.max(0, Math.min(100, Math.round(x)));

export function applyFilter(widget: DashboardWidget): DashboardWidget {
  const f = widget.filter;
  if (!f || (f.channel === 'all' && f.direction === 'all')) return widget;
  const factor = CHANNEL_SHARE[f.channel] * DIRECTION_SHARE[f.direction];
  const time = CHANNEL_TIME[f.channel];

  switch (widget.kind) {
    case 'kpi-trend':
      return { ...widget, value: share(widget.value, factor), trend: widget.trend.map((v) => share(v, factor)) };
    case 'kpi-simple':
      return widget.unit === 'percent'
        ? { ...widget, value: clampPct(widget.value + CHANNEL_LEVEL[f.channel]) }
        : { ...widget, value: share(widget.value, factor) };
    case 'ranked-list':
      return { ...widget, items: widget.items.map((it) => ({ ...it, total: share(it.total, factor * jitter(it.label + f.channel)) })) };
    case 'agents-table':
      return { ...widget, rows: widget.rows.map((row) => filterRow(row, factor, time, f.channel)) };
    case 'group-panel':
      return filterGroups(widget, factor, time, CHANNEL_LEVEL[f.channel]);
    default:
      return widget;
  }
}

function filterRow(row: AgentRow, factor: number, time: number, channel: DashboardChannel): AgentRow {
  const k = factor * (channel === 'all' ? 1 : jitter(row.name + channel));
  const conversations = share(row.conversations, k);
  const attended = Math.min(conversations, share(row.attended, k));
  return {
    ...row,
    conversations,
    attended,
    rejected: Math.min(conversations - attended, share(row.rejected, k)),
    transferred: share(row.transferred, k),
    avgSeconds: row.avgSeconds * time * (channel === 'all' ? 1 : jitter(row.name)),
  };
}

function filterGroups(w: GroupPanelWidget, factor: number, time: number, level: number): GroupPanelWidget {
  const total = share(w.total, factor);
  const attended = Math.min(total, share(w.attended, factor));
  return {
    ...w,
    onHold: share(w.onHold, factor),
    inProgress: share(w.inProgress, factor),
    total,
    attended,
    notAttended: total - attended,
    abandoned: share(w.abandoned, factor),
    overflowed: share(w.overflowed, factor),
    disconnected: share(w.disconnected, factor),
    avgTalkSeconds: w.avgTalkSeconds * time,
    avgPostSeconds: w.avgPostSeconds * time,
    avgWaitSeconds: w.avgWaitSeconds * time,
    avgAbandonSeconds: w.avgAbandonSeconds * time,
    serviceLevel: clampPct(w.serviceLevel + level),
    attentionLevel: clampPct(w.attentionLevel + level),
  };
}
