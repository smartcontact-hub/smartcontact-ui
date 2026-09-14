import type { AgentPresence, DashboardWidget, WidgetFilter } from './dashboard.types';
import { widgetType } from './widget-catalog';

const ALL: WidgetFilter = { channel: 'all', direction: 'all' };

/** Números estables a partir de una semilla: el mismo widget sale igual en la vista previa y al crearlo. */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export interface BuildWidgetOptions {
  readonly id: string;
  readonly entities: readonly string[];
  readonly title?: string | null;
  readonly filter?: WidgetFilter | null;
}

/**
 * Crea un widget de un tipo del catálogo con datos de demostración proporcionados a lo que vigila:
 * más agentes o más grupos, cifras más altas. Lo usan el asistente (vista previa y crear) y los
 * monitores de demostración.
 */
export function buildWidget(typeId: string, opts: BuildWidgetOptions): DashboardWidget {
  const def = widgetType(typeId);
  const rnd = seeded(`${typeId}|${opts.entities.join(',')}`);
  const n = Math.max(1, opts.entities.length);
  const int = (min: number, max: number) => Math.round(min + rnd() * (max - min));
  const base = {
    id: opts.id,
    type: typeId,
    title: opts.title ?? null,
    entities: opts.entities,
    filter: def.filterable ? (opts.filter ?? ALL) : null,
  };

  switch (def.kind) {
    case 'kpi-trend': {
      const scale = typeId === 'groups-on-hold' ? 1 : typeId === 'services-total-conv' ? 12 : 4;
      const start = int(1, 4) * scale * Math.ceil(n / 2);
      let v = start;
      const trend = Array.from({ length: 12 }, () => (v = Math.max(0, v + int(-2, 3) * Math.ceil(scale / 2))));
      return { ...base, kind: 'kpi-trend', value: trend[trend.length - 1], trend };
    }
    case 'kpi-simple':
      return def.unit === 'percent'
        ? { ...base, kind: 'kpi-simple', value: int(58, 96), unit: 'percent' }
        : { ...base, kind: 'kpi-simple', value: int(4, 30) * n };
    case 'agents-state': {
      const total = int(Math.max(3, n - 2), Math.max(4, n));
      const presence: AgentPresence = def.presence ?? 'available';
      return { ...base, kind: 'agents-state', presence, total, value: int(1, Math.max(1, Math.round(total * 0.6))) };
    }
    case 'agents-table': {
      const presences: AgentPresence[] = ['available', 'available', 'paused', 'available', 'offline'];
      return {
        ...base,
        kind: 'agents-table',
        rows: opts.entities.map((name, i) => {
          const conversations = int(3, 22);
          const attended = conversations - int(0, 1);
          return {
            name,
            presence: presences[i % presences.length],
            conversations,
            attended,
            rejected: conversations - attended,
            transferred: int(0, 3),
            avgSeconds: int(150, 320),
          };
        }),
      };
    }
    case 'group-panel': {
      const connected = int(3, 4) * n;
      const total = int(20, 34) * n;
      const attended = total - int(1, 3) * n;
      return {
        ...base,
        kind: 'group-panel',
        onHold: int(0, 4),
        inProgress: int(2, 5) * n,
        available: int(1, Math.max(1, Math.round(connected * 0.6))),
        connected,
        total,
        attended,
        notAttended: total - attended,
        abandoned: int(1, 2) * n,
        overflowed: int(0, 1) * n,
        disconnected: int(0, 1) * n,
        avgTalkSeconds: int(170, 260),
        avgPostSeconds: int(25, 50),
        avgWaitSeconds: int(15, 45),
        avgAbandonSeconds: int(40, 90),
        serviceLevel: int(72, 94),
        attentionLevel: int(80, 97),
      };
    }
    case 'ranked-list':
      return { ...base, kind: 'ranked-list', items: opts.entities.map((label) => ({ label, total: int(3, 70) })) };
  }
}
