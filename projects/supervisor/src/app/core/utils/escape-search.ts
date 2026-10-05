/**
 * Escape en el buscador de una lista: con texto, lo vacía; vacío, suelta el foco (DD-98). Lo comparten `sc-list-page` y
 * los filtros de Conversaciones, que tienen su buscador propio.
 *
 * Cada evento se atiende UNA vez. `(keydown)` sobre `<sc-search>` llega dos veces con el mismo evento: por su salida
 * `keydown` y por el nativo, que sube desde el `<input>` hasta el host. Medido el 2026-10-05 en Usuarios y
 * Conversaciones: el primer Escape vaciaba y, en la segunda llamada, ya vacío, soltaba el foco. `preventDefault` marca el
 * evento como atendido; de paso quita el vaciado nativo de Chrome en `type="search"`, que ya hace `clear`.
 */
export function escapeSearch(event: KeyboardEvent, query: string, clear: () => void): void {
  if (event.key !== 'Escape' || event.defaultPrevented) return;
  event.preventDefault();
  if (query) clear();
  else (event.target as HTMLElement).blur();
}
