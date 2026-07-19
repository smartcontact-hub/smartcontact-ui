/**
 * Fuente ÚNICA del COLOR de marca (export DTCG ↔ --sc-* ↔ token generado).
 *
 * La consumen DOS scripts (igual que `sizing-map.mjs` para el sizing):
 *   - `token-parity.mjs` §6 — GATE: cada fila `enforce` debe cuadrar export↔--sc-*
 *     (resuelto a hex, light+dark); las `diverge` se informan, no fallan.
 *   - `token-gen-color.mjs` — escribe las filas enforce GENERABLES (las semánticas,
 *     no las primitivas `sc-color-*`) en las zonas `@sc-gen:semantic-color-{light,dark}`
 *     de `02-semantic.css` / `07-dark.css`, como `var(--sc-color-*)`.
 *
 * Cada fila:
 *   - `mode`   : 'light' | 'dark' — grupo del export (`aura/semantic/<mode>`).
 *   - `exp`    : ruta del token en ese grupo (se resuelve siguiendo refs DTCG → hex).
 *   - `token`  : nombre `--sc-*` destino (SIN el `--`). En `diverge` es `null`.
 *   - `kind`   : 'enforce' (1:1 con el export) | 'diverge' (divergencia consciente).
 *   - `reason` : solo en `diverge` — por qué diverge (lo informa parity).
 *
 * GENERABLE vs no: el generador solo escribe las filas enforce cuyo `token` NO es una
 * primitiva (`isGenerated`). Las filas `surface.*` → `sc-color-slate-*` son primitivas
 * que posee el generador de primitivos (`token-gen.mjs`, zona `@sc-gen:palette`); aquí
 * están solo para que `parity` las cruce.
 *
 * Extraído 1:1 de los arrays inline que vivían en `token-parity.mjs` §6 — misma fuente
 * de verdad, ahora compartida (mismo patrón que `sizing-map.mjs`).
 */

