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

  // ── warn → amber, NO yellow (toast/message). `base.ts` remapea `yellow→amber`
  //    (warn de marca = amber #f59e0b, más cálido que el yellow #eab308 del Kit). Estos
  //    slots se renderizan por `{yellow.*}` → amber; el Kit los espejaría a yellow y
  //    rompería la marca. Se preservan a mano (los fondos/bordes literales yellow SÍ se
  //    generan — son no-op). Verificado por scripts/cmp-color-rewire.mjs (value-equality).
  'dark:toast.warn.color',
  'dark:toast.warn.close.button.focus.ring.color',
  'light:toast.warn.color',
  'light:toast.warn.border.color',
  'light:toast.warn.close.button.focus.ring.color',
  'light:toast.warn.close.button.hover.background',
  'dark:message.warn.color',
  'dark:message.warn.simple.color',
  'dark:message.warn.outlined.color',
  'dark:message.warn.outlined.border.color',
  'dark:message.warn.close.button.focus.ring.color',
  'light:message.warn.color',
  'light:message.warn.simple.color',
  'light:message.warn.outlined.color',
  'light:message.warn.outlined.border.color',
  'light:message.warn.border.color',
  'light:message.warn.close.button.focus.ring.color',
  'light:message.warn.close.button.hover.background',

  // ── dark contrast/secondary → surface de MARCA (gris frío SC), NO zinc (toast/message).
  //    El preset usa `{surface.*}` y `base.ts` mapea surface→gray (gris navy de marca); el
  //    Kit, en dark, usa zinc neutro. Espejarlos forkearía el sistema de surface (un zinc
  //    suelto solo en toast/message). Se preservan: toast/message secondary/contrast siguen
  //    el surface general de la app. (Sus slots LITERALES blanco/azul SÍ se generan — no-op.)
  'dark:toast.contrast.color',
  'dark:toast.contrast.border.color',
  'dark:toast.contrast.close.button.focus.ring.color',
  'dark:toast.contrast.close.button.hover.background',
  'dark:toast.contrast.detail.color',
  'dark:toast.secondary.color',
  'dark:toast.secondary.background',
  'dark:toast.secondary.border.color',
  'dark:toast.secondary.close.button.focus.ring.color',
  'dark:toast.secondary.close.button.hover.background',
  'dark:message.contrast.color',
  'dark:message.contrast.border.color',
  'dark:message.contrast.close.button.focus.ring.color',
  'dark:message.contrast.close.button.hover.background',
  'dark:message.secondary.color',
  'dark:message.secondary.simple.color',
  'dark:message.secondary.outlined.color',
  'dark:message.secondary.outlined.border.color',
  'dark:message.secondary.background',
  'dark:message.secondary.border.color',
  'dark:message.secondary.close.button.focus.ring.color',
  'dark:message.secondary.close.button.hover.background',
]);

/**
 * ¿Se genera este slot? No si está en EXCLUDE (divergencia de marca), o si es ruido del
 * plugin: el namespace `*.figma.*` son hints internos del Theme Designer (sombras raised
 * simuladas como fondo, contenedores de figma…), NO tokens que el tema PrimeNG consuma.
 */
export const isExcluded = (mode, path) =>
  /(^|\.)figma\./.test(path) || EXCLUDE.has(`${mode}:${path}`) || EXCLUDE.has(path);
