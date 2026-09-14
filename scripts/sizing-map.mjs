/**
 * Fuente ÚNICA del sizing de componente (export DTCG ↔ preset ↔ token generado).
 *
 * La consumen DOS scripts, para que el mapa no se duplique ni se desincronice:
 *   - `token-parity.mjs`  — lee `read` (valor actual del preset) y `exp` (valor del
 *     export) y compara; es el GATE (rojo si hay drift en una fila no-divergente).
 *   - `token-gen-component.mjs` — lee `exp` (valor deseado del export) y escribe
 *     `--sc-cmp-<cmp>` en la zona `@sc-gen:cmp-sizing` de `04-component.css`; el
 *     preset referencia ese token, así el sizing fluye Figma→código sin mano.
 *
 * Cada fila:
 *   - `label`  — etiqueta legible (mensajes de parity).
 *   - `group`  — grupo del export: 'CC' (aura/component/common) o 'SC'
 *                (aura/semantic/common).
 *   - `exp`    — ruta dentro del grupo (se resuelve siguiendo refs DTCG → px).
 *   - `read`   — cómo lee parity el valor ACTUAL del preset:
 *                  · `{ path }`                       → presetToPx(get(path))
 *                  · `{ path, index }`                → shorthand(path)[index]
 *                  · `{ path, index, fallback }`      → shorthand(path)[index] ?? [fallback]
 *
 * El nombre del token generado se DERIVA del label con `cmpName()` (determinista;
 * el test valida que no haya colisiones). El generador emite valores rem crudos
 * (px/16) con el px en comentario — igual que los primitivos, sin lookup de familia.
 */

/** Grupos del export DTCG (claves slash de primer nivel). */
export const GROUPS = {
  CC: 'aura/component/common',
  SC: 'aura/semantic/common',
};

/**
 * label → nombre del token CSS generado (`--sc-cmp-<cmp>`).
 * Quita el `.root` redundante, pasa camelCase→kebab y los puntos a guiones.
 * Ej.: 'button.root.paddingX' → 'button-padding-x' · 'formField.lg.fontSize'
 *      → 'form-field-lg-font-size' · 'iconSize' → 'icon-size'.
 */
/** @param {string} label */
export function cmpName(label) {
  return label
    .replace(/\.root(?=\.)/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\./g, '-');
}

/**
 * Las filas de sizing (53 de origen; 110 desde DD-85, que añadió las que los temas escribían a
 * mano con un paso de escala). Las 53 primeras se extrajeron 1:1 del array inline que vivía en
 * `token-parity.mjs` (§4) — misma fuente de verdad, ahora compartida.
 */
