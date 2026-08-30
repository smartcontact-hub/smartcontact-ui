# Auditoría de deuda de diseño — Smart Contact DS (2026-06-30)

> **Método:** auditoría por bloques del monorepo (8 áreas en paralelo), lente
> arquitecto-DS + senior-lead, contra `CLAUDE.md`/`AGENTS.md`. 99 hallazgos
> brutos → síntesis priorizada. Backlog vivo: marca `[x]` lo cerrado.
>
> **Es el único snapshot FECHADO de deuda** (consolidación 2026-08-13). El backlog *vivo* lo
> genera la rutina semanal en [`AUDIT-SEMANAL.md`](./AUDIT-SEMANAL.md); lo que se prioriza se
> mueve a [`ROADMAP.md`](./ROADMAP.md). Se absorbió aquí `AUDIT-2026-07.md`, que se auto-declaraba
> referencia de este ("§5 · referenciada, NO arreglada aquí"), daba por siguiente una fase que
> DD-29 ya cerró, y abría con un baseline de "16 guardarraíles" cuando son 26. Los tres arreglos
> que sí aportaba están **ejecutados y vivos en el código**, que es donde se comprueban:
> `i18n:check` en `verify`, el matching con y sin guiones de `component-audit.mjs`, y la
> allowlist `PROPOSED_SCRIPTS` de `docs-coherence.mjs`.
>
> **Objetivo guía:** reducir deuda de diseño, consistencia entre flujos,
> claridad y simpleza. No es una lista de nitpicks — es lo que de verdad
> multiplica esfuerzo o rompe consistencia.

## 1. Temas transversales (atacar aquí primero)

- [x] **A. Dos eras de API conviviendo** — 16 wrappers DS usan `@Input/@Output`
  (legacy) vs 31 con `input()/output()/model()` (signals); en `agent-app` solo
  2 de 8 con signals. Sin criterio escrito. Es la inconsistencia más visible.
  → **DECIDIDO 2026-08-14 (DD-38)**: la era objetivo es señales, `sc-button`
  migrado como referencia, y lo sostiene un trinquete en `verify`
  (`npm run audit:api-era`) que impide estrenar decoradores y obliga a que la
  lista de pendientes solo mengüe. El lado de las **apps ya está al 100%**
  (medido 2026-08-14: 0 ficheros con decoradores en supervisor/agent/cuscare/
  sc-docs).
  → **MIGRACIÓN TERMINADA TAMBIÉN (verificado 2026-08-30)**: los 16 que
  quedaban —`sc-icon` incluido— están migrados. `LEGACY_PENDIENTES` en
  `scripts/audit-api-era.mjs` está **vacía** y el gate reporta *211
  componentes: 95 en señales, 0 en decoradores*. Los 4 `@Input()` que aún
  aparecen en un grep son menciones **dentro de comentarios** (`sc-drawer`,
  `sc-radiobutton`, `sc-textarea`, `sidebar-nav-item`), y el gate las descarta
  antes de contar. Decisión y migración, ambas cerradas.
- [x] **B. El field-pattern copy-pasteado ×5** *(la deuda más cara)* — duplicaban
  template, CVA, host class-binding, 9 computeds, tipos `size`, ID-gen.
  → **CERRADO 2026-08-30 ([DD-44](./DECISIONS.md))**. El CVA se BORRÓ en los seis (no lo
  ejercía nada: 0 Reactive Forms, 0 ngModel externo) y la lógica compartida vive en
  `components/field/sc-field.ts` como factories. El plan viejo (`scCreateControlValueAccessor`)
  era trabajo tirado: la vía de Angular 22 es Signal Forms. ~265 líneas netas fuera. Ver §2.
- [x] **C. Dirty-state sin patrón único** — *RESUELTO 2026-06-30:* primitivo
  compartido `createFormDirtyState` (snapshot estable que maneja Sets) cableado
  en agentes/grupos/usuarios + rule-builder; AED ya era correcto. Guardar
  refleja CAMBIO NETO (se apaga si deshaces). Fuera ~25 `formDirty.set(true)`
  muertos. 7 tests + verificado en vivo.
