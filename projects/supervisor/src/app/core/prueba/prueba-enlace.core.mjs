// @ts-check
/**
 * EL ENLACE DE UNA PRUEBA CON USUARIOS, puro y sin Angular (DD-256). Lo prueba `scripts/__tests__/prueba-usuarios.test.mjs`.
 *
 * La página de la prueba en el Lab de sc-docs escribe la sesión de cada persona en el enlace (`#prueba=…`), y el
 * Supervisor la lee al arrancar. Al acabar, el resultado vuelve a sc-docs por el mismo camino. Sin servidor y sin
 * terceros: nada sale del navegador hasta que la persona copia su resultado.
 *
 * El codificador está repetido en `projects/sc-docs/src/app/pages/lab/pruebas/prueba.core.mjs` a propósito: el
 * `rootDir` de cada app impide importar un fichero de la otra. La prueba cruza los dos para que no se separen.
 */

/** La clave del enlace: `…/admin/calendarios#prueba=<sesión>`. */
export const CLAVE_ENLACE = 'prueba=';

/**
 * ¿Puede encenderse el modo prueba aquí? Solo en local y en el preview de una rama (`<rama>.sc-supervisor.pages.dev`).
 * En producción (`sc-supervisor.pages.dev`) nunca, aunque alguien abra un enlace de prueba.
 * @param {string} host
 * @returns {boolean}
 */
export function pruebaPermitida(host) {
  if (host === 'localhost' || host === '127.0.0.1') return true;
  return /^[a-z0-9-]+\.sc-supervisor\.pages\.dev$/.test(host);
}

/**
 * Un valor a texto seguro para una dirección: JSON en UTF-8 y base64url, sin relleno.
 * @param {unknown} valor
 * @returns {string}
 */
export function codificar(valor) {
  const bytes = new TextEncoder().encode(JSON.stringify(valor));
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * El camino de vuelta de `codificar`.
 * @param {string} texto
 * @returns {unknown}
 */
export function decodificar(texto) {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(b64 + '==='.slice((b64.length + 3) % 4));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0))));
}
