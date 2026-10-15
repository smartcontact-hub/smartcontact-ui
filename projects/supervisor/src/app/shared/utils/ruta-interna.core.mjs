/**
 * Núcleo de «a dónde puedo mandar a la persona sin sacarla de la app»: puro, sin Angular ni DOM, para que
 * `node:test` lo pruebe dentro del gate.
 *
 * Empezar por `/` no basta: `//dominio-ajeno` y `/\dominio-ajeno` empiezan por `/` y el navegador los resuelve
 * como un dominio distinto (una redirección abierta). Se resuelve contra el origen de la app y solo vale si el
 * origen resultante es el mismo.
 */

/**
 * La ruta interna (`/camino?consulta#ancla`) a la que apunta `destino`, o `null` si no es una ruta de esta app
 * (vacía, relativa, de otro dominio o con un esquema como `javascript:`).
 *
 * @param {string | null | undefined} destino lo que llega de la URL o del almacenamiento
 * @param {string} origen el origen de la app (`location.origin`)
 * @returns {string | null}
 */
export function rutaInterna(destino, origen) {
  if (typeof destino !== 'string' || !destino.startsWith('/')) return null;
  let url;
  try {
    url = new URL(destino, origen);
  } catch {
    return null;
  }
  if (url.origin !== origen) return null;
  return url.pathname + url.search + url.hash;
}
