<!-- Plan operativo de la Mitad B: port incremental de los componentes al repo unificado. Las fundaciones (Mitad A) están cerradas; su rationale en foundations-rationale.md. El detalle por componente vive en convergence-manifesto.md (§3–§5, §8). -->

# Plan de port de componentes — Mitad B

> Las fundaciones del repo (escala 14-base/rem, tokens, preset modular, `provideSmartContactUi`, guardarraíles) están cerradas. Este documento es el plan **accionable** de lo que queda: portar los componentes de ambos catálogos de origen al repo unificado, pieza a pieza, con verificación visual por pantalla. El detalle de cada fila está en `convergence-manifesto.md` (§3 tabla Rosetta, §4 solapes, §5 huecos, §8 pendientes).

---

## 1. Método (innegociable, aplica a cada pieza)

Cada componente se porta de forma **incremental y verificada**:

1. **Port** del componente al project que le toca (`projects/ui-smartcontact/` para wrappers/custom; `projects/ui-smartcontact-icons/` para lo de iconos), con naming DD-12 (pegado para wrappers PrimeNG, kebab para custom).
2. **Barrido de escala**: los wrappers que llegan del catálogo de desarrollo consumiendo `--sc-spacing-*` (8-point) o `--sc-space-*` **no resuelven en este repo** — esa escala no existe aquí. El barrido a `--sc-scale-*` / aliases v/14 es **parte del port de cada pieza**, no un paso aparte.
3. **Verificación visual**: diff Playwright **no-layout-shift** contra la referencia (Figma / render de origen).
4. **e2e smoke** en verde.
5. **Guardarraíles en verde**: `tokens:parity` + `tokens:guard` + `audit:theme-scale` deben seguir pasando tras cada port. Si un port los rompe, el port está mal, no el guardarraíl.

**Avisos de fundaciones que afectan al diff visual:**

- **Focus ring**: el token de focus-ring quedó **unificado en `2px`**. Los custom que se porten heredarán 2px donde antes podían asumir 1px — revisar explícitamente en el diff visual de cada pieza con estado focus.
- **Toast**: el gap de acciones del toast quedó en **`--sc-scale-0-5`** — referencia al portar `sc-toast` y cualquier composición que lo use.

---

## 2. Los 54 componentes — origen y acción

Resumen operativo (32 del catálogo de diseño + 22 del catálogo de desarrollo). Detalle por fila en el manifiesto §3.

### 2.1 Comunes — convergir (5)

| Componente | Acción |
|---|---|
| `sc-inputtext` | Convergir. Rename `sc-input-text`→pegado; chrome de campo (label/required/helper/error) + CVA del catálogo de diseño; sumar `fluid`/`size`/`readonly` del de desarrollo (`filled` existe en ambos — no duplicar). |
| `sc-select` | Convergir. Re-proyección `pTemplate` + iftaLabel + appendTo + CVA; sumar `showClear`/`filter`. |
| `sc-toggleswitch` | Convergir. Rename a pegado; API `[checked]`/`(checkedChange)`; sumar `readonly`/`size`/`inputId`. |
| `sc-dialog` | Convergir. **Decisión de API pendiente** (ver §4). |
| `sc-checkbox` | Convergir. **Decisión de base pendiente** (ver §4). |

### 2.2 Del catálogo de diseño — wrappers PrimeNG (9)

Portar: `sc-datepicker` · `sc-multiselect` · `sc-inputnumber` · `sc-search` · `sc-inputgroup` · `sc-divider` · `sc-column-selector` · `sc-group-popover` · `sc-confirmdialog` (origen `sc-confirm-host`; rename pendiente, ver §4).

### 2.3 Del catálogo de diseño — custom (16)

