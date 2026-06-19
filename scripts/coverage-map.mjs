/**
 * Cobertura de los 3 grupos del export que §1-7 NO tocaban: `aura/semantic/common`,
 * `aura/app`, `aura/effects`. Es la "garantía de completitud" del PUENTE (Fase 1.3):
 * CADA hoja de esos grupos cae en EXACTAMENTE un bucket con su forma de cobertura, y si
 * una hoja NUEVA del Kit no encaja en ninguno → ROJO (no se cuela en silencio).
 *
 * No es un generador: estos valores ya fluyen por REFERENCIA (refs a scale/radius/
 * typography/primitivas que §1·2·7 verifican), están CABLEADOS en `base.ts`, son
 * DIVERGENCIA de marca documentada, o NO se consumen. El generador sería sobre-ingeniería
 * para valores que o ya fluyen o divergen a propósito. Lo que faltaba era el RECONOCIMIENTO
 * mecánico + un value-check de lo que sí consumimos 1:1 (la rampa `primary` = `blue`).
 *
 * La consume `token-parity.mjs` §8. Buckets = fuente única, testeada (doble cara).
 */

/** kind: cómo está cubierta la hoja (para agrupar el censo + decidir si value-checkear). */
export const BUCKETS = [
  // ── aura/semantic/common ────────────────────────────────────────────────────
  // primary.50-950 = {blue.*}; base.ts: semantic.primary = ramp('blue'). VALUE-CHECK (abajo).
  { group: 'aura/semantic/common', test: /^primary\.\d+$/, kind: 'value-check', note: 'rampa primary = blue (1:1 con --sc-color-blue-*, verificado por valor)' },
  // form.field padding/borderRadius/sm/lg/icon + overlay padding/radius → ya en §4 (sizing-map).
  { group: 'aura/semantic/common', test: /^form\.field\.(padding|border|sm|lg)/, kind: 'sizing-§4', note: 'form field sizing — value-check en §4 (sizing-map)' },
  { group: 'aura/semantic/common', test: /^icon\.size$/, kind: 'sizing-§4', note: 'icon size — §4' },
  { group: 'aura/semantic/common', test: /^overlay\.(modal|popover|select)\.(padding|border)/, kind: 'sizing-§4', note: 'overlay padding/radius — §4' },
  // form field focus ring APAGADO (Kit: foco = borde, width 0). base.ts lo fija 1:1.
  { group: 'aura/semantic/common', test: /^form\.field\.focus\.ring\./, kind: 'value-match', note: 'ring del campo apagado (Kit width 0 / transparente) — base.ts 1:1' },
  // list.* y navigation.* → cableados en base.ts a var(--sc-scale-*)/{border.radius.*}/literales
  // que fluyen por §1·2; un cambio del Kit en la REFERENCIA (no en el valor) sería manual.
  { group: 'aura/semantic/common', test: /^list\./, kind: 'wired-base', note: 'list — cableado en base.ts (refs a scale/radius + pesos literales)' },
  { group: 'aura/semantic/common', test: /^navigation\./, kind: 'wired-base', note: 'navigation — cableado en base.ts (refs a scale/radius + pesos)' },
  { group: 'aura/semantic/common', test: /^content\.border\.radius$/, kind: 'wired-base', note: 'content.borderRadius = {border.radius.md} — base.ts' },
  { group: 'aura/semantic/common', test: /^anchor\.gutter$/, kind: 'wired-base', note: 'anchorGutter — base.ts' },
  { group: 'aura/semantic/common', test: /^disabled\.opacity$/, kind: 'wired-base', note: 'disabledOpacity 0.6 (= 60%) — base.ts' },
  { group: 'aura/semantic/common', test: /^focus\.ring\.(width|offset)$/, kind: 'wired-base', note: 'focus ring width/offset — base.ts (--sc-focus-ring-*)' },
  { group: 'aura/semantic/common', test: /^overlay\.title\.font\.size$/, kind: 'aura-default', note: 'overlay.title.fontSize — default de Aura (ref a typography que fluye); SC no lo re-cablea' },
  // DIVERGENCIA consciente: el foco del DS usa sky de marca ancho (a11y); difiere del valor que el
  // export pone en focus.ring.color (Tailwind sky #0ea5e9), no de la primitiva sky del Kit.
  { group: 'aura/semantic/common', test: /^focus\.ring\.color$/, kind: 'divergence', note: 'color de foco = sky de marca/--sc-border-focus (a11y, customs-catalog §1.1), NO el focus.ring.color del export (Tailwind sky #0ea5e9)' },

  // ── aura/app ────────────────────────────────────────────────────────────────
  // base.ts no tiene sección `app`: SC no renderiza la capa app del preset Aura.
  { group: 'aura/app', test: /^app\./, kind: 'not-consumed', note: 'SC no consume la capa app (refs a typography/content que sí fluyen si algún día se usa)' },

  // ── aura/effects ────────────────────────────────────────────────────────────
  // 71 *.focus.ring.shadow = #00000000 (no-op): el DS hace el foco por OUTLINE
  // (--sc-focus-ring-width), no por shadow-ring → divergencia estructural vs Aura.
  { group: 'aura/effects', test: /\.focus\.ring\.shadow$/, kind: 'divergence', note: 'foco por outline (--sc-focus-ring-width), no shadow-ring → sombra transparente (no-op)' },
  // El resto = sombras de elevación. GENERADAS a --sc-cmp-*-shadow (@sc-gen:effects) y LEÍDAS por
  // el preset (var(--sc-cmp-*-shadow)) → fluyen del Kit. Puente completo (Etapa 1 emite, Etapa 2
  // repunta); el guard tokens:effects-rewire impide que vuelva a colarse un hex hardcoded.
  { group: 'aura/effects', test: /\.shadow$/, kind: 'shadow', note: 'sombra de elevación — GENERADA a --sc-cmp-*-shadow y LEÍDA por el preset → fluye del Kit (guard: tokens:effects-rewire)' },
];

/**
 * Clasifica las hojas de un grupo en buckets. PURA (testeable).
 * @param {string} group
 * @param {Iterable<string>} paths  rutas con puntos de las hojas del grupo
 * @returns {{ byKind: Record<string,string[]>, perBucket: Map<object,string[]>, unmatched: string[] }}
 */
export function classify(group, paths) {
  const buckets = BUCKETS.filter((b) => b.group === group);
  const byKind = {};
  const perBucket = new Map(buckets.map((b) => [b, []]));
  const unmatched = [];
  for (const p of paths) {
    const b = buckets.find((x) => x.test.test(p));
    if (!b) {
      unmatched.push(p);
      continue;
    }
    perBucket.get(b).push(p);
    (byKind[b.kind] ??= []).push(p);
  }
  return { byKind, perBucket, unmatched };
}

/** Pasos de la rampa primary a value-checkear (primary.N = blue.N = --sc-color-blue-N). */
export const PRIMARY_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
