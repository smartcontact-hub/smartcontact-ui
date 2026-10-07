import { RequestOrigin, RequestTag } from '../../data/seed';

/**
 * Estado del filtro «Request type» (V3, SCC 2081). El panel de referencia es el de Figma:
 * Landing page › V3 › «Main Container» (1736:13257): origen de la clasificación arriba y una
 * lista de tipos con casillas debajo.
 *
 *   · `origins` → orígenes encendidos: ninguno (de inicio), IA, Agente o los dos. Sin ninguno,
 *                 no se filtra.
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

/**
 * El filtro solo actúa con algún origen encendido Y algún tipo marcado: sin origen no se
 * filtra (decisión de producto y desarrollo del 2026-10-07).
 */
export function isRequestTypeActive(f: RequestTypeFilter): boolean {
  return f.origins.length > 0 && f.types.length > 0;
}

/** ¿Ese origen puso ese tipo? «Vacío» = ese origen no puso ninguno. */
function hasType(tags: readonly RequestTag[], origin: RequestOrigin, type: string): boolean {
  const from = tags.filter((t) => t.origin === origin);
  return type === EMPTY_TYPE ? from.length === 0 : from.some((t) => t.label === type);
}

/**
 * ¿El ticket pasa el filtro? Cada origen encendido tiene que haber puesto ALGUNO de los tipos
 * marcados, no necesariamente el mismo: «IA (Baja o Devolución) Y Agente (Baja o Devolución)».
 * O dentro de cada origen, Y entre orígenes.
 *   · solo IA      → la IA puso alguno de los tipos, diga lo que diga el agente;
 *   · solo Agente  → lo mismo con el agente;
 *   · los dos      → la IA puso alguno Y el agente puso alguno. IA Baja con Agente Devolución
 *                    sale; IA Baja con Agente Spam, no.
 */
export function matchesRequestType(tags: readonly RequestTag[], f: RequestTypeFilter): boolean {
  if (!isRequestTypeActive(f)) return true;
  return f.origins.every((o) => f.types.some((type) => hasType(tags, o, type)));
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
