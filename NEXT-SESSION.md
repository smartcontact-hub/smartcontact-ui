# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-07-01** (sesión 9). Temas: **(0)** modernizar el constructor de reglas · **(1)** auditoría +
> arreglo pokédex + **gate i18n** · **(2-4)** motor **«Storybook-like»** en sc-demo → **49/49 componentes en
> formato story** (canvas + knobs en vivo + snippet + tabla API + sidebar por categorías). **Todo en main** +
> desplegándose (sc-demo.pages.dev). Decisión nueva: **DD-29**. `npm run verify` **ENTERO VERDE**. SOBREESCRIBE
> este fichero al cerrar.

---

## ▶️ EMPIEZA AQUÍ
1. **Lee este fichero entero.**
2. Todo está en main (`22dba57` y anteriores) y desplegándose. El *por qué* durable: `docs/DECISIONS.md` → **DD-29**
   (motor Storybook) · informe de esta auditoría: `docs/AUDIT-2026-07.md`.
3. `verify` entero verde (ya NO hay el falso-positivo de `docs:coherence` — se arregló, ver TRAMPAS).

---

## 🎯 Qué se hizo esta sesión (5 fases, cada una en main)

**Fase 0 — Modernizar el rule-builder** (`supervisor/features/memory/pages/rule-builder/`). Des-encajonado: las 3
secciones dejan de ser tarjetas blancas → una hoja aireada con hairline + eyebrow «01/02/03» + título semibold
(jerarquía por peso/color, no por caja). Elevación reservada al panel de impacto sticky. Motion sutil (revelado
escalonado + push :active, respeta `prefers-reduced-motion`). Badge-caja IA → chispa teal inline. Claro/oscuro
verificado. Re-captura del «después» del recorrido `/reglas`. → `c73897c`.

**Fase 1 — Auditoría + pokédex + i18n** (`docs/AUDIT-2026-07.md`, complementa `AUDIT-DEUDA-2026-06`). (a) Bug
`hasDemo` en `scripts/component-audit.mjs`: casaba el demo solo CON guiones (`section-card`) pero el registro usa
SIN guiones (`sectioncard`) → 18 con demo salían como «—». Arreglado → casa ambas. (b) **Gate `i18n:check`**
(`scripts/i18n-check.mjs`) en `verify`: paridad de claves es↔en/fr/pt; cerradas 37 claves (`cond.*`+`crumb_rules`)
que solo estaban en es. (c) Falso-positivo de `docs:coherence` (refs a `scripts/paths.mjs`, backlog propuesto)
resuelto con allowlist `PROPOSED_SCRIPTS`. → `1577453`.

**Fases 2-4 — Motor «Storybook-like» en sc-demo** (`projects/sc-demo/src/app/storybook/`). Motor propio (sin tooling
nuevo): render por `<ng-template>` por story + `viewChild` (NO `NgComponentOutlet` — soporta content-projection de
sc-select y `model()`/cellTemplate de sc-datatable). `StoryHost` (apilado, e2e-safe) · `StoryCanvas` (lienzo aislado,
tema claro/oscuro/comparar local) · `StoryControls` (**knobs en vivo**, dogfooding sc-select/toggleswitch/inputtext/
inputnumber) · `StorySnippet` (código + copiar) · `StoryPropsTable` · `serialize-args` (puro). **Shell** con sidebar
(7 categorías + búsqueda), `/components` anidada. **Los 49 componentes migrados** (button piloto + 46 por lotes con
subagentes paralelos + slot/subsection NUEVOS) → **pokédex 49/49**. Header sc-demo → «Smart Contact Design
Engineering». → `1b1d69a`, `4cfea44`, `432f424`, `22dba57`.

## 🗺️ Lo que queda
- **[lead deuda DS]** El overflow del lienzo del showcase se arregló (`.sb-canvas` ya no lleva `overflow:hidden`, que
  recortaba los paneles inline). Pero **`sc-multiselect` NO expone `appendTo`** (sc-select SÍ, `appendTo='body'`;
  sc-datepicker lo hardcodea). Si un overlay se recorta dentro de un contenedor `overflow:hidden` (p.ej. `sc-dialog`),
  la causa es esa → **candidato a igualar el appendTo en el DS** (sc-multiselect/otros overlays inline).
