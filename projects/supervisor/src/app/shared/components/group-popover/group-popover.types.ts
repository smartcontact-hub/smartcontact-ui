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
