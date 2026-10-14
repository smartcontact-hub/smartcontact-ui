/** Tipos de lo que una ficha recibe de Repositorios (la lógica vive en `recursos.core.mjs`, DD-164). */

/** Los ids que siguen existiendo, en el orden en que se pusieron. */
export function idsVivos(ids: Iterable<number>, existentes: Iterable<{ readonly id: number }>): number[];
