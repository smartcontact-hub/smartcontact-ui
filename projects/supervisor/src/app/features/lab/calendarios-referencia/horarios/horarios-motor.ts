/**
 * Motor del prototipo «Horarios y calendarios»: horarios reutilizables (franjas con color) que el calendario asigna a
 * su semana habitual, a periodos especiales y a días especiales (anuales o de una fecha). Orden de aplicación: día
 * especial → periodo especial → semana habitual. Los turnos nocturnos (fin > 24:00) continúan al día siguiente salvo
 * que una regla corte en las 00:00. Port literal del HTML original (fechas en hora local).
 */
import type { LabelColor } from '@smartcontact-hub/components';

export type Franja = [number, number];

export interface Horario {
  id: string;
  name: string;
  color: LabelColor;
  /** En minutos; un fin mayor que 1440 sigue al día siguiente. */
  slots: Franja[];
}
export interface Regla {
  id: string;
  name: string;
  from: string;
  to: string;
  annual: boolean;
  ids: string[];
  /** Solo en periodos: los días (0 = lunes) con atención dentro del periodo. */
  days: number[];
}
export interface Calendario {
  id: string;
  name: string;
  zone: string;
  /** Por cada día (0 = lunes), los horarios que empiezan ese día. */
  week: string[][];
  periods: Regla[];
  specials: Regla[];
}
export interface Db {
  schedules: Horario[];
  calendars: Calendario[];
}

export interface Origen {
  ids: string[];
  source: string;
  type: 'Día especial' | 'Periodo especial' | 'Semana habitual';
  exception?: Regla;
  periodId?: string;
}
export interface Segmento {
  id: string;
  a: number;
  b: number;
  carry: boolean;
}
export interface Efectivo extends Origen {
  segments: Segmento[];
  union: Franja[];
}

export const fecha = (s: string): Date => new Date(s + 'T12:00:00');
export const clave = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const sumar = (s: string, n: number): string => {
  const d = fecha(s);
  d.setDate(d.getDate() + n);
  return clave(d);
};
/** Lunes = 0 … domingo = 6. */
export const idx = (s: string): number => (fecha(s).getDay() + 6) % 7;

function match(e: Regla, s: string): boolean {
  return e.annual ? s.slice(5) === e.from.slice(5) : s >= e.from && s <= e.to;
}

export function spec(c: Calendario, s: string): Origen {
  const e = c.specials.find((x) => match(x, s));
  if (e) return { ids: e.ids, source: e.name, type: 'Día especial', exception: e };
  const p = c.periods.find((x) => s >= x.from && s <= x.to);
  if (p) return { ids: p.days.includes(idx(s)) ? p.ids : [], source: p.name, type: 'Periodo especial', periodId: p.id };
  return { ids: c.week[idx(s)], source: 'Semana habitual', type: 'Semana habitual' };
}

export function effective(c: Calendario, schedules: Horario[], s: string): Efectivo {
  const sch = (id: string) => schedules.find((x) => x.id === id);
  const r = spec(c, s);
  let out: Segmento[] = [];
  for (const id of r.ids) for (const [a, b] of sch(id)?.slots ?? []) out.push({ id, a, b: Math.min(1440, b), carry: false });
  const prev = spec(c, sumar(s, -1));
  if (!r.exception && !prev.exception && r.periodId === prev.periodId && (!r.periodId || r.ids.length)) {
    for (const id of prev.ids) for (const [, b] of sch(id)?.slots ?? []) if (b > 1440) out.push({ id, a: 0, b: b - 1440, carry: true });
  }
  out = out.filter((x) => x.b > x.a).sort((a, b) => a.a - b.a);
  const union: Franja[] = [];
  for (const x of out) {
    const last = union[union.length - 1];
    if (last && x.a <= last[1]) last[1] = Math.max(last[1], x.b);
    else union.push([x.a, x.b]);
  }
  return { ...r, segments: out, union, ids: [...new Set(out.map((x) => x.id))] };
}

export function overlap(a: Regla, b: Regla): boolean {
  if (a.annual || b.annual) {
    const annual = a.annual ? a : b;
    const other = a.annual ? b : a;
    if (other.annual) return annual.from.slice(5) === other.from.slice(5);
    for (let y = fecha(other.from).getFullYear(); y <= fecha(other.to).getFullYear(); y++) {
      const s = y + '-' + annual.from.slice(5);
      if (clave(fecha(s)) === s && s >= other.from && s <= other.to) return true;
    }
    return false;
  }
  return a.from <= b.to && a.to >= b.from;
}

/** Los datos de ejemplo del prototipo. */
export function inicial(): Db {
  return {
    schedules: [
      { id: 'g', name: 'Jornada partida', color: 'blue', slots: [[540, 840], [960, 1080]] },
      { id: 'v', name: 'Intensivo', color: 'teal', slots: [[480, 900]] },
      { id: 'm', name: 'Mañana', color: 'green', slots: [[480, 840]] },
      { id: 't', name: 'Tarde', color: 'purple', slots: [[780, 1200]] },
      { id: 'n', name: 'Guardia nocturna', color: 'orange', slots: [[1320, 1800]] },
    ],
    calendars: [
      {
        id: 'c1', name: 'Atención al cliente', zone: 'Europe/Madrid',
        week: [['g'], ['g'], ['g'], ['g'], ['v'], [], []],
        periods: [{ id: 'p1', name: 'Jornada de verano', from: '2026-07-01', to: '2026-08-31', annual: false, days: [0, 1, 2, 3, 4], ids: ['v'] }],
        specials: [
          { id: 'e1', name: 'Navidad · ejemplo', from: '2026-12-25', to: '2026-12-25', annual: true, ids: [], days: [] },
          { id: 'e2', name: 'Jornada reducida', from: '2026-12-24', to: '2026-12-24', annual: false, ids: ['m'], days: [] },
        ],
      },
      { id: 'c2', name: 'Soporte ampliado', zone: 'Europe/Madrid', week: Array.from({ length: 7 }, (_, i) => (i < 5 ? ['m', 't'] : [])), periods: [], specials: [] },
      { id: 'c3', name: 'Guardias técnicas', zone: 'Europe/Madrid', week: Array.from({ length: 7 }, () => ['n']), periods: [], specials: [] },
    ],
  };
}
