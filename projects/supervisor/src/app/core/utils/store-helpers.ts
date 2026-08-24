import type { LocalStore } from '@core/services/local-store.factory';

/**
 * Piezas que TODOS los stores repetían igual. Solo entra aquí lo que estaba
 * duplicado **verbatim**: lo que diverge entre stores (el `switch` que traduce
 * campo → patch, el `nextCode` de cada entidad) se queda en su sitio, porque es
 * dominio y no andamiaje.
 */

/**
 * ¿Hay ya otro elemento con ese nombre? Compara en minúsculas y sin espacios de
 * los extremos, e ignora el propio elemento cuando se está editando.
 *
 * Estaba copiado palabra por palabra en `categories.store` y `entities.store`,
 * cambiando solo la señal que leía.
 *
 * Un nombre vacío devuelve `false` a propósito: "está en blanco" es un problema
 * de campo requerido, no de duplicado, y mezclarlos acusaría al usuario de algo
 * que no ha hecho.
 */
export function isNameTaken<T extends { id: unknown; name: string }>(
  items: readonly T[],
  name: string,
  exceptId?: T['id'],
): boolean {
  const lower = name.trim().toLowerCase();

  if (!lower) {
    return false;
  }

  return items.some((item) => item.id !== exceptId && item.name.toLowerCase() === lower);
}

/**
 * Aplica un cambio a muchas filas a la vez.
 *
 * Lo duplicado eran estas cinco líneas de recorrido —salir si no hay ids, montar
 * el `Set`, iterar, saltar los que no están, llamar a `updateItem`—, idénticas
 * en `agents`, `groups` y `users`. Lo que NO se toca es el `switch` que decide
 * QUÉ parchear: ese es distinto en cada store porque conoce sus campos, y
 * generalizarlo obligaría a tipar el valor como `unknown` en más sitios de los
 * que ya está.
 *
 * `parche` devuelve `null` para saltarse una fila (campo desconocido), que es lo
 * que hacía el `default: continue` de cada `switch`. No recibe el campo: la
 * clausura del store ya lo tiene, y pasarlo otra vez solo añade un parámetro
 * que nadie lee.
 */
export function bulkUpdatePatch<T extends { id: number }>(
  store: LocalStore<T>,
  items: readonly T[],
  ids: readonly number[],
  parche: (item: T) => Partial<T> | null,
): void {
  if (ids.length === 0) {
    return;
  }

  const idSet = new Set(ids);

  for (const item of items) {
    if (!idSet.has(item.id)) {
      continue;
    }

    const patch = parche(item);

    if (patch === null) {
      continue;
    }

    store.updateItem(item.id, patch);
  }
}
