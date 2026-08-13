# Auditoría semanal — Smart Contact DS (backlog vivo)

> **Autogenerado** por la rutina cloud "Auditoría semanal"
> (`.claude/skills/auditoria-semanal/SKILL.md`). Es la versión de **juicio**, en
> cadencia, de `AUDIT-DEUDA-2026-06.md`: caza lo que los 25 gates de `verify` no
> pueden ver (deuda de diseño + deriva semántica de docs). Cada run añade una
> sección fechada **arriba**; `[x]` = cerrado. Semana sin hallazgos reales → no
> hay sección nueva (la rutina no abre PR).
>
> ⚠️ **Este doc lo escanea `docs:coherence` en cada `verify`.** No cita nunca un
> `npm run …` ni un `scripts/….mjs` que no exista (rompería el CI). Los gates
> *propuestos* se describen en prosa, sin su path. Ver §3 del skill.

---

## 2026-08-13

> Método: pasada A (deuda de código, ≤5) + pasada B (deriva de docs) + pasada C (PRs parados
> >7d). Contra AGENTS.md/.impeccable.md/customs-catalog.md/DOCS-INDEX.md. Pasada C: `gh`/MCP
> de GitHub confirma **0 PRs abiertos** en el repo — sin hallazgos.

### Deuda de código

- [ ] **P1** Los 4 componentes de referencia que `AGENTS.md:267-282` manda inspeccionar antes de
  generar nada conviven en dos eras de API sin criterio escrito: `sc-button.component.ts:31-61`
  (el más citado y copiado del set) sigue en `@Input()`/`@Output()` puro, mientras
  `sc-toggleswitch.component.ts:37-40` e `sc-inputtext.component.ts` ya usan `input()`/`output()`
  de signals — confirmado también a nivel de librería: 16 ficheros con `@Input()` vs 19 con
  `= input(` en `projects/ui-smartcontact/src/lib/components`, sin ninguna nota en `AGENTS.md`,
  `docs/DECISIONS.md` ni `docs/migration-safety.md` sobre cuál es la era objetivo → decidir y
  documentar (DD-N) la era objetivo; si es signals, migrar `sc-button` primero por ser la
  referencia más citada. [arréglalo]