/** Pasos de la rampa de superficie (light) — cruzan contra las primitivas gray. */
export const SURFACE_STEPS = ['0', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

export const COLOR = [
  // ── surface ramp (light) → primitivas --sc-color-slate-* ───────────────────────
  //    (el Kit nombra la rampa `slate`; nuestra `gray` ES esa rampa, renombrada).
  //    enforce para parity; NO generables (las posee `token-gen.mjs`).
  ...SURFACE_STEPS.map((s) => ({
    mode: 'light',
    exp: `surface.${s}`,
    token: s === '0' ? 'sc-color-slate-0' : `sc-color-slate-${s}`,
    kind: 'enforce',
  })),

  // ── primary de marca (light) ──────────────────────────────────────────────────
  { mode: 'light', exp: 'primary.color', token: 'sc-bg-primary', kind: 'enforce' },
  { mode: 'light', exp: 'primary.hover.color', token: 'sc-bg-primary-hover', kind: 'enforce' },
  { mode: 'light', exp: 'primary.active.color', token: 'sc-bg-primary-active', kind: 'enforce' },
  { mode: 'light', exp: 'primary.contrast.color', token: 'sc-text-on-primary', kind: 'enforce' },
  // ── content / text (light) ────────────────────────────────────────────────────
  { mode: 'light', exp: 'content.background', token: 'sc-bg-surface', kind: 'enforce' },
  { mode: 'light', exp: 'content.border.color', token: 'sc-border-default', kind: 'enforce' },
  { mode: 'light', exp: 'content.color', token: 'sc-text-primary', kind: 'enforce' },
  { mode: 'light', exp: 'content.hover.background', token: 'sc-bg-secondary-hover', kind: 'enforce' },
  { mode: 'light', exp: 'text.color', token: 'sc-text-primary', kind: 'enforce' },
  // ── form field (light) ────────────────────────────────────────────────────────
  { mode: 'light', exp: 'form.field.background', token: 'sc-bg-surface', kind: 'enforce' },
  { mode: 'light', exp: 'form.field.color', token: 'sc-text-primary', kind: 'enforce' },
  { mode: 'light', exp: 'form.field.focus.border.color', token: 'sc-bg-primary', kind: 'enforce' },
  { mode: 'light', exp: 'form.field.hover.border.color', token: 'sc-border-strong', kind: 'enforce' },
  { mode: 'light', exp: 'form.field.disabled.background', token: 'sc-bg-disabled', kind: 'enforce' },
  { mode: 'light', exp: 'form.field.invalid.border.color', token: 'sc-border-error', kind: 'enforce' },
  { mode: 'light', exp: 'form.field.icon.color', token: 'sc-icon-subtle', kind: 'enforce' },
  // ── navigation (light) ────────────────────────────────────────────────────────
  { mode: 'light', exp: 'navigation.item.color', token: 'sc-text-primary', kind: 'enforce' },
  { mode: 'light', exp: 'navigation.item.icon.color', token: 'sc-icon-subtle', kind: 'enforce' },
  { mode: 'light', exp: 'navigation.item.active.background', token: 'sc-bg-secondary-hover', kind: 'enforce' },
  // ── list (light) ──────────────────────────────────────────────────────────────
  { mode: 'light', exp: 'list.option.color', token: 'sc-text-primary', kind: 'enforce' },
  { mode: 'light', exp: 'list.option.focus.background', token: 'sc-bg-secondary-hover', kind: 'enforce' },
  // ── overlay (light) ───────────────────────────────────────────────────────────
  { mode: 'light', exp: 'overlay.modal.background', token: 'sc-bg-surface', kind: 'enforce' },
  { mode: 'light', exp: 'overlay.modal.border.color', token: 'sc-border-default', kind: 'enforce' },
  { mode: 'light', exp: 'overlay.popover.background', token: 'sc-bg-surface', kind: 'enforce' },
  { mode: 'light', exp: 'overlay.popover.border.color', token: 'sc-border-default', kind: 'enforce' },

  // ── primary de marca (dark) ───────────────────────────────────────────────────
  //    Lo ÚNICO 1:1 con el Kit en dark; el resto del dark es divergencia consciente.
  { mode: 'dark', exp: 'primary.color', token: 'sc-bg-primary', kind: 'enforce' },
  { mode: 'dark', exp: 'primary.hover.color', token: 'sc-bg-primary-hover', kind: 'enforce' },
  { mode: 'dark', exp: 'primary.active.color', token: 'sc-bg-primary-active', kind: 'enforce' },

  // ── DIVERGENCIAS CONSCIENTES (opt-in) ─────────────────────────────────────────
  //    El generador NO las escribe; parity las informa (no fallan). Para divergir un
  //    color a propósito: mover su fila enforce a aquí (kind:'diverge', token:null, reason).
  { mode: 'dark', exp: 'surface.*', token: null, kind: 'diverge', reason: 'gray-* navy-tinted (el Kit usa zinc en dark) — paleta de marca SC' },
  { mode: 'dark', exp: 'primary.contrast.color', token: null, kind: 'diverge', reason: 'texto sobre primario dark = gray-900 navy-tinted vs zinc-900 del Kit (misma divergencia que surface.*)' },
  { mode: 'light', exp: 'form.field.border.color', token: null, kind: 'diverge', reason: 'borde de input gray-200 (=content/overlay) vs Kit surface-300 — 1 paso, jerarquía propia' },
  { mode: 'light', exp: 'form.field.placeholder.color', token: null, kind: 'diverge', reason: 'placeholder gray-400 vs Kit surface-500 — un punto más tenue' },
  { mode: 'light', exp: 'form.field.disabled.color', token: null, kind: 'diverge', reason: 'disabled gray-300 vs Kit surface-500 — más tenue a propósito' },
  { mode: 'light', exp: 'overlay.select.background', token: null, kind: 'diverge', reason: '--sc-bg-elevated (elevación propia) vs Kit surface-0' },
  { mode: 'light', exp: 'text.muted.color', token: null, kind: 'diverge', reason: 'texto secundario slate-600 vs Kit surface-500: el del Kit da 2.95:1 sobre blanco, bajo AA en sus 178 usos. Mismo movimiento que accent en customs-catalog §1.4 (cyan-600 3.46 → sky-600). Revertir cuando el Kit suba el suyo.' },
  { mode: 'dark', exp: 'overlay/content/form.field', token: null, kind: 'diverge', reason: 'resuelven vía capa 7 (.sc-dark, navy-tinted) — no se cruzan contra el zinc del Kit' },
];

/** Filas que parity FUERZA (deben cuadrar 1:1 con el export). */
export const ENFORCE = COLOR.filter((r) => r.kind === 'enforce');

/** Divergencias conscientes (parity las informa, no fallan). */
export const DIVERGE = COLOR.filter((r) => r.kind === 'diverge');

/**
 * ¿La fila la ESCRIBE el generador de color? Enforce + token semántico (no primitiva
 * `sc-color-*`). Las `surface.*` quedan fuera: las posee el generador de primitivos.
 */
export const isGenerated = (r) => r.kind === 'enforce' && !r.token.startsWith('sc-color-');

/** Filas que el generador de color materializa en las zonas `@sc-gen:semantic-color-*`. */
export const GENERATED = ENFORCE.filter(isGenerated);
