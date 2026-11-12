/** Tipos de los horarios de atención (la lógica vive en `horarios.core.mjs`). */

/** `[inicio, fin]` en minutos desde las 00:00. Un fin menor o igual que el inicio acaba al día siguiente. */
export type Franja = readonly [number, number];
/** Las franjas de cada día, de lunes (0) a domingo (6). Un día sin franjas está cerrado. */
export type Semana = readonly (readonly Franja[])[];

export type ColorDePeriodo = 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'amber' | 'red' | 'brown';

/** Una temporada con su propia semana. `from` y `to` son `MM-DD`; `year: null` se repite cada año. */
export interface Periodo {
  readonly id: number;
  readonly name: string;
  readonly color: ColorDePeriodo;
  readonly from: string;
  readonly to: string;
  readonly year: number | null;
  readonly week: Semana;
}

/** Un día con sus propias horas; sin franjas, cerrado. `yearly` lo repite cada año en ese día y mes. */
export interface FechaEspecial {
  readonly id: number;
  readonly name: string;
  readonly date: string;
  readonly yearly: boolean;
  readonly slots: readonly Franja[];
}

export interface Horario {
  readonly id: number;
  readonly name: string;
  readonly timezone: string;
  readonly description: string;
  readonly status: string;
  readonly week: Semana;
  readonly periods: readonly Periodo[];
  readonly specials: readonly FechaEspecial[];
  /** Los calendarios de festivos que aplica. */
  readonly holidayCalendarIds: readonly number[];
}

/** Un día cerrado de un calendario de festivos. */
export interface Festivo {
  readonly id: number;
  readonly name: string;
  readonly date: string;
  readonly yearly: boolean;
}

/** Una lista de días cerrados que varios horarios pueden aplicar. */
export interface CalendarioDeFestivos {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly status: string;
  readonly days: readonly Festivo[];
}

type Reglas = Pick<Horario, 'week' | 'periods' | 'specials' | 'holidayCalendarIds'>;

export type TipoDeDueno = 'especial' | 'festivo' | 'periodo' | 'semana';

export interface Dueno {
  readonly tipo: TipoDeDueno;
  readonly especial: FechaEspecial | null;
  readonly festivo: Festivo | null;
  readonly calendario: CalendarioDeFestivos | null;
  readonly periodo: Periodo | null;
  readonly franjas: readonly Franja[];
}

export interface DiaResuelto extends Dueno {
  readonly fecha: string;
  /** Los tramos abiertos dentro del día, de 0 a 1440, unidos y ordenados. */
  readonly tramos: readonly Franja[];
  /** Parte viene de una franja que empezó la víspera. */
  readonly arrastre: boolean;
  readonly minutosAbiertos: number;
}

export interface Momento {
  readonly fecha: string;
  readonly minutos: number;
}

export type CodigoDeFranjas = 'hora' | 'vacia' | 'solape' | 'noche';
export type CodigoDeSemana = CodigoDeFranjas | 'pisa_siguiente';

export type FaltaDePeriodo =
  | { readonly codigo: 'nombre' | 'fechas' | 'cruza_anio' }
  | { readonly codigo: 'solape'; readonly con: Periodo }
  | { readonly codigo: 'semana'; readonly dia: number; readonly detalle: CodigoDeSemana };

export const MINUTOS_DEL_DIA: number;
export const COLORES_DE_PERIODO: readonly ColorDePeriodo[];

export function minutosDe(texto: string | null | undefined): number | null;
export function horaDe(minutos: number): string;
export function cruzaMedianoche(franja: Franja): boolean;
export function textoDeFranja(franja: Franja): string;

export function fechaValida(iso: unknown): iso is string;
export function sumarDias(iso: string, n: number): string;
export function diaDeLaSemana(iso: string): number;
export function fechasEntre(desde: string, hasta: string): string[];
export function rejillaDelAnio(anio: number): { mes: number; huecos: number; fechas: string[] }[];
export function ahoraEn(zona: string, cuando?: Date): Momento;

export function periodoCubre(periodo: Pick<Periodo, 'from' | 'to' | 'year'>, iso: string): boolean;
export function duenoDe(horario: Reglas, iso: string, calendarios?: readonly CalendarioDeFestivos[]): Dueno;
export function resolverDia(horario: Reglas, iso: string, calendarios?: readonly CalendarioDeFestivos[]): DiaResuelto;
export function abiertoEn(horario: Reglas, iso: string, minutos: number, calendarios?: readonly CalendarioDeFestivos[]): boolean;
export function estadoEn(
  horario: Reglas,
  iso: string,
  minutos: number,
  calendarios?: readonly CalendarioDeFestivos[],
): { abierto: boolean; cambia: Momento | null };

export function gruposDeLaSemana(semana: Semana): { desde: number; hasta: number; franjas: readonly Franja[] }[];
export function resumenDeLaSemana(semana: Semana, dias: readonly string[], cerrado: string, siempre: string): string;
export function coberturaAnual(
  horario: Reglas,
  anio: number,
  calendarios?: readonly CalendarioDeFestivos[],
): { total: number; semana: number; especiales: number; festivos: number; periodos: { id: number; dias: number }[] };

export function validarFranjas(franjas: readonly Franja[]): CodigoDeFranjas | null;
export function validarSemana(semana: Semana): { dia: number; codigo: CodigoDeSemana } | null;
export function periodosSeSolapan(a: Pick<Periodo, 'from' | 'to' | 'year'>, b: Pick<Periodo, 'from' | 'to' | 'year'>): boolean;
export function validarPeriodo(horario: Pick<Horario, 'periods'>, periodo: Periodo): FaltaDePeriodo | null;
export function diaRepetido<T extends { id: number; date: string; yearly: boolean }>(dias: readonly T[], dia: T): T | null;

export function semanaDeTexto(texto: string | null | undefined): Franja[][];
export function normalizarHorario(crudo: Record<string, unknown>): Horario;
export function siguienteId(lista: readonly { id: number }[]): number;