Portar: `sc-bulk-action-bar` · `sc-bulk-edit-menu` · `sc-color-dot-picker` · `sc-command-palette` · `sc-empty-state` · `sc-form-danger-zone` · `sc-form-section-nav` · `sc-icon` (reconciliar, ver §4) · `sc-inline-rename-cell` (sobre `p-inplace` — auditoría §10 del manifiesto) · `sc-keyboard-shortcuts` · `sc-page-header` · `sc-photo-upload` (sobre `p-fileupload`) · `sc-section-card` (evolucionar, ver §3) · `sc-sticky-form-header` (retenido, rollback DD#65) · `sc-delete-entity-dialog` · `sc-impact-preview-dialog`.

Antes de declarar portable cada custom: **saldar la deuda de aislamiento** (ver §5). Aplicar la auditoría de reutilización (manifiesto §10): 2 se reconstruyen sobre primitivos (`p-inplace`, `p-fileupload`), 3 se componen (`p-dialog`/`p-panel`), ~5 son bespoke legítimos.

Del lado del catálogo de diseño también cuentan los 2 componentes que se **retiran como solape** (`sc-label-chip`, `sc-illustrated-avatar`): no se portan como standalone, su comportamiento migra como variante/fallback (ver §3).

### 2.4 Del catálogo de desarrollo — wrappers PrimeNG (15)

Adoptar: `sc-avatar` · `sc-badge` · `sc-button` · `sc-card` · `sc-chip` · `sc-drawer` · `sc-message` · `sc-panel` · `sc-progressbar` · `sc-progressspinner` · `sc-radiobutton` · `sc-skeleton` · `sc-tag` · `sc-textarea` · `sc-toast`.

Renames DD-12 al adoptar: `sc-progress-bar`/`sc-progress-spinner`/`sc-radio-button` → pegado. Con estos wrappers se arrastra la **dependencia transitiva** `sc-component-icon-resolver` + los tipos públicos de `lib/core/types` (decisión pendiente, ver §4). Todos requieren el **barrido de escala** del §1.2.

### 2.5 Del catálogo de desarrollo — infra y negocio (2)

| Pieza | Acción |
|---|---|
| `ScDynamicDialogService` (+ `ScDynamicDialogRef`, `provideScDynamicDialog`) | Adoptar como infra de DS. Complementa (no reemplaza) el patrón `[visible]` declarativo. Junto con `ScToastService` (+ `provideScToast`). |
| `sc-bulk-transcription-modal` | **No es pieza de DS** — flujo de negocio de Memory. Al migrar Memory se comparan las dos implementaciones existentes y se elige/funde. |

---

## 3. Los 4 solapes (manifiesto §4)

| Solape | Resolución | Trabajo de port |
|---|---|---|
| tag / chip / label-chip | `sc-tag` = solo lectura (canónico); `sc-chip` = quitables; `sc-label-chip` se retira. | Meter los 8 colores categóricos + puntito como **variante** de `sc-tag`/`sc-chip` (tokens `--sc-label-*` + `LABEL_COLORS` compartido con `sc-color-dot-picker`); migrar los 3 usos read-only a `sc-tag`; validar 1:1 con Figma. |
| avatar | Un solo `sc-avatar` (base: el del catálogo de desarrollo); `sc-illustrated-avatar` se retira como standalone. | Cablear el fallback de ilustración por hash al tipo Image; reconectar `sc-photo-upload`; **construir Badge + AvatarGroup** hacia la spec Figma (Type Label/Icon/Image, Size 28/42/56 — son nodos del Figma, no API existente). |
| section-card | `sc-section-card` se queda (custom legítimo) y **evoluciona**. | API anidada Section → Subsection (1–4) → Slot (1–5), 1:1 con el Figma "Section", conservando collapsible + flush. Medidas reales del Figma antes de codear. |
| dynamic dialog | Separar: servicio genérico (DS) vs modal de transcripción (negocio). | Adoptar `ScDynamicDialogService` como infra; `sc-bulk-transcription-modal` se resuelve al migrar Memory. |

---

## 4. Decisiones por-componente pendientes (se cierran al portar cada pieza)

Del manifiesto §8. Ninguna bloquea el arranque; cada una se decide con racional documentado en `DECISIONS-LOG.md` al tocar la pieza.

1. **Base de `sc-checkbox`**: `<input>` nativo tri-estado (a11y de browser) vs wrapper `p-checkbox` con `indeterminate`. Lo innegociable es **conservar el tri-estado** none/some/all.
2. **Destino del `sc-component-icon-resolver`**: portarlo tal cual (compat pi→Material, del que dependen casi todos los wrappers del catálogo de desarrollo) o sustituirlo por el mapeo del catálogo de diseño. Decidir **antes** de adoptar en masa los wrappers de §2.4.
3. **API de `sc-dialog`**: la card canónica (header icon+title+subtitle+close, footer projection, `[visible]` declarativo) como capa sobre el wrapper fino (`header`/`position`/`draggable`), o unificación de inputs.
4. **Rename de `sc-confirm-host`**: a `sc-confirmdialog` (envuelve `p-confirmdialog`, regla pegado) o mantener el nombre de host por su acoplamiento a `ConfirmHostService`. Borde de la regla DD-12.
5. **API anidada de `sc-section-card`**: diseño del sistema Section → Subsection → Slot (ver §3).
6. **Reconciliación de `sc-icon` con `@smartcontact/icons`**: migrar al paquete de iconos **conservando los ejes FILL/wght/opsz** (font-variation-settings) y el proveedor por ligadura.

Además: **aliases de naming vivos** durante la transición de los 5 renames a pegado (no romper imports a media migración).

---

## 5. Deuda de aislamiento de servicios (a saldar al portar los custom)

Varios custom del catálogo de diseño acoplan servicios que vivían fuera del package, en el `@core`/`@shared` de la app de origen:

`CommandPaletteService` · `ConfirmHostService` · `KeyboardShortcutsService` · `ClipboardService` · `MessageService` · `NAV_ICONS` · `@shared/utils/icon-size`

No son 100% portables sin mover o abstraer esos paths. **Inventariar y resolver el acoplamiento de cada pieza al meterla en `@smartcontact/components`** — un custom no se declara portado mientras dependa de un path de app consumidora.

---

## 6. Hueco prioritario: `sc-datatable`

No existe como wrapper Angular en **ningún** origen (solo styling en el preset) y las list pages lo necesitan. **Es el componente nuevo más prioritario a construir** durante la Mitad B. Tras él, según necesidad: `sc-accordion`, `sc-breadcrumb`, `sc-menu`, `sc-stepper`, `sc-tabs` (mismos casos: preset cubre, wrapper falta).

---

## 7. Orden recomendado

Sigue las Fases 2–5 del manifiesto (§7):

1. **Fase 2 — primitivos**: decidir el icon-resolver (§4.2) → adoptar los 15 wrappers del catálogo de desarrollo + infra (toast/dynamic-dialog) → portar los 9 wrappers del catálogo de diseño → convergir los 5 comunes → construir `sc-datatable`.
2. **Fase 3 — custom**: portar los 16 custom, saldando la deuda de aislamiento (§5) pieza a pieza.
3. **Fase 4 — solapes**: ejecutar las 4 migraciones de §3.
4. **Fase 5 — flujos/apps**: migrar Memory (y resolver `sc-bulk-transcription-modal`), migrar las apps consumidoras a paquetes versionados, usar `sc-demo` como piloto.

En todas las fases: el método de §1 por pieza, y los guardarraíles (`tokens:parity` · `tokens:guard` · `audit:theme-scale`) **siempre en verde**.
