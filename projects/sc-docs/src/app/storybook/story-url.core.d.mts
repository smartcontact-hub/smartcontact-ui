/** Tipos del enlace de una story (la lógica vive en `story-url.core.mjs`). */
import type { ScArgs } from './story.types';

export function slugHistoria(nombre: string): string;
export function codificarArgs(args: ScArgs, base?: ScArgs, orden?: readonly string[]): string;
export function decodificarArgs(texto: string | null | undefined, permitidos?: readonly string[]): ScArgs;
export function urlDeHistoria(opciones: {
  readonly pagina: string;
  readonly historia: string;
  readonly args?: string;
  readonly solo?: boolean;
  readonly extra?: Readonly<Record<string, string | null | undefined>>;
}): string;
