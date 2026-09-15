/**
 * ¿Existe una CLASE en el código de PrimeNG? La pieza pura del chequeo de huérfanos de
 * `audit-primeng-coupling.mjs`, aparte para poder probarla con casos fabricados
 * (`scripts/__tests__/audit-primeng-coupling.test.mjs`).
 *
 * POR QUÉ NO VALE `texto.includes(clase)` (medido el 2026-09-15). `sc-inputgroup` tenía
 * reglas sobre `.p-inputgroup-addon`, una clase que PrimeNG 22 ya no pone (la del addon es
 * `.p-inputgroupaddon`), y el guardián las daba por buenas: el texto `p-inputgroup-addon`
 * sigue en el bundle, pero como NOMBRE DE ETIQUETA (`selector: "p-inputgroup-addon"`). En
 * el navegador, esas reglas casaban con 0 elementos. Dos cosas lo arreglan:
 *
 *   1. Se quitan los `selector: '…'` antes de buscar: ahí PrimeNG escribe etiquetas, no clases.
 *   2. La clase tiene que aparecer ENTERA, no dentro de otra (`p-tab` dentro de `p-tablist`).
 *
 * Para las ETIQUETAS consultadas desde código (`querySelector('p-tabs')`) sigue valiendo la
 * búsqueda suelta: justo ahí el `selector:` es la prueba de que existen.
 */

const SELECTOR = /selector:\s*(['"`])[^'"`]*\1/g;
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Quita los `selector: '…'` de cada fichero del bundle. Hazlo UNA vez y reutiliza. */
export const sinSelectores = (textos) => textos.map((t) => t.replace(SELECTOR, 'selector: ""'));

/** `true` si `clase` aparece entera en algún texto ya pasado por `sinSelectores`. */
export const existeComoClase = (clase, textosSinSelectores) => {
  const re = new RegExp(`(?<![\\w-])${escapar(clase)}(?![\\w-])`);
  return textosSinSelectores.some((t) => re.test(t));
};
