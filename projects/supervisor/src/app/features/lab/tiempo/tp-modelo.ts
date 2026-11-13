import {
  type CalendarioDeFestivos,
  type ColorDePeriodo,
  diaDeLaSemana,
  type FechaEspecial,
  type Festivo,
  type Franja,
  type Horario,
  horaDe,
  type Periodo,
  periodoCubre,
  type Semana,
} from '@features/admin/repositories/state/horarios.core.mjs';

/**
 * LABORATORIO «Tiempo» premium: lo que las pantallas calculan y no es Angular. La lógica de verdad (de quién es un día,
 * qué está abierto) vive en `horarios.core.mjs`; aquí solo están los resúmenes y formatos que pinta esta versión.
 */

export type Reglas = Pick<Horario, 'week' | 'periods' | 'specials' | 'holidayCalendarIds'>;

export const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
export const NOMBRES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
export const CORTOS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'] as const;
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
export const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;

export const aFecha = (iso: string): Date => new Date(`${iso}T12:00:00`);
export const fmtDia = (iso: string): string => `${Number(iso.slice(8))} ${MESES_CORTOS[Number(iso.slice(5, 7)) - 1]}`;
export const fmtDiaAnio = (iso: string): string => `${fmtDia(iso)} ${iso.slice(0, 4)}`;
export const fmtLargo = (iso: string): string => `${NOMBRES[diaDeLaSemana(iso)]}, ${Number(iso.slice(8))} de ${MESES[Number(iso.slice(5, 7)) - 1]}`;
export const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Los días entre hoy y una fecha, en palabras: «hoy», «mañana», «en 12 días». */
export function faltan(hoy: string, iso: string): string {
  const n = Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / 86_400_000);
  if (n === 0) return 'hoy';
  if (n === 1) return 'mañana';
  if (n < 0) return `hace ${-n} días`;
  return `en ${n} días`;
}

/* ── Color ──────────────────────────────────────────────────────────────────────────────────────────────────────── */

export const colorDePeriodo = (c: ColorDePeriodo | string | null | undefined): string => `var(--tp-p-${c ?? 'blue'})`;

/** Los colores de los tramos de la semana: cada tramo con el suyo, el mismo en la línea de 24 h y en sus días. */
export const COLORES_DE_TRAMO = ['#5b5bd6', '#0fb5a6', '#e5366a', '#e08a00', '#3b82f6', '#8b5cf6', '#12b981'] as const;

/** Un color estable para un nombre: el de su avatar. */
export function colorDeNombre(nombre: string): string {
  const paleta = ['#5b5bd6', '#0fb5a6', '#e5366a', '#e08a00', '#3b82f6', '#8b5cf6', '#12b981', '#f97316'];
  let h = 0;
  for (const ch of nombre) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return paleta[h % paleta.length];
}

export function iniciales(nombre: string): string {
  const p = nombre.trim().split(/\s+/).filter((x) => /[\p{L}\d]/u.test(x));
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? (p[p.length - 1][0] ?? '') : (p[0]?.[1] ?? ''))).toUpperCase();
}

/* ── La semana en tramos ────────────────────────────────────────────────────────────────────────────────────────── */

/** Un tramo: unos días (lunes = 0) que comparten franjas. Así se edita la semana: sin «copiar a otro día». */
export interface Tramo {
  readonly dias: readonly number[];
  readonly franjas: readonly Franja[];
}

const claveDe = (franjas: readonly Franja[]): string => franjas.map((f) => f.join('-')).join(',');

export function tramosDe(semana: Semana): Tramo[] {
  const porClave = new Map<string, Tramo>();
  semana.forEach((franjas, dia) => {
    if (franjas.length === 0) return;
    const k = claveDe(franjas);
    const t = porClave.get(k);
    porClave.set(k, t ? { ...t, dias: [...t.dias, dia] } : { dias: [dia], franjas });
  });
  return [...porClave.values()];
}

export function semanaDe(tramos: readonly Tramo[]): Semana {
  const semana: Franja[][] = Array.from({ length: 7 }, () => []);
  for (const t of tramos) for (const d of t.dias) semana[d] = [...t.franjas];
  return semana;
}

/** Minutos que suma una franja (la que cruza la medianoche cuenta hasta su fin al día siguiente). */
export const minutosDe = (f: Franja): number => (f[1] > f[0] ? f[1] - f[0] : 1440 - f[0] + f[1]);
export const minutosDeSemana = (semana: Semana): number => semana.reduce((n, d) => n + d.reduce((m, f) => m + minutosDe(f), 0), 0);

