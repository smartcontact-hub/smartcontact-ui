/**
 * Motor del prototipo «Calendarios y periodos» (v2): a quién pertenece cada fecha y qué horario semanal aplica.
 * Port literal del motor del HTML original; toda la aritmética de fechas es UTC.
 */
import type { LabelColor } from '@smartcontact-hub/components';

export type Franja = [number, number];

export interface Horario {
  id: string;
  name: string;
  /** Siete filas, de lunes a domingo; cada una con sus franjas en minutos. */
  week: Franja[][];
}
export interface Periodo {
  id: string;
  name: string;
  from: string;
  to: string;
  scheduleId: string;
  color: LabelColor;
}
export interface DiaEspecial {
  id: string;
  name: string;
  date: string;
  scheduleId: string | null;
}
export interface Calendario {
  id: string;
  name: string;
  zone: string;
  default: { name: string; scheduleId: string; color: LabelColor };
  periods: Periodo[];
  specials: DiaEspecial[];
}
export interface Db {
  schedules: Horario[];
  calendars: Calendario[];
}

export interface Resolucion {
  date: string;
  ownerType: 'special' | 'period' | 'default';
  ownerId: string;
  special: DiaEspecial | null;
  period: Periodo | null;
  scheduleId: string | null;
  schedule: Horario | null;
  slots: Franja[];
  openMinutes: number;
}
export interface Tramo {
  from: string;
  to: string;
  days: number;
}
export interface FilaCobertura {
  id: string;
  type: 'default' | 'period';
  name: string;
  scheduleId: string | null;
  period: Periodo | null;
  dates: string[];
  ranges: Tramo[];
  effectiveDays: number;
  nominalDays: number;
  excludedSpecialDays: number;
}
export interface Cobertura {
  year: number;
  totalDays: number;
  specialDays: number;
  periodDays: number;
  rows: FilaCobertura[];
}
export interface Validacion {
  ok: boolean;
  error: string;
}

const DAY = 86400000;
const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
const fail = (error: string): Validacion => ({ ok: false, error });
const pass = (): Validacion => ({ ok: true, error: '' });

export function validDate(value: string): boolean {
  if (typeof value !== 'string' || !isoPattern.test(value)) return false;
  const d = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function timestamp(value: string): number {
  if (!validDate(value)) throw new TypeError('Fecha ISO no válida: ' + value);
  return Date.parse(value + 'T00:00:00.000Z');
}

export function addDays(value: string, count: number): string {
  return dateKey(new Date(timestamp(value) + count * DAY));
}

export function daysInYear(year: number): number {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
}

/** Lunes = 0 … domingo = 6. */
export function dayIndex(value: string): number {
  return (new Date(timestamp(value)).getUTCDay() + 6) % 7;
}

export function rangeDates(from: string, to: string): string[] {
  const start = timestamp(from);
  const end = timestamp(to);
  const dates: string[] = [];
  for (let t = start; t <= end; t += DAY) dates.push(dateKey(new Date(t)));
  return dates;
}

export function compressDates(dates: string[]): Tramo[] {
  const sorted = [...new Set(dates)].filter(validDate).sort();
  const ranges: Tramo[] = [];
  for (const date of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && addDays(last.to, 1) === date) {
      last.to = date;
      last.days += 1;
    } else ranges.push({ from: date, to: date, days: 1 });
  }
  return ranges;
}

function owner(calendar: Calendario, value: string): Omit<Resolucion, 'date' | 'schedule' | 'slots' | 'openMinutes'> {
  const special = calendar.specials.find((item) => item.date === value);
  if (special) {
    return { ownerType: 'special', ownerId: special.id, special, period: null, scheduleId: special.scheduleId || null };
  }
  const period = calendar.periods.find((item) => item.from <= value && value <= item.to);
  if (period) return { ownerType: 'period', ownerId: period.id, special: null, period, scheduleId: period.scheduleId || null };
  return { ownerType: 'default', ownerId: 'default', special: null, period: null, scheduleId: calendar.default.scheduleId || null };
}

export function resolveDay(calendar: Calendario, value: string, schedules: Horario[]): Resolucion {
  const selected = owner(calendar, value);
  const schedule = schedules.find((item) => item.id === selected.scheduleId) ?? null;
  const slots = (schedule?.week[dayIndex(value)] ?? []).map((slot): Franja => [slot[0], slot[1]]);
  return { date: value, ...selected, schedule, slots, openMinutes: slots.reduce((total, slot) => total + slot[1] - slot[0], 0) };
}

