# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-07-17** (cierre sesión 10). **La sesión 11 tiene PLAN COMPLETO abajo**:
> eliminar deuda de diseño + comprobar tipografías + rediseñar `/reglas`. Todo cruzado
> con el código actual (3 exploraciones verificadas). La sesión 10 dejó **main en verde**
> (6 commits: orden de ramas, arreglo CI, Marta + DD-30 «varias activas», `/lab`,
> optimización de iconos ~340KB + dedup + footgun). SOBREESCRIBE este fichero al cerrar.

## ▶️ EMPIEZA AQUÍ
1. Lee este fichero. La **sesión 11 = ejecutar el «PLAN SESIÓN 11» de abajo** (top-down, parar donde toque).
2. Todo en main verde. **Confirma el CI LEYENDO el run** en GitHub Actions, NO este hand-off.
3. **Dos decisiones a confirmar antes de arrancar** (ver plan): adoptar `sc-button` en el supervisor; unificar el icono Material en **Rounded**.

---

# PLAN SESIÓN 11 — eliminar deuda de diseño + tipografías + rediseño /reglas

## Contexto
Tres frentes que pidió Rafa: (1) rediseñar `/reglas` (más ancho de texto + feedback como pestaña flotante abajo-derecha con animación elegante), (2) comprobar/arreglar tipografías, (3) eliminar la deuda de diseño/consistencia (AUDIT-DEUDA-2026-06 + AUDIT-2026-07 + auditoría UX del 17-jul), cruzada con el código de hoy (varios de junio ya cerrados).

**Reglas del repo:** tokens `--sc-*` (nada de px/valores a pelo); wrappers PrimeNG pegados; `npm run verify` + `ng build` AOT antes de push; NUNCA `git add .claude`; commits a main con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## Decisiones de diseño (recomendadas; confirmar al arrancar)
1. **Botón:** adoptar `sc-button` en el supervisor (contrato del DS). Hoy 24 ficheros / 101 usos de `p-button` vs 3 de `sc-button`. Migrar (list-pages + forms primero). Alternativa: oficializar `p-button`+preset y retirar `sc-button` (menos coherente).
2. **Icono Material:** unificar en **Rounded** (canónico del DS, auto-hospedado). Hoy sc-demo=Rounded pero supervisor/agent overridean a **Outlined** por CDN → mismo `<sc-icon>` distinto en demo vs app. Recomendado: apps dejan de overridear. Alternativa: si Outlined es la marca, el DS sirve Outlined y se quita el CDN.

## Bloque 1 — Rediseño de /reglas (acotado, visible, sin riesgo de DS)
Ficheros: `projects/sc-demo/src/app/pages/reglas/rules-walkthrough.component.{ts,html,scss}`.

**1a. Más ancho para el texto.** Medido: el `<aside class="rules__feedback">` (18rem) + `.demo-main` capado a 60rem dejan la lectura en ~570px, por debajo del `--measure` de 68ch (~620px).
- Quitar el bloque flex `@media (min-width:80rem)` del `.scss` (~771-794).
- Sacar el `<aside>` del `<article>` (pasa a panel flotante). `.rules__main` recupera el ancho completo.

**1b. Feedback como pestaña flotante abajo-derecha.** NO usar `ScDrawer` (lateral/modal) ni `p-popover` (anclado). Panel propio ligero:
- **Anclaje:** `position: fixed` abajo-derecha estilo `sc-bulk-action-bar` (sin offset de sidebar; sc-demo no tiene). Radius `--sc-radius-lg`, sombra `--sc-shadow-popover`/`dialog`.
- **Apertura/foco/Esc:** patrón `sc-command-palette` (`command-palette.component.ts:84-138`): signal `open`, `effect` de foco, Esc, return-focus al handle.
- **Handle/tab:** `<button>` fixed con `aria-expanded` + `aria-controls`; panel `role="dialog"`/`region` + aria-label (reusar "Feedback del equipo, por fecha").
- **Reusar** el array `feedback` (ts ~280) + markup `.fb/.fb__date/.fb__list/.fb__item` (html ~370-382).
- **Animación:** `opacity 0→1` + `translateY(8px)→0` con `var(--sc-transition-base) var(--sc-easing-emphasized)`, en `@media (prefers-reduced-motion: no-preference)`.
- **a11y/no romper:** panel NO-modal (no bloquear `body.overflow`); Esc con prioridad sobre el lightbox; coordinar z-index (lightbox hardcode 1000): panel por debajo o se cierra al ampliar captura.

Verif: `build:demo` + preview `/#/reglas` (texto más ancho, tab abre/cierra con animación, Esc, lightbox OK, dark, teclado).

## Bloque 2 — Tipografías
Base **bien** (tokens 3 niveles, `type-parity` verde, guard bloquea `font-size` px). Fallan 2 cargas de fuente (P1) + gobernanza (guard no cubre line-height/font-weight).

- **2a P1:** (i) sc-demo NO carga Open Sans → captions del DS caen a sans-serif en la vitrina → añadir Open Sans al `<link>` de `projects/sc-demo/src/index.html:10`. (ii) Material Symbols Rounded(DS) vs Outlined(apps): unificar (decisión 2) quitando override en `supervisor/src/styles/main.scss:62`, `supervisor/.../shared/components/icon/icon.component.scss:2`, `agent/src/styles/main.scss:27`.
- **2b P2 (multiplicador):** extender `scripts/token-guard.mjs` con reglas para `line-height`/`font-weight`/stack-mono literales; migrar ~93 font-weight + ~98 line-height a tokens (75% en supervisor). Peor primero: px de line-height en config (`settings-sidebar.scss:38,45,107`, `sistema-page.scss:26,34`, `aed-defaults-page.scss:133,205,357`, `form-section-nav.scss:136`). Mono: `var(--sc-font-family-mono)` ×9.
- **2c P2 opcional:** auto-hospedar Inter/Open Sans (`@fontsource/*`, patrón de los iconos).
- **2d P3:** KPI cards del agent hardcodean peso/line-height; 3 `em` en páginas demo.

