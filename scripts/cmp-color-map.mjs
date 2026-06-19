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
  //    (¿añadir esa variante, o remapear info a azure/sky?). El chivato §7 lo recordará.
  'dark:tag.info.background',
  'dark:button.outlined.info.hover.background',
  'dark:button.outlined.info.active.background',
  'dark:button.text.info.hover.background',
  'dark:button.text.info.active.background',

  // ── warn → amber, NO yellow (toast/message). `base.ts` remapea `yellow→amber`
  //    (warn de marca = amber #f59e0b, más cálido que el yellow #eab308 del Kit). Estos
  //    slots se renderizan por `{yellow.*}` → amber; el Kit los espejaría a yellow y
  //    rompería la marca. Se preservan a mano (los fondos/bordes literales yellow SÍ se
  //    generan). El guard `cmp-color-rewire` vela que no se hardcodee un hex en un slot generado.
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

  // ══ RESTO DE COMPONENTES (rewire Fase 1.1, tanda 2) — mismas 2 familias de marca ══
  //    Las refs SEMÁNTICAS ({primary/text/form/content}.*) ya las salta isSemanticRef (regla,
  //    no lista). Aquí solo quedan las 2 divergencias de MARCA que el Kit no puede inferir:
  //    · superficie oscura = gris SC (base.ts surface→gray) en vez de zinc del Kit → W5.
  //    · warn = amber (base.ts orange/yellow→amber) en vez de orange/yellow del Kit.
  //    Divergencias de marca excluidas a mano de la generación (no se repuntan).
  'dark:autocomplete.chip.focus.background',
  'dark:autocomplete.dropdown.color',
  'dark:autocomplete.dropdown.background',
  'dark:autocomplete.dropdown.hover.color',
  'dark:autocomplete.dropdown.active.color',
  'dark:autocomplete.dropdown.hover.background',
  'dark:autocomplete.dropdown.active.background',
  'dark:badge.warn.color',
  'dark:badge.warn.background',
  'dark:badge.contrast.color',
  'dark:badge.secondary.color',
  'dark:badge.secondary.background',
  'light:badge.warn.background',
  'dark:button.text.warn.color',
  'dark:button.text.plain.hover.background',
  'dark:button.text.plain.active.background',
  'dark:button.text.contrast.hover.background',
  'dark:button.text.contrast.active.background',
  'dark:button.text.secondary.color',
  'dark:button.text.secondary.hover.background',
  'dark:button.text.secondary.active.background',
  'dark:button.outlined.warn.color',
  'dark:button.outlined.warn.border.color',
  'dark:button.outlined.plain.border.color',
  'dark:button.outlined.plain.hover.background',
  'dark:button.outlined.plain.active.background',
  'dark:button.outlined.contrast.border.color',
  'dark:button.outlined.contrast.hover.background',
  'dark:button.outlined.contrast.active.background',
  'dark:button.outlined.secondary.color',
  'dark:button.outlined.secondary.border.color',
  'light:button.text.warn.color',
  'light:button.text.warn.hover.background',
  'light:button.text.warn.active.background',
  'light:button.outlined.warn.color',
  'light:button.outlined.warn.border.color',
  'light:button.outlined.warn.hover.background',
  'light:button.outlined.warn.active.background',
  'dark:carousel.indicator.background',
  'dark:carousel.indicator.hover.background',
  'dark:datatable.row.striped.background',
  'dark:datepicker.today.background',
  'dark:datepicker.dropdown.color',
  'dark:datepicker.dropdown.background',
  'dark:datepicker.dropdown.hover.color',
  'dark:datepicker.dropdown.active.color',
  'dark:datepicker.dropdown.hover.background',
  'dark:datepicker.dropdown.active.background',
  'dark:galleria.indicator.button.background',
  'dark:galleria.indicator.button.hover.background',
  'dark:galleria.thumbnail.nav.button.color',
  'dark:galleria.thumbnail.nav.button.hover.background',
  'dark:inputnumber.button.color',
  'dark:inputnumber.button.hover.color',
  'dark:inputnumber.button.active.color',
  'dark:inputnumber.button.hover.background',
  'dark:inputnumber.button.active.background',
  'dark:listbox.option.striped.background',
  'dark:scrollpanel.bar.background',
  'dark:slider.handle.content.background',
  'dark:tag.warn.color',
  'dark:tag.contrast.color',
  'dark:tag.secondary.color',
  'dark:tag.secondary.background',
  'light:tag.warn.color',
  'light:tag.warn.background',
  'dark:togglebutton.icon.color',
  'dark:togglebutton.icon.hover.color',
  'dark:togglebutton.content.checked.background',
  'dark:toggleswitch.handle.color',
  'dark:toggleswitch.handle.background',
  'dark:toggleswitch.handle.hover.color',
  'dark:toggleswitch.handle.hover.background',
  'dark:toggleswitch.handle.checked.background',
  'dark:toggleswitch.handle.disabled.background',
  'dark:toggleswitch.handle.checked.hover.background',
]);

/**
 * SKIP por REGLA (sostenible, no hace falta listar slot a slot): si el VALOR del Kit es una
 * referencia a un namespace SEMÁNTICO (`{primary.*}`, `{text.*}`, `{form.*}`, `{content.*}`),
 * ese slot NO es color de componente — es el componente consumiendo el TEMA. Debe quedarse
 * como ref semántica en el preset (así un cambio de marca/tema lo arrastra), no congelarse en
 * una primitiva del Kit. El color de componente solo emite severidades FIJAS (info/success/
 * warn/error + sus familias primitivas) y literales. `surface` NO entra aquí a propósito:
 * tiene una divergencia de marca VIVA (dark gris SC vs zinc del Kit) que se cura por EXCLUDE
 * hasta decidir el W5; su dark va a EXCLUDE y su light (no-op) se repunta como el resto.
 */
export const isSemanticRef = (value) =>
  typeof value === 'string' && /^\{(primary|text|form|content)\./.test(value);

/**
 * ¿Se genera este slot? No si su valor es una ref semántica (regla de arriba), si está en
 * EXCLUDE (divergencia de marca), o si es ruido del plugin: el namespace `*.figma.*` son
 * hints internos del Theme Designer (sombras raised simuladas como fondo, contenedores de
 * figma…), NO tokens que el tema PrimeNG consuma.
 */
export const isExcluded = (mode, path, value) =>
  isSemanticRef(value) || /(^|\.)figma\./.test(path) || EXCLUDE.has(`${mode}:${path}`) || EXCLUDE.has(path);
