/** Tipos de las reglas del índice de una ficha (la lógica vive en `alta-secciones.core.mjs`). */
export function seccionesHechas(o: {
  readonly ids: readonly string[];
  readonly abierta: string;
  readonly dejadas: ReadonlyMap<string, string>;
  readonly firma: (id: string) => string;
  readonly completa: (id: string) => boolean;
}): Set<string>;
export function dejarSeccion(dejadas: ReadonlyMap<string, string>, id: string, firma: string): Map<string, string>;
export function seDice(
  falta: string,
  intento: ReadonlySet<string> | null,
  guardado: ReadonlySet<string>,
  tocados?: ReadonlySet<string>,
): boolean;
export function firmaDe(valores: Iterable<string>): string;
