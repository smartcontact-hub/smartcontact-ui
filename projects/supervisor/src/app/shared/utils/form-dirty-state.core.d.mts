/** Tipos del núcleo de dirty-state (la lógica vive en `form-dirty-state.core.mjs`). */
export function stableStringify(value: unknown): string;
/** Las claves de primer nivel que difieren entre dos objetos (con `stableStringify`). */
export function changedKeys(current: object, pristine: object): Set<string>;