- [x] **D. CRUD / listas / selección reinventados por feature** — cada store
  (Agent/User/Group) reimplementa add/update/delete/get; `isNameTaken` ×2;
  `ConversationsStore` reimplementa selección ignorando `SelectionState`;
  listas con los mismos computeds search/sort/filtered.
  → **CERRADO 2026-08-30 por [DD-43](./DECISIONS.md), y NO construyendo la base común.**
  Medido: los stores ya delegan en `createLocalStore` (los wrappers van de 36 a 106 líneas),
  `isNameTaken` está unificado, `SelectionState` se retiró a propósito, y lo que queda repetido
  entre list-pages son one-liners — el diff normalizado agents↔groups deja **595 líneas
  divergentes de 775**. Lo que parecía una base por construir estaba construido; lo que
  parecía duplicación es parecido estructural.
- [x] **E. Utils duplicados que deberían compartirse** — audio (`formatTime`,
  `parseDurationSeconds`, `hashString`) ×2; scripts (`splitAlpha`/`normHex`/
  `dropAlpha` ×3, `EXPORT_PATH` ×7, `recompactPriorities` ×3); ID-gen ×2.
  → **CERRADO 2026-08-30**, con dos correcciones al enunciado:
  · audio ✅ `shared/utils/audio.ts` (2026-08-24). **`hashString` no estaba
  duplicado** —una sola definición, `conversation-player-modal:446`— ni es
  audio: es semilla determinista de datos de demostración. Se queda donde se
  usa (DD-4: el patrón de un solo consumidor vive en su sitio).
  · el ID-gen ×2 **sí existía, pero en otra familia**: `hashName` (DJB2) estaba
  **verbatim** en el DS (`core/avatar-illustration.ts`, exportado) y copiado en
  `illustrated-avatar.component.ts` del supervisor, junto con el catálogo de
  pools. Riesgo real, no cosmético: con dos reparticiones, el avatar 25 del DS
  habría dado **caras distintas para el mismo nombre** según el componente. El
  supervisor delega ya en `buildIllustrationSrc`; comprobado que el `src` sale
  idéntico (40 comparaciones: 20 nombres reales × 2 pools).
  · `EXPORT_PATH` → ver la fila de *Agent/Scripts/i18n*, cerrada el mismo día.
- **F. Tokens / valores fuera de escala** — `font-size` en px (viola AGENTS.md),
  `0.142857rem` magic, desincronización TS↔CSS de icon-size, hardcodes px.
- [x] **G. iftaLabel + ARIA inconsistentes** en la familia field →
  **CERRADO 2026-08-30 con [DD-44](./DECISIONS.md)**: el ARIA lo alimenta ahora la factory
  compartida (`createScFieldState` → `isInvalid`/`msgId`), que es donde nacía el drift, y el
  `invalid` explícito se igualó a los cinco. `iftaLabel` se conserva en 3 de 5 como divergencia
  de capacidad deliberada (los otros dos no lo llevan en Figma).

## 2. Top por severidad (file + fix)

### P0 — duplicación del field-pattern → ✅ CERRADO 2026-08-30 ([DD-44](./DECISIONS.md))

Ejecutado en su totalidad. Lo que de verdad se hizo, distinto del plan de junio:
- [x] ~~CVA idéntico ×5 → `scCreateControlValueAccessor()`~~ → **BORRADO** en los seis
  (`sc-search` incluido, que el audit no contaba). Ningún consumidor lo usaba; sustituirlo por
  otro CVA era trabajo tirado (Angular 22 → Signal Forms, compat estructural vía `value=model()`).
- [x] ~~9 computeds idénticos select↔multiselect → `scCreateFieldComputeds`~~ → extraídos a
  `createScOptionState` (opciones, incl. `hasPrimitiveOptions`) + `createScPanelSizing` + el
  `createScFieldState` común. Una sola copia del fix «empty empty…» con `string[]`.
