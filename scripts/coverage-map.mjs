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

  // ── aura/custom ─────────────────────────────────────────────────────────────
  // La rama del Kit donde viven los tokens que NO son de Aura: nuestra tipografía,
  // los estados de presencia, el accent y los customs de marca. Estaba en el censo
  // de §7b (visible) pero FUERA del gate de completitud de §8, así que una hoja
  // nueva del Kit aquí no ponía nada en rojo. Cada bucket de abajo se escribió
  // MIDIENDO su consumo real en el código, no por el nombre de la hoja.
  //
  // Las 19 de tipografía son la FUENTE de la escala: `dtcg-export.mjs:79` las saca
  // de `custom.typography` y alimentan `--sc-font-size-*`, `--sc-line-height-*` y
  // `--sc-font-weight-*` en `01-primitive.css:258-291`. Verificado por valor
  // (12·14·16·18·20·24·32·48 y 18·20·24·28·36·40·58; pesos 400/500/600/700).
  { group: 'aura/custom', test: /^primitive\.typography\.font\.size\./, kind: 'flows', note: 'fuente de --sc-font-size-* (01-primitive.css:258+) — valores 1:1' },
  { group: 'aura/custom', test: /^primitive\.typography\.line\.height\./, kind: 'flows', note: 'fuente de --sc-line-height-* (01-primitive.css:274+) — valores 1:1' },
  { group: 'aura/custom', test: /^primitive\.typography\.font\.weight\./, kind: 'flows', note: 'fuente de --sc-font-weight-* (01-primitive.css:288-291) — valores 1:1' },

  // El Kit pide violet; el DS usa sky por CONTRASTE, y está razonado en el sitio
  // (02-semantic.css:101-106: cyan-600 daba 3,46 y sky-600 da 6,80). Misma clase de
  // divergencia que focus.ring.color: la decide la accesibilidad, no la marca.
  { group: 'aura/custom', test: /^semantic\.text\.accent$/, kind: 'divergence', note: 'Kit {violet.400} · DS --sc-text-accent = sky-600 por contraste (02-semantic.css:101-106)' },

  // Presencia: el DS TIENE sus tokens (--sc-presence-*, 03-palette.css:83-88) pero
  // ni los valores ni los NOMBRES coinciden — el Kit trae available/unavailable/
  // administrative/talking/wrap-up y el DS available/paused/training/offline, con
  // hexes curados a mano y calibrados a AA sobre --sc-bg-surface. No es un desfase
  // que se arregle sincronizando: son dos taxonomías distintas del mismo concepto.
  { group: 'aura/custom', test: /^semantic\.presence\./, kind: 'divergence', note: 'taxonomía y valores distintos: Kit available/unavailable/administrative/talking/wrap-up vs DS --sc-presence-available/paused/training/offline (03-palette.css:83-88), curados a AA' },

  // 26 hojas para el modal de transcripción masiva y NADIE las lee: no existe
  // ninguna `--sc-cmp-bulktranscriptionmodal-*` en las capas. El componente se
  // estiliza con 36 tokens semánticos/primitivos directos. Es una elección válida
  // —consumir la capa semántica en vez de tener familia propia— pero conviene que
  // el censo lo diga en voz alta en vez de que parezca que fluye.
  { group: 'aura/custom', test: /^component\.bulktranscriptionmodal\./, kind: 'not-consumed', note: 'sin familia --sc-cmp-bulktranscriptionmodal-*: el componente consume 36 tokens semánticos directos' },

  // El Kit quiere el icono del diálogo al color de texto pleno ({overlay.modal.color}
  // → {text.color}); el DS lo quiere ATENUADO (--sc-dialog-head-icon-fg = slate-500,
  // 04-component.css:64, zona escrita a mano). Divergencia de intención visual.
  { group: 'aura/custom', test: /^component\.dialog\.icon\.color$/, kind: 'divergence', note: 'Kit {overlay.modal.color}={text.color} · DS --sc-dialog-head-icon-fg = slate-500 (icono atenuado, 04-component.css:64)' },

  // Las 6 de `app.typography` son el CONTRATO de tipografía que el tema lleva al extend y que
  // el preset consume: `sc-preset/extend.ts` declara app.typography.{sm,md,lg}.{fontSize,
  // lineHeight} → var(--sc-font-size-*) / var(--sc-line-height-*). Vivían en la colección App
  // del Kit, que el plugin NO exporta, y por eso no llegaban; ahora viajan en `custom` → extend.
  // VALUE-CHECK en §8: el PASO al que apunta el Kit (font.size.200 · line.height.200 …) debe ser
  // el mismo que usa extend.ts, o el contrato se desfasa MUDO (fue el bug de md=21 vs 20). El
  // valor de cada paso ya lo cubre el bucket `flows` de primitive.typography.
  { group: 'aura/custom', test: /^app\.typography\.(sm|md|lg)\.(fontSize|lineHeight)$/, kind: 'value-check', note: 'contrato de tipografía del extend — el paso del Kit debe coincidir con sc-preset/extend.ts (value-check §8)' },

  // 26 hojas del modal custom y NADIE las lee: no existe ninguna `--sc-cmp-custommodal-*` en las
  // capas (mismo caso y misma decisión que bulktranscriptionmodal). El componente se estiliza con
  // tokens semánticos directos. Se declara para que el censo lo diga en voz alta, no para taparlo.
  { group: 'aura/custom', test: /^component\.custommodal\./, kind: 'not-consumed', note: 'sin familia --sc-cmp-custommodal-*: consume tokens semánticos directos (igual que bulktranscriptionmodal)' },
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

/**
 * CONTRATO de tipografía `app.*` del extend (§8 value-check).
 * El Kit apunta cada talla a un PASO primitivo; `sc-preset/extend.ts` tiene que apuntar al MISMO
 * paso vía `var(--sc-*)`. Si Figma remapea una talla y el preset no lo recoge, el contrato se
 * rompe en silencio y los componentes heredan del documento (el bug de chip/tag/toast).
 */
export const APP_TYPOGRAPHY_CONTRACT = [
  { size: 'sm', prop: 'fontSize', kitFamily: 'font.size', cssVar: 'sc-font-size' },
  { size: 'sm', prop: 'lineHeight', kitFamily: 'line.height', cssVar: 'sc-line-height' },
  { size: 'md', prop: 'fontSize', kitFamily: 'font.size', cssVar: 'sc-font-size' },
  { size: 'md', prop: 'lineHeight', kitFamily: 'line.height', cssVar: 'sc-line-height' },
  { size: 'lg', prop: 'fontSize', kitFamily: 'font.size', cssVar: 'sc-font-size' },
  { size: 'lg', prop: 'lineHeight', kitFamily: 'line.height', cssVar: 'sc-line-height' },
];
