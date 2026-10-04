/**
 * Qué compila `preflight:scope` según lo que se ha tocado. Vive aparte de `preflight-scope.mjs` para
 * poder probarlo sin lanzar la cadena (`scripts/__tests__/preflight-alcance.test.mjs`).
 *
 * El carril corre SIEMPRE `guard:lockfile`, `verify` (que construye el DS y pasa los tests de scripts,
 * los gates y el typecheck) y el build de sc-docs. Lo que decide esto es solo qué builds AOT de las
 * apps añade:
 *
 *   · si se toca algo que entra en el build de TODAS (el DS, los tokens, la config de la raíz, un
 *     script de la cadena) → cadena completa, las cinco apps;
 *   · si se toca una app → su build;
 *   · pruebas e2e, configs de Playwright, tests y hooks de `scripts/`, el CI y la documentación no
 *     entran en ningún build AOT → ninguno.
 *
 * Hasta el 2026-10-04 `e2e/` y todo `scripts/` mandaban a la cadena completa: venía de cuando el
 * preflight corría las suites e2e (DD-60 las sacó). Un bloque del Supervisor con su prueba y un test de
 * script compilaba las cinco apps en un Air de 16 GB. DD-155.
 */

export const APPS = ['agent', 'agent-mini', 'supervisor', 'cuscare', 'sc-docs'];

/** Tocar cualquiera de estas obliga a la cadena completa. */
export const COMPARTIDO = [
  /^projects\/ui-smartcontact/, // también ui-smartcontact-icons
  /^projects\/design-tokens/,
  /^scripts\/(?!__tests__\/|hooks\/)/, // los generadores y la cadena; sus tests y hooks no
  /^package(-lock)?\.json$/,
  /^tsconfig/,
  /^angular\.json$/,
  /^eslint\.config\.js$/,
];

/** Lo que no entra en ningún build AOT. */
export const INOCUO = [
  /^findings\//,
  /^docs\//,
  /^\.cache\//,
  /^tools\//,
  /^[^/]*\.md$/,
  /^e2e\//,
  /^playwright.*\.config\.ts$/,
  /^scripts\/(__tests__|hooks)\//,
  /^\.github\//,
];

/**
 * @param {string[]} ficheros rutas cambiadas, relativas a la raíz
 * @returns {{ compartidos: string[], relevantes: string[], appsTocadas: string[], completo: boolean }}
 */
export function planDe(ficheros) {
  const compartidos = ficheros.filter((f) => COMPARTIDO.some((re) => re.test(f)));
  const relevantes = ficheros.filter((f) => !INOCUO.some((re) => re.test(f)));
  const appsTocadas = APPS.filter((a) => ficheros.some((f) => f.startsWith(`projects/${a}/`)));
  return { compartidos, relevantes, appsTocadas, completo: compartidos.length > 0 };
}
