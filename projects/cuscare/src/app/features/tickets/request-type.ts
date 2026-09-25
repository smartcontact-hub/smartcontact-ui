import { RequestOrigin, RequestTag } from '../../data/seed';

/**
 * Estado del filtro «Request type» (V3, SCC 2081). Se explica paso a paso en Figma:
 * Landing page › 🛝 Playground › «Filtro Tipo de solicitud: origen IA y Agente».
 *
 *   · `on`      → orígenes activos. Vacío = sin filtro.
 *   · `types`   → una lista de tipos POR origen: marcar uno en AI no lo marca en Agent.
 *   · `editing` → de qué origen es la lista que enseña el panel.
 */
export interface RequestTypeFilter {
  readonly on: readonly RequestOrigin[];
  readonly types: Readonly<Record<RequestOrigin, readonly string[]>>;
  readonly editing: RequestOrigin | null;
}

export const ORIGINS: readonly RequestOrigin[] = ['ai', 'agent'];

export const ORIGIN_LABEL: Readonly<Record<RequestOrigin, string>> = { ai: 'AI', agent: 'Agent' };

export const EMPTY_REQUEST_TYPE_FILTER: RequestTypeFilter = {
  on: [],
  types: { ai: [], agent: [] },
  editing: null,
};

const other = (o: RequestOrigin): RequestOrigin => (o === 'ai' ? 'agent' : 'ai');

/**
 * Encender un origen lo pone a editar. Apagarlo BORRA sus tipos (si se vuelve a encender,
 * empieza de cero) y el panel pasa a la lista del origen que quede.
 */
export function toggleOrigin(f: RequestTypeFilter, o: RequestOrigin): RequestTypeFilter {
  if (!f.on.includes(o)) {
    return { ...f, on: ORIGINS.filter((x) => x === o || f.on.includes(x)), editing: o };
  }
  const on = f.on.filter((x) => x !== o);
  return {
    on,
    types: { ...f.types, [o]: [] },
    editing: on.includes(other(o)) ? other(o) : null,
  };
}

/** Marca o desmarca un tipo en la lista del origen que se está editando. */
export function toggleType(f: RequestTypeFilter, type: string): RequestTypeFilter {
  const o = f.editing;
  if (!o) return f;
  const cur = f.types[o];
  const next = cur.includes(type) ? cur.filter((t) => t !== type) : [...cur, type];
  return { ...f, types: { ...f.types, [o]: next } };
}

/** Con los dos orígenes activos, el selector AI | Agent elige qué lista se edita. No filtra. */
export function setEditing(f: RequestTypeFilter, o: RequestOrigin): RequestTypeFilter {
  return f.on.includes(o) ? { ...f, editing: o } : f;
}

/**
 * ¿El ticket pasa el filtro?
 *   · Dentro de un origen, «y»: el origen y sus tipos van juntos. Sin tipos marcados, vale
 *     cualquier tipo que haya puesto ese origen; con varios, basta uno.
 *   · Entre orígenes, «o»: pasa si cumple lo de la IA o lo del agente.
 */
export function matchesRequestType(tags: readonly RequestTag[], f: RequestTypeFilter): boolean {
  if (!f.on.length) return true;
  return f.on.some((o) => {
    const types = f.types[o];
    return tags.some((t) => t.origin === o && (!types.length || types.includes(t.label)));
  });
}

/**
 * Lo que pinta la celda: si la IA y el agente pusieron el mismo tipo, gana el agente y se ve
 * una sola etiqueta; si pusieron tipos distintos, se ven las dos. El FILTRO mira las etiquetas
 * crudas, no estas: un ticket con «Unsubscription» de los dos pasa «AI + Unsubscription»
 * aunque en la tabla solo se vea la del agente.
 */
export function displayTags(tags: readonly RequestTag[]): RequestTag[] {
  const byLabel = new Map<string, RequestTag>();
  for (const t of tags) {
    if (!byLabel.has(t.label) || t.origin === 'agent') byLabel.set(t.label, t);
  }
  return [...byLabel.values()];
}

/* ── Variante B: una sola lista, y en cada fila un grupo AI | Agent ──────────
 * Cada fila dice por qué origen filtra ESE tipo: por lo que puso la IA, por lo que
 * puso el agente, o por los dos. No hay sección de origen ni selector: los orígenes
 * activos se deducen de las filas marcadas. «All types» es un marcar-todo por
 * columna, así que «todo lo que clasificó la IA» sigue siendo posible. */

/** Rehace `on` desde las listas: activo = el que tiene al menos un tipo. */
function fromTypes(types: Record<RequestOrigin, readonly string[]>): RequestTypeFilter {
  return { on: ORIGINS.filter((o) => types[o].length > 0), types, editing: null };
}

/** Los orígenes con los que filtra una fila. */
export function originsOf(f: RequestTypeFilter, type: string): RequestOrigin[] {
  return ORIGINS.filter((o) => f.types[o].includes(type));
}

/** Pone los orígenes de UNA fila (lo que emite su grupo AI | Agent). */
export function setTypeOrigins(
  f: RequestTypeFilter,
  type: string,
  origins: readonly RequestOrigin[],
): RequestTypeFilter {
  const types = { ...f.types };
  for (const o of ORIGINS) {
    const has = types[o].includes(type);
    if (origins.includes(o) && !has) types[o] = [...types[o], type];
    if (!origins.includes(o) && has) types[o] = types[o].filter((t) => t !== type);
  }
  return fromTypes(types);
}

/** La fila «All types»: marca o vacía una columna entera. */
export function setAllTypes(
  f: RequestTypeFilter,
  all: readonly string[],
  origins: readonly RequestOrigin[],
): RequestTypeFilter {
  const types = { ...f.types };
  for (const o of ORIGINS) {
    const full = all.every((t) => types[o].includes(t));
    if (origins.includes(o) && !full) types[o] = [...all];
    if (!origins.includes(o) && full) types[o] = [];
  }
  return fromTypes(types);
}
