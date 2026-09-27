// @ts-check
/**
 * Serialización ESTABLE para comparar snapshots de formularios — dirty-state por
 * CAMBIO NETO, no por "tocado":
 *  - `Set`  → elementos ordenados (etiquetas/horarios no tienen orden semántico).
 *  - objeto → claves ordenadas (el orden de inserción no debe marcar "sucio").
 *  - array  → en orden (los arrays SÍ son ordenados: prioridad de links, idiomas…).
 *
 * Así, deshacer un cambio devuelve el MISMO string → `dirty` vuelve a false.
 * Puro (sin Angular) → cubierto por `test:unit`.
 */

/**
 * @param {unknown} value
 * @returns {string}
 */
export function stableStringify(value) {
  if (value instanceof Set) {
    return `S[${[...value].map(stableStringify).sort().join(',')}]`;
  }
  if (value instanceof Map) {
    return `M[${[...value.entries()]
      .map(([k, v]) => `${stableStringify(k)}=>${stableStringify(v)}`)
      .sort()
      .join(',')}]`;
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const obj = /** @type {Record<string, unknown>} */ (value);
    return `{${Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/**
 * Qué claves de primer nivel difieren entre dos estados de un formulario, con la misma comparación
 * que `stableStringify` (deshacer un cambio devuelve el conjunto vacío; el orden de un Set no cuenta).
 * Lo usan las fichas para marcar en el índice las secciones con cambios sin guardar (DD-122): cada
 * página sabe qué campo es de qué sección.
 *
 * @param {Record<string, unknown>} current
 * @param {Record<string, unknown>} pristine
 * @returns {Set<string>}
 */
export function changedKeys(current, pristine) {
  const keys = new Set([...Object.keys(current), ...Object.keys(pristine)]);
  const changed = new Set();
  for (const key of keys) {
    const now = Object.hasOwn(current, key) ? stableStringify(current[key]) : undefined;
    const before = Object.hasOwn(pristine, key) ? stableStringify(pristine[key]) : undefined;
    if (now !== before) changed.add(key);
  }
  return changed;
}
