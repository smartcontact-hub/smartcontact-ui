/** Tipos de las tipificaciones (la lógica vive en `tipificaciones.core.mjs`). */

export type TipificacionNiveles = 1 | 2 | 3;

/** Una opción del árbol, con sus hijas del nivel de abajo. */
export interface TipificacionOpcion {
  readonly id: string;
  readonly label: string;
  readonly children: readonly TipificacionOpcion[];
}

export interface Tipificacion {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  /** Los niveles del árbol: todas las ramas llegan a este. */
  readonly levels: TipificacionNiveles;
  readonly options: readonly TipificacionOpcion[];
}

export const NIVELES_MAXIMOS: number;
export const TOPE_DE_IMPORTACION: number;

export function nivelesDe(t: Pick<Tipificacion, 'levels'>): number;
export function opcionesPorNivel(opciones: readonly TipificacionOpcion[], niveles: number): number[];
export function profundidad(opciones: readonly TipificacionOpcion[]): TipificacionNiveles;
export function ramasIncompletas(opciones: readonly TipificacionOpcion[], niveles: number): string[][];
export function recortarANiveles(
  opciones: readonly TipificacionOpcion[],
  niveles: number,
): { opciones: TipificacionOpcion[]; quitadas: number };
export function hermanasRepetidas(opciones: readonly TipificacionOpcion[]): string[][];
export function totalDeOpciones(opciones: readonly TipificacionOpcion[]): number;
export function nuevoIdDeOpcion(opciones: readonly TipificacionOpcion[]): string;

export function plantillaCsv(cabecera: readonly string[]): string;

/** Lo que dice un CSV de tipificaciones antes de crearlas. */
export interface ImportacionDeTipificaciones {
  readonly nuevas: readonly Omit<Tipificacion, 'id'>[];
  readonly errores: readonly {
    readonly linea: number;
    readonly motivo: 'nombre' | 'hueco' | 'vacia';
  }[];
  /** Las que ya existían con ese nombre. */
  readonly repetidas: number;
  /** Las que pasarían del tope. */
  readonly sobran: number;
}
export function parsearTipificacionesCsv(
  texto: string | null | undefined,
  existentes: readonly { readonly name: string }[],
  tope?: number,
): ImportacionDeTipificaciones;
export function filasParaDescargar(tipificaciones: readonly Tipificacion[]): string[][];
