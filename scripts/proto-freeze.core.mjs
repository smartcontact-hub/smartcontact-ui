// @ts-check
/**
 * Lo puro de `proto-freeze.mjs`, sin git ni terminal, para probarlo con node:test
 * (`scripts/__tests__/proto-freeze.test.mjs`). El script, al cargarse, mira el árbol y pregunta: no se
 * puede importar desde una prueba.
 *
 * Un ID congelado es el ticket de Jira (`SISMAC-4058`) y, cuando ese ticket ya tiene una versión
 * congelada, `-vN` desde la segunda (`SISMAC-4058-v2`, DD-212). La versión anterior no se mueve:
 * su enlace ya está pegado en Jira y tiene que seguir enseñando lo mismo.
 */

const ID = /^[A-Z][A-Z0-9]*-\d+(?:-v\d+)?$/;

/** Qué le falta a un ID para ser válido, o `null` si lo es. */
export function malTicket(/** @type {string} */ t) {
  return ID.test(t) ? null : 'Se espera algo como SISMAC-3780, o SISMAC-3780-v2 para una versión nueva.';
}

/** El ticket de Jira de un ID, sin su versión: `SISMAC-4058-v2` → `SISMAC-4058`. */
export const ticketBase = (/** @type {string} */ id) => id.replace(/-v\d+$/, '');

/**
 * La siguiente versión libre de un ticket, vistas las etiquetas `proto/*` que ya existen: la primera
 * vez que se repite, `-v2`; luego `-v3`, y así.
 * @param {string} id
 * @param {readonly string[]} etiquetas
 */
export function siguienteVersion(id, etiquetas) {
  const base = ticketBase(id);
  let n = 2;
  while (etiquetas.includes(`proto/${base}-v${n}`)) n++;
  return `${base}-v${n}`;
}

/**
 * Filas de la tabla de `docs/PROTOTIPOS.md`, parseadas. Una fila es
 * `| ID | fecha | app | `proto/ID` | URL | qué cubre |`
 * @param {string} md
 */
export function filas(md) {
  const out = [];
  for (const linea of md.split('\n')) {
    const m = /^\|\s*([A-Z][A-Z0-9]*-\d+(?:-v\d+)?)\s*\|/.exec(linea);
    if (!m) continue;
    const celdas = linea.split('|').slice(1, -1).map((c) => c.trim());
    out.push({
      ticket: celdas[0],
      fecha: celdas[1],
      app: celdas[2],
      etiqueta: (celdas[3] || '').replace(/`/g, ''),
      url: (celdas[4] || '').replace(/^\[.*\]\(|\)$/g, ''),
      que: celdas[5],
      linea,
    });
  }
  return out;
}

/** El nombre de rama que Cloudflare convierte en subdominio: minúsculas y sin `/`. */
export const ramaDe = (/** @type {string} */ id) => 'proto/' + id.toLowerCase();

/** La URL que Cloudflare da a esa rama en el proyecto de una app. */
export const urlDe = (/** @type {string} */ id, /** @type {string} */ proyecto) =>
  `https://proto-${id.toLowerCase()}.${proyecto}.pages.dev`;
