/**
 * Lo que comparten los tres prototipos de Calendarios del Lab: nombres de días y meses, el formato de horas y fechas,
 * la paleta y la persistencia en el navegador. Cada prototipo conserva su propio modelo de datos tal cual llegó; aquí
 * solo vive lo que en los tres HTML era la misma línea repetida.
 */
import type { LabelColor } from '@smartcontact-hub/components';

export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
export const DIAS_LETRA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

export const ZONAS = ['Europe/Madrid', 'Atlantic/Canary', 'Europe/Lisbon', 'America/Mexico_City'] as const;

/** Los colores del prototipo, llevados a la paleta de etiquetas del DS (sus tokens `--sc-label-*`). */
export const PALETA: readonly LabelColor[] = ['blue', 'teal', 'purple', 'orange', 'red'];
export const NOMBRE_COLOR: Record<LabelColor, string> = {
  gray: 'Gris', red: 'Rosa', orange: 'Naranja', amber: 'Ámbar', brown: 'Marrón',
  green: 'Verde claro', teal: 'Verde', blue: 'Azul', purple: 'Morado',
};

/** `--c` (la marca) y `--wash` (el fondo suave) de un color de la paleta, como en el prototipo. */
export function pintura(color: LabelColor): string {
  return `--c: var(--sc-label-${color}-dot); --wash: var(--sc-label-${color}-bg)`;
}

export const uid = (): string => Math.random().toString(36).slice(2, 10);
export const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** Minutos desde las 00:00 a «hh:mm». */
export const hhmm = (n: number): string =>
  String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
/** «hh:mm» a minutos. */
export const minutos = (s: string): number => +s.split(':')[0] * 60 + +s.split(':')[1];
/** «hh:mm» válido de 00:00 a 23:59; el fin admite además 24:00. */
export const HORA = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function horasTexto(n: number): string {
  return Math.floor(n / 60) + ' h' + (n % 60 ? ' ' + (n % 60) + ' min' : '');
}

/** Fecha ISO (aaaa-mm-dd) a `Date` local a mediodía, para `sc-datepicker`. */
export function isoADate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/** `Date` de `sc-datepicker` a fecha ISO. */
export function dateAIso(d: Date | null): string {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Lee un JSON del navegador; si no está o no se puede leer, devuelve `null`. */
export function leer<T>(clave: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(clave) ?? 'null') as T | null;
  } catch {
    return null;
  }
}

/** Guarda un JSON en el navegador. Devuelve `false` si el navegador no lo deja. */
export function guardar(clave: string, valor: unknown): boolean {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}
