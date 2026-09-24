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
  { mode: 'light', exp: 'form.field.icon.color', token: null, kind: 'diverge', reason: 'icono de campo slate-600 vs Kit surface-400: el del Kit da 2.04:1 sobre blanco y un icono necesita 3:1 (WCAG 1.4.11). slate-500 tampoco llega (2.95). Mismo movimiento y mismo motivo que text.muted.color — que YA revirtió: el sync del 2026-08-24 trajo el Kit a slate-600 y esa fila volvió a enforce. O sea que esta condición no es teórica, dispara. Revertir cuando el Kit suba también el suyo (hoy sigue en surface-400, verificado contra el export del 24-ago).' },
  // ── navigation (light) ────────────────────────────────────────────────────────
  { mode: 'light', exp: 'navigation.item.color', token: 'sc-text-primary', kind: 'enforce' },
  { mode: 'light', exp: 'navigation.item.icon.color', token: null, kind: 'diverge', reason: 'icono de navegación slate-600 vs Kit surface-400: mismo token y mismo motivo que form.field.icon.color — 2.04:1, por debajo del 3:1 de 1.4.11.' },
  { mode: 'light', exp: 'navigation.item.active.background', token: 'sc-bg-secondary-hover', kind: 'enforce' },
  // ── list (light) ──────────────────────────────────────────────────────────────
  { mode: 'light', exp: 'list.option.color', token: 'sc-text-primary', kind: 'enforce' },
  { mode: 'light', exp: 'list.option.focus.background', token: 'sc-bg-secondary-hover', kind: 'enforce' },
  // ── overlay (light) ───────────────────────────────────────────────────────────
  { mode: 'light', exp: 'overlay.modal.background', token: 'sc-bg-surface', kind: 'enforce' },
  { mode: 'light', exp: 'overlay.modal.border.color', token: 'sc-border-default', kind: 'enforce' },
  { mode: 'light', exp: 'overlay.popover.background', token: 'sc-bg-surface', kind: 'enforce' },
  { mode: 'light', exp: 'overlay.popover.border.color', token: 'sc-border-default', kind: 'enforce' },

  // ── primary de marca (dark) = Kit, con el patrón de Aura en `sky` (DD-81) ──────
  //    Aura pinta el primario oscuro CLARO con texto oscuro, y hover y pulsado aún más
  //    claros, porque ese color también es texto (botón de texto, contornos, cursor)
  //    sobre el fondo oscuro. Los pasos se eligen por CLARIDAD, no por número: el
  //    esmeralda-400 de Aura (L77) es nuestro sky-300 (L76). Base 8,24:1, deshabilitado
  //    3,77:1, como texto sobre zinc-900 8,24:1. Sustituye a DD-40 (azul 300 con texto
  //    oscuro: deshabilitado a 2,73:1).
  { mode: 'dark', exp: 'primary.color', token: 'sc-bg-primary', kind: 'enforce' },
  { mode: 'dark', exp: 'primary.hover.color', token: 'sc-bg-primary-hover', kind: 'enforce' },
  { mode: 'dark', exp: 'primary.active.color', token: 'sc-bg-primary-active', kind: 'enforce' },
  { mode: 'dark', exp: 'primary.contrast.color', token: 'sc-text-on-primary', kind: 'enforce' },

  // ── texto deshabilitado = Kit y Aura (`surface.500` claro, `surface.400` oscuro), DD-81 ──
  //    Antes, en claro, «más tenue a propósito» (slate-300): 1,21:1 sobre el fondo de campo
  //    deshabilitado, y en oscuro zinc-600 a 1,35:1. El texto no se leía. Ahora 2,20 y 4,07
  //    (APCA pide Lc 30 a lo deshabilitado: Lc 37 y 42). WCAG 1.4.3 exime a lo inactivo.
  { mode: 'light', exp: 'form.field.disabled.color', token: 'sc-text-disabled', kind: 'enforce' },
  { mode: 'dark', exp: 'form.field.disabled.color', token: 'sc-text-disabled', kind: 'enforce' },

  // ── DIVERGENCIAS CONSCIENTES (opt-in) ─────────────────────────────────────────
  //    El generador NO las escribe; parity las informa (no fallan). Para divergir un
  //    color a propósito: mover su fila enforce a aquí (kind:'diverge', token:null, reason).
  // Borde de campo: fue divergencia («gray-200, jerarquía propia», 1,34:1) hasta DD-87 (2026-09-14), que lo
  // devuelve a Aura quitando el override del tema. Ahora el tema pinta `{surface.300}`, lo mismo que el Kit.
  { mode: 'light', exp: 'form.field.border.color', token: 'sc-color-slate-300', kind: 'enforce' },
  { mode: 'light', exp: 'form.field.placeholder.color', token: null, kind: 'diverge', reason: 'placeholder slate-600 vs Kit surface-500: con el gris de marca el 500 da 2,95:1 sobre blanco, bajo AA. DD-87.' },
  { mode: 'light', exp: 'overlay.select.background', token: null, kind: 'diverge', reason: '--sc-bg-elevated (elevación propia) vs Kit surface-0' },
  // `text.muted.color` FUE divergencia de marca desde julio (el Kit daba surface-500 = 2.95:1 sobre
  // blanco, bajo AA en sus 178 usos) y volvió a enforce el 2026-08-24: el sync del Theme Designer
  // (`e3f84f1`) trajo el export diciendo `{slate.600}`, o sea el MISMO valor que habíamos puesto a
  // mano. La condición de reversión escrita entonces —«revertir cuando el Kit suba el suyo»— se
  // cumplió sola. Sus dos aliases (`list.option.group.color`, `navigation.submenu.label.color`) la siguen.
  { mode: 'light', exp: 'text.muted.color', token: 'sc-text-secondary', kind: 'enforce' },

  // ── NEUTROS DEL MODO OSCURO = KIT (zinc), desde el 2026-09-13 ────────────────
  //    Hasta hoy eran divergencia de marca («gray-* navy-tinted, el Kit usa zinc»), y de
  //    ahí salían 262 de las 323 diferencias sin motivo escrito entre nuestro código y el
  //    Kit en los 15 componentes del Supervisor (`tools/aura-diff.mjs`). Se eligió zinc,
  //    que es lo que dicen Aura y el Kit, comparándolos lado a lado en sc-docs `/aura/oscuro`.
  //    Las filas repiten las de claro, con una salvedad medida: en oscuro el Kit pone el
  //    fondo de campo en zinc-950 (el del lienzo) y el de contenido en zinc-900, así que
  //    `form.field.background` cuelga de `sc-bg-default`, no de `sc-bg-surface`.
  ...SURFACE_STEPS.map((s) => ({
    mode: 'dark',
    exp: `surface.${s}`,
    token: s === '0' ? 'sc-color-slate-0' : `sc-color-zinc-${s}`,
    kind: 'enforce',
  })),
  { mode: 'dark', exp: 'content.background', token: 'sc-bg-surface', kind: 'enforce' },
  { mode: 'dark', exp: 'content.border.color', token: 'sc-border-default', kind: 'enforce' },
  { mode: 'dark', exp: 'content.color', token: 'sc-text-primary', kind: 'enforce' },
  { mode: 'dark', exp: 'content.hover.background', token: 'sc-bg-secondary-hover', kind: 'enforce' },
  { mode: 'dark', exp: 'text.color', token: 'sc-text-primary', kind: 'enforce' },
  { mode: 'dark', exp: 'text.muted.color', token: 'sc-text-secondary', kind: 'enforce' },
  { mode: 'dark', exp: 'form.field.background', token: 'sc-bg-default', kind: 'enforce' },
  { mode: 'dark', exp: 'form.field.color', token: 'sc-text-primary', kind: 'enforce' },
  { mode: 'dark', exp: 'form.field.hover.border.color', token: 'sc-border-strong', kind: 'enforce' },
  { mode: 'dark', exp: 'form.field.disabled.background', token: 'sc-bg-disabled', kind: 'enforce' },
  { mode: 'dark', exp: 'navigation.item.color', token: 'sc-text-primary', kind: 'enforce' },
  { mode: 'dark', exp: 'navigation.item.active.background', token: 'sc-bg-secondary-hover', kind: 'enforce' },
  { mode: 'dark', exp: 'list.option.color', token: 'sc-text-primary', kind: 'enforce' },
  { mode: 'dark', exp: 'list.option.focus.background', token: 'sc-bg-secondary-hover', kind: 'enforce' },
  { mode: 'dark', exp: 'overlay.modal.background', token: 'sc-bg-surface', kind: 'enforce' },
  { mode: 'dark', exp: 'overlay.modal.border.color', token: 'sc-border-default', kind: 'enforce' },
  { mode: 'dark', exp: 'overlay.popover.background', token: 'sc-bg-surface', kind: 'enforce' },
  { mode: 'dark', exp: 'overlay.popover.border.color', token: 'sc-border-default', kind: 'enforce' },
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