- [ ] **P1** `createFormDirtyState()` se documenta a sí mismo como "patrón único
  plataforma-wide (admin agentes/grupos/usuarios, AED, builder de reglas)"
  (`form-dirty-state.ts:6-9`), pero solo lo consumen las 3 páginas admin
  (`user-form-page.component.ts`, `agent-form-page.component.ts`,
  `group-form-page.component.ts`); las páginas AED y el rule-builder reimplementan a mano el
  mismo par pristine/dirty con `JSON.stringify` crudo — justo el falso-sucio que
  `stableStringify` existe para evitar — con el mismo comentario copiado ("Público para el
  `formDirtyGuard`... confirma al salir con cambios"): `aed-agentes-page.component.ts:100,106-111`
  (y su misma forma en `aed-grupos-page`/`aed-servicio-page`) y
  `rule-builder-page.component.ts:198-217` con su propio `buildSnapshot()` → migrar las 4 páginas
  restantes a `createFormDirtyState()`. [arréglalo]
- [ ] **P1** El port presentacional `sc-bulk-transcription-modal` del DS
  (`sc-bulk-transcription-modal.component.ts:41-51`: "recibe los contadores YA calculados...
  Animaciones 1:1 con el molde: hero count-up, delta flotante, pulse del caption, nudge del
  toggle") se exporta en `public-api.ts` y no lo consume nadie fuera de `sc-docs`; la app
  (Memory) reimplementó el mismo modal desde cero con las mismas animaciones bajo otros nombres
  (`bulk-transcription-modal.component.ts:87-93` `isPulsing`/`deltaGhost`/`isShaking`, `:302-331`
  `firePulseAndFlash`) → adoptar `<sc-bulk-transcription-modal>` en Memory (aportando solo los
  contadores, que es justo lo que el componente del DS espera) o, si quedó desfasado del caso
  real, retirarlo del DS. [arréglalo]
- [ ] **P2** Los 9 stores de `projects/supervisor/src/app/features/admin/repositories/instances/`
  (`entidades.ts:74-95`, `agendas.ts:74-95`, y 7 más) son la misma clase boilerplate carácter a
  carácter — `@Injectable` + `addItem`/`updateItem`/`deleteItem`/`deleteItems` como pass-through
  1:1 a `createLocalStore` — y solo cambia el nombre del tipo → `createRepoStore<T>(opts)` en
  `local-store.factory.ts` que devuelva directamente un `RepoStore<T>`, sin clase por entidad.
  [arréglalo]

### Deriva de docs

- [ ] El comentario del CHECK E en `scripts/docs-coherence.mjs:25-27` dice que el gate "nace de
  dos derivas reales: el README raíz decía 49 y el del paquete '~55'" citando
  `projects/ui-smartcontact/README.md` como motivo — pero el alcance del propio check
  (`scripts/docs-coherence.mjs:63-64`: "checks A-E siguen con el alcance de docs:guard", que no
  escanea `projects/**`) excluye exactamente ese fichero: `projects/ui-smartcontact/README.md:25`
  sigue en "~55 componentes" (ítem ya abierto en la sección 2026-08-04 de este doc) y CHECK E
  nunca podrá cazarlo → matizar el comentario: el caso real que originó el gate queda fuera de su
  alcance hasta que se amplíe como CHECK F (que sí camina `projects/**` vía `mdDeProyectos()`).
  [arréglalo]

## 2026-08-10

> Método: pasada A (deuda de código, ≤5) + pasada B (deriva de docs). Contra AGENTS.md/.impeccable.md/customs-catalog.md/DOCS-INDEX.md. La deriva de `docs/DECISIONS.md` (newest-first) ya está capturada en la sección 2026-08-04 de abajo, sin resolver — no se repite aquí.

### Deuda de código

- [ ] **P1** `sc-illustrated-avatar` local del supervisor duplica un componente que el propio DS ya retiró y consolidó en `sc-avatar` (`projects/supervisor/src/app/shared/components/illustrated-avatar/illustrated-avatar.component.ts:44`, vs `projects/ui-smartcontact/src/lib/core/avatar-illustration.ts:1-5` que documenta la migración + `sc-avatar.component.ts:51` que ya expone `illustrationName`/`illustrationPool`/`illustrationBase`) → reemplazar `<sc-illustrated-avatar>` por `<sc-avatar [illustrationName]>` en los 9 ficheros que aún lo usan (`user-form-page`, `agent-form-page`, `agents-list-page`, `group-form-page`, `groups-list-page`, `agent-channel-table`, `group-assignment-table`, `top-bar`) y borrar el componente local. [arréglalo]
- [ ] **P1** `AgentChannelTableComponent` y `GroupAssignmentTableComponent` se documentan a sí mismos como "contraparte simétrica" (comentario en `group-assignment-table.component.ts:25`) pero divergen en UX (selección múltiple + bulk pause/unassign vs picker simple) sobre el mismo modelo `GroupAgentLink[]`, y comparten un helper `canonicalize()` copiado verbatim (`agent-channel-table.component.ts:269` = `group-assignment-table.component.ts:168`, idéntico carácter a carácter) → extraer un editor compartido de links agente↔canal/grupo (o al menos mover `canonicalize()` a un util común) y decidir una única UX para añadir/quitar un link. [arréglalo]
- [ ] **P1** El patrón "form panel de alta/edición" se reimplementa 5 veces (signal por campo, sync `initial`→signals, autofocus vía `ViewChild`+`queueMicrotask`, `onSave` create-vs-update) con **dos criterios distintos** de nombre-duplicado sin documentar: `existingNames`/`.some()` en `label-form-panel.component.ts:56,127` y `template-form-panel.component.ts:40` vs `store.isNameTaken()` en `category-form-modal.component.ts:155` y `entity-form-modal.component.ts:122` — mientras `repo-form-panel.component.ts:46` ya es genérico (`RepoFormPanelComponent<T>`, sirve 7 tipos de entidad) y no se reusa → generalizar `RepoFormPanelComponent` (o extraer el estado a un helper compartido) y unificar el criterio de nombre-duplicado. [arréglalo]
- [ ] **P2** `ClipboardService` del supervisor es una copia carácter-a-carácter de `ScClipboardService` del DS (`projects/supervisor/src/app/core/services/clipboard.service.ts:12` vs `projects/ui-smartcontact/src/lib/core/services/sc-clipboard.service.ts:14`) y no la inyecta nadie (0 usos fuera de su propio fichero y del barrel `core/services/index.ts:4`) → borrar el fichero y su export; usar `ScClipboardService` del DS si hace falta. [gate-able — un guard que barra exports sin ningún import en el resto del árbol (dead-export sweep) habría cazado esto solo]
- [ ] **P2** Dos utils de `supervisor/shared/utils/` bifurcan (fork) su equivalente ya publicado por el DS en vez de importarlo, y una de las dos copias está además muerta: `icon-size.ts:24-38` es copia byte-a-byte de `sc-icon-sizes.ts` del paquete `@smartcontact-hub/icons` (usado solo en `label-chip.component.ts`) y `is-typing-target.ts:7` es copia byte-a-byte de `projects/ui-smartcontact/src/lib/core/utils/is-typing-target.ts` (0 usos en supervisor) → borrar `is-typing-target.ts` local; en `icon-size.ts`, importar de `@smartcontact-hub/icons` en vez de re-declarar. [gate-able — mismo dead-export sweep que el punto anterior]

### Deriva de docs

- [x] ~~`README.md:19` (raíz del repo) dice "**49** wrappers/customs `sc-*`" pero `docs/inventory.md:28` (auto-generado por `component-audit`) dice "**51 componentes**"~~ — **cerrado**: `README.md:19` ya dice 51 (arreglado en `1674bf1`, "feat(gates): la doc ya no puede mentir sobre cifras..."), cuadra con `docs/inventory.md:28` y con `node scripts/component-audit.mjs check` (verificado 2026-08-13).
- [ ] `docs/customs-catalog.md:52` documenta el primary de marca como `#344a70` ("navy-500") vía `semantic.primary.color = var(--sc-bg-primary)`, pero `--sc-bg-primary` resuelve hoy a `--sc-color-blue-700` = `#1b273d` (`02-semantic.css:22`, `01-primitive.css:24`) — el código está bien y pasa `tokens:parity` (`sc-bg-primary` es `enforce` contra `primary.color` del export en `scripts/color-map.mjs:42`), pero el hex de ejemplo del catálogo quedó desactualizado (distinto del pie de página ya señalado en la sección 2026-08-04: aquí el valor en sí es incorrecto, no solo la fecha) → actualizar el hex de la fila a `#1b273d`/blue-700. [arréglalo]

## 2026-08-04

> Método: pasada A (deuda de código, ≤5) + pasada B (deriva de docs). Contra
> `AGENTS.md` / `.impeccable.md` / `docs/customs-catalog.md` / `docs/DOCS-INDEX.md`.

### Deuda de código

- [ ] **P1** Patrón de selección fragmentado en 3 formas sin decisión escrita:
  la clase `SelectionState` (`groups-list-page.component.ts:144`,
  `users-list-page.component.ts:131`) vs un `selectedIds` signal nativo con
  opt-out ya documentado (`agents-list-page.component.ts:175-186`: migró fuera
  de `SelectionState` a favor de `p-tableHeaderCheckbox`/`p-tableCheckbox`) vs
  el mismo `selectedIds` signal sin documentar el porqué
  (`templates-page.component.ts:94`, `labels-page.component.ts:103`,
  `repo-list-page.component.ts:94`). El docstring de
  `selection-state.ts:7-8` sigue listando agents/labels/repositories como si
  compartieran el patrón que resuelve, y ya no es así → escribir la decisión
  (retirar `SelectionState` a favor del patrón de agents, o al revés) y migrar
  los rezagados, o corregir el docstring. [arréglalo]
- [ ] **P1** `labels` monta un 4º diálogo de confirmación desde cero
  (`delete-labels-dialog.component.ts:18-24`: stack de chips + conteo de
  agentes afectados) en vez de componer `sc-impact-preview-dialog`, que ya
  resuelve exactamente ese patrón (impacto de una operación masiva con chips
  removibles) y está en uso en agents/groups/users para el bulk-edit → extender
  `sc-impact-preview-dialog` (o `sc-delete-entity-dialog`) para cubrir borrado
  con conteo de impacto en vez de un componente nuevo. [arréglalo]
- [ ] **P2** `GroupAgentLinksStore.readFromStorage`/`writeToStorage`
  (`group-agent-links.store.ts:152-176`) duplican casi verbatim —mismos
  comentarios incluidos— la lógica de storage versionado de `createLocalStore`
  (`local-store.factory.ts:51-75`); no puede reusar el factory tal cual porque
  su entidad tiene clave compuesta (`agentId`+`groupId`), pero el storage no
  depende de la clave → extraer un `createVersionedStorage` que no asuma
  `id: number` y que ambos lo consuman. [arréglalo]
- [ ] **P2** `bulkUpdate` repite la misma forma exacta (guard de vacío + `Set`
  + `for...of` + `switch`→`patch` + `updateItem`) en tres stores admin
  (`agents.store.ts:69-93`, `groups.store.ts:48-68`, `users.store.ts:62-73`)
  → `bulkUpdatePatch<T>(store, ids, patchFn)` genérico en
  `local-store.factory.ts` que reciba el `switch` como callback. [arréglalo]

### Deriva de docs

- [ ] `docs/DECISIONS.md:9` promete "Formato DD-N, newest first", pero
  DD-21..DD-34 (`docs/DECISIONS.md:1005` a `:1444`) se anexaron en orden
  ASCENDENTE al final, tras DD-1 (`docs/DECISIONS.md:978`), en vez de subir al
  principio del bloque — rompe la promesa para toda la cola. Ya señalado como
  pendiente en `docs/DOCS-INDEX.md:88` desde 2026-06-30 (entonces "DD-21..27 al
  final") y ha seguido creciendo sin corregirse (ahora DD-21..34) → mover
  DD-21..DD-34 justo debajo del DD más reciente para que el fichero completo
  sea newest-first real. [arréglalo]
- [ ] `docs/customs-catalog.md:905` dice "Última actualización: 2026-06-14",
  pero el cuerpo tiene secciones fechadas hasta el 2026-07-22 (§1.9,
  `docs/customs-catalog.md:321`) — el pie lleva más de un mes de contenido
  nuevo sin tocarse → actualizar la fecha al último cambio real, o quitar el
  pie fijo y remitir a las fechas inline de cada sección. [arréglalo]
- [ ] `projects/ui-smartcontact/README.md:25` afirma "~55 componentes
  `sc-*`"; el conteo real (`docs/inventory.md:28`, mantenido al día por
  `npm run audit:components` dentro de `verify`) da 51. Fuera del alcance de
  `docs:guard`, que no escanea `projects/**` (nota en
  `docs/DOCS-INDEX.md:90`) → cambiar la cifra a 51 (o a "más de 50" para no
  requerir mantenimiento exacto); un guard nuevo que compare la cifra citada
  en los README de paquete contra el conteo real de componentes cerraría esta
  clase de deriva para siempre. [gate-able]

<!-- Las secciones fechadas se insertan aquí, la más nueva primero. -->