- **[follow-up local, NO bloquea]** Los **baselines de screenshot de componentes** (`e2e/components.spec.ts-snapshots/
  *-darwin.png`, 24 tracked) quedaron obsoletos: TODAS las páginas cambiaron (shell + formato story). Son **darwin +
  local-only** (el e2e salta el screenshot en CI con `process.env.CI`; CI se apoya en las métricas del Kit, que pasan
  porque los `data-testid` se preservaron). Regenéralos cuando toque con `npx playwright test e2e/components.spec.ts
  --update-snapshots` (NO `npm run e2e` entero — footgun, ver abajo) y commítealos.
- **[decisión de Rafa]** **TypeUI plugin** (`~/Downloads/SKILL.md`+`DESIGN.md`, en scratchpad `typeui-*.md`): son un
  volcado plano del MISMO Figma que ya consume nuestro pipeline verificado (`kit-export-dtcg.json` + generadores +
  `tokens:parity`/`type-parity`). **NO sustituibles** (regresaría a doc plana sin round-trip). Alineación confirmada
  (radios 8/6/12/4/2 exactos; tipografía 1:1 vía type-parity verde). **Única divergencia real**: DESIGN.md (Figma
  crudo) dice `warn=orange/500` pero el DS remapea a **amber** a propósito (`customs-catalog.md §1.3`). Si Figma es la
  fuente de verdad y se quiere warn=orange, es lo único a reconciliar; si amber es la marca, divergimos bien.
- **Backlog grande sigue**: `docs/AUDIT-DEUDA-2026-06.md` (P0 = `sc-field-wrapper`; base común admin; 2 eras de API).

## ⚠️ TRAMPAS / PROTECCIONES
- **`npm run e2e` ES UN FOOTGUN**: corre `e2e/usage/usage-capture.spec.ts` contra sc-demo:4280 y **CLOBBEA los PNG de
  `public/usage/`**. Para capturar uso usa SOLO `npx playwright test -c playwright.usage.config.ts` (sirve el
  supervisor:4290) + `git checkout -- _usage-raw.json` después. Para baselines de componentes, filtra al fichero:
  `npx playwright test e2e/components.spec.ts` (NO corre el usage spec).
- **`preview_logs level:error` acumula TODO el historial** del dev server (errores ya arreglados incluidos). No te fíes
  del buffer: corre un `tsc`/`ng build` FRESCO para el estado real (esta sesión un «exit 0» de background fue espurio y
  el buffer mostró errores de casing ya arreglados).
- **Casing de clases DS**: es `ScInputTextComponent`/`ScToggleSwitchComponent`/`ScInputNumberComponent` (mayúsculas
  internas), NO `ScInputtextComponent`. Verifica el nombre EXPORTADO en `public-api.ts`, no lo infieras del selector.
- **NUNCA `git add .claude`** · **NUNCA commitees `kit-export-dtcg.json`** · commits a main con
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` · `npm run verify` entero antes de pushear cambios de `sc-*`.

## Índice — dónde mirar
- **Decisiones** → `docs/DECISIONS.md` (**DD-29** motor Storybook · DD-28 reglas MVP · DD-27/26 constructor) ·
  **Auditorías** → `docs/AUDIT-2026-07.md` (consistencia/cobertura, esta sesión) + `docs/AUDIT-DEUDA-2026-06.md`
  (deuda de código) · **Pokédex** → `docs/inventory.md` (49/49) · **Mapa docs** → `docs/DOCS-INDEX.md`.
- **Motor Storybook** → `sc-demo/src/app/storybook/` (+ `pages/components/component-catalog.ts` + `storybook-shell`) ·
  **Demos** → `sc-demo/src/app/pages/components/*/` (49, formato story) · **rule-builder** → `supervisor/features/memory/
  pages/rule-builder/`.