export const SIZING = [
  // ── button (aura/component/common) ──────────────────────────────────────────
  { label: 'button.root.paddingX', group: 'CC', exp: 'button.padding.x', read: { path: 'components.button.root.paddingX' } },
  { label: 'button.root.paddingY', group: 'CC', exp: 'button.padding.y', read: { path: 'components.button.root.paddingY' } },
  { label: 'button.root.borderRadius', group: 'CC', exp: 'button.border.radius', read: { path: 'components.button.root.borderRadius' } },
  { label: 'button.root.gap', group: 'CC', exp: 'button.gap', read: { path: 'components.button.root.gap' } },
  { label: 'button.root.iconOnlyWidth', group: 'CC', exp: 'button.icon.only.width', read: { path: 'components.button.root.iconOnlyWidth' } },
  { label: 'button.root.roundedBorderRadius', group: 'CC', exp: 'button.rounded.border.radius', read: { path: 'components.button.root.roundedBorderRadius' } },
  { label: 'button.root.sm.fontSize', group: 'CC', exp: 'button.sm.font.size', read: { path: 'components.button.root.sm.fontSize' } },
  { label: 'button.root.sm.paddingX', group: 'CC', exp: 'button.sm.padding.x', read: { path: 'components.button.root.sm.paddingX' } },
  { label: 'button.root.sm.paddingY', group: 'CC', exp: 'button.sm.padding.y', read: { path: 'components.button.root.sm.paddingY' } },
  { label: 'button.root.sm.iconOnlyWidth', group: 'CC', exp: 'button.sm.icon.only.width', read: { path: 'components.button.root.sm.iconOnlyWidth' } },
  { label: 'button.root.lg.fontSize', group: 'CC', exp: 'button.lg.font.size', read: { path: 'components.button.root.lg.fontSize' } },
  { label: 'button.root.lg.paddingX', group: 'CC', exp: 'button.lg.padding.x', read: { path: 'components.button.root.lg.paddingX' } },
  { label: 'button.root.lg.paddingY', group: 'CC', exp: 'button.lg.padding.y', read: { path: 'components.button.root.lg.paddingY' } },
  { label: 'button.root.lg.iconOnlyWidth', group: 'CC', exp: 'button.lg.icon.only.width', read: { path: 'components.button.root.lg.iconOnlyWidth' } },
  // ── formField (aura/semantic/common) ────────────────────────────────────────
  { label: 'formField.paddingX', group: 'SC', exp: 'form.field.padding.x', read: { path: 'semantic.formField.paddingX' } },
  { label: 'formField.paddingY', group: 'SC', exp: 'form.field.padding.y', read: { path: 'semantic.formField.paddingY' } },
  { label: 'formField.borderRadius', group: 'SC', exp: 'form.field.border.radius', read: { path: 'semantic.formField.borderRadius' } },
  { label: 'formField.sm.fontSize', group: 'SC', exp: 'form.field.sm.font.size', read: { path: 'semantic.formField.sm.fontSize' } },
  { label: 'formField.sm.paddingX', group: 'SC', exp: 'form.field.sm.padding.x', read: { path: 'semantic.formField.sm.paddingX' } },
  { label: 'formField.sm.paddingY', group: 'SC', exp: 'form.field.sm.padding.y', read: { path: 'semantic.formField.sm.paddingY' } },
  { label: 'formField.lg.fontSize', group: 'SC', exp: 'form.field.lg.font.size', read: { path: 'semantic.formField.lg.fontSize' } },
  { label: 'formField.lg.paddingX', group: 'SC', exp: 'form.field.lg.padding.x', read: { path: 'semantic.formField.lg.paddingX' } },
  { label: 'formField.lg.paddingY', group: 'SC', exp: 'form.field.lg.padding.y', read: { path: 'semantic.formField.lg.paddingY' } },
  { label: 'iconSize', group: 'SC', exp: 'icon.size', read: { path: 'semantic.iconSize' } },
  // ── overlay (aura/semantic/common) ──────────────────────────────────────────
  { label: 'overlay.modal.padding', group: 'SC', exp: 'overlay.modal.padding', read: { path: 'semantic.overlay.modal.padding' } },
  { label: 'overlay.modal.borderRadius', group: 'SC', exp: 'overlay.modal.border.radius', read: { path: 'semantic.overlay.modal.borderRadius' } },
  { label: 'overlay.popover.padding', group: 'SC', exp: 'overlay.popover.padding', read: { path: 'semantic.overlay.popover.padding' } },
  { label: 'overlay.popover.borderRadius', group: 'SC', exp: 'overlay.popover.border.radius', read: { path: 'semantic.overlay.popover.borderRadius' } },
  { label: 'overlay.select.borderRadius', group: 'SC', exp: 'overlay.select.border.radius', read: { path: 'semantic.overlay.select.borderRadius' } },
  // ── tabs (aura/component/common) — paddings shorthand ───────────────────────
  { label: 'tabs.tab.gap', group: 'CC', exp: 'tabs.tab.gap', read: { path: 'components.tabs.tab.gap' } },
  { label: 'tabs.tab.paddingY', group: 'CC', exp: 'tabs.tab.padding.y', read: { path: 'components.tabs.tab.padding', index: 0 } },
  { label: 'tabs.tab.paddingX', group: 'CC', exp: 'tabs.tab.padding.x', read: { path: 'components.tabs.tab.padding', index: 1 } },
  { label: 'tabs.tabpanel.paddingTop', group: 'CC', exp: 'tabs.tabpanel.padding.top', read: { path: 'components.tabs.tabpanel.padding', index: 0 } },
  { label: 'tabs.tabpanel.paddingRight', group: 'CC', exp: 'tabs.tabpanel.padding.right', read: { path: 'components.tabs.tabpanel.padding', index: 1 } },
  { label: 'tabs.tabpanel.paddingBottom', group: 'CC', exp: 'tabs.tabpanel.padding.bottom', read: { path: 'components.tabs.tabpanel.padding', index: 2, fallback: 1 } },
  { label: 'tabs.tabpanel.paddingLeft', group: 'CC', exp: 'tabs.tabpanel.padding.left', read: { path: 'components.tabs.tabpanel.padding', index: 3, fallback: 1 } },
  // ── tooltip (aura/component/common) — padding shorthand ─────────────────────
  { label: 'tooltip.maxWidth', group: 'CC', exp: 'tooltip.max.width', read: { path: 'components.tooltip.root.maxWidth' } },
  { label: 'tooltip.gutter', group: 'CC', exp: 'tooltip.gutter', read: { path: 'components.tooltip.root.gutter' } },
  { label: 'tooltip.paddingY', group: 'CC', exp: 'tooltip.padding.y', read: { path: 'components.tooltip.root.padding', index: 0 } },
  { label: 'tooltip.paddingX', group: 'CC', exp: 'tooltip.padding.x', read: { path: 'components.tooltip.root.padding', index: 1 } },
  // ── divider (aura/component/common) — margins/paddings shorthand ────────────
  { label: 'divider.horizontal.marginY', group: 'CC', exp: 'divider.horizontal.margin.y', read: { path: 'components.divider.horizontal.margin', index: 0 } },
  { label: 'divider.horizontal.marginX', group: 'CC', exp: 'divider.horizontal.margin.x', read: { path: 'components.divider.horizontal.margin', index: 1 } },
  { label: 'divider.horizontal.content.paddingY', group: 'CC', exp: 'divider.horizontal.content.padding.y', read: { path: 'components.divider.horizontal.content.padding', index: 0 } },
  { label: 'divider.horizontal.content.paddingX', group: 'CC', exp: 'divider.horizontal.content.padding.x', read: { path: 'components.divider.horizontal.content.padding', index: 1 } },
  { label: 'divider.vertical.marginY', group: 'CC', exp: 'divider.vertical.margin.y', read: { path: 'components.divider.vertical.margin', index: 0 } },
  { label: 'divider.vertical.marginX', group: 'CC', exp: 'divider.vertical.margin.x', read: { path: 'components.divider.vertical.margin', index: 1 } },
  { label: 'divider.vertical.content.paddingY', group: 'CC', exp: 'divider.vertical.content.padding.y', read: { path: 'components.divider.vertical.content.padding', index: 0 } },
  { label: 'divider.vertical.content.paddingX', group: 'CC', exp: 'divider.vertical.content.padding.x', read: { path: 'components.divider.vertical.content.padding', index: 1 } },
  // ── toggleswitch (aura/component/common) ────────────────────────────────────
  { label: 'toggleswitch.width', group: 'CC', exp: 'toggleswitch.width', read: { path: 'components.toggleswitch.root.width' } },
  { label: 'toggleswitch.height', group: 'CC', exp: 'toggleswitch.height', read: { path: 'components.toggleswitch.root.height' } },
  { label: 'toggleswitch.gap', group: 'CC', exp: 'toggleswitch.gap', read: { path: 'components.toggleswitch.root.gap' } },
  { label: 'toggleswitch.handle.size', group: 'CC', exp: 'toggleswitch.handle.size', read: { path: 'components.toggleswitch.handle.size' } },
  { label: 'toggleswitch.handle.borderRadius', group: 'CC', exp: 'toggleswitch.handle.border.radius', read: { path: 'components.toggleswitch.handle.borderRadius' } },
  // ── DD-85 (2026-09-14): las medidas que los temas escribían a mano con un paso de escala
  //    (casilla, chip, avisos, toast, calendario, diálogo, etiqueta, desplegables) salen del
  //    export como el resto, para que un cambio de Figma llegue solo al código.
  { label: 'select.dropdown.width', group: 'CC', exp: 'select.dropdown.width', read: { path: 'components.select.dropdown.width' } },
  { label: 'select.checkmark.gutterStart', group: 'CC', exp: 'select.checkmark.gutter.start', read: { path: 'components.select.checkmark.gutterStart' } },
  { label: 'select.checkmark.gutterEnd', group: 'CC', exp: 'select.checkmark.gutter.end', read: { path: 'components.select.checkmark.gutterEnd' } },
  { label: 'multiselect.dropdown.width', group: 'CC', exp: 'multiselect.dropdown.width', read: { path: 'components.multiselect.dropdown.width' } },
  { label: 'multiselect.option.gap', group: 'CC', exp: 'multiselect.option.gap', read: { path: 'components.multiselect.option.gap' } },
  { label: 'datepicker.title.gap', group: 'CC', exp: 'datepicker.title.gap', read: { path: 'components.datepicker.title.gap' } },
  { label: 'datepicker.dropdown.width', group: 'CC', exp: 'datepicker.dropdown.width', read: { path: 'components.datepicker.dropdown.width' } },
  { label: 'datepicker.dropdown.sm.width', group: 'CC', exp: 'datepicker.dropdown.sm.width', read: { path: 'components.datepicker.dropdown.sm.width' } },
  { label: 'datepicker.dropdown.lg.width', group: 'CC', exp: 'datepicker.dropdown.lg.width', read: { path: 'components.datepicker.dropdown.lg.width' } },
  { label: 'datepicker.weekDay.padding', group: 'CC', exp: 'datepicker.week.day.padding', read: { path: 'components.datepicker.weekDay.padding' } },
  { label: 'datepicker.date.width', group: 'CC', exp: 'datepicker.date.width', read: { path: 'components.datepicker.date.width' } },
  { label: 'datepicker.date.height', group: 'CC', exp: 'datepicker.date.height', read: { path: 'components.datepicker.date.height' } },
  { label: 'datepicker.date.borderRadius', group: 'CC', exp: 'datepicker.date.border.radius', read: { path: 'components.datepicker.date.borderRadius' } },
  { label: 'datepicker.date.padding', group: 'CC', exp: 'datepicker.date.padding', read: { path: 'components.datepicker.date.padding' } },
  { label: 'datepicker.month.padding', group: 'CC', exp: 'datepicker.month.padding', read: { path: 'components.datepicker.month.padding' } },
  { label: 'datepicker.year.padding', group: 'CC', exp: 'datepicker.year.padding', read: { path: 'components.datepicker.year.padding' } },
  { label: 'datepicker.timePicker.gap', group: 'CC', exp: 'datepicker.time.picker.gap', read: { path: 'components.datepicker.timePicker.gap' } },
  { label: 'datepicker.timePicker.buttonGap', group: 'CC', exp: 'datepicker.time.picker.button.gap', read: { path: 'components.datepicker.timePicker.buttonGap' } },
  { label: 'checkbox.root.width', group: 'CC', exp: 'checkbox.width', read: { path: 'components.checkbox.root.width' } },
  { label: 'checkbox.root.height', group: 'CC', exp: 'checkbox.height', read: { path: 'components.checkbox.root.height' } },
  { label: 'checkbox.root.sm.width', group: 'CC', exp: 'checkbox.sm.width', read: { path: 'components.checkbox.root.sm.width' } },
  { label: 'checkbox.root.sm.height', group: 'CC', exp: 'checkbox.sm.height', read: { path: 'components.checkbox.root.sm.height' } },
  { label: 'checkbox.root.lg.width', group: 'CC', exp: 'checkbox.lg.width', read: { path: 'components.checkbox.root.lg.width' } },
  { label: 'checkbox.root.lg.height', group: 'CC', exp: 'checkbox.lg.height', read: { path: 'components.checkbox.root.lg.height' } },
  { label: 'checkbox.icon.size', group: 'CC', exp: 'checkbox.icon.size', read: { path: 'components.checkbox.icon.size' } },
  { label: 'checkbox.icon.sm.size', group: 'CC', exp: 'checkbox.icon.sm.size', read: { path: 'components.checkbox.icon.sm.size' } },
  { label: 'checkbox.icon.lg.size', group: 'CC', exp: 'checkbox.icon.lg.size', read: { path: 'components.checkbox.icon.lg.size' } },
  { label: 'dialog.header.gap', group: 'CC', exp: 'dialog.header.gap', read: { path: 'components.dialog.header.gap' } },
  { label: 'dialog.footer.gap', group: 'CC', exp: 'dialog.footer.gap', read: { path: 'components.dialog.footer.gap' } },
  { label: 'tag.root.gap', group: 'CC', exp: 'tag.gap', read: { path: 'components.tag.root.gap' } },
  { label: 'tag.icon.size', group: 'CC', exp: 'tag.icon.size', read: { path: 'components.tag.icon.size' } },
  { label: 'chip.root.borderRadius', group: 'CC', exp: 'chip.border.radius', read: { path: 'components.chip.root.borderRadius' } },
  { label: 'chip.root.paddingX', group: 'CC', exp: 'chip.padding.x', read: { path: 'components.chip.root.paddingX' } },
  { label: 'chip.root.paddingY', group: 'CC', exp: 'chip.padding.y', read: { path: 'components.chip.root.paddingY' } },
  { label: 'chip.root.gap', group: 'CC', exp: 'chip.gap', read: { path: 'components.chip.root.gap' } },
  { label: 'chip.image.width', group: 'CC', exp: 'chip.image.width', read: { path: 'components.chip.image.width' } },
  { label: 'chip.image.height', group: 'CC', exp: 'chip.image.height', read: { path: 'components.chip.image.height' } },
  { label: 'chip.icon.size', group: 'CC', exp: 'chip.icon.size', read: { path: 'components.chip.icon.size' } },
  { label: 'chip.removeIcon.size', group: 'CC', exp: 'chip.remove.icon.size', read: { path: 'components.chip.removeIcon.size' } },
  { label: 'message.content.gap', group: 'CC', exp: 'message.content.gap', read: { path: 'components.message.content.gap' } },
  { label: 'message.icon.size', group: 'CC', exp: 'message.icon.size', read: { path: 'components.message.icon.size' } },
  { label: 'message.icon.sm.size', group: 'CC', exp: 'message.icon.sm.size', read: { path: 'components.message.icon.sm.size' } },
  { label: 'message.icon.lg.size', group: 'CC', exp: 'message.icon.lg.size', read: { path: 'components.message.icon.lg.size' } },
  { label: 'message.closeButton.width', group: 'CC', exp: 'message.close.button.width', read: { path: 'components.message.closeButton.width' } },
  { label: 'message.closeButton.height', group: 'CC', exp: 'message.close.button.height', read: { path: 'components.message.closeButton.height' } },
  { label: 'message.closeButton.borderRadius', group: 'CC', exp: 'message.close.button.border.radius', read: { path: 'components.message.closeButton.borderRadius' } },
  { label: 'message.closeIcon.size', group: 'CC', exp: 'message.close.icon.size', read: { path: 'components.message.closeIcon.size' } },
  { label: 'message.closeIcon.sm.size', group: 'CC', exp: 'message.close.icon.sm.size', read: { path: 'components.message.closeIcon.sm.size' } },
  { label: 'message.closeIcon.lg.size', group: 'CC', exp: 'message.close.icon.lg.size', read: { path: 'components.message.closeIcon.lg.size' } },
  { label: 'toast.root.width', group: 'CC', exp: 'toast.width', read: { path: 'components.toast.root.width' } },
  { label: 'toast.icon.size', group: 'CC', exp: 'toast.icon.size', read: { path: 'components.toast.icon.size' } },
  { label: 'toast.content.gap', group: 'CC', exp: 'toast.content.gap', read: { path: 'components.toast.content.gap' } },
  { label: 'toast.text.gap', group: 'CC', exp: 'toast.text.gap', read: { path: 'components.toast.text.gap' } },
  { label: 'toast.closeButton.width', group: 'CC', exp: 'toast.close.button.width', read: { path: 'components.toast.closeButton.width' } },
  { label: 'toast.closeButton.height', group: 'CC', exp: 'toast.close.button.height', read: { path: 'components.toast.closeButton.height' } },
  { label: 'toast.closeButton.borderRadius', group: 'CC', exp: 'toast.close.button.border.radius', read: { path: 'components.toast.closeButton.borderRadius' } },
  { label: 'toast.closeIcon.size', group: 'CC', exp: 'toast.close.icon.size', read: { path: 'components.toast.closeIcon.size' } },
  // ── DD-86 (2026-09-14): el resto de medidas sueltas con un paso de escala en los temas, las que
  //    YA valen lo mismo que el Kit. Conectarlas no mueve nada en pantalla: solo hace que sigan a Figma.
  { label: 'accordion.header.padding', group: 'CC', exp: 'accordion.header.padding', read: { path: 'components.accordion.header.padding' } },
  { label: 'autocomplete.dropdown.width', group: 'CC', exp: 'autocomplete.dropdown.width', read: { path: 'components.autocomplete.dropdown.width' } },
  { label: 'autocomplete.dropdown.sm.width', group: 'CC', exp: 'autocomplete.dropdown.sm.width', read: { path: 'components.autocomplete.dropdown.sm.width' } },
  { label: 'autocomplete.dropdown.lg.width', group: 'CC', exp: 'autocomplete.dropdown.lg.width', read: { path: 'components.autocomplete.dropdown.lg.width' } },
  { label: 'avatar.root.width', group: 'CC', exp: 'avatar.width', read: { path: 'components.avatar.root.width' } },
  { label: 'avatar.root.height', group: 'CC', exp: 'avatar.height', read: { path: 'components.avatar.root.height' } },
  { label: 'avatar.icon.size', group: 'CC', exp: 'avatar.icon.size', read: { path: 'components.avatar.icon.size' } },
  { label: 'avatar.group.offset', group: 'CC', exp: 'avatar.group.offset', read: { path: 'components.avatar.group.offset' } },
  { label: 'avatar.lg.width', group: 'CC', exp: 'avatar.lg.width', read: { path: 'components.avatar.lg.width' } },
  { label: 'avatar.lg.height', group: 'CC', exp: 'avatar.lg.height', read: { path: 'components.avatar.lg.height' } },
  { label: 'avatar.lg.icon.size', group: 'CC', exp: 'avatar.lg.icon.size', read: { path: 'components.avatar.lg.icon.size' } },
  { label: 'avatar.lg.group.offset', group: 'CC', exp: 'avatar.lg.group.offset', read: { path: 'components.avatar.lg.group.offset' } },
  { label: 'avatar.xl.width', group: 'CC', exp: 'avatar.xl.width', read: { path: 'components.avatar.xl.width' } },
  { label: 'avatar.xl.height', group: 'CC', exp: 'avatar.xl.height', read: { path: 'components.avatar.xl.height' } },
  { label: 'avatar.xl.icon.size', group: 'CC', exp: 'avatar.xl.icon.size', read: { path: 'components.avatar.xl.icon.size' } },
  { label: 'avatar.xl.group.offset', group: 'CC', exp: 'avatar.xl.group.offset', read: { path: 'components.avatar.xl.group.offset' } },
  { label: 'badge.root.minWidth', group: 'CC', exp: 'badge.min.width', read: { path: 'components.badge.root.minWidth' } },
  { label: 'badge.root.height', group: 'CC', exp: 'badge.height', read: { path: 'components.badge.root.height' } },
  { label: 'badge.dot.size', group: 'CC', exp: 'badge.dot.size', read: { path: 'components.badge.dot.size' } },
  { label: 'badge.sm.minWidth', group: 'CC', exp: 'badge.sm.min.width', read: { path: 'components.badge.sm.minWidth' } },
  { label: 'badge.sm.height', group: 'CC', exp: 'badge.sm.height', read: { path: 'components.badge.sm.height' } },
  { label: 'badge.lg.minWidth', group: 'CC', exp: 'badge.lg.min.width', read: { path: 'components.badge.lg.minWidth' } },
  { label: 'badge.lg.height', group: 'CC', exp: 'badge.lg.height', read: { path: 'components.badge.lg.height' } },
  { label: 'badge.xl.minWidth', group: 'CC', exp: 'badge.xl.min.width', read: { path: 'components.badge.xl.minWidth' } },
  { label: 'badge.xl.height', group: 'CC', exp: 'badge.xl.height', read: { path: 'components.badge.xl.height' } },
  { label: 'breadcrumb.root.padding', group: 'CC', exp: 'breadcrumb.padding', read: { path: 'components.breadcrumb.root.padding' } },
  { label: 'breadcrumb.root.gap', group: 'CC', exp: 'breadcrumb.gap', read: { path: 'components.breadcrumb.root.gap' } },
  { label: 'card.body.padding', group: 'CC', exp: 'card.body.padding', read: { path: 'components.card.body.padding' } },
  { label: 'card.caption.gap', group: 'CC', exp: 'card.caption.gap', read: { path: 'components.card.caption.gap' } },
  { label: 'carousel.content.gap', group: 'CC', exp: 'carousel.content.gap', read: { path: 'components.carousel.content.gap' } },
  { label: 'carousel.indicatorList.padding', group: 'CC', exp: 'carousel.indicator.list.padding', read: { path: 'components.carousel.indicatorList.padding' } },
  { label: 'carousel.indicatorList.gap', group: 'CC', exp: 'carousel.indicator.list.gap', read: { path: 'components.carousel.indicatorList.gap' } },
  { label: 'carousel.indicator.width', group: 'CC', exp: 'carousel.indicator.width', read: { path: 'components.carousel.indicator.width' } },
  { label: 'carousel.indicator.height', group: 'CC', exp: 'carousel.indicator.height', read: { path: 'components.carousel.indicator.height' } },
  { label: 'cascadeselect.dropdown.width', group: 'CC', exp: 'cascadeselect.dropdown.width', read: { path: 'components.cascadeselect.dropdown.width' } },
  { label: 'cascadeselect.list.mobileIndent', group: 'CC', exp: 'cascadeselect.list.mobile.indent', read: { path: 'components.cascadeselect.list.mobileIndent' } },
  { label: 'cascadeselect.option.icon.size', group: 'CC', exp: 'cascadeselect.option.icon.size', read: { path: 'components.cascadeselect.option.icon.size' } },
  { label: 'confirmdialog.icon.size', group: 'CC', exp: 'confirmdialog.icon.size', read: { path: 'components.confirmdialog.icon.size' } },
  { label: 'confirmdialog.content.gap', group: 'CC', exp: 'confirmdialog.content.gap', read: { path: 'components.confirmdialog.content.gap' } },
  { label: 'confirmpopup.root.arrowOffset', group: 'CC', exp: 'confirmpopup.arrow.offset', read: { path: 'components.confirmpopup.root.arrowOffset' } },
  { label: 'confirmpopup.content.gap', group: 'CC', exp: 'confirmpopup.content.gap', read: { path: 'components.confirmpopup.content.gap' } },
  { label: 'confirmpopup.icon.size', group: 'CC', exp: 'confirmpopup.icon.size', read: { path: 'components.confirmpopup.icon.size' } },
  { label: 'confirmpopup.footer.gap', group: 'CC', exp: 'confirmpopup.footer.gap', read: { path: 'components.confirmpopup.footer.gap' } },
  { label: 'contextmenu.submenu.mobileIndent', group: 'CC', exp: 'contextmenu.submenu.mobile.indent', read: { path: 'components.contextmenu.submenu.mobileIndent' } },
  { label: 'dock.root.padding', group: 'CC', exp: 'dock.padding', read: { path: 'components.dock.root.padding' } },
  { label: 'dock.item.padding', group: 'CC', exp: 'dock.item.padding', read: { path: 'components.dock.item.padding' } },
  { label: 'dock.item.size', group: 'CC', exp: 'dock.item.size', read: { path: 'components.dock.item.size' } },
  { label: 'fieldset.legend.gap', group: 'CC', exp: 'fieldset.legend.gap', read: { path: 'components.fieldset.legend.gap' } },
  { label: 'fileupload.header.padding', group: 'CC', exp: 'fileupload.header.padding', read: { path: 'components.fileupload.header.padding' } },
  { label: 'fileupload.header.gap', group: 'CC', exp: 'fileupload.header.gap', read: { path: 'components.fileupload.header.gap' } },
  { label: 'fileupload.content.gap', group: 'CC', exp: 'fileupload.content.gap', read: { path: 'components.fileupload.content.gap' } },
  { label: 'fileupload.file.padding', group: 'CC', exp: 'fileupload.file.padding', read: { path: 'components.fileupload.file.padding' } },
  { label: 'fileupload.file.gap', group: 'CC', exp: 'fileupload.file.gap', read: { path: 'components.fileupload.file.gap' } },
  { label: 'fileupload.file.info.gap', group: 'CC', exp: 'fileupload.file.info.gap', read: { path: 'components.fileupload.file.info.gap' } },
  { label: 'fileupload.fileList.gap', group: 'CC', exp: 'fileupload.file.list.gap', read: { path: 'components.fileupload.fileList.gap' } },
  { label: 'fileupload.progressbar.height', group: 'CC', exp: 'fileupload.progressbar.height', read: { path: 'components.fileupload.progressbar.height' } },
  { label: 'fileupload.basic.gap', group: 'CC', exp: 'fileupload.basic.gap', read: { path: 'components.fileupload.basic.gap' } },
  { label: 'floatlabel.over.active.top', group: 'CC', exp: 'floatlabel.over.active.top', read: { path: 'components.floatlabel.over.active.top' } },
  { label: 'floatlabel.in.input.paddingTop', group: 'CC', exp: 'floatlabel.in.input.padding.top', read: { path: 'components.floatlabel.in.input.paddingTop' } },
  { label: 'galleria.navButton.size', group: 'CC', exp: 'galleria.nav.button.size', read: { path: 'components.galleria.navButton.size' } },
  { label: 'galleria.navButton.gutter', group: 'CC', exp: 'galleria.nav.button.gutter', read: { path: 'components.galleria.navButton.gutter' } },
  { label: 'galleria.navButton.prev.borderRadius', group: 'CC', exp: 'galleria.nav.button.prev.border.radius', read: { path: 'components.galleria.navButton.prev.borderRadius' } },
  { label: 'galleria.navButton.next.borderRadius', group: 'CC', exp: 'galleria.nav.button.next.border.radius', read: { path: 'components.galleria.navButton.next.borderRadius' } },
  { label: 'galleria.navIcon.size', group: 'CC', exp: 'galleria.nav.icon.size', read: { path: 'components.galleria.navIcon.size' } },
  { label: 'galleria.thumbnailNavButton.size', group: 'CC', exp: 'galleria.thumbnail.nav.button.size', read: { path: 'components.galleria.thumbnailNavButton.size' } },
  { label: 'galleria.thumbnailNavButton.gutter', group: 'CC', exp: 'galleria.thumbnail.nav.button.gutter', read: { path: 'components.galleria.thumbnailNavButton.gutter' } },
  { label: 'galleria.thumbnailNavButtonIcon.size', group: 'CC', exp: 'galleria.thumbnail.nav.button.icon.size', read: { path: 'components.galleria.thumbnailNavButtonIcon.size' } },
  { label: 'galleria.caption.padding', group: 'CC', exp: 'galleria.caption.padding', read: { path: 'components.galleria.caption.padding' } },
  { label: 'galleria.indicatorList.gap', group: 'CC', exp: 'galleria.indicator.list.gap', read: { path: 'components.galleria.indicatorList.gap' } },
  { label: 'galleria.indicatorList.padding', group: 'CC', exp: 'galleria.indicator.list.padding', read: { path: 'components.galleria.indicatorList.padding' } },
  { label: 'galleria.indicatorButton.width', group: 'CC', exp: 'galleria.indicator.button.width', read: { path: 'components.galleria.indicatorButton.width' } },
  { label: 'galleria.indicatorButton.height', group: 'CC', exp: 'galleria.indicator.button.height', read: { path: 'components.galleria.indicatorButton.height' } },
  { label: 'galleria.indicatorButton.borderRadius', group: 'CC', exp: 'galleria.indicator.button.border.radius', read: { path: 'components.galleria.indicatorButton.borderRadius' } },
  { label: 'galleria.closeButton.size', group: 'CC', exp: 'galleria.close.button.size', read: { path: 'components.galleria.closeButton.size' } },
  { label: 'galleria.closeButton.gutter', group: 'CC', exp: 'galleria.close.button.gutter', read: { path: 'components.galleria.closeButton.gutter' } },
  { label: 'galleria.closeButton.borderRadius', group: 'CC', exp: 'galleria.close.button.border.radius', read: { path: 'components.galleria.closeButton.borderRadius' } },
  { label: 'galleria.closeButtonIcon.size', group: 'CC', exp: 'galleria.close.button.icon.size', read: { path: 'components.galleria.closeButtonIcon.size' } },
  { label: 'iftalabel.input.paddingTop', group: 'CC', exp: 'iftalabel.input.padding.top', read: { path: 'components.iftalabel.input.paddingTop' } },
  { label: 'image.preview.icon.size', group: 'CC', exp: 'image.preview.icon.size', read: { path: 'components.image.preview.icon.size' } },
  { label: 'image.toolbar.position.right', group: 'CC', exp: 'image.toolbar.position.right', read: { path: 'components.image.toolbar.position.right' } },
  { label: 'image.toolbar.position.top', group: 'CC', exp: 'image.toolbar.position.top', read: { path: 'components.image.toolbar.position.top' } },
  { label: 'image.toolbar.padding', group: 'CC', exp: 'image.toolbar.padding', read: { path: 'components.image.toolbar.padding' } },
  { label: 'image.toolbar.gap', group: 'CC', exp: 'image.toolbar.gap', read: { path: 'components.image.toolbar.gap' } },
  { label: 'image.action.size', group: 'CC', exp: 'image.action.size', read: { path: 'components.image.action.size' } },
  { label: 'image.action.iconSize', group: 'CC', exp: 'image.action.icon.size', read: { path: 'components.image.action.iconSize' } },
  { label: 'image.action.borderRadius', group: 'CC', exp: 'image.action.border.radius', read: { path: 'components.image.action.borderRadius' } },
  { label: 'inputgroup.addon.padding', group: 'CC', exp: 'inputgroup.addon.padding', read: { path: 'components.inputgroup.addon.padding' } },
  { label: 'inputgroup.addon.minWidth', group: 'CC', exp: 'inputgroup.addon.min.width', read: { path: 'components.inputgroup.addon.minWidth' } },
  { label: 'inputnumber.button.width', group: 'CC', exp: 'inputnumber.button.width', read: { path: 'components.inputnumber.button.width' } },
  { label: 'inputotp.root.gap', group: 'CC', exp: 'inputotp.gap', read: { path: 'components.inputotp.root.gap' } },
  { label: 'inputotp.input.width', group: 'CC', exp: 'inputotp.input.width', read: { path: 'components.inputotp.input.width' } },
  { label: 'inputotp.input.sm.width', group: 'CC', exp: 'inputotp.input.sm.width', read: { path: 'components.inputotp.input.sm.width' } },
  { label: 'inputotp.input.lg.width', group: 'CC', exp: 'inputotp.input.lg.width', read: { path: 'components.inputotp.input.lg.width' } },
  { label: 'listbox.checkmark.gutterStart', group: 'CC', exp: 'listbox.checkmark.gutter.start', read: { path: 'components.listbox.checkmark.gutterStart' } },
  { label: 'listbox.checkmark.gutterEnd', group: 'CC', exp: 'listbox.checkmark.gutter.end', read: { path: 'components.listbox.checkmark.gutterEnd' } },
  { label: 'megamenu.root.gap', group: 'CC', exp: 'megamenu.gap', read: { path: 'components.megamenu.root.gap' } },
  { label: 'megamenu.root.horizontalOrientation.gap', group: 'CC', exp: 'megamenu.horizontal.orientation.gap', read: { path: 'components.megamenu.root.horizontalOrientation.gap' } },
  { label: 'megamenu.overlay.gap', group: 'CC', exp: 'megamenu.overlay.gap', read: { path: 'components.megamenu.overlay.gap' } },
  { label: 'megamenu.mobileButton.borderRadius', group: 'CC', exp: 'megamenu.mobile.button.border.radius', read: { path: 'components.megamenu.mobileButton.borderRadius' } },
  { label: 'megamenu.mobileButton.size', group: 'CC', exp: 'megamenu.mobile.button.size', read: { path: 'components.megamenu.mobileButton.size' } },
  { label: 'menubar.root.gap', group: 'CC', exp: 'menubar.gap', read: { path: 'components.menubar.root.gap' } },
  { label: 'menubar.submenu.mobileIndent', group: 'CC', exp: 'menubar.submenu.mobile.indent', read: { path: 'components.menubar.submenu.mobileIndent' } },
  { label: 'menubar.mobileButton.borderRadius', group: 'CC', exp: 'menubar.mobile.button.border.radius', read: { path: 'components.menubar.mobileButton.borderRadius' } },
  { label: 'menubar.mobileButton.size', group: 'CC', exp: 'menubar.mobile.button.size', read: { path: 'components.menubar.mobileButton.size' } },
  { label: 'metergroup.root.gap', group: 'CC', exp: 'metergroup.gap', read: { path: 'components.metergroup.root.gap' } },
  { label: 'metergroup.meters.size', group: 'CC', exp: 'metergroup.meters.size', read: { path: 'components.metergroup.meters.size' } },
  { label: 'metergroup.label.gap', group: 'CC', exp: 'metergroup.label.gap', read: { path: 'components.metergroup.label.gap' } },
  { label: 'metergroup.labelMarker.size', group: 'CC', exp: 'metergroup.label.marker.size', read: { path: 'components.metergroup.labelMarker.size' } },
  { label: 'metergroup.labelIcon.size', group: 'CC', exp: 'metergroup.label.icon.size', read: { path: 'components.metergroup.labelIcon.size' } },
  { label: 'metergroup.labelList.verticalGap', group: 'CC', exp: 'metergroup.label.list.vertical.gap', read: { path: 'components.metergroup.labelList.verticalGap' } },
  { label: 'metergroup.labelList.horizontalGap', group: 'CC', exp: 'metergroup.label.list.horizontal.gap', read: { path: 'components.metergroup.labelList.horizontalGap' } },
  { label: 'orderlist.root.gap', group: 'CC', exp: 'orderlist.gap', read: { path: 'components.orderlist.root.gap' } },
  { label: 'orderlist.controls.gap', group: 'CC', exp: 'orderlist.controls.gap', read: { path: 'components.orderlist.controls.gap' } },
  { label: 'organizationchart.root.gutter', group: 'CC', exp: 'organizationchart.gutter', read: { path: 'components.organizationchart.root.gutter' } },
  { label: 'organizationchart.nodeToggleButton.size', group: 'CC', exp: 'organizationchart.node.toggle.button.size', read: { path: 'components.organizationchart.nodeToggleButton.size' } },
  { label: 'organizationchart.nodeToggleButton.borderRadius', group: 'CC', exp: 'organizationchart.node.toggle.button.border.radius', read: { path: 'components.organizationchart.nodeToggleButton.borderRadius' } },
  { label: 'paginator.root.gap', group: 'CC', exp: 'paginator.gap', read: { path: 'components.paginator.root.gap' } },
  { label: 'paginator.navButton.width', group: 'CC', exp: 'paginator.nav.button.width', read: { path: 'components.paginator.navButton.width' } },
  { label: 'paginator.navButton.height', group: 'CC', exp: 'paginator.nav.button.height', read: { path: 'components.paginator.navButton.height' } },
  { label: 'paginator.navButton.borderRadius', group: 'CC', exp: 'paginator.nav.button.border.radius', read: { path: 'components.paginator.navButton.borderRadius' } },
  { label: 'paginator.jumpToPageInput.maxWidth', group: 'CC', exp: 'paginator.jump.to.page.input.max.width', read: { path: 'components.paginator.jumpToPageInput.maxWidth' } },
  { label: 'panel.header.padding', group: 'CC', exp: 'panel.header.padding', read: { path: 'components.panel.header.padding' } },
  { label: 'panelmenu.root.gap', group: 'CC', exp: 'panelmenu.gap', read: { path: 'components.panelmenu.root.gap' } },
  { label: 'panelmenu.item.gap', group: 'CC', exp: 'panelmenu.item.gap', read: { path: 'components.panelmenu.item.gap' } },
  { label: 'panelmenu.submenu.indent', group: 'CC', exp: 'panelmenu.submenu.indent', read: { path: 'components.panelmenu.submenu.indent' } },
  { label: 'password.meter.height', group: 'CC', exp: 'password.meter.height', read: { path: 'components.password.meter.height' } },
  { label: 'password.content.gap', group: 'CC', exp: 'password.content.gap', read: { path: 'components.password.content.gap' } },
  { label: 'picklist.root.gap', group: 'CC', exp: 'picklist.gap', read: { path: 'components.picklist.root.gap' } },
  { label: 'picklist.controls.gap', group: 'CC', exp: 'picklist.controls.gap', read: { path: 'components.picklist.controls.gap' } },
  { label: 'popover.root.arrowOffset', group: 'CC', exp: 'popover.arrow.offset', read: { path: 'components.popover.root.arrowOffset' } },
  { label: 'progressbar.root.height', group: 'CC', exp: 'progressbar.height', read: { path: 'components.progressbar.root.height' } },
  { label: 'radiobutton.root.width', group: 'CC', exp: 'radiobutton.width', read: { path: 'components.radiobutton.root.width' } },
  { label: 'radiobutton.root.height', group: 'CC', exp: 'radiobutton.height', read: { path: 'components.radiobutton.root.height' } },
  { label: 'radiobutton.root.sm.width', group: 'CC', exp: 'radiobutton.sm.width', read: { path: 'components.radiobutton.root.sm.width' } },
  { label: 'radiobutton.root.sm.height', group: 'CC', exp: 'radiobutton.sm.height', read: { path: 'components.radiobutton.root.sm.height' } },
  { label: 'radiobutton.root.lg.width', group: 'CC', exp: 'radiobutton.lg.width', read: { path: 'components.radiobutton.root.lg.width' } },
  { label: 'radiobutton.root.lg.height', group: 'CC', exp: 'radiobutton.lg.height', read: { path: 'components.radiobutton.root.lg.height' } },
  { label: 'radiobutton.icon.size', group: 'CC', exp: 'radiobutton.icon.size', read: { path: 'components.radiobutton.icon.size' } },
  { label: 'radiobutton.icon.sm.size', group: 'CC', exp: 'radiobutton.icon.sm.size', read: { path: 'components.radiobutton.icon.sm.size' } },
  { label: 'radiobutton.icon.lg.size', group: 'CC', exp: 'radiobutton.icon.lg.size', read: { path: 'components.radiobutton.icon.lg.size' } },
  { label: 'rating.root.gap', group: 'CC', exp: 'rating.gap', read: { path: 'components.rating.root.gap' } },
  { label: 'rating.icon.size', group: 'CC', exp: 'rating.icon.size', read: { path: 'components.rating.icon.size' } },
  { label: 'slider.handle.content.width', group: 'CC', exp: 'slider.handle.content.width', read: { path: 'components.slider.handle.content.width' } },
  { label: 'slider.handle.content.height', group: 'CC', exp: 'slider.handle.content.height', read: { path: 'components.slider.handle.content.height' } },
  { label: 'speeddial.root.gap', group: 'CC', exp: 'speeddial.gap', read: { path: 'components.speeddial.root.gap' } },
  { label: 'splitbutton.root.roundedBorderRadius', group: 'CC', exp: 'splitbutton.rounded.border.radius', read: { path: 'components.splitbutton.root.roundedBorderRadius' } },
  { label: 'stepper.step.padding', group: 'CC', exp: 'stepper.step.padding', read: { path: 'components.stepper.step.padding' } },
  { label: 'stepper.step.gap', group: 'CC', exp: 'stepper.step.gap', read: { path: 'components.stepper.step.gap' } },
  { label: 'stepper.stepHeader.gap', group: 'CC', exp: 'stepper.step.header.gap', read: { path: 'components.stepper.stepHeader.gap' } },
  { label: 'stepper.stepNumber.size', group: 'CC', exp: 'stepper.step.number.size', read: { path: 'components.stepper.stepNumber.size' } },
  { label: 'stepper.stepNumber.borderRadius', group: 'CC', exp: 'stepper.step.number.border.radius', read: { path: 'components.stepper.stepNumber.borderRadius' } },
  { label: 'tabs.navButton.width', group: 'CC', exp: 'tabs.nav.button.width', read: { path: 'components.tabs.navButton.width' } },
  { label: 'terminal.root.height', group: 'CC', exp: 'terminal.height', read: { path: 'components.terminal.root.height' } },
  { label: 'terminal.prompt.gap', group: 'CC', exp: 'terminal.prompt.gap', read: { path: 'components.terminal.prompt.gap' } },
  { label: 'tieredmenu.submenu.mobileIndent', group: 'CC', exp: 'tieredmenu.submenu.mobile.indent', read: { path: 'components.tieredmenu.submenu.mobileIndent' } },
  { label: 'timeline.event.minHeight', group: 'CC', exp: 'timeline.event.min.height', read: { path: 'components.timeline.event.minHeight' } },
  { label: 'timeline.eventMarker.size', group: 'CC', exp: 'timeline.event.marker.size', read: { path: 'components.timeline.eventMarker.size' } },
  { label: 'timeline.eventMarker.content.size', group: 'CC', exp: 'timeline.event.marker.content.size', read: { path: 'components.timeline.eventMarker.content.size' } },
  { label: 'togglebutton.root.padding', group: 'CC', exp: 'togglebutton.padding', read: { path: 'components.togglebutton.root.padding' } },
  { label: 'togglebutton.root.gap', group: 'CC', exp: 'togglebutton.gap', read: { path: 'components.togglebutton.root.gap' } },
  { label: 'togglebutton.root.sm.padding', group: 'CC', exp: 'togglebutton.sm.padding', read: { path: 'components.togglebutton.root.sm.padding' } },
  { label: 'togglebutton.root.lg.padding', group: 'CC', exp: 'togglebutton.lg.padding', read: { path: 'components.togglebutton.root.lg.padding' } },
  { label: 'toolbar.root.gap', group: 'CC', exp: 'toolbar.gap', read: { path: 'components.toolbar.root.gap' } },
  { label: 'toolbar.root.padding', group: 'CC', exp: 'toolbar.padding', read: { path: 'components.toolbar.root.padding' } },
  { label: 'tree.root.padding', group: 'CC', exp: 'tree.padding', read: { path: 'components.tree.root.padding' } },
  { label: 'tree.root.indent', group: 'CC', exp: 'tree.indent', read: { path: 'components.tree.root.indent' } },
  { label: 'tree.node.gap', group: 'CC', exp: 'tree.node.gap', read: { path: 'components.tree.node.gap' } },
  { label: 'tree.nodeToggleButton.borderRadius', group: 'CC', exp: 'tree.node.toggle.button.border.radius', read: { path: 'components.tree.nodeToggleButton.borderRadius' } },
  { label: 'tree.nodeToggleButton.size', group: 'CC', exp: 'tree.node.toggle.button.size', read: { path: 'components.tree.nodeToggleButton.size' } },
  { label: 'tree.loadingIcon.size', group: 'CC', exp: 'tree.loading.icon.size', read: { path: 'components.tree.loadingIcon.size' } },
  { label: 'tree.filter.margin', group: 'CC', exp: 'tree.filter.margin', read: { path: 'components.tree.filter.margin' } },
  { label: 'treeselect.dropdown.width', group: 'CC', exp: 'treeselect.dropdown.width', read: { path: 'components.treeselect.dropdown.width' } },
  { label: 'treetable.headerCell.gap', group: 'CC', exp: 'treetable.header.cell.gap', read: { path: 'components.treetable.headerCell.gap' } },
  { label: 'treetable.bodyCell.gap', group: 'CC', exp: 'treetable.body.cell.gap', read: { path: 'components.treetable.bodyCell.gap' } },
  { label: 'treetable.columnResizer.width', group: 'CC', exp: 'treetable.column.resizer.width', read: { path: 'components.treetable.columnResizer.width' } },
  { label: 'treetable.sortIcon.size', group: 'CC', exp: 'treetable.sort.icon.size', read: { path: 'components.treetable.sortIcon.size' } },
  { label: 'treetable.loadingIcon.size', group: 'CC', exp: 'treetable.loading.icon.size', read: { path: 'components.treetable.loadingIcon.size' } },
  { label: 'treetable.nodeToggleButton.size', group: 'CC', exp: 'treetable.node.toggle.button.size', read: { path: 'components.treetable.nodeToggleButton.size' } },
  { label: 'treetable.nodeToggleButton.borderRadius', group: 'CC', exp: 'treetable.node.toggle.button.border.radius', read: { path: 'components.treetable.nodeToggleButton.borderRadius' } },
  { label: 'virtualscroller.loader.icon.size', group: 'CC', exp: 'virtualscroller.loader.icon.size', read: { path: 'components.virtualscroller.loader.icon.size' } },
];

/**
 * Divergencias de sizing CONSCIENTES (opt-in). Análogo al `DIVERGE` de color.
 * Una fila aquí: (1) el generador NO la auto-sobrescribe, (2) parity la informa en
 * vez de fallar. Vacío hoy — todo el sizing es 1:1 con el export. Para divergir un
 * slot a propósito: añadir `{ label, reason }` (único toque humano del loop).
 */
/** @type {{ label: string, reason: string }[]} */
export const DIVERGE_SIZING = [];