export function coverage(calendar: Calendario, year: number): Cobertura {
  const totalDays = daysInYear(year);
  const ys = String(year).padStart(4, '0');
  const from = ys + '-01-01';
  const to = ys + '-12-31';
  const periods = calendar.periods.filter((item) => item.from <= to && item.to >= from);
  const rows: FilaCobertura[] = [
    {
      id: 'default', type: 'default', name: calendar.default.name || 'Periodo por defecto',
      scheduleId: calendar.default.scheduleId || null, period: null,
      dates: [], ranges: [], effectiveDays: 0, nominalDays: totalDays, excludedSpecialDays: 0,
    },
    ...periods.map((period): FilaCobertura => ({
      id: period.id, type: 'period', name: period.name, scheduleId: period.scheduleId || null, period,
      dates: [], ranges: [], effectiveDays: 0,
      nominalDays: rangeDates(period.from < from ? from : period.from, period.to > to ? to : period.to).length,
      excludedSpecialDays: 0,
    })),
  ];
  const byId = new Map(rows.map((row) => [row.id, row]));
  let specialDays = 0;
  for (const value of rangeDates(from, to)) {
    const selected = owner(calendar, value);
    if (selected.ownerType === 'special') {
      specialDays += 1;
      const underlying = periods.find((item) => item.from <= value && value <= item.to);
      byId.get(underlying?.id ?? 'default')!.excludedSpecialDays += 1;
    } else byId.get(selected.ownerId)!.dates.push(value);
  }
  for (const row of rows) {
    row.ranges = compressDates(row.dates);
    row.effectiveDays = row.dates.length;
  }
  return { year, totalDays, specialDays, periodDays: totalDays - specialDays, rows };
}

export function validatePeriod(calendar: Calendario, period: Periodo, schedules: Horario[]): Validacion {
  if (!String(period.name || '').trim()) return fail('Introduce un nombre para el periodo.');
  if (!validDate(period.from) || !validDate(period.to)) return fail('Selecciona fechas válidas para el periodo.');
  if (period.from > period.to) return fail('La fecha final debe ser igual o posterior a la inicial.');
  if (period.from.slice(0, 4) !== period.to.slice(0, 4)) return fail('El periodo debe quedar dentro de un mismo año.');
  if (!period.scheduleId) return fail('Selecciona un horario semanal para el periodo.');
  if (!schedules.some((item) => item.id === period.scheduleId)) return fail('El horario seleccionado ya no existe.');
  const collision = calendar.periods.find((item) => item.id !== period.id && item.from <= period.to && period.from <= item.to);
  if (collision) {
    return fail(`El periodo coincide con «${collision.name}» (${collision.from} – ${collision.to}). Ajusta las fechas para que no se solapen.`);
  }
  return pass();
}

export function validateSchedule(schedule: Horario): Validacion {
  if (!String(schedule.name || '').trim()) return fail('Introduce un nombre para el horario.');
  if (schedule.week.length !== 7) return fail('El horario debe incluir los siete días de la semana, de lunes a domingo.');
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  for (let day = 0; day < 7; day += 1) {
    const slots = schedule.week[day];
    for (const slot of slots) {
      if (!Number.isInteger(slot[0]) || !Number.isInteger(slot[1]) || slot[0] < 0 || slot[0] >= slot[1] || slot[1] > 1440) {
        return fail(dayNames[day] + ': usa franjas con inicio anterior al fin, entre 00:00 y 24:00.');
      }
    }
    const ordered = slots.map((slot) => [...slot]).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < ordered.length; i += 1) {
      if (ordered[i][0] < ordered[i - 1][1]) return fail(dayNames[day] + ': hay franjas que se solapan. Ajusta sus horas.');
    }
  }
  return pass();
}

/** Los datos de ejemplo del prototipo. */
export function inicial(): Db {
  return {
    schedules: [
      { id: 'h1', name: 'Horario habitual', week: [...Array.from({ length: 4 }, (): Franja[] => [[540, 840], [960, 1080]]), [[480, 900]], [], []] },
      { id: 'h2', name: 'Horario de verano', week: [...Array.from({ length: 5 }, (): Franja[] => [[480, 900]]), [], []] },
      { id: 'h3', name: 'Horario extraordinario', week: Array.from({ length: 7 }, (): Franja[] => [[600, 840]]) },
    ],
    calendars: [
      {
        id: 'c1', name: 'Atención al cliente', zone: 'Europe/Madrid',
        default: { name: 'Periodo general', scheduleId: 'h1', color: 'blue' },
        periods: [{ id: 'p1', name: 'Verano', from: '2026-07-01', to: '2026-08-31', scheduleId: 'h2', color: 'teal' }],
        specials: [
          { id: 'e1', name: 'Cierre extraordinario', date: '2026-08-14', scheduleId: null },
          { id: 'e2', name: 'Atención especial', date: '2026-12-24', scheduleId: 'h3' },
        ],
      },
      {
        id: 'c2', name: 'Solo periodo general', zone: 'Europe/Madrid',
        default: { name: 'Periodo general', scheduleId: 'h1', color: 'blue' }, periods: [], specials: [],
      },
    ],
  };
}