Verif: `tokens:type-parity` verde + guard nuevo + revisión visual demo↔app.

## Bloque 3 — Deuda de diseño/consistencia (P1, el grueso)
- **a11y filas** (audit #1): `<tr (click)>` en `rules-page.component.html:62-66` sin teclado (WCAG 2.1.1). Fix o al migrar a datatable.
- **Tablas → `sc-datatable`** (0 usos en supervisor; ~14 a mano): migrar list-pages simples (rules/categories/entities/users/groups); cierra la a11y de filas. Confirmar que soporta fila-enlace + chips; matrices de canal aparte.
- **`sc-button`** (decisión 1): migrar `p-button`→`sc-button` en supervisor.
- **Bug kebab doble-clic** (audit #3): propagar patrón `menuTargetX` signal + `menuItems` computed de `rules-page.component.ts:84-92` a categories/entities. Verificar 1er clic con supervisor levantado.
- **rule-builder vestigial** (audit #4): quitar del `onSave()`/tipo los planos `direction`/`schedule`/`durationMin` (el `conditionTree` es la fuente). Confirmar que nada los lee.
- **PrimeIcons restantes:** 4 ficheros con `pi pi-*` (confirm-host + menús categories/entities/rules) → `sc-icon`; soltar `primeicons`.

## Bloque 4 — Deuda técnica P0 (multiplicador del DS)
- **`sc-field-wrapper` + CVA + computeds** (P0): 5 fields (inputtext/select/multiselect/datepicker/inputnumber) duplican CVA + 9 computeds + `hasPrimitiveOptions`. Extraer `sc-field-wrapper` + `scCreateControlValueAccessor()` + `scCreateFieldComputeds()` + directiva `scFieldHost`. **Piloto en inputtext detrás del e2e, replicar. Toca TODOS los forms → AOT + e2e por componente.**
- **`BaseCrudStore<T>`:** categories/entities/conversations duplican CRUD + `isNameTaken`; conversations ignora `core/utils/selection-state.ts`. Extraer base.
- **16 wrappers legacy `@Input`→signals** por lotes (AOT por lote).
- **`shared/utils/audio.ts`:** `formatTime` ×2 + `parseDurationSeconds` + `hashString`.

## Bloque 5 — Cola (P2/P3)
Doble modal transcripción (DS vs copia supervisor) · `SC_ICON_SIZE_LG` 15.75→16 · `font-size` px "Figma raw" en `04-component.css:69,106,108` · **145 claves i18n huérfanas** (barrido key-por-key antes de borrar; la paridad ya está bien) · `permission-matrix` centralizada · `GroupChannelCascadeService` · `TriStateToggleUtil` · handlers vestigiales `onLabelAdd`/`onLanguageAdd`.

## Orden recomendado
1. Bloque 1 (/reglas) · 2. Bloque 2a (fuentes P1) · 3. Bloque 3 (diseño P1) · 4. Bloque 4 (field-wrapper P0, máxima verif) · 5. Bloque 2b + Bloque 5.
Mucho alcance: top-down, parar donde toque; todo listado para retomar.

## Verificación transversal
`sc-*`/tokens → `npm run verify` + AOT de las 3 apps · field/CVA → `npx playwright test e2e/components.spec.ts` + conducir un form · a11y/kebab → supervisor levantado + teclado + 1er clic · /reglas → preview (tab + Esc + lightbox + dark + reduced-motion) · tipografía → `type-parity` + guard · CI verde leyendo el run.

## TRAMPAS
- `npm run e2e` clobbea `public/usage/*.png` → baselines con `npx playwright test e2e/components.spec.ts`.
- Imports first-party SIEMPRE por alias `@smartcontact-hub/*` (nunca `.../src/public-api` → duplica módulo en el bundle).
- `SC_MATERIAL_SYMBOL_GLYPHS` es literal a propósito (no derivar del array → vuelven 340KB). Generador: `projects/ui-smartcontact-icons/scripts/generate-material-symbols.js`.
- `sc-field-wrapper` toca todos los forms: piloto + e2e antes de replicar.
- Verificar que `sc-datatable` cubre fila-enlace + chips ANTES de migrar; si no, a11y de filas por separado.

## Estado cerrado (NO es deuda, verificado)
dirty-state centralizado · user crossTab/conflictWarning · i18n `memory.rules.builder.*` a paridad · PROFILE dup eliminado · seeds sin placeholders · (sesión 10: CI verde, iconos ~340KB, dedup −124KB, DD-30, /lab).

## Índice
Decisiones → `docs/DECISIONS.md` (DD-30 varias activas · DD-29 storybook · DD-28 reglas MVP). Deuda → `docs/AUDIT-DEUDA-2026-06.md` + `docs/AUDIT-2026-07.md`. Reglas producto → `supervisor/src/app/features/memory/`. Presentación → `sc-demo/src/app/pages/reglas/`. Lab → `sc-demo/src/app/pages/lab/`. Deploys: sc-supervisor.pages.dev · sc-demo.pages.dev · sandbox.sc-supervisor.pages.dev (rama Marta).
