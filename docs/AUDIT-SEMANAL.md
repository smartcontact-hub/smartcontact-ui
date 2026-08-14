# Auditoría semanal — Smart Contact DS (backlog vivo)

> **Autogenerado** por la rutina cloud "Auditoría semanal"
> (`.claude/skills/auditoria-semanal/SKILL.md`). Es la versión de **juicio**, en
> cadencia, de `AUDIT-DEUDA-2026-06.md`: caza lo que los 26 gates de `verify` no
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

- [x] ~~**P1** Los 4 componentes de referencia que `AGENTS.md:267-282` manda inspeccionar antes de
  generar nada conviven en dos eras de API sin criterio escrito: `sc-button.component.ts:31-61`
  (el más citado y copiado del set) sigue en `@Input()`/`@Output()` puro, mientras
  `sc-toggleswitch.component.ts:37-40` e `sc-inputtext.component.ts` ya usan `input()`/`output()`
  de signals — confirmado también a nivel de librería: 16 ficheros con `@Input()` vs 19 con
  `= input(` en `projects/ui-smartcontact/src/lib/components`, sin ninguna nota en `AGENTS.md`,
  `docs/DECISIONS.md` ni `docs/migration-safety.md` sobre cuál es la era objetivo → decidir y
  documentar (DD-N) la era objetivo; si es signals, migrar `sc-button` primero por ser la
  referencia más citada.~~ **HECHO 2026-08-14** — **DD-38**: la era objetivo es señales,
  `sc-button` migrado (15 `input()` + 1 `output()`, getters → `computed()`), nota de era en
  `AGENTS.md` → *Reference Components* + anti-patrón, y **gate nuevo `audit:api-era`** (el 26 de
  `verify`) que es un trinquete: la lista de pendientes solo mengua, y también se pone rojo si
  dejas dentro uno ya migrado. Tres matices que el hallazgo no veía, todos medidos: (a) el
  **19** era un `grep '= input('` literal — con `input.required(` y `model()` la librería estaba
  en **34 señales / 16 decoradores**, o sea que la era mayoritaria ya era señales por más de 2:1;
  (b) **las apps ya están al 100%** — el único `@Input()` del supervisor es un *comentario* de
  `sidebar-nav-item.component.ts` que explica por qué NO lo usa, así que la deuda es solo de la
  librería; (c) el guard cazó un decimoséptimo que el grep del hallazgo no miraba, **`sc-icon`**
  del paquete de iconos. Lo que hace la migración barata: de los 17, **0** usan `@Input() set` y
  **0** son CVA. Quedan 16 en el trinquete, por lotes.
- [x] ~~**P1** `createFormDirtyState()` se documenta como "patrón único plataforma-wide" pero solo
  lo usaban las 3 páginas admin; AED y el rule-builder reimplementaban el par pristine/dirty con
  `JSON.stringify` crudo.~~ **HECHO 2026-08-13**, con un matiz que el hallazgo no veía: las 3
  páginas de AED usan `pristine` **también para restaurar** el formulario al descartar
  (`form.set(structuredClone(pristine()))`), y `createFormDirtyState` guarda el pristine
  *serializado* — migrarlas enteras habría roto "descartar cambios". Así que se partió en dos:
  el **rule-builder** migra completo (su pristine solo comparaba) y las **3 de AED** conservan su
  signal y comparten solo la comparación, vía `stableStringify` ya re-exportado.
  Lo que se arregla de verdad no es la duplicación, es un defecto: con `JSON.stringify` crudo
  `{x:1,y:2}` y `{y:2,x:1}` salen **distintos** → falso SUCIO (Guardar se activa sin tocar nada),
  y dos `Set` distintos salen **iguales** → falso LIMPIO (un cambio real se pierde). Verificado en
  consola antes de tocar nada. Gate: `e2e:supervisor` 125/125 + AOT + typecheck + lint.

