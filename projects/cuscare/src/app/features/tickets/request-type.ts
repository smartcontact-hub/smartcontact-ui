import { RequestOrigin, RequestTag } from '../../data/seed';

/**
 * Estado del filtro «Request type» (V3, SCC 2081). El panel de referencia es el de Figma:
 * Landing page › V3 › «Main Container» (1736:13257): origen de la clasificación arriba y una
 * lista de tipos con casillas debajo.
 *
 *   · `origins` → orígenes encendidos: ninguno (de inicio), IA, Agente o los dos.
 *   · `types`   → UNA lista de tipos para los dos orígenes. Vacía = sin filtro.
 */
export interface RequestTypeFilter {
  readonly origins: readonly RequestOrigin[];
  readonly types: readonly string[];
}

export const ORIGINS: readonly RequestOrigin[] = ['ai', 'agent'];

export const ORIGIN_LABEL: Readonly<Record<RequestOrigin, string>> = { ai: 'AI', agent: 'Agent' };

/** «Vacío» (NATURE_OF_DEMAND.empty): el origen no puso ningún tipo. */
export const EMPTY_TYPE = 'Empty';

export const DEFAULT_REQUEST_TYPE_FILTER: RequestTypeFilter = { origins: [], types: [] };

/** El filtro solo actúa con algún tipo marcado. */
export function isRequestTypeActive(f: RequestTypeFilter): boolean {
  return f.types.length > 0;
}

/**
 * ¿Ese origen puso ese tipo? Sin origen (`null`), vale cualquiera de los dos. «Vacío» = no
 * puso ninguno (sin origen: nadie puso ninguno).
 */
function hasType(tags: readonly RequestTag[], origin: RequestOrigin | null, type: string): boolean {
  const from = origin ? tags.filter((t) => t.origin === origin) : tags;
  return type === EMPTY_TYPE ? from.length === 0 : from.some((t) => t.label === type);
}

/**
 * ¿El ticket pasa el filtro? Basta con UNO de los tipos marcados, y ese tipo lo tienen que
 * haber puesto TODOS los orígenes encendidos:
 *   · ninguno      → lo puso la IA o el agente, da igual quién;
 *   · solo IA      → lo puso la IA, diga lo que diga el agente;
 *   · solo Agente  → lo mismo con el agente;
 *   · los dos      → coincidencia: la IA y el agente pusieron el MISMO tipo. Un ticket que
 *                    el agente aún no ha revisado no coincide, así que no sale.
 */
export function matchesRequestType(tags: readonly RequestTag[], f: RequestTypeFilter): boolean {
  if (!isRequestTypeActive(f)) return true;
  if (!f.origins.length) return f.types.some((type) => hasType(tags, null, type));
  return f.types.some((type) => f.origins.every((o) => hasType(tags, o, type)));
}

/** Lo que pinta la celda: una coincidencia (el mismo tipo de los dos) o una etiqueta suelta. */
export type CellItem =
  | { readonly kind: 'match'; readonly label: string; readonly key: string }
  | { readonly kind: 'tag'; readonly tag: RequestTag; readonly key: string };

/**
 * Todas las etiquetas, también las repetidas. Las coincidencias van primero y juntas, con su
 * marca; después las sueltas, primero las de la IA.
 */
export function cellItems(tags: readonly RequestTag[]): CellItem[] {
  const labels = (o: RequestOrigin) => tags.filter((t) => t.origin === o).map((t) => t.label);
  const agent = labels('agent');
  const matched = new Set(labels('ai').filter((l) => agent.includes(l)));
  return [
    ...[...matched].map((label) => ({ kind: 'match' as const, label, key: `m:${label}` })),
    ...ORIGINS.flatMap((o) =>
      tags
        .filter((t) => t.origin === o && !matched.has(t.label))
        .map((tag) => ({ kind: 'tag' as const, tag, key: `${o}:${tag.label}` })),
    ),
  ];
}
