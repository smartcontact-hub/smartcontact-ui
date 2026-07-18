# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-07-18** (cierre sesión 11). Cerrados **Bloque 1** (rediseño `/reglas`),
> **Bloque 2a** (Open Sans + icono Outlined, DD-31) y **todo lo acotado del Bloque 3**
> (a11y de filas, bug del kebab, vestigiales de `Rule`, PrimeIcons→Material). Quedan las
> **dos piezas grandes del Bloque 3** (sc-button, migración a sc-datatable) + Bloques 4/2b/5.
> Este fichero corrige los hallazgos del audit, que estaban **simplificados de más**.
> SOBREESCRIBE este fichero al cerrar.

## ▶️ EMPIEZA AQUÍ
1. Lee este fichero. **Confirma el CI LEYENDO el run** en GitHub Actions, no este hand-off.
2. Todo pusheado a main. Desplegado en Pages: sc-demo (`/#/reglas` rediseñado) + supervisor
   + agent (iconos Outlined). Verifica visualmente si vas a construir encima.
3. **Dos decisiones pendientes**, ambas grandes: (a) adoptar `sc-button` en el supervisor
   (111 usos de `p-button` / 24 ficheros); (b) migrar list-pages a `sc-datatable` — ojo:
   su justificación principal (a11y de filas) **ya está resuelta** por otra vía, ver abajo.

---

# HECHO en la sesión 11 (pusheado, CI verde)

- **Bloque 1 — rediseño `/reglas`** (`0efe0ab`): el rail de feedback sale del flujo →
  el texto recupera su medida de 68ch (601px, antes ~570px). Feedback ahora es una
  **pestaña flotante abajo-derecha** (`role="dialog"` no-modal, foco/Esc/return-focus
  como el lightbox, animación de entrada `rules-rise` bajo reduced-motion). De paso:
  lightbox a `--sc-z-modal` (era `z-index:1000` hardcode), `aria-label` en el handle
  (la ligadura del icono lo dejaba sin nombre accesible), borrado de CSS muerto
  (`.shot`/`.resolved`). Verificado en navegador (claro/oscuro, teclado, prioridad Esc).
- **Bloque 2a-i — Open Sans en sc-demo** (`73c5186`): sc-demo solo cargaba Inter →
  `--sc-font-family-caption` caía a sans-serif. Añadido Open Sans al `<link>`. Verificado.
- **Bloque 2a-ii — icono Outlined self-hospedado** (`6df7ebc`, **DD-31**): el DS pasa a
  servir Material Symbols **Outlined** self-hospedado (`@fontsource-variable/…-outlined`,
  familia `'Material Symbols Outlined Variable'`); supervisor/agent **importan el
  `material-symbols.css` del DS** y sueltan su `.sc-icon` replicado + el `<link>` del CDN.
  sc-demo iguala solo. `npm run verify` verde · AOT de las 3 apps · iconos renderizan
  (familia computada + woff2 200, sin CDN). Docs: DD-31 + ROADMAP + inventory.

## Bloque 3 — lo ACOTADO, cerrado y verificado en el supervisor
- **a11y de filas** (`f596918`): el nombre de la regla es un **enlace real** (`<a routerLink>`)
  en vez de depender del `(click)` de la fila. Nativo al teclado, se anuncia como enlace y
  permite cmd+click. Verificado: Tab lleva el foco al enlace (anillo visible) y activarlo
  navega a `/conversaciones/reglas/:id`. **No es trabajo tirado**: al migrar a datatable el
  enlace vive dentro del `cellTemplate` de la columna nombre. `categories`/`entities` no
  tenían filas clicables → era el único caso.
- **Bug del kebab** (`d5fed4b`): propagado a categories/entities el patrón de rules
  (menú ÚNICO compartido + `menuTarget*` signal + `menuItems` computed estable). Antes
  `[model]="buildMenuItems(x)"` recreaba el array en cada CD → se perdía el 1er clic, y había
  un `<p-menu>` POR FILA. Verificado: 1 clic abre y aplica, sobre la fila correcta; `p-menu`
  en el DOM de 6 → 1.
- **Vestigiales de `Rule`** (`3019824`): retirados `direction`/`schedule`/`durationMin` + sus
  6 signals sin binding + los tipos muertos `Direction`/`Schedule`. El audit decía "nada los
  lee" y era **falso** (los leía el plumbing de load/save/duplicate) — pero la retirada es
  segura porque `deriveTreeFromLegacy` NO depende de ellos. Verificado: cargar/guardar/duplicar
  conservan el alcance «…la duración supera 60 s», que sale del `conditionTree` (DD-27).
- **PrimeIcons → Material** (`ccb8b46`): los 12 `MenuItem.icon` restantes renderizaban
  PrimeIcons DE VERDAD (comprobado: `font-family: primeicons`), no mapeados por ningún
  resolver. `MenuItem.icon` es una CLASE, no un componente → se usa la convención
  `.sc-icon-font--NAME` del DS, declarando en `main.scss` solo los 8 glifos usados.

