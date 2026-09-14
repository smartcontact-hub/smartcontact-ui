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
];

/**
 * Divergencias de sizing CONSCIENTES (opt-in). Análogo al `DIVERGE` de color.
 * Una fila aquí: (1) el generador NO la auto-sobrescribe, (2) parity la informa en
 * vez de fallar. Vacío hoy — todo el sizing es 1:1 con el export. Para divergir un
 * slot a propósito: añadir `{ label, reason }` (único toque humano del loop).
 */
/** @type {{ label: string, reason: string }[]} */
export const DIVERGE_SIZING = [];
