/** Tipos del enlace de una prueba con usuarios (la lógica vive en `prueba-enlace.core.mjs`). */
export const CLAVE_ENLACE: string;
export function pruebaPermitida(host: string): boolean;
export function codificar(valor: unknown): string;
export function decodificar(texto: string): unknown;