- [x] ~~**P1** El port presentacional `sc-bulk-transcription-modal` del DS
  (`sc-bulk-transcription-modal.component.ts:41-51`: "recibe los contadores YA calculados...
  Animaciones 1:1 con el molde: hero count-up, delta flotante, pulse del caption, nudge del
  toggle") se exporta en `public-api.ts` y no lo consume nadie fuera de `sc-docs`; la app
  (Memory) reimplementó el mismo modal desde cero con las mismas animaciones bajo otros nombres
  (`bulk-transcription-modal.component.ts:87-93` `isPulsing`/`deltaGhost`/`isShaking`, `:302-331`
  `firePulseAndFlash`) → adoptar `<sc-bulk-transcription-modal>` en Memory (aportando solo los
  contadores, que es justo lo que el componente del DS espera) o, si quedó desfasado del caso
  real, retirarlo del DS.~~
  **RESUELTO 2026-08-14 — ninguna de las dos ramas: es [intencional].** Las dos se descartaron
  con medición, y en este orden:
  · **Adoptarlo en Memory, NO**: comparados fichero a fichero, ya no son el mismo modal. El port
    se quedó en la v26 de junio (`git log`: última edición funcional el 2026-06-13) y la app
    siguió con el redesign S58. La app tiene y el port no: **badges iconográficos**
    include/warn/exclude en el hero —que sustituyeron al texto denso (`heroHint`) que el port
    sigue pintando—, **franja de error** `role="alert"`, **estado de carga** en el botón de
    procesar, y el shell delegado en `<sc-dialog>` (el port renderiza su propio `role="dialog"`).
    Adoptarlo sería una regresión visible en producción, no una consolidación.
  · **Retirarlo del DS, TAMPOCO** — y esto es lo que el hallazgo no podía ver, porque solo miró
    consumidores: **el modal está en el Kit**. `kit-export-dtcg.json` lo modela con tokens
    propios (borde, header, subheader, título, footer) bajo `aura/custom`, cuya única otra rama
    es `typography`: es decir, es **el único componente custom que el Kit modela**. Retirar su
    implementación dejaría sin implementar la única pieza custom del sistema de diseño. Que "no
    lo use nadie" no significa que sobre — significa que **la app se adelantó al Kit**, que es
    otra conversación (y es de Rafa y Marta, en Figma, no del código).
  Se cierra como **[intencional]**, mismo criterio con el que se reclasificó `sc-illustrated-avatar`
  el 2026-08-13, y queda avisado en el docstring del propio componente para que la próxima
  pasada no lo vuelva a levantar. **Sin DD**: es un triaje, no una decisión de arquitectura
  nueva — el criterio ("el DS implementa el Kit, no la app") ya vive en el diseño del repo.

  **Hallazgo NUEVO que salió tirando de este hilo** (más pequeño, pero real y verificable): la
  rama `aura/custom` del export del Kit **no la clasifica ningún coverage-map**, así que ni se
  genera su familia `--sc-cmp-*` ni salta nada si el Kit añade mañana otro custom; y la SCSS del
  componente tira de tokens semánticos (`--sc-text-secondary`, `--sc-spacing-*`) en vez de los de
  su propia familia. Es la clase de agujero que `tokens:parity` ya cubre para `semantic/common`,
  `app` y `effects`. [gate-able]
- [x] ~~**P2** Los 9 stores de `projects/supervisor/src/app/features/admin/repositories/instances/`
  (`entidades.ts:74-95`, `agendas.ts:74-95`, y 7 más) son la misma clase boilerplate carácter a
  carácter — `@Injectable` + `addItem`/`updateItem`/`deleteItem`/`deleteItems` como pass-through
  1:1 a `createLocalStore` — y solo cambia el nombre del tipo → `createRepoStore<T>(opts)` en
  `local-store.factory.ts` que devuelva directamente un `RepoStore<T>`, sin clase por entidad.~~
  **HECHO 2026-08-14**: `createRepoStore<T>(nombre, config)` en `local-store.factory.ts`; las 9
  clases pasan a una constante de 6 líneas (**−144 líneas netas**). Devuelve un `InjectionToken`
  con factory `providedIn: 'root'`, no un objeto suelto, y eso es lo que hace que el cambio sea
  de verdad no-invasivo: conserva el singleton **perezoso** (el `localStorage` se lee en la
  primera inyección, no al importar el módulo) y **`inject(XStore)` no cambia en ningún
  consumidor** — ni en las 9 páginas ni en `agent-form-page.component.ts:154`. Lo que permitió
  borrar la clase entera: el `LocalStore<T>` que ya devolvía el factory **cumple `RepoStore<T>`**,
  que es un subconjunto suyo. Verificado: 9 claves de `localStorage` distintas y preservadas una a
  una (un error ahí habría vaciado un repositorio), 0 usos de esos símbolos en posición de tipo o
  en `providers:`, typecheck + AOT del supervisor + `e2e:supervisor`.

### Deriva de docs

- [x] ~~El comentario del CHECK E en `scripts/docs-coherence.mjs:25-27` dice que el gate "nace de
  dos derivas reales: el README raíz decía 49 y el del paquete '~55'" citando
  `projects/ui-smartcontact/README.md` como motivo — pero el alcance del propio check
  (`scripts/docs-coherence.mjs:63-64`: "checks A-E siguen con el alcance de docs:guard", que no
  escanea `projects/**`) excluye exactamente ese fichero: `projects/ui-smartcontact/README.md:25`
  sigue en "~55 componentes" (ítem ya abierto en la sección 2026-08-04 de este doc) y CHECK E
  nunca podrá cazarlo → matizar el comentario: el caso real que originó el gate queda fuera de su
  alcance hasta que se amplíe como CHECK F (que sí camina `projects/**` vía `mdDeProyectos()`).~~
  **HECHO 2026-08-14, pero al revés**: en vez de matizar el comentario para que dijera la verdad
  sobre un agujero, se tapó el agujero — **CHECK E ya camina `projects/**`** vía `mdDeProyectos()`,
  igual que CHECK F. Nada más ampliarlo se puso rojo él solo con el caso real que llevaba abierto
  desde el 2026-08-04 (`projects/ui-smartcontact/README.md:25`, "~55" contra 51), que es la mejor
  validación posible de un guardián: no hizo falta fabricarle un caso malo. Cerrado también, por
  tanto, el ítem gemelo de la sección 2026-08-04.

## 2026-08-10

> Método: pasada A (deuda de código, ≤5) + pasada B (deriva de docs). Contra AGENTS.md/.impeccable.md/customs-catalog.md/DOCS-INDEX.md. La deriva de `docs/DECISIONS.md` (newest-first) ya está capturada en la sección 2026-08-04 de abajo, sin resolver — no se repite aquí.

### Deuda de código

- [x] ~~**P1** `sc-illustrated-avatar` local del supervisor duplica un componente que el propio DS ya retiró y consolidó en `sc-avatar`~~ → **reclasificado 2026-08-13, no es deuda**: `.impeccable.md:75-76` y `docs/inventory.md:93` (actualizados ese mismo día) documentan que es uno de los **2 gaps abiertos** del DS — `sc-avatar` solo expone buckets de tamaño (`illustrationName`/`illustrationPool`/`illustrationBase`), no **píxeles exactos**, que es justo lo que `illustrated-avatar` necesita. El hallazgo original no distinguió "expone el mismo contenido" de "expone el mismo control de tamaño". Es override **intencional** hasta que el DS resuelva el gap de tamaño; no reemplazar sin eso. [intencional]
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

- [x] ~~`docs/DECISIONS.md:9` promete "Formato DD-N, newest first", pero
  DD-21..DD-34 se anexaron en orden ASCENDENTE al final~~ — **cerrado**: el
  fichero se reordenó 37→1 el 2026-08-13 (commit `7fff4e7`, "docs: arregla los
  estados falsos de DECISIONS..."), verificado con
  `grep -n '^## DD-' docs/DECISIONS.md` (DD-37 primero, DD-1 último) y ahora
  gateado por CHECK I de `docs:coherence` (falla si un DD queda por debajo de
  uno más antiguo).
- [ ] `docs/customs-catalog.md:905` dice "Última actualización: 2026-06-14",
  pero el cuerpo tiene secciones fechadas hasta el 2026-07-22 (§1.9,
  `docs/customs-catalog.md:321`) — el pie lleva más de un mes de contenido
  nuevo sin tocarse → actualizar la fecha al último cambio real, o quitar el
  pie fijo y remitir a las fechas inline de cada sección. [arréglalo]
- [x] ~~`projects/ui-smartcontact/README.md:25` afirma "~55 componentes
  `sc-*`"; el conteo real (`docs/inventory.md:28`, mantenido al día por
  `npm run audit:components` dentro de `verify`) da 51. Fuera del alcance de
  `docs:guard`, que no escanea `projects/**` (nota en
  `docs/DOCS-INDEX.md:90`) → cambiar la cifra a 51 (o a "más de 50" para no
  requerir mantenimiento exacto); un guard nuevo que compare la cifra citada
  en los README de paquete contra el conteo real de componentes cerraría esta
  clase de deriva para siempre.~~ **HECHO 2026-08-14**: cifra a **51** y, como
  pedía el `[gate-able]`, **la clase entera queda cerrada** — CHECK E de
  `docs:coherence` ahora escanea también los `.md` de `projects/**`, así que
  la próxima cifra a mano que se desfase falla en su propio commit. De paso,
  ese mismo README repetía la claim que la auditoría de agosto ya había
  desmentido en `guia-tokens` (que el preset hace `definePreset(Aura, …)`,
  cuando `definePreset` tiene **0 apariciones** en `projects/`): corregida
  ahí también.

<!-- Las secciones fechadas se insertan aquí, la más nueva primero. -->