## Abierto de la sesión 11 (no bloquea)
- **Baselines visuales `-darwin`** (`e2e/components.spec.ts-snapshots/`): stale para
  componentes con icono (muestran Rounded). **CI no afectado** (los snapshots de píxeles
  se saltan en CI, `components.spec.ts:25`; CI gatea por métricas). Refrescar con la config
  aislada: `npx playwright test e2e/components.spec.ts --update-snapshots` (server FRESCO en
  4280; NO la captura de usage → clobbea `public/usage/*.png`).
- **FOUT**: el `@fontsource` usa `font-display: swap` (el CDN usaba `block`) → posible flash
  breve de la ligadura en carga fría. Aceptable (fuente local; sc-demo ya vivía así).
- **Peso/ejes del icono** sigue abierto (la otra mitad del item de iconografía del ROADMAP;
  DD-31 solo cerró el ESTILO). Icono de cabecera de `ScConfirmService` (API `icon?`) también.

## Operativo (s11)
- **PR #16 cerrada** (sync auto stale, `info` blue→sky): nunca la validó el gate `ci`
  (`action_required` en PRs de bot) + generados de hace 25 días. `info` se mantiene en blue
  por decisión. Reabrible / recreable con un sync fresco si se quiere info→sky.
- **⚠️ `tokens-sync` (Theme Designer) está ROTO**: sus últimas corridas fallan (6/30, 6/22).
  Hay que arreglarlo para que el round-trip DTCG vuelva a sincronizar tokens. Task propia.

---

# BLOQUE 3 — lo que QUEDA (solo las 2 piezas grandes)

> ⚠️ Los items de `AUDIT-2026-07.md` están **simplificados de más**: en esta sesión, 4 de 4
> eran más grandes o su precondición era falsa. Verifica cada uno contra el código antes de
> ejecutarlo. Lo acotado ya está cerrado (ver arriba).

- **`sc-button`** (decisión pendiente): **111 usos / 24 ficheros** de `p-button` vs 3 de
  `sc-button`. Migración grande. Decidir adoptar antes de empezar; patrón sugerido: piloto en
  una list-page + forms, validar, resto por lotes con AOT por lote.
- **Tablas → `sc-datatable`** (decisión pendiente): **su justificación se debilitó**. Era el
  «linchpin» porque cerraba a11y de filas + kebab + tablas de golpe, pero **a11y y kebab ya
  están resueltos** por vías propias (arriba). Queda el valor de consistencia y de quitar
  ~14 tablas a mano. Antes de migrar, dos cosas:
  - **Cerrar 2 huecos de API del DS** (verificados leyendo `sc-datatable.component.ts`
    entero): (1) **no hay hook de clase por fila** (`rowStyleClass`) → el atenuado de filas
    inactivas (`rules-row-inactive`, `categories-row--inactive`) no tiene dónde vivir;
    (2) **no hay output de activación de fila** (`rowClick`/`rowActivate`) → la navegación
    tendría que ir sobre el modelo `selection`, con el efecto raro de que reseleccionar la
    MISMA fila no vuelve a emitir.
  - **Sonda de teclado en `selectionMode='single'`**. Lo que sí está verificado: las filas
    reciben `tabindex="0"` vía `pSelectableRow` y PrimeNG 21 tiene los handlers
    (`onEnterKey`/`onSpaceKey`). Lo que **NO** está verificado: que la activación por teclado
    funcione de punta a punta (ver TRAMPAS: el tooling entrega teclas malformadas, así que una
    prueba en contra no vale). El demo de sc-demo está cableado para `multiple`, no sirve.
  - Sí está cubierto el CONTENIDO: chips/estado/kebab vía `ScColumnDef.cellTemplate`, orden,
    anchos/alineación y slots `[scTableCaption]`/`[scTableEmpty]`.
- **Soltar `primeicons`**: NO se puede aún. Verificado que **PrimeNG 21 referencia clases `pi`
  por dentro** (`api`, `cascadeselect`, `multiselect`, `select`). Retirar el `@import` de
  `main.scss:44` + la dependencia exige barrer y verificar esos componentes.
- **`ScConfirmService` sin API de icono de cabecera** (`icon?`) sigue abierto (ROADMAP).

# BLOQUE 4 — deuda técnica P0 (multiplicador, máxima verif)
- **`sc-field-wrapper` + CVA + computeds** (P0): 5 fields duplican CVA + 9 computeds +
  `hasPrimitiveOptions`. Piloto en inputtext detrás del e2e, replicar. Toca TODOS los forms
  → AOT + e2e por componente.
- **`BaseCrudStore<T>`** (categories/entities/conversations) · **16 wrappers legacy
  `@Input`→signals** por lotes · **`shared/utils/audio.ts`** (formatTime ×2 + parseDuration + hash).

