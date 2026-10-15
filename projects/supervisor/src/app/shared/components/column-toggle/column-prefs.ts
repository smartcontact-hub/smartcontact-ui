import type { ColumnDef } from '@smartcontact-hub/components';

/**
 * Lo que se recuerda de la tabla de cada lista al volver: qué columnas se ven, en qué orden (el de TODAS, también
 * las ocultas, para que una columna que se vuelve a enseñar salga donde estaba) y los anchos arrastrados, en rem.
 * Lo guarda la lista y no `stateKey` de `p-table`, que restaura además el orden de filas y la SELECCIÓN (medido en
 * `primeng-table.mjs`, `restoreState`): se volvería a una lista con filas marcadas.
 */
export interface ColumnPrefs {
  readonly order: readonly string[];
  readonly visible: readonly string[];
  readonly widths: Readonly<Record<string, string>>;
}

/**
 * Lo guardado, contrastado con las columnas de hoy: fuera las que ya no existen, las nuevas al final (visibles
 * según su `defaultVisible`) y las fijas (`locked`) en su sitio y siempre visibles. Lee también el formato del
 * selector anterior (`sc-column-selector`: la lista de visibles en su orden), para no perder lo que cada uno tenía.
 */
export function normalizePrefs(choices: readonly ColumnDef[], stored: unknown): ColumnPrefs {
  const keys = choices.map((c) => c.key);
  const known = (k: unknown): k is string => typeof k === 'string' && keys.includes(k);
  const raw = (stored ?? {}) as Partial<Record<keyof ColumnPrefs, unknown>>;
  const legacy = Array.isArray(stored) ? stored.filter(known) : null;
  const storedOrder = legacy ?? (Array.isArray(raw.order) ? raw.order.filter(known) : []);
  const storedVisible = legacy ?? (Array.isArray(raw.visible) ? raw.visible.filter(known) : null);
  const fresh = keys.filter((k) => !storedOrder.includes(k));

  const order = [...storedOrder, ...fresh].filter((k) => !choices.find((c) => c.key === k)?.locked);
  choices.forEach((c, i) => {
    if (c.locked) order.splice(i, 0, c.key);
  });

  const visibleSet = new Set(
    storedVisible
      ? [...storedVisible, ...fresh.filter((k) => choices.find((c) => c.key === k)?.defaultVisible !== false)]
      : choices.filter((c) => c.defaultVisible !== false).map((c) => c.key),
  );
  for (const c of choices) if (c.locked) visibleSet.add(c.key);

  const widths: Record<string, string> = {};
  if (raw.widths && typeof raw.widths === 'object')
    for (const [k, v] of Object.entries(raw.widths as Record<string, unknown>))
      if (known(k) && typeof v === 'string' && /^\d+(\.\d+)?rem$/.test(v)) widths[k] = v;

  return { order, visible: order.filter((k) => visibleSet.has(k)), widths };
}
