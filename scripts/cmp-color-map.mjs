/**
 * Fuente ÚNICA de las EXCEPCIONES del color de componente (export DTCG → --sc-cmp-*).
 *
 * El generador `token-gen-cmp-color.mjs` ESPEJA por defecto TODO el color de cada
 * componente (`aura/component/light|dark`) a `--sc-cmp-<componente>-<parte>`. Aquí
 * viven solo las DIVERGENCIAS conscientes — slots cuyo valor en código está afinado a
 * mano y NO debe seguir al export (frosted dark, blanco/negro translúcido afinado,
 * secondary/contrast que dependen del surface navy…). El generador NO los escribe; el
 * chivato §7 los vigila (si el export cambia un slot divergente, avisa para re-decidir).
 *
 * Esto materializa el trade-off "marca vs Kit": por defecto `mirror` (el export manda,
 * la marca se cura EN Figma); las pocas filas de aquí son `brand` (se preservan a mano).
 *
 * Formato de EXCLUDE: clave `"<mode>:<path>"` (p.ej. `"dark:toast.info.background"`) o
 * solo `"<path>"` para excluir el slot en AMBOS modos.
 */

/** Slots que NO se generan (divergencia de marca / afinado a mano). Se siembra vacío;
 *  se añade una fila cuando una reconciliación export↔código decide preservar el valor. */
export const EXCLUDE = new Set([
  // ── success text (dark): el export usa green-950 vanilla (#052e16); la DS cura su propio
  //    green-950 de marca (#0a2916, un punto más oscuro). Divergencia consciente → no espejar.
  'dark:badge.success.color',
  'dark:button.success.color',
  'dark:button.success.hover.color',
  'dark:button.success.active.color',
  // ── info translúcido (dark): el export hardcodea Tailwind sky (#0ea5e9/#38bdf8) que NO está
  //    en la paleta de marca (su `sky` es un azul de marca). Fuera de paleta → decisión de DS
  //    (¿añadir sky, o remapear info a azure/electric-blue?). El chivato §7 lo recordará.
  'dark:tag.info.background',
  'dark:button.outlined.info.hover.background',
  'dark:button.outlined.info.active.background',
  'dark:button.text.info.hover.background',
  'dark:button.text.info.active.background',
]);

/**
 * ¿Se genera este slot? No si está en EXCLUDE (divergencia de marca), o si es ruido del
 * plugin: el namespace `*.figma.*` son hints internos del Theme Designer (sombras raised
 * simuladas como fondo, contenedores de figma…), NO tokens que el tema PrimeNG consuma.
 */
export const isExcluded = (mode, path) =>
  /(^|\.)figma\./.test(path) || EXCLUDE.has(`${mode}:${path}`) || EXCLUDE.has(path);
