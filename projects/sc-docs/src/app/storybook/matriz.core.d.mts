/** Tipos de «Todas las combinaciones» (la lógica vive en `matriz.core.mjs`). */
import type { ArgType, ScArgs } from './story.types';

export type ValorEje = string | number | boolean | undefined;

export interface EjeCandidato {
  readonly nombre: string;
  readonly valores: readonly ValorEje[];
}

export interface Ejes {
  readonly filas: string | null;
  readonly columnas: string | null;
  readonly grupos: string | null;
}

export interface Celda {
  readonly valor: ValorEje;
  readonly args: ScArgs;
  readonly imposible: boolean;
}

export interface FilaRejilla {
  readonly valor: ValorEje;
  readonly celdas: readonly Celda[];
}

export interface GrupoRejilla {
  readonly valor: ValorEje;
  readonly filas: readonly FilaRejilla[];
}

export const MAX_CELDAS: number;
export function ejesCandidatos(argTypes: readonly ArgType[] | null | undefined): EjeCandidato[];
export function ejesPorDefecto(candidatos: readonly EjeCandidato[]): Ejes;
export function contarCeldas(ejes: Ejes, candidatos: readonly EjeCandidato[]): number;
export function construirRejilla(
  ejes: Ejes,
  candidatos: readonly EjeCandidato[],
  base?: ScArgs,
  imposible?: (args: ScArgs) => boolean,
): GrupoRejilla[];
