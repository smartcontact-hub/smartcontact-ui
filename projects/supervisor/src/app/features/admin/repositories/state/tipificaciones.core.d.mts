/** Tipos de las tipificaciones (la lógica vive en `tipificaciones.core.mjs`). */

/** Los canales por los que se usa en un grupo: las familias de la ficha de grupo (DD-147). */
export type TipificacionCanal = 'phone' | 'chat' | 'email';
export type TipificacionDireccion = 'inbound' | 'outbound';
export type TipificacionNiveles = 1 | 2 | 3;

/** Una opción del árbol, con sus hijas del nivel de abajo. */
export interface TipificacionOpcion {
  readonly id: string;
  readonly label: string;
  readonly children: readonly TipificacionOpcion[];
}

/** Un grupo que usa la tipificación, y por qué canales. */
export interface TipificacionGrupo {
  readonly groupId: number;
  readonly channels: readonly TipificacionCanal[];
}

export interface Tipificacion {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  /** En qué conversaciones se pide: entrantes, salientes o las dos. */
  readonly inbound: boolean;
  readonly outbound: boolean;
  /** Si pide elegir del árbol. Sin ella, solo el comentario. */
  readonly categorization: boolean;
  /** Si pide un comentario. */
  readonly comments: boolean;
  /** Los niveles del árbol: todas las ramas llegan a este. */
  readonly levels: TipificacionNiveles;
  readonly options: readonly TipificacionOpcion[];
  readonly groups: readonly TipificacionGrupo[];
}

export const NIVELES_MAXIMOS: number;
export const TOPE_DE_IMPORTACION: number;

export function nivelesDe(t: Pick<Tipificacion, 'categorization' | 'levels'>): number;
export function opcionesPorNivel(opciones: readonly TipificacionOpcion[], niveles: number): number[];
export function ramasIncompletas(opciones: readonly TipificacionOpcion[], niveles: number): string[][];
export function recortarANiveles(
  opciones: readonly TipificacionOpcion[],
  niveles: number,
): { opciones: TipificacionOpcion[]; quitadas: number };
export function hermanasRepetidas(opciones: readonly TipificacionOpcion[]): string[][];
export function totalDeOpciones(opciones: readonly TipificacionOpcion[]): number;
export function nuevoIdDeOpcion(opciones: readonly TipificacionOpcion[]): string;

export function direccionesDe(t: Pick<Tipificacion, 'inbound' | 'outbound'>): TipificacionDireccion[];

/** Otra tipificación del mismo grupo que cubre la misma dirección por el mismo canal. */
export interface ChoqueDeTipificacion {
  readonly groupId: number;
  readonly otherId: number;
  readonly otherName: string;
  readonly direction: TipificacionDireccion;
  readonly channel: TipificacionCanal;
}
export function choquesDe(
  tipificacion: Pick<Tipificacion, 'id' | 'inbound' | 'outbound' | 'groups'>,
  todas: readonly Tipificacion[],
): ChoqueDeTipificacion[];
export function tipificacionesDeGrupo(
  todas: readonly Tipificacion[],
  groupId: number,
): { tipificacion: Tipificacion; channels: readonly TipificacionCanal[] }[];
export function asignarAGrupo(
  todas: readonly Tipificacion[],
  ids: Iterable<number>,
  groupId: number,
  familias: readonly TipificacionCanal[],
): Tipificacion[];
export function gruposAlDia<T extends Pick<Tipificacion, 'groups'>>(
  tipificacion: T,
  familiasDe: (groupId: number) => readonly TipificacionCanal[] | null,
): T;

export function plantillaCsv(cabecera: readonly string[]): string;

/** Lo que dice un CSV de tipificaciones antes de crearlas. */
export interface ImportacionDeTipificaciones {
  readonly nuevas: readonly Omit<Tipificacion, 'id'>[];
  readonly errores: readonly {
    readonly linea: number;
    readonly motivo: 'nombre' | 'direccion' | 'comentarios' | 'hueco' | 'nivel' | 'vacia';
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
export function filasParaDescargar(
  tipificaciones: readonly Tipificacion[],
  textos: { inbound: string; outbound: string; both: string; yes: string; no: string },
): string[][];
