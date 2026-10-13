import type { RequestOrigin, RequestTag } from '../../data/seed';

/**
 * Estado del filtro «Request type» (Figma «Para desarrollo / Recorrido y reglas del filtro», 2404:35544):
 *   · `origins` → orígenes encendidos: ninguno (de inicio), IA, Agente o los dos.
 *   · `types`   → UNA lista de tipos para los dos orígenes. Vacía = sin filtro.
 */
export interface RequestTypeFilter {
  readonly origins: readonly RequestOrigin[];
  readonly types: readonly string[];
}

export const ORIGINS: readonly RequestOrigin[] = ['ai', 'agent'];
export const ORIGIN_LABEL: Readonly<Record<RequestOrigin, string>> = { ai: 'AI', agent: 'Agent' };

/** «Vacío»: busca tickets sin clasificar; cuenta como un tipo más. */
export const EMPTY_TYPE = 'Empty';

export const DEFAULT_REQUEST_TYPE_FILTER: RequestTypeFilter = { origins: [], types: [] };

/** El filtro solo actúa con algún tipo marcado: sin tipos o sin origen no hay filtro. */
export const isRequestTypeActive = (f: RequestTypeFilter | undefined): boolean => !!f && f.types.length > 0;

/** ¿Ese origen puso ese tipo? Sin origen (`null`), vale cualquiera. «Vacío» = no puso ninguno. */
function hasType(tags: readonly RequestTag[], origin: RequestOrigin | null, type: string): boolean {
  const from = origin ? tags.filter((t) => t.origin === origin) : tags;
  return type === EMPTY_TYPE ? from.length === 0 : from.some((t) => t.label === type);
}

/**
 * ¿El ticket pasa el filtro? Basta con UNO de los tipos marcados (OR), y ese tipo lo tienen que haber puesto TODOS
 * los orígenes encendidos (AND): con los dos, la IA y el agente pusieron el MISMO tipo.
 */
export function matchesRequestType(tags: readonly RequestTag[], f: RequestTypeFilter | undefined): boolean {
  if (!f || !isRequestTypeActive(f)) return true;
  if (!f.origins.length) return f.types.some((type) => hasType(tags, null, type));
  return f.types.some((type) => f.origins.every((o) => hasType(tags, o, type)));
}