- [~] ~~Template field ×5 → `sc-field-wrapper`~~ → **NO se hizo, con motivo**: las plantillas
  restantes divergen estructuralmente (datepicker sin `__field`, ifta en 3/5, select con 6
  puentes contentChild dentro), así que un wrapper habría metido re-parenting condicional y
  churn del baseline por ahorrar ~20 líneas cortas ya vigiladas por `component-structure.spec`.
  El label+msg que SÍ se compartía se extrajo en B2 (`sc-field-label`/`sc-field-msg`).

### P1 — DS components
- [x] ~~16 wrappers legacy → migrar a `input()/output()/model()`~~ → **TERMINADO**
  (verificado 2026-08-30): `LEGACY_PENDIENTES` vacía en `scripts/audit-api-era.mjs`, gate en
  *0 componentes en decoradores*. Criterio y trinquete: **DD-38**.
- [ ] `radiobutton`/`textarea` legacy + sin field-pattern. → **la mitad legacy está CERRADA**
  (verificado 2026-08-30: ambos en `model()`/`input()`). Sigue abierto que no consumen
  `sc-field-label`/`sc-field-msg` — y ojo, **ninguno de los dos es CVA y está escrito a
  propósito** en su propio docstring, así que no entran en el P0 de arriba por analogía.
- [ ] host class-binding duplicado ×5 → directiva `scFieldHost`.
- [ ] `hasPrimitiveOptions` duplicado + comentario word-for-word → `scHasPrimitiveOptions()`.

### P1 — Tokens/theme
- [x] ~~`font-size` en px → token (`04-component.css:69,106,108`)~~ → **CERRADO**
  (verificado 2026-08-30): esas tres declaraciones son hoy `var(--sc-font-size-400/200/100)`
  en `04-component.css:69,108,111`; cero `font-size: Npx` en el fichero.
- [x] ~~`SC_ICON_SIZE_LG=15.75` vs token 16px~~ → **CERRADO**: `sc-icon-sizes.ts:47` es `= 16`,
  y el propio fichero (`:9-15`) documenta el arreglo citando este informe. *Verificado 2026-08-30.*

### P1 — Admin/Config (misma raíz: falta base form/store)
- [x] ~~`formDirty.set(true)` en 20+ handlers~~ → resuelto (Tema C).
- [x] ~~dirty-state divergente admin vs AED~~ → unificado (primitivo) / AED ya correcto.
- [x] ~~User sin `crossTab`/`conflictWarning`~~ → verificado 2026-07-18: `user-form-page` ya los tiene.
- [x] ~~`isNameTaken` duplicado (`categories.store:50` ↔ `entities.store:69`)~~ → **CERRADO**:
  genérico en `core/utils/store-helpers.ts:21`; los dos stores son wrappers de una línea
  (`categories.store.ts:51`, `entities.store.ts:70`). *Verificado 2026-08-30.*
- [x] ~~`PERMISSION_MATRIX_KEYS` duplicado (agent-form ↔ aed-agentes)~~ → ya solo hay **una**
  definición (`agent-form-page.component.ts:82`); el resto son usos en ese mismo fichero.
  *Verificado 2026-08-13.*
- [x] ~~**[quick]** handlers legacy `onLabelAdd`/`onLanguageAdd` (`agent-form:766+`)~~ →
  **CERRADO**: 0 ocurrencias en todo el repo. *Verificado 2026-08-30.*
- [ ] `toggleChannel` con cascade-clamping acoplado → **ABIERTO**, movido a
  [`ROADMAP.md`](./ROADMAP.md) con disparador (2026-08-30). Referencia rancia corregida: hoy
  `group-form-page.component.ts:408`, `group-assignment-table:127`, `agent-channel-table:178`.
  Matiz medido: **no es duplicación**, es lógica de dominio pegada a la vista — extraerla se
  paga en testabilidad, no en DRY.
