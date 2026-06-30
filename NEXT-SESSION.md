# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-30** (sesión 7). Esta sesión, todo **mergeado a main + live en Cloudflare** (`main-X3D7M2FY.js`):
> (1) **pulido del listado de reglas** — la columna Alcance muestra la **PROSA del árbol** (servicio+grupo+
> tipificación+duración), no el alcance plano; **guía proactiva "N sin terminar"** junto a Guardar; 3 claves i18n
> huérfanas fuera. (2) **Dirty-state en TODA la plataforma** — primitivo compartido `createFormDirtyState` (snapshot
> estable que maneja Sets) → Guardar refleja **CAMBIO NETO** (se apaga si deshaces) en los 5 forms. (3) **Auditoría
> de deuda del monorepo** por bloques (9 agentes, 99 hallazgos) → `docs/AUDIT-DEUDA-2026-06.md`. Verify entero verde,
> **125 tests**. SOBREESCRIBE este fichero al cerrar.

---

## ▶️ EMPIEZA AQUÍ
1. **Lee este fichero entero.**
2. El backlog priorizado de la sesión: **`docs/AUDIT-DEUDA-2026-06.md`** (temas A-G + P0/P1 + quick-wins, con checkboxes).
3. El *por qué* durable: `docs/DECISIONS.md` (DD-27 = cond-builder v2). Elige tarea de §Lo que queda.

---

## 🎯 Estado de un vistazo — qué se hizo esta sesión (todo en main)

**1. Listado de reglas + builder (commit `e2d425b`)**
- `rules-page.scopeSummary` ahora usa `describeConditionTree` → la fila **dice de verdad qué hace la regla** (fallback
  plano solo para reglas antiguas sin árbol). Verificado en vivo.
- Builder: **"N sin terminar"** (color secundario, no rojo) en el dock junto a Guardar — guía proactiva mientras montas,
  además del hint rojo que sale al intentar guardar.

**2. Dirty-state plataforma-wide (commit `60f20da`) — resuelve Tema C del audit**
- **Primitivo compartido**: `projects/supervisor/src/app/shared/utils/form-dirty-state.{core.mjs,core.d.mts,ts}`.
  `createFormDirtyState(() => snapshot)` → `dirty` por CAMBIO NETO (computed snapshot vs pristine) + `markPristine()`.
  `stableStringify` maneja **Sets** (→ ordenados) y orden de claves (clave: `JSON.stringify` rompe Sets). 7 tests en
  `scripts/__tests__/form-dirty-state.test.mjs`.
- **Cableado**: agentes/grupos/usuarios usan el primitivo (antes tenían un flag manual de un solo sentido, ~25
  `formDirty.set(true)` muertos, fuera); rule-builder usa su propio snapshot + ahora **gatea `canSave`**; **AED ya era
  correcto** (no se tocó). Patrón: `canSave = válido && (esNuevo || dirty())` — en CREAR ignora dirty, en EDITAR lo exige.
- **Verificado en vivo** (vía `ng.getComponent`): editar→cambiar→Guardar ON→deshacer→Guardar OFF, incl. ciclo del Set.

**3. Auditoría de deuda (commit `b25b782`)** → `docs/AUDIT-DEUDA-2026-06.md` (enlazada en DOCS-INDEX).
- Lo gordo: **P0 = field-pattern copy-pasteado ×5** (inputtext/select/multiselect/datepicker/inputnumber: template+CVA+
  9 computeds) — el mayor multiplicador del repo. **2 eras de API** (16 wrappers legacy vs 31 signals).

## 🗺️ Lo que queda (orden recomendado por el audit)

**A. Quick-wins de verificación (mejor ROI — baratos, dejan gates):**
- `i18n:check` como gate del verify (cierra ~35 claves `memory.rules.builder.*` que faltan en en/fr/pt).
- `font-size` px→token (`04-component.css:69,106,108`); `SC_ICON_SIZE_LG=15.75`→16 (`sc-icon-sizes.ts:36`).
- Borrar handlers legacy `onLabelAdd`/`onLanguageAdd` (`agent-form`); `shared/utils/audio.ts` (3 funcs duplicadas).

