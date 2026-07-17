# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-07-17** (sesión 10). Vuelta de vacaciones: **ordenado el caos de
> ramas**, **arreglado el CI** (2 semanas en rojo), **integrado el trabajo de la UI
> designer (Marta)** con **DD-30 «varias reglas activas» + regla de la unión**,
> montado **`/lab`** (nido de prototipos), **verificación integral OK**, y una tanda
> de **optimización** (iconos fuera de la app real ~340 KB, dedup −124 KB, limpieza,
> footgun blindado). **Todo en main + CI verde** (6 commits, todos success).
> SOBREESCRIBE este fichero al cerrar.

---

## ▶️ EMPIEZA AQUÍ
1. Lee este fichero entero.
2. Todo en main (`ef4ee9f` y anteriores). **Confirma el CI verde LEYENDO el run en
   GitHub Actions, NO te fíes de este hand-off** (hoy el rojo llevaba 2 semanas
   mientras los hand-offs lo daban por verde — la trampa de siempre).
3. El *por qué* durable: `docs/DECISIONS.md` → **DD-30** (varias activas).

## 🎯 Qué se hizo (sesión 10)
- **Ramas limpias:** borradas 7 locales fusionadas + 2 remotas. Vivas: `main`,
  `sandbox` (Marta, conservada), `design-tokens-sync` (bot).
- **CI arreglado** (`c0d7ce3`): las demos de `toast`/`confirmdialog` montaban el
  overlay 2 veces (StoryHost apila stories) → strict-mode violation en e2e. Fix: un
  solo host por demo.
- **Marta integrada + DD-30** (`61dcf92`, `ca2313c`): merge de `sandbox` (constructor
  de reglas: tipificación jerárquica, alcance, checkbox, descripción). Adoptado
  **varias reglas activas a la vez**; el solape se resuelve por **unión** (una
  conversación se procesa UNA vez, categorías sumadas; sin prioridad ni conflictos ni
  doble transcripción). Presentación `/reglas` reescrita; DD-30 supersede el invariante
  de DD-28.
- **`/lab`** (`a0e21c3`): copiadas al repo las 2 exploraciones de carga de Marta
  (skeleton HTML + icono Lottie/GIF) en `public/explorations/`, página `/lab`
  etiquetada como prototipo (no producto).
- **Optimización** (auditoría multi-agente + escéptico):
  - Iconos (`ef41ea9`): `SC_MATERIAL_SYMBOL_GLYPHS` era derivado del catálogo completo
    → arrastraba ~340 KB de labels/keywords a TODOS los bundles (supervisor incluido).
    Ahora es literal independiente → catálogo fuera por tree-shaking.
  - Dedup −124 KB (`211f333`): 2 demos importaban iconos por ruta de fuente (2ª
    identidad de módulo) → reapuntadas al alias `@smartcontact-hub/icons`. Rutas de
    componentes diferidas (loadChildren). Logo huérfano borrado + preconnect en sc-demo.
  - Footgun blindado (`ef4ee9f`): borrado `SC_ICON_CATALOG` + 4 exports muertos que
    podían re-atar los 340 KB.

## 🗺️ Lo que queda (backlog de optimización — pasada enfocada)
- **Bug doble-clic del menú kebab** en `features/memory/pages/categories/` y
  `.../entities/`: `[model]="buildMenuItems(x)"` se recrea por ciclo de CD. Reglas ya
  lo arregló (patrón `menuTargetRule` signal + `menuItems` computed, ver
  `rules-page.component.ts:84-93`); NO se propagó. **Necesita el supervisor levantado
  para verificar el «1er clic funciona».**
- **145 claves i18n huérfanas** en supervisor (×4 = 580 entradas, restos del rediseño
  del builder de reglas). Borrado con re-verificación clave-por-clave (un falso
  positivo rompe un texto). El escéptico ya las midió, pero verificar de nuevo.
- **Dedups menores:** `formatTime()` en los 2 reproductores de audio; helper CRUD de
  `categories.store`/`entities.store`. Micro-opts de plantilla (repo-list, etc.).
- **Opcional/gordo (uno a uno):** virtualizar `conversation-table` (solo si crece el
  dataset real de 156 filas), optimizar el GIF de `/lab` + PNGs de `/usage` a webp,
  soltar `primeicons`, migrar builder webpack→esbuild (exige e2e completo de 4 apps),
  reconciliar el doble modal de transcripción masiva.
- **Descartado por el escéptico (NO perseguir):** aligerar la fuente de iconos
  (requisito del contrato sc-icon), podar el preset PrimeNG (intencionado), la CSS de
  311 KB (comprime a 41 KB y está en uso).
- **Rutina «PR Revision» (del cowork):** ya apunta al repo correcto. Pendiente aplicar
  el texto reformulado en modo solo-reporte; editable **solo en Claude Code web** (tú).

## ⚠️ TRAMPAS
- **NUNCA `git add .claude`** · commits a main con
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` · `npm run verify` + build
  AOT antes de pushear cambios de `sc-*`.
- **`npm run e2e` es footgun** (clobbea `public/usage/*.png`): para baselines usa
  `npx playwright test e2e/components.spec.ts`.
- **Iconos generados:** `SC_MATERIAL_SYMBOL_GLYPHS` es literal A PROPÓSITO. Si lo
  derivas del array (`Object.fromEntries(SC_MATERIAL_SYMBOLS.map...)`) vuelven los 340 KB
  del catálogo al bundle. Generador: `projects/ui-smartcontact-icons/scripts/generate-material-symbols.js`.
- **Imports first-party:** usa siempre los alias `@smartcontact-hub/*`, NUNCA rutas a
  `.../src/public-api` (crea 2ª identidad de módulo → duplica en el bundle).

## Índice
- **Decisiones** → `docs/DECISIONS.md` (**DD-30** varias activas · DD-29 storybook · DD-28 reglas MVP).
- **Reglas producto** → `supervisor/src/app/features/memory/`. **Presentación** →
  `sc-demo/src/app/pages/reglas/`. **Lab** → `sc-demo/src/app/pages/lab/`.
- **Deploys:** sc-supervisor.pages.dev · sc-demo.pages.dev · sandbox.sc-supervisor.pages.dev (rama Marta).