- [x] ~~tri-state toggle sin compartir (agent ↔ group) → `TriStateToggleUtil`~~ → **CERRADO,
  con otro nombre y otro sitio**: `triStateOf()` vive en el DS (`sc-checkbox.component.ts:28`) y
  lo consumen `agent-form-page:341,425` y `agent-channel-table:151`. *Verificado 2026-08-30.*

### P1 — Conversaciones / Memory
- [x] ~~**[quick]** audio utils duplicados → `shared/utils/audio.ts`~~ → **CERRADO** (2026-08-24):
  `formatTime` + `parseDurationSeconds` unificados, quedándose con la versión segura de cada uno.
  (`hashString` no entró: no estaba duplicado y no es audio — ver tema **E**.)
- [x] ~~selección reimplementada ignorando `SelectionState`~~ → **OBSOLETO, no arreglado**:
  `SelectionState` se **retiró del repo** el 2026-08-24 (de sus nueve miembros las páginas usaban
  dos, y `p-tableHeaderCheckbox` da el resto). Las tres list-pages lo documentan en su código. El
  ítem pedía converger hacia una abstracción que ya no existe. *Verificado 2026-08-30.*

### P1 — Agent / Scripts / i18n
- [x] ~~PROFILE duplicado (`profile-card` + `agent-footer`)~~ → eliminado (verificado 2026-07-18).
- [x] ~~seed `"Nombre Grupo 1"` ×4~~ → 0 ocurrencias (verificado 2026-07-18).
- [x] **[quick]** i18n: ~35 claves `memory.rules.builder.*` faltan en en/fr/pt → sincronizar + **`i18n:check` en verify** — *RESUELTO 2026-07-01:* 37 claves traducidas (es ↔ en/fr/pt a 1:1, 1277 c/u) + `i18n:check` permanente en `verify`. (`scripts/i18n-check.mjs`, hoy en la cadena `verify`).
- [x] ~~`EXPORT_PATH` ×7 → `scripts/paths.mjs`~~ → **CERRADO 2026-08-30**, y **escondía un bug**:
  eran **6** definiciones y las cinco de los generadores respetaban `SC_KIT_EXPORT`, pero
  `token-parity.mjs` —el que VERIFICA— hardcodeaba la ruta. Apuntar la cadena a otro export dejaba
  a generar y verificar mirando ficheros distintos, **con la paridad en verde**. Medido con control
  negativo: con el export mutado, la versión vieja salía 0 y la nueva sale 1. Hoy los 6 importan de
  `scripts/paths.mjs` y lo fija una prueba en `bridge-e2e.test.mjs`. *(El «meta-generador» no se
  hace: los 5 generadores encadenados en `tokens:import` son legibles y no se pisan.)*

## 3. Secuencia recomendada
1. **Quick-wins de verificación** (`i18n:check`, tokens px/icon-size) — bajan ruido, dejan gates.
2. **Piloto `sc-field-wrapper` con inputtext** detrás de `npm run e2e` — el P0, mayor multiplicador. Migra 1 field, valida visual, replica.
3. ~~**Base común admin** (`BaseCrudStore<T>`/`FilteredSortedTable`)~~ — **DESCARTADO
   2026-08-30, [DD-43](./DECISIONS.md)**: `BaseCrudStore` ya existe con otro nombre
   (`createLocalStore`) y `FilteredSortedTable` chocaría con una divergencia de orden puesta a
   conciencia (`users-list-page.component.ts:155-166`). No se construye.
4. ~~**Migración wrappers legacy → signals** por lotes en paralelo.~~ → **TERMINADA**
   (verificado 2026-08-30, tema **A**).

> **Método (innegociable):** cada refactor compartido necesita su verifier antes
> de darlo por bueno — `verify` ENTERO si tocas `sc-*`, `e2e` para el
> field-wrapper. Confirma verde leyendo el log, no el exit-code de un background.