**B. El P0 — `sc-field-wrapper`** (extraer label+required+slot+footer + CVA + computeds de los 5 fields). **Detrás de
`npm run e2e`** (toca render). Piloto: migra inputtext, valida visual, replica. Es duplicación GENUINA → sí extraer.

**C. Base común admin** (`BaseCrudStore<T>`/`FilteredSortedTable`) — ataca el grueso de P1 admin. Dirty-state ya hecho.

**D. Follow-ups menores ya identificados:**
- **Picker (#1):** decisión cerrada = **mantener el custom** `rule-condition-value-picker` (su comodín "Todos"+`agentGroup`
  son app-domain, NO van al `sc-multiselect` del DS — lo ensuciarían). Queda: igualar fino su look al multiselect + nota
  de doc de por qué es feature-scoped.
- **Consistencia builder ↔ forms admin (#3):** mismo patrón de footer sticky/secciones (no investigado a fondo).
- **Muerto invisible (#5 resto):** bloques i18n `conflict.*`/`draft.*` + `cols.order`/`status.draft` en `es.json`;
  métodos `getConflictingRules`/`reorderActive`/`conflictsByRuleId` en `rules.store` (0 consumidores).
- **`sc-demo /reglas`** (`projects/sc-demo/src/app/pages/reglas/`) — material de PRESENTACIÓN — sigue mostrando el modelo
  VIEJO (grabación, Prioridad, borradores). Si se va a presentar, alinear con DD-27 (o avisar).
- **`DECISIONS.md` newest-first** roto (DD-21..27 al final) — reordenar.

**Diferido de antes:** PPT puente código↔Figma · accionables backend (Repositorios transcripción/tipificación,
simulador de coste, AED Fase 4) · Neutral gray/slate · Code Connect.

## ⚠️ TRAMPAS / PROTECCIONES
- **`npm run verify` ENTERO antes de cada commit que toque componentes.** Los subsets (AOT+lint) **SALTAN
  `audit:components`**; la staleness se acumula y rompe el gate al final. Confirma verde **leyendo el log** (`grep ✗`),
  no el exit-code de un background con `&` (puede ser espurio).
- **Verificar el OUTCOME, no un proxy:** screenshot a viewport real (`preview_resize` 1200+ ANTES) para lo visual; para
  **lógica de signals** usa `window.ng.getComponent(el)` + ejercita la cadena real (`canSave()` antes/después de mutar
  el form) + 1 check del render. NO te quedes en una propiedad del DOM.
- **El `ng serve` se cae solo a mitad** (esbuild) → reinicia el preview; no es tu código (AOT pasa). **AOT = gate de
  plantillas** (`tsc` no las type-checkea a fondo); el supervisor usa su PROPIO `<sc-icon>` (`@shared/components`).
- **Subagentes (edits o AUDITORÍA):** sus reportes/hallazgos son LEADS — verifica cada uno contra el código antes de
  actuar (el audit marcó AED como "dirty divergente" y al abrirlo ya era correcto; no toqué un no-bug).
- **NUNCA `git add .claude`** · **NUNCA commitear `kit-export-dtcg.json`** · commits a main con
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## 🟡 RECAP al cerrar lotes (lo pidió Rafa)
Mega-dumb, sin AI slop, conciso: qué se hizo, por qué, conclusiones, pendiente, y lo que NO se hizo a drede.

## Índice — dónde mirar
- **Backlog priorizado de deuda** → `docs/AUDIT-DEUDA-2026-06.md` · **Decisiones** → `docs/DECISIONS.md` (DD-27/26) ·
  **Backlog durable** → `docs/ROADMAP.md` · **Mapa de docs** → `docs/DOCS-INDEX.md`.
- **Dirty-state compartido** → `supervisor/src/app/shared/utils/form-dirty-state.*` (+ test en `scripts/__tests__/`).
- **Builder real** → supervisor `features/memory/` (`components/rule-condition-builder` + `rule-condition-value-picker`
  + `data/condition-*.{ts,mjs}` + `pages/rule-builder`) · **Forms admin** → `features/admin/{agents,groups,users}/pages`.
- **Recorrido `/reglas`** → sc-demo (presentación, **modelo viejo**, no producto).
