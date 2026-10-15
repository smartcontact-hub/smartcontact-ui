/**
 * Lightweight group reference shape consumed by `<sc-group-popover>`.
 *
 * El tipo vive en SCDS para que el componente sea self-contained — el
 * consumer (AED, Memory) provee el array tipado sin que SCDS dependa de
 * un módulo de feature concreta.
 */
export interface GroupRef {
  readonly id: number;
  readonly name: string;
  readonly active: boolean;
}

/**
 * Qué pinta la celda. `count` (por defecto): siempre la cifra, que enseña los nombres al pasar. `adaptive`: según
 * cuántos haya (revisión de producto del 2026-10-15): ninguno, «—» en gris suave y «Sin grupos» para el lector; uno,
 * su nombre, con «…» y su globo si no cabe; dos o más, la cifra con su desplegable.
 */
export type ScGroupPopoverDisplay = 'count' | 'adaptive';
