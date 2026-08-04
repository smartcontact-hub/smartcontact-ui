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
