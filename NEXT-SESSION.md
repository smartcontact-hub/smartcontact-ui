# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-30** (sesión 8). Tema: **borradores fuera + «una sola regla activa» en toda la plataforma**, y
> **recorrido `/reglas` (sc-demo) reescrito** al modelo real. **OJO: trabajo en working tree, COMMIT PENDIENTE de OK
> de Rafa** (no se ha pusheado a main aún). Decisión nueva: **DD-28**. Verify verde salvo 1 falso-positivo
> pre-existente (`docs:coherence`). SOBREESCRIBE este fichero al cerrar.

---

## ▶️ EMPIEZA AQUÍ
1. **Lee este fichero entero.**
2. Si Rafa aprobó el commit: el cambio ya está en main. Si no: revisa el working tree (`git status`) — son solo
   los ficheros de reglas (supervisor + sc-demo/reglas + i18n + 2 capturas + DECISIONS).
3. El *por qué* durable: `docs/DECISIONS.md` → **DD-28** (esta sesión) sobre DD-27/26.

---

## 🎯 Qué se hizo esta sesión

**1. Borrador FUERA del modelo de reglas + invariante «una sola activa» (supervisor real) — DD-28**
- Origen: feedback de Rafa — *«solo una regla puede estar activa; al desactivar no crea inactivas ni borradores,
  solo aparece como inactiva»*. El supervisor aún arrastraba el concepto (DD-27 lo dejó como limpieza follow-up).
- `rule.types.ts`: fuera `isDraft`/`duplicatedFromId`/`priority`/`RuleStatus`. `rules.store.ts` reescrito:
  `inactiveOrDraftRules`→`inactiveRules`; `toggleActive`/`addRule`/`updateRule` **desactivan el resto al activar**
  (radio); **duplicar crea copia inactiva normal** (no borrador no-activable); fuera `priority`/`conflictsByRuleId`/
  `getConflictingRules`/`isInConflict`/`reorderActive`/`scopeOverlaps` (muertos en UI). `rules-mock.ts` reseed:
  **1 activa + 3 inactivas** (antes 4 activas con priority 1..4). Listado: «Inactivas y borradores»→«Inactivas»,
  título «Regla activa» (singular), sin gating del botón Activar.
- i18n (es/en/fr/pt): fuera `status.draft`/`status.conflict`/`activate_draft_tooltip`/`builder.{draft_banner,
  discard_draft,draft_ready_toast,discarded_toast}`/`order_updated`/`cols.order`/bloque `conflict.*`; `duplicated_toast`
  reescrito. + scss muerto del banner de borrador fuera. **OJO: el `draft` de admin (agents/groups/users, DD#294)
  es OTRO concepto — intacto.**
- **Verificado en vivo** (capturas reales del Supervisor): listado 1 activa/3 inactivas con alcance en prosa;
  builder con estimación «6 de 34» + barra + «≈74/día».

**2. Recorrido `/reglas` (sc-demo) reescrito como HISTORIA antes/después** (presentación, NO producto)
- `projects/sc-demo/src/app/pages/reglas/rules-walkthrough.component.{ts,html,scss}`: la página cuenta el cambio como
  storytelling — el giro a transcripción, y **3 beats de transformación** (alcance rígido→árbol+refs vivas ·
  prioridad/conflictos→una activa [core] · borradores→activa/inactiva), cada uno con **Antes / Ahora / Por qué** en
  lenguaje llano. Componente nuevo `.compare` (2 col→1, flat, 1px borders, label Antes muted / Ahora acento) con
  **capturas antes/después** + snippets de código antes/después. Concerns/conclusiones a *decidido→hecho*; nombres
  genéricos. **Skills `/impeccable` + `/minimalist-ui`**: aplicados solo donde NO contrastan con el DS (anti-slop —cero
  border-left stripes, cero gradient-text—, jerarquía, whitespace, editorial); se descartaron sus fuentes/colores/iconos
  propios (romperían la consonancia). Dark-safe + responsive verificados; AOT + typecheck + lint verde.
- **Assets**: 4 capturas en `public/usage/` — `conversaciones-reglas{,-nueva}.png` (AHORA, regeneradas del Supervisor)
  + `conversaciones-reglas{,-nueva}-antes.png` (ANTES, extraídas de git: modelo viejo con prioridad/conflicto/borradores).

## 🗺️ Lo que queda (del audit + nuevo)
- **El backlog grande sigue**: `docs/AUDIT-DEUDA-2026-06.md` (P0 = `sc-field-wrapper`; base común admin; quick-wins).
- **Nuevo de esta sesión**: si Rafa quiere consonancia total, el `chip.recording`/`builder.type.recording` y la
  `RuleType: 'recording'` siguen vestigiales (grabación fuera del MVP) — limpieza menor, no se tocó (fuera de scope).

## ⚠️ TRAMPAS / PROTECCIONES (nuevas de esta sesión, importantes)
- **`npm run e2e` ES UN FOOTGUN**: `playwright.config.ts` tiene `testDir:'e2e'` SIN `testIgnore`, así que **corre
  también `e2e/usage/usage-capture.spec.ts` contra sc-demo:4280** (donde las rutas del supervisor no existen) →
  **CLOBBEA los PNG de `public/usage/`** con páginas equivocadas. Esta sesión clobbeó 13 PNG; se restauraron con git
  + se re-capturaron las 2 de reglas. **Para capturar reglas usa SOLO**: `npx playwright test -c
  playwright.usage.config.ts --grep "conversaciones-reglas"` (sirve el supervisor:4290) **y `git checkout --
  _usage-raw.json`** después (el `afterAll` lo reduce a las pantallas capturadas). *Fix sugerido (no aplicado):
  añadir `testIgnore: '**/usage/**'` al config principal.*
- **e2e de componentes NO pasa en entorno fresco**: son snapshots visuales `-darwin.png` sensibles al render de
  fuentes (+ 15 componentes sin baseline commiteada). Fallan por entorno, no por código. No persigas esos ✘.
- **`docs:coherence` falso-positivo pre-existente**: `AUDIT-DEUDA-2026-06.md:72` propone crear `scripts/paths.mjs`
  (backlog `- [ ]`) y el checker lo lee como referencia rota → corta `verify`. Ajeno a reglas; arréglalo aparte.
- Verify entero verde salvo eso (125 tests, audit:components, AOT supervisor+demo, typecheck, lint).
- **NUNCA `git add .claude`** · commits a main con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## 🟡 RECAP al cerrar (lo pidió Rafa)
Mega-dumb, sin AI slop: qué se hizo, por qué, conclusiones, pendiente, y lo que NO se hizo a drede.

## Índice — dónde mirar
- **Decisiones** → `docs/DECISIONS.md` (**DD-28** reglas MVP sin borradores/prioridad · DD-27/26 constructor) ·
  **Backlog deuda** → `docs/AUDIT-DEUDA-2026-06.md` · **Mapa docs** → `docs/DOCS-INDEX.md`.
- **Reglas (producto)** → supervisor `features/memory/` (`state/rules.store.ts` + `data/rule.types.ts` +
  `data/rules-mock.ts` + `pages/rules` + `pages/rule-builder`) · **Recorrido** → sc-demo `pages/reglas` (presentación).
