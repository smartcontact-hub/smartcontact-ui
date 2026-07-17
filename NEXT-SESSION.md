# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-07-17** (cierre sesión 11). La sesión 11 cerró **Bloque 1 (rediseño
> `/reglas`)** + **Bloque 2a (tipografías P1: Open Sans + icono Outlined)** y los
> **pusheó a main con CI verde**. Quedan Bloques 3/4/2b/5. Este fichero corrige los
> hallazgos del Bloque 3 (los items del audit estaban **simplificados de más** — ver
> abajo). SOBREESCRIBE este fichero al cerrar.

## ▶️ EMPIEZA AQUÍ
1. Lee este fichero. **Confirma el CI LEYENDO el run** en GitHub Actions, no este hand-off.
2. Lo pusheado (3 commits, hasta `6df7ebc`) desplegó en Pages: sc-demo (`/#/reglas` rediseñado)
   + supervisor + agent (iconos Outlined). Verifica visualmente si vas a construir encima.
3. **Dos decisiones pendientes** antes del grueso del Bloque 3: (a) migrar list-pages a
   `sc-datatable`; (b) adoptar `sc-button` en el supervisor (111 usos de `p-button`).

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

---

# BLOQUE 3 — deuda de diseño P1 (estado CORREGIDO)

> ⚠️ Los items de `AUDIT-2026-07.md` están **simplificados de más**. Verificado esta sesión
> contra el código — cada uno es más grande de lo que dice el audit. NO ejecutar a ciegas.

- **Tablas → `sc-datatable`** = **linchpin**. Verificado: `sc-datatable` soporta celdas
  custom (`ScColumnDef.cellTemplate` → chips, columna de acciones/kebab) y fila seleccionable
  (`selectionMode='single'`, con teclado vía PrimeNG). Migrar las 5 list-pages
  (rules/categories/entities/users/groups) **cierra a11y de filas + kebab + tablas de golpe**.
  Es una migración **grande** (patrón: piloto en `rules` → valida → resto por lotes).
- **a11y filas** (`rules-page.component.html:62-65`): `<tr (click)="openRule">` sin teclado
  (WCAG 2.1.1). REAL. Se resuelve al migrar a datatable (selección con teclado). Hacerlo a
  mano ahora = parcialmente tirado.
- **Bug kebab** (categories/entities SIN el patrón `menuTargetX`/`menuItems` que sí tiene
  `rules-page.component.ts:84-92`): REAL. También lo absorbe la migración a datatable
  (columna de acciones única). Verificar 1er-clic con supervisor levantado.
- **`sc-button`** (decisión 1): **111 usos / 24 ficheros** de `p-button` vs 3 de `sc-button`.
  Migración grande. Decidir adoptar antes.
- **PrimeIcons** (`pi pi-*` en confirm-host + rules/categories/entities): son
  `MenuItem.icon: 'pi pi-*'` que **el resolver pi→Material del DS ya mapea a Outlined**
  (test e2e `components.spec.ts:61` lo confirma) → probablemente **ya renderizan Material**.
  El "cleanup" es cosmético (usar nombres Material directos) + toca el resolver/preset de menú
  + la pregunta de si se puede soltar `primeicons` (¿otros usos?). NO mecánico. El
  confirm-host está gated por la API `icon?` de `ScConfirmService` (ROADMAP).
- **rule-builder vestigial** (audit #4): los planos `direction`/`schedule`/`durationMin` NO
  son "nada los lee" (el audit se equivoca) — sin UI en el template (son condiciones del
  árbol, DD-27), pero SÍ plumbing de `loadFromRule`/`buildSnapshot`/`onSave` + copia en
  `rules.store.ts:158-160` + `deriveTreeFromLegacy` (backward-compat). Refactor **moderado**:
  quitar el tipo + el plumbing + confirmar que `deriveTreeFromLegacy` está muerto (¿alguna
  regla sin `conditionTree`?). Verificación interactiva del flujo create/edit/save/duplicate.

# BLOQUE 4 — deuda técnica P0 (multiplicador, máxima verif)
- **`sc-field-wrapper` + CVA + computeds** (P0): 5 fields duplican CVA + 9 computeds +
  `hasPrimitiveOptions`. Piloto en inputtext detrás del e2e, replicar. Toca TODOS los forms
  → AOT + e2e por componente.
- **`BaseCrudStore<T>`** (categories/entities/conversations) · **16 wrappers legacy
  `@Input`→signals** por lotes · **`shared/utils/audio.ts`** (formatTime ×2 + parseDuration + hash).

# BLOQUE 2b — gobernanza tipografía (P2)
Extender `scripts/token-guard.mjs` a `line-height`/`font-weight`/stack-mono literales; migrar
~93 font-weight + ~98 line-height a tokens (75% en supervisor). Peor primero: px de line-height
en config (settings-sidebar, sistema-page, aed-defaults, form-section-nav). Mono `var(--sc-font-family-mono)` ×9.

# BLOQUE 5 — Cola (P2/P3)
Doble modal transcripción · `SC_ICON_SIZE_LG` 15.75→16 · font-size px "Figma raw" en
`04-component.css:69,106,108` · 145 claves i18n huérfanas (barrido key-por-key) ·
`permission-matrix` centralizada · `GroupChannelCascadeService` · `TriStateToggleUtil`.

## Orden recomendado
1. Confirmar decisiones (datatable + sc-button) · 2. Bloque 3 datatable-céntrico (piloto→lotes)
· 3. Bloque 4 (field-wrapper P0) · 4. Bloque 2b + 5. Top-down, parar donde toque.

## Verificación transversal
`sc-*`/tokens/icons → `npm run verify` + AOT de las 3 apps · datatable/kebab/a11y → supervisor
levantado + teclado + 1er clic · tipografía → `type-parity` + guard · CI verde LEYENDO el run.

## TRAMPAS
- Los items de **AUDIT-2026-07 están simplificados** — verifica la precondición de cada uno
  contra el código antes de tocar (esta sesión: 3 de 3 eran más grandes de lo dicho).
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
icono Outlined self-hospedado DD-31).

## Índice
Decisiones → `docs/DECISIONS.md` (**DD-31 icono Outlined** · DD-30 varias activas · DD-29
storybook · DD-28 reglas MVP). Deuda → `docs/AUDIT-DEUDA-2026-06.md` + `docs/AUDIT-2026-07.md`
(⚠️ leer con el filtro de arriba). Roadmap → `docs/ROADMAP.md` (iconos: peso/ejes abierto).
Reglas producto → `supervisor/src/app/features/memory/`. Presentación → `sc-demo/src/app/pages/reglas/`.
Deploys: sc-supervisor.pages.dev · sc-demo.pages.dev · sandbox.sc-supervisor.pages.dev (rama Marta).
