# Auditoría de deuda de diseño — Smart Contact DS (2026-06-30)

> **Método:** auditoría por bloques del monorepo (8 áreas en paralelo), lente
> arquitecto-DS + senior-lead, contra `CLAUDE.md`/`AGENTS.md`. 99 hallazgos
> brutos → síntesis priorizada. Backlog vivo: marca `[x]` lo cerrado.
>
> **Objetivo guía:** reducir deuda de diseño, consistencia entre flujos,
> claridad y simpleza. No es una lista de nitpicks — es lo que de verdad
> multiplica esfuerzo o rompe consistencia.

## 1. Temas transversales (atacar aquí primero)

- **A. Dos eras de API conviviendo** — 16 wrappers DS usan `@Input/@Output`
  (legacy) vs 31 con `input()/output()/model()` (signals); en `agent-app` solo
  2 de 8 con signals. Sin criterio escrito. Es la inconsistencia más visible.
- **B. El field-pattern copy-pasteado ×5** *(la deuda más cara)* —
  `inputtext/select/multiselect/datepicker/inputnumber` duplican palabra por
  palabra template, CVA, host class-binding, 9 computeds, tipos `size`, ID-gen.
  Un cambio de validación o ARIA exige tocar 5 ficheros. **P0.**
- [x] **C. Dirty-state sin patrón único** — *RESUELTO 2026-06-30:* primitivo
  compartido `createFormDirtyState` (snapshot estable que maneja Sets) cableado
  en agentes/grupos/usuarios + rule-builder; AED ya era correcto. Guardar
  refleja CAMBIO NETO (se apaga si deshaces). Fuera ~25 `formDirty.set(true)`
  muertos. 7 tests + verificado en vivo.
- **D. CRUD / listas / selección reinventados por feature** — cada store
  (Agent/User/Group) reimplementa add/update/delete/get; `isNameTaken` ×2;
  `ConversationsStore` reimplementa selección ignorando `SelectionState`;
  listas con los mismos computeds search/sort/filtered.
- **E. Utils duplicados que deberían compartirse** — audio (`formatTime`,
  `parseDurationSeconds`, `hashString`) ×2; scripts (`splitAlpha`/`normHex`/
  `dropAlpha` ×3, `EXPORT_PATH` ×7, `recompactPriorities` ×3); ID-gen ×2.
- **F. Tokens / valores fuera de escala** — `font-size` en px (viola AGENTS.md),
  `0.142857rem` magic, desincronización TS↔CSS de icon-size, hardcodes px.
- **G. iftaLabel + ARIA inconsistentes** en la familia field (sin política
  documentada).

## 2. Top por severidad (file + fix)

### P0 — duplicación del field-pattern (1 causa, 3 hallazgos)
- [ ] Template field duplicado ×5 → extraer `sc-field-wrapper` (label+required+slot+footer).
- [ ] CVA idéntico ×5 (`sc-inputtext:123`, `sc-select:191`, `sc-multiselect:187`, `sc-datepicker:124`, `sc-inputnumber:156`) → `scCreateControlValueAccessor()`.
- [ ] 9 computeds idénticos (`sc-select:142-189` ↔ `sc-multiselect:107-153`) → `scCreateFieldComputeds(inputs)`.

### P1 — DS components
- [ ] 16 wrappers legacy → migrar a `input()/output()/model()` (por lotes, AOT por lote).
- [ ] `radiobutton`/`textarea` legacy + sin field-pattern.
- [ ] host class-binding duplicado ×5 → directiva `scFieldHost`.
- [ ] `hasPrimitiveOptions` duplicado + comentario word-for-word → `scHasPrimitiveOptions()`.

### P1 — Tokens/theme
- [ ] `font-size` en px → token (`04-component.css:69,106,108`).
- [ ] `SC_ICON_SIZE_LG=15.75` vs token 16px (`sc-icon-sizes.ts:36`) → poner 16 + auditar el resto.

### P1 — Admin/Config (misma raíz: falta base form/store)
- [x] ~~`formDirty.set(true)` en 20+ handlers~~ → resuelto (Tema C).
- [x] ~~dirty-state divergente admin vs AED~~ → unificado (primitivo) / AED ya correcto.
- [x] ~~User sin `crossTab`/`conflictWarning`~~ → verificado 2026-07-18: `user-form-page` ya los tiene.
- [ ] `isNameTaken` duplicado (`categories.store:50` ↔ `entities.store:69`).
- [ ] `PERMISSION_MATRIX_KEYS` duplicado (agent-form ↔ aed-agentes) → `admin/data/permission-matrix.ts`.
- [ ] **[quick]** handlers legacy `onLabelAdd`/`onLanguageAdd` vivos en paralelo (`agent-form:766+`) → borrar.
- [ ] `toggleChannel` con cascade-clamping acoplado (`group-form:372`) → `GroupChannelCascadeService`.
- [ ] tri-state toggle sin compartir (agent ↔ group) → `TriStateToggleUtil`.

### P1 — Conversaciones / Memory
- [ ] **[quick]** audio utils duplicados → `shared/utils/audio.ts`.
- [ ] selección reimplementada ignorando `SelectionState` (`conversations.store`).

### P1 — Agent / Scripts / i18n
- [x] ~~PROFILE duplicado (`profile-card` + `agent-footer`)~~ → eliminado (verificado 2026-07-18).
- [x] ~~seed `"Nombre Grupo 1"` ×4~~ → 0 ocurrencias (verificado 2026-07-18).
- [x] **[quick]** i18n: ~35 claves `memory.rules.builder.*` faltan en en/fr/pt → sincronizar + **`i18n:check` en verify** — *RESUELTO 2026-07-01:* 37 claves traducidas (es ↔ en/fr/pt a 1:1, 1277 c/u) + `i18n:check` permanente en `verify`. Ver [`AUDIT-2026-07.md`](./AUDIT-2026-07.md) §3.
- [ ] `EXPORT_PATH` ×7 + cadena de 5 generadores en `package.json:29` → `scripts/paths.mjs` + meta-generador.

## 3. Secuencia recomendada
1. **Quick-wins de verificación** (`i18n:check`, tokens px/icon-size) — bajan ruido, dejan gates.
2. **Piloto `sc-field-wrapper` con inputtext** detrás de `npm run e2e` — el P0, mayor multiplicador. Migra 1 field, valida visual, replica.
3. **Base común admin** (`BaseCrudStore<T>`/`FilteredSortedTable`) — ataca el grueso de P1 admin de una vez. *(Dirty-state ya hecho.)*
4. **Migración wrappers legacy → signals** por lotes en paralelo.

> **Método (innegociable):** cada refactor compartido necesita su verifier antes
> de darlo por bueno — `verify` ENTERO si tocas `sc-*`, `e2e` para el
> field-wrapper. Confirma verde leyendo el log, no el exit-code de un background.