/** «9 h», «7,5 h», «24 h». */
export function horas(minutos: number): string {
  const h = minutos / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1).replace('.', ',')} h`;
}

/** Un trozo pintable de un día de la semana habitual: lo suyo y lo que arrastra de la noche anterior. */
export interface Trozo {
  readonly desde: number;
  readonly hasta: number;
  readonly arrastre: boolean;
  readonly franja: Franja;
}

export function trozosDelDia(semana: Semana, dia: number): Trozo[] {
  const propios = (semana[dia] ?? []).map((f) => ({ desde: f[0], hasta: f[1] > f[0] ? f[1] : 1440, arrastre: false, franja: f }));
  const vispera = (semana[(dia + 6) % 7] ?? []).filter((f) => f[1] <= f[0] && f[1] > 0).map((f) => ({ desde: 0, hasta: f[1], arrastre: true, franja: f }));
  return [...vispera, ...propios];
}

export const textoDeFranja = (f: Franja): string => `${horaDe(f[0])}–${horaDe(f[1])}`;

/* ── El calor de un día: cuántas horas abre ─────────────────────────────────────────────────────────────────────── */

export function calor(minutos: number): 0 | 1 | 2 | 3 | 4 {
  if (minutos <= 0) return 0;
  if (minutos <= 360) return 1;
  if (minutos <= 600) return 2;
  if (minutos < 1440) return 3;
  return 4;
}

/* ── Por qué un día tiene sus horas: las cuatro capas, y cuál manda ─────────────────────────────────────────────── */

export type TipoDeCapa = 'especial' | 'festivo' | 'periodo' | 'semana';
export type EstadoDeCapa = 'manda' | 'tapada' | 'nada';

export interface Capa {
  readonly tipo: TipoDeCapa;
  readonly titulo: string;
  readonly detalle: string;
  readonly estado: EstadoDeCapa;
  readonly color: string | null;
}

const entradaDe = <T extends { date: string; yearly: boolean }>(dias: readonly T[], iso: string): T | null =>
  dias.find((d) => !d.yearly && d.date === iso) ?? dias.find((d) => d.yearly && d.date.slice(5) === iso.slice(5)) ?? null;

const horasDe = (franjas: readonly Franja[]): string => (franjas.length ? franjas.map(textoDeFranja).join(', ') : 'Cerrado');

/**
 * Las cuatro capas de una fecha en el orden en que mandan (día especial, festivo, periodo, semana) y lo que diría cada
 * una. La primera que tiene algo manda; las de debajo que también tenían algo quedan tapadas.
 */
export function capasDe(reglas: Reglas, iso: string, calendarios: readonly CalendarioDeFestivos[]): Capa[] {
  const especial: FechaEspecial | null = entradaDe(reglas.specials, iso);
  let festivo: { f: Festivo; c: CalendarioDeFestivos } | null = null;
  for (const c of calendarios.filter((x) => reglas.holidayCalendarIds.includes(x.id) && x.status !== 'inactive')) {
    const f = entradaDe(c.days, iso);
    if (f) {
      festivo = { f, c };
      break;
    }
  }
  const periodo: Periodo | null = reglas.periods.find((p) => periodoCubre(p, iso)) ?? null;
  const dia = diaDeLaSemana(iso);
  const crudas: { tipo: TipoDeCapa; hay: boolean; titulo: string; detalle: string; color: string | null }[] = [
    { tipo: 'especial', hay: !!especial, titulo: especial ? especial.name : 'Día especial', detalle: especial ? horasDe(especial.slots) : 'Ninguno este día', color: null },
    { tipo: 'festivo', hay: !!festivo, titulo: festivo ? festivo.f.name : 'Festivo', detalle: festivo ? `Cerrado, lista ${festivo.c.name}` : 'Ninguna lista lo cierra', color: null },
    {
      tipo: 'periodo',
      hay: !!periodo,
      titulo: periodo ? periodo.name : 'Periodo',
      detalle: periodo ? horasDe(periodo.week[dia] ?? []) : 'Fuera de temporada',
      color: periodo ? colorDePeriodo(periodo.color) : null,
    },
    { tipo: 'semana', hay: true, titulo: `Semana habitual, ${NOMBRES[dia]}`, detalle: horasDe(reglas.week[dia] ?? []), color: null },
  ];
  const ganadora = crudas.findIndex((x) => x.hay);
  return crudas.map((x, i) => ({
    tipo: x.tipo,
    titulo: x.titulo,
    detalle: x.detalle,
    color: x.color,
    estado: i === ganadora ? 'manda' : x.hay ? 'tapada' : 'nada',
  }));
}

/* ── Excepciones: dónde caen en el año ──────────────────────────────────────────────────────────────────────────── */

/** Un periodo como trozos de una barra de 12 meses (de 0 a 1), para dibujar en qué parte del año cae. */
export function trozosDelAnio(p: Pick<Periodo, 'from' | 'to'>): { desde: number; hasta: number }[] {
  const pos = (md: string): number => {
    const [m, d] = md.split('-').map(Number);
    return (m - 1 + (d - 1) / 31) / 12;
  };
  const a = pos(p.from);
  const b = pos(p.to) + 1 / 12 / 31;
  return p.from <= p.to ? [{ desde: a, hasta: b }] : [{ desde: a, hasta: 1 }, { desde: 0, hasta: b }];
}