# BLOQUE 2b — gobernanza tipografía (P2)
> ⚠️ **Es todo-o-nada**: en cuanto el guard nuevo entre, romperá `npm run verify` hasta que
> los ~190 literales estén migrados. Planifícalo como un solo golpe (o con allowlist temporal).

Extender `scripts/token-guard.mjs` a `line-height`/`font-weight`/stack-mono literales; migrar
~93 font-weight + ~98 line-height a tokens (75% en supervisor). Peor primero: px de line-height
en config (settings-sidebar, sistema-page, aed-defaults, form-section-nav). Mono `var(--sc-font-family-mono)` ×9.

# BLOQUE 5 — Cola (P2/P3)
Doble modal transcripción · `SC_ICON_SIZE_LG` 15.75→16 · font-size px "Figma raw" en
`04-component.css:69,106,108` · 145 claves i18n huérfanas (barrido key-por-key) ·
`permission-matrix` centralizada · `GroupChannelCascadeService` · `TriStateToggleUtil`.

## Orden recomendado
Lo acotado del Bloque 3 ya está hecho, así que lo que queda son **piezas grandes de sesión
propia**. Sugerido: 1. **`sc-button`** (decidir + piloto→lotes) — es la mayor ganancia de
consistencia que queda · 2. **Bloque 4** (`sc-field-wrapper`, el mayor multiplicador, máxima
verificación) · 3. **`sc-datatable`** (cerrar antes los 2 huecos de API + la sonda de teclado)
· 4. Bloque 2b (de un golpe) + 5. Ninguna es de "cola de sesión": empiézalas frescas.

## Verificación transversal
`sc-*`/tokens/icons → `npm run verify` + AOT de las 3 apps · datatable/kebab/a11y → supervisor
levantado + teclado + 1er clic · tipografía → `type-parity` + guard · CI verde LEYENDO el run.

## TRAMPAS
- Los items de **AUDIT-2026-07 están simplificados** — verifica la precondición de cada uno
  contra el código antes de tocar (esta sesión: 4 de 4 eran más grandes o falsos).
- ⚠️ **El tooling de navegador entrega las teclas MALFORMADAS** (llegan con `key`/`code`
  vacíos, comprobado con un listener). Consecuencia: una prueba de teclado que "falla" NO
  prueba nada — en esta sesión me llevó a afirmar en falso que las filas de `sc-datatable` no
  se activaban con Enter. Para verificar teclado: haz **clic en la página primero** (si no, ni
  llegan), y valida por foco + comportamiento nativo, no por una tecla que no puedes sintetizar.
- Los **errores de consola por View Transitions** (`InvalidStateError: Transition was aborted`)
  son **PREEXISTENTES** (`withViewTransitions()` en `app.config.ts:24`), no regresión.
  Comprobado haciendo stash del cambio y reproduciéndolos igual.
- Comprobar el DOM **en la misma llamada síncrona** que dispara la acción da falsos negativos
  (Angular aún no ha renderizado): comprueba en una llamada aparte.
- `npm run e2e` clobbea `public/usage/*.png` → baselines con `npx playwright test e2e/components.spec.ts`.
- CI (ubuntu) **salta los snapshots de píxeles** (`components.spec.ts:25`) y gatea por métricas;
  los baselines `-darwin` son solo para regresión visual local.
- Imports first-party SIEMPRE por alias `@smartcontact-hub/*` (nunca `.../src/public-api`).
- Las apps importan el `material-symbols.css` del DS por **ruta de source** (`../../../ui-smartcontact-icons/…`),
  no por specifier npm (SCSS no lo resuelve) — igual que las capas de tokens.
- `sc-field-wrapper` toca todos los forms: piloto + e2e antes de replicar.

## Estado cerrado (NO es deuda, verificado)
dirty-state centralizado · user crossTab/conflictWarning · PROFILE dup eliminado · seeds sin
placeholders · (s10: iconos ~340KB, dedup, DD-30, /lab) · (s11: /reglas rediseñado, Open Sans,
icono Outlined self-hospedado DD-31, a11y de filas por enlace real, bug del kebab, vestigiales
de `Rule`, menús en Material). **a11y de filas y kebab NO son deuda ya** — no los reabras al
migrar a datatable, solo trasládalos (el enlace va al `cellTemplate`).

## Índice
Decisiones → `docs/DECISIONS.md` (**DD-31 icono Outlined** · DD-30 varias activas · DD-29
storybook · DD-28 reglas MVP). Deuda → `docs/AUDIT-DEUDA-2026-06.md` + `docs/AUDIT-2026-07.md`
(⚠️ leer con el filtro de arriba). Roadmap → `docs/ROADMAP.md` (iconos: peso/ejes abierto).
Reglas producto → `supervisor/src/app/features/memory/`. Presentación → `sc-demo/src/app/pages/reglas/`.
Deploys: sc-supervisor.pages.dev · sc-demo.pages.dev · sandbox.sc-supervisor.pages.dev (rama Marta).
