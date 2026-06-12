<!-- Manifiesto de convergencia adaptado al repo unificado. Base del port de componentes (Mitad B). Verificado adversarialmente contra el código real de ambos orígenes. Decisiones fijas: DD-12 (naming) + escala 14-base. -->

# Manifiesto de convergencia — Smart Contact Design System

> Documento base del port. Define cómo se construye el Design System unificado a partir de sus dos orígenes: **el catálogo de diseño** (SCDS, paquete `@sc/design-system`) y **el catálogo de desarrollo** (la librería `smartcontact-ui`: `@smartcontact/styles` + `@smartcontact/icons` + `@smartcontact/components`). El estado de ejecución por componente vive en §8 y en `component-port-plan.md`.

---

## 1. Propósito y alcance

Este manifiesto es la **base del port** del repo unificado: un único Design System que reúne lo construido en ambos catálogos.

**Qué cubre:** el catálogo unión de componentes, la resolución de los solapes, los huecos de cobertura, la estructura de empaquetado objetivo y el plan de port por fases.

**Principio de composición:** el repo unificado adopta **la estructura de empaquetado del catálogo de desarrollo** (split de 3 paquetes publicables vía ng-packagr + `provideSmartContactUi()`), **el sistema de tokens y verificación del catálogo de diseño** (tokens 14-base, contrato `--sc-*`, preset que referencia `var(--sc-*)`, tooling de parity) y **los primitivos de cada origen que el otro no tenía**.

**Anclaje a fuente de verdad:** el Figma / Smart Contact Prime UI Kit Pro manda en naming y métricas. Los `--sc-*` son la única fuente de verdad de valores; el preset solo redirige `--p-*` → `--sc-*`.

---

## 2. Decisiones fijas

Decisiones ya cerradas. No se re-litigan; se reflejan tal cual.

### 2.1 Naming — DD-12 (extiende DD-8)

**Regla del nombre unificado:**

- Si el componente **envuelve un componente PrimeNG** → `sc-` + nombre PrimeNG **pegado** (sin guión). Ejemplos: `p-inputtext` → `sc-inputtext`, `p-toggleswitch` → `sc-toggleswitch`, `p-radiobutton` → `sc-radiobutton`, `p-progressbar` → `sc-progressbar`, `p-progressspinner` → `sc-progressspinner`.
- Si es **componente custom sin equivalente PrimeNG** → kebab descriptivo. Ejemplos: `sc-section-card`, `sc-empty-state`, `sc-bulk-action-bar`.

**Razón:** el Figma/Kit Pro nombra los componentes pegado, y los componentes se construyen leyendo el Figma. Hablar el mismo idioma.

**Realineo:** el catálogo de desarrollo trae **5** wrappers con guión que se realinean a pegado al converger. (`sc-bulk-transcription-modal` lleva guiones internos pero es kebab-custom legítimo — flujo de negocio, no wrapper PrimeNG — y por eso **no cuenta** ni se realinea.)

| Nombre de origen (con guión) | Nombre unificado DD-12 (pegado) |
|---|---|
| `sc-input-text` | `sc-inputtext` |
| `sc-toggle-switch` | `sc-toggleswitch` |
| `sc-radio-button` | `sc-radiobutton` |
| `sc-progress-bar` | `sc-progressbar` |
| `sc-progress-spinner` | `sc-progressspinner` |

### 2.2 Escala — 14-base manda

- **Fuente de verdad:** Figma / Kit Pro → escala **14-base** (rampa única `m×14px`: 7 / 14 / 21 / 28 …), naming derivado del valor (`v/14`: `--sc-scale-1`, `--sc-scale-0-875`, `--sc-scale-1-125`).
- El catálogo de desarrollo usaba **8-point** (4 / 8 / 12 / 16 / 24 / 32, unitless, naming numérico escalonado `--sc-spacing-50/100/200…`) → **converge a 14-base**. Su `spacing.css`/`radius.css` 8-point se sustituyen por la escala unificada.
- Font-size y line-height son **alias semánticos de `--sc-scale-*`**.
- La conversión a `rem` es **centralizada** (diseño en 14 → rem en un punto único; ver `foundations-rationale.md`).

> **En este repo la escala ya está unificada.** Los wrappers que se porten desde el catálogo de desarrollo y consuman `--sc-spacing-*`/`--sc-space-*` **no resuelven aquí** (esa escala no existe): el barrido a `--sc-scale-*`/aliases v/14 es parte del port de cada pieza.

### 2.3 Contrato `--sc-*` y preset

- **`--sc-*` = única fuente de verdad** de valores (7 capas en `projects/design-tokens/src/lib/styles/tokens/layers/`, `01-primitive…07-dark.css`).
- **Preset que referencia `var(--sc-*)`** (`definePreset(Aura, …)`): cada slot apunta a `var(--sc-color-*)` / `var(--sc-radius-*)`. Cambias el token y el preset lo hereda sin tocar el `.ts`.
- **NO** se adoptan hex hardcodeados en `base.ts` (`#ef4444ff`, corporativo `#344a70`…): es doble fuente y drift garantizado. El preset de origen se **reescribió** para apuntar a `var(--sc-*)`.
- **Sí** se conserva la **modularización por-componente** del preset de origen: **~82 módulos por-componente + `base.ts` + `index.ts` (que cierra con `} satisfies Preset` y `export default`) + `extend.ts` = 85 ficheros** en `projects/ui-smartcontact/src/lib/theme/sc-preset/` — más limpia que un preset monolítico. Los overrides del catálogo de diseño se portan a esa estructura.
- **El tooling de parity/gen** (`tokens:parity`, `tokens:gen`, `tokens:import`) es el guardarraíl que cruza el export del Kit contra `--sc-*` + preset y bloquea drift. Está fundido con el import DTCG en un generador único.

### 2.4 Estructura / empaquetado objetivo

**Estructura de empaquetado del catálogo de desarrollo + tokens/preset/tooling del catálogo de diseño.** Split de 3 paquetes ng-packagr publicables (`@smartcontact/styles`, `@smartcontact/icons`, `@smartcontact/components`) + `sc-demo` privado de referencia. API de setup pública `provideSmartContactUi()`. Detalle concreto en §6.

---

## 3. Catálogo unión (tabla Rosetta)

Una fila por componente del **unión**. Marca: **común** (en ambos orígenes), **solo en el catálogo de diseño**, **solo en el catálogo de desarrollo**. El *Nombre unificado* sigue DD-12 (pegado para wrappers PrimeNG, kebab para custom). Orden: comunes → wrappers PrimeNG → custom.

Convención de columnas: `¿Diseño?` / `¿Desarrollo?` = aparece en ese catálogo de origen; cuando el nombre difiere entre orígenes se anota el alias.

### 3.1 Comunes (en ambos catálogos)

| Nombre unificado | Base PrimeNG | Tipo | ¿Diseño? | ¿Desarrollo? | Acción / estado |
|---|---|---|---|---|---|
| `sc-inputtext` | `p-inputtext` | wrapper | Sí (`sc-inputtext`) | Sí (alias `sc-input-text`) | Convergir. Renombrar `sc-input-text` → `sc-inputtext` (DD-12). Conservar la chrome de campo del catálogo de diseño (label/required/helper/error) + CVA + variantes filled/iftaLabel. Nota: **`filled` existe en AMBOS orígenes** (`variant: 'outlined'\|'filled'` en desarrollo); el aporte exclusivo del catálogo de desarrollo es `fluid` (+ `size`, `readonly`) — reconciliar sin doble-trabajo. |
| `sc-select` | `p-select` | wrapper | Sí (`sc-select`) | Sí (`sc-select`) | Convergir. Mismo nombre. Conservar la re-proyección de `pTemplate` (item/selectedItem), iftaLabel, appendTo, CVA del catálogo de diseño; reconciliar con la API del catálogo de desarrollo (`showClear`, `filter`). |
| `sc-toggleswitch` | `p-toggleswitch` | wrapper | Sí (`sc-toggleswitch`) | Sí (alias `sc-toggle-switch`) | Convergir. Renombrar `sc-toggle-switch` → `sc-toggleswitch` (DD-12). API estable `[checked]`/`(checkedChange)` del catálogo de diseño; reconciliar `readonly`/`size`/`inputId` del de desarrollo. |
| `sc-dialog` | `p-dialog` | wrapper | Sí (`sc-dialog`) | Sí (`sc-dialog`) | Convergir. Mismo nombre, **APIs divergentes**: el del catálogo de diseño pinta toda la card (header icon+title+subtitle+close, footer projection) con `[visible]` declarativo; el del catálogo de desarrollo es wrapper fino con `header`/`position`/`draggable`. Validar al migrar: conservar la card canónica como capa sobre el wrapper fino, o unificar inputs. |
| `sc-checkbox` | `p-checkbox` (desarrollo) / nativo (diseño) | **divergente** | Sí (custom, `<input>` nativo tri-estado) | Sí (wrapper `p-checkbox`) | **Validar al ejecutar.** El del catálogo de diseño es custom deliberado (a11y nativa, tri-estado none/some/all imperativo); el del catálogo de desarrollo wrappea `p-checkbox` con `indeterminate`. Decidir base única manteniendo el tri-estado. Sin nombre que cambiar. |

### 3.2 Solo en el catálogo de diseño — wrappers PrimeNG

| Nombre unificado | Base PrimeNG | Tipo | ¿Diseño? | ¿Desarrollo? | Acción / estado |
|---|---|---|---|---|---|
| `sc-datepicker` | `p-datepicker` | wrapper | Sí | No | Portar. El preset ya cubre `datepicker` sin wrapper Angular — encaja directo. |
| `sc-multiselect` | `p-multiselect` | wrapper | Sí | No | Portar. Chrome de campo + CVA + display chip/comma. |
| `sc-inputnumber` | `p-inputtext` (sobre `<input type=number>`) | wrapper | Sí | No | Portar. `primengBase` efectivo = directiva `pInputText`; decisión deliberada vs `p-inputNumber` (documentada). |
| `sc-search` | `p-iconfield` (+ `p-inputicon` + `pInputText`) | wrapper | Sí | No | Portar. Clear button + hint de atajo + CVA + `focus()` público. |
| `sc-inputgroup` | `p-inputgroup` | wrapper | Sí | No | Portar. Addons left/right por content projection. |
| `sc-divider` | `p-divider` | wrapper | Sí | No | Portar. Wrapper 1:1 del Kit Pro. |
| `sc-column-selector` | `p-popover` | wrapper | Sí | No | Portar. Popover gestor de columnas (visibilidad + CDK drag-drop, persistido en localStorage). |
| `sc-group-popover` | `p-popover` | wrapper | Sí | No | Portar. Celda inline con conteo + lista flotante. |
| `sc-confirmdialog` | `p-confirmdialog` | wrapper | Sí (`sc-confirm-host`) | No | Portar. **Nombre de origen `sc-confirm-host` es kebab**; bajo DD-12, al envolver `p-confirmdialog` el unificado pegado sería `sc-confirmdialog`. Validar rename (depende de si se considera wrapper 1:1 o host de servicio — ver §8). Acoplado a `ConfirmHostService` (vivía en `@core` de la app de origen). |

### 3.3 Solo en el catálogo de diseño — custom

| Nombre unificado | Base PrimeNG | Tipo | ¿Diseño? | ¿Desarrollo? | Acción / estado |
|---|---|---|---|---|---|
| `sc-bulk-action-bar` | none | custom | Sí | No | Portar. Barra de acciones fija al seleccionar filas. Helper `useBulkEntityI18n` acompaña. |
| `sc-bulk-edit-menu` | `p-button` (+ 2× `sc-select`) | custom | Sí | No | Portar. Editor inline "Cambiar [campo] a [valor] [Aplicar]". |
| `sc-color-dot-picker` | none | custom | Sí | No | Portar. Picker de puntos de color (form de Labels). Comparte `LabelColor` con tag/chip. |
| `sc-command-palette` | none | custom | Sí | No | Portar. Overlay Cmd/Ctrl+K. Acoplado a `CommandPaletteService` (`@core`). |
| `sc-empty-state` | none | custom | Sí | No | Portar. Card de empty-state con reserva de min-height (no CLS). |
| `sc-form-danger-zone` | `p-button` (botón interno) | custom | Sí | No | Portar. Sección de acciones irreversibles. |
| `sc-form-section-nav` | none | custom | Sí | No | Portar. Nav de secciones in-form (tabs) con variante flush + dots de error. |
| `sc-icon` | none | custom | Sí | No | **Reconciliar con `@smartcontact/icons`.** Ambos orígenes tienen `<sc-icon>`; el paquete de iconos del catálogo de desarrollo es más maduro (Material Symbols generados). Migrar el del catálogo de diseño (Material Symbols por ligadura, ejes FILL/wght/opsz) a ese paquete. **Ojo dependencia transitiva:** los wrappers del catálogo de desarrollo no usan `<sc-icon>` directo sino que pasan por `sc-component-icon-resolver` (capa de compat de nombres pi→Material) — ver §5.a / §8.8. |
| `sc-inline-rename-cell` | none | custom | Sí | No | Portar. Celda de nombre editable in-place (`<input>` nativo). |
| `sc-keyboard-shortcuts` | none | custom | Sí | No | Portar. Cheat sheet de atajos (tecla `?`). Acoplado a `KeyboardShortcutsService` (`@core`). |
| `sc-page-header` | none | custom | Sí | No | Portar. Header de página estático (rutas no-entidad). |
| `sc-photo-upload` | none | custom | Sí | No | Portar. Uploader de avatar redondo; fallback a ilustración por hash (alimenta el tipo Image de `sc-avatar`). |
| `sc-section-card` | none | custom | Sí | No | **Portar + evolucionar.** Custom legítimo (Figma lo etiqueta "Custom"). Evolucionar al sistema anidado Section → Subsection → Slot del Figma. Ver §4.3. |
| `sc-sticky-form-header` | `p-button` (botón interno) | custom | Sí | No | Portar **retenido**. Ya no en uso activo; conservado para rollback (DD#65). |
| `sc-delete-entity-dialog` | `p-dialog` (vía `sc-dialog`) | custom (compone) | Sí | No | Portar. Compone `sc-dialog` + `p-button`. Acoplado a `ClipboardService`/`MessageService`. |
| `sc-impact-preview-dialog` | `p-dialog` (vía `sc-dialog`) | custom (compone) | Sí | No | Portar. Previsualiza operación bulk con chips podables. |

### 3.4 Solo en el catálogo de desarrollo — wrappers PrimeNG

| Nombre unificado | Base PrimeNG | Tipo | ¿Diseño? | ¿Desarrollo? | Acción / estado |
|---|---|---|---|---|---|
| `sc-avatar` | `p-avatar` | wrapper | No (existía `sc-illustrated-avatar`) | Sí | **Adoptar (canónico).** El componente real de origen expone **`size: 'normal'\|'large'\|'xlarge'` + `shape: 'square'\|'circle'`** (API actual). La **spec Figma objetivo** es más rica (Type Label/Icon/Image, Size 28/42/56, + Badge + AvatarGroup): el Badge y el AvatarGroup son **nodos del Figma, no API construida** — no existen como componentes en ningún origen, así que son **trabajo de port**, no algo ya hecho. `sc-illustrated-avatar` era el divergente → se retira como standalone, su fallback por hash alimenta el tipo Image. Ver §4.2. |
| `sc-badge` | `p-badge` | wrapper | No | Sí | Adoptar. variant→severity, size sm/md/lg/xl. |
| `sc-button` | `p-button` | wrapper | No (se usaba `p-button` directo) | Sí | Adoptar. variant/appearance (filled/outlined/text/link), icon, loading. Centraliza el botón que varios custom embebían suelto. |
| `sc-card` | `p-card` | wrapper | No | Sí | Adoptar. Tarjeta genérica header/subheader (distinta de `sc-section-card`, que es custom de jerarquía). |
| `sc-chip` | `p-chip` | wrapper | No (existía `sc-label-chip`) | Sí | **Adoptar.** Chip con remoción/disabled. El sistema de 8 colores categóricos + puntito entra como **variante** (styling). Ver §4.1. |
| `sc-drawer` | `p-drawer` | wrapper | No | Sí | Adoptar. Drawer lateral (posición, fullScreen). |
| `sc-message` | `p-message` | wrapper | No | Sí | Adoptar. Mensaje inline por severity (closable, variant simple/outlined/text). |
| `sc-panel` | `p-panel` | wrapper | No | Sí | Adoptar. Panel colapsable/toggleable. |
| `sc-progressbar` | `p-progressbar` | wrapper | No | Sí (alias `sc-progress-bar`) | Adoptar. Renombrar `sc-progress-bar` → `sc-progressbar` (DD-12). |
| `sc-progressspinner` | `p-progressspinner` | wrapper | No | Sí (alias `sc-progress-spinner`) | Adoptar. Renombrar `sc-progress-spinner` → `sc-progressspinner` (DD-12). |
| `sc-radiobutton` | `p-radiobutton` | wrapper | No | Sí (alias `sc-radio-button`) | Adoptar. Renombrar `sc-radio-button` → `sc-radiobutton` (DD-12). |
| `sc-skeleton` | `p-skeleton` | wrapper | No | Sí | Adoptar. Placeholder skeleton (shape/animation/dimensiones). |
| `sc-tag` | `p-tag` | wrapper | No (existía `sc-label-chip`) | Sí | **Adoptar (canónico para etiquetas de solo lectura).** Estandarizar a `sc-tag` los 3 usos de solo lectura existentes. Sistema de 8 colores + puntito entra como variante. Ver §4.1. |
| `sc-textarea` | `p-textarea` (`pTextarea`) | wrapper | No | Sí | Adoptar. Textarea (autoResize, rows, invalid, fluid). |
| `sc-toast` | `p-toast` | wrapper | No | Sí | Adoptar. Contenedor de toasts alimentado por `ScToastService` (`provideScToast`). Infra de notificación que el catálogo de diseño no tenía. |

### 3.5 Solo en el catálogo de desarrollo — custom + servicios

| Nombre unificado | Base PrimeNG | Tipo | ¿Diseño? | ¿Desarrollo? | Acción / estado |
|---|---|---|---|---|---|
| `ScDynamicDialogService` (+ `ScDynamicDialogRef`, `provideScDynamicDialog`) | `primeng/dynamicdialog` (`DialogService`) | servicio | No | Sí | **Adoptar (infra).** Servicio genérico para abrir cualquier componente standalone como diálogo al vuelo (`inputValues`). Ver §4.4. |
| `sc-bulk-transcription-modal` | none | custom (negocio) | Sí (implementación propia en Memory) | Sí | **NO es pieza de DS.** Flujo de negocio → feature de **Memory**. Al migrar Memory se validan ambas implementaciones. Ver §4.4. |

---

## 4. Solapes resueltos

Los 4 solapes detectados están **resueltos y validados con Figma**. Principio rector: **los solapes NO son duplicados a fundir a la fuerza.** Política: conservar lo construido + adoptar los genéricos PrimeNG que faltan + diferir refactors.

### 4.1 tag / chip / label-chip → `sc-tag` + `sc-chip` (puntito = variante)

- **`sc-tag`** (wrapper `p-tag`) = canónico para **etiquetas de solo lectura**, que es el uso real existente (3 sitios, sin quitar). Se estandarizan a `sc-tag`. (El `sc-tag` de origen no tiene remoción; su `sc-chip` sí es removible/disabled — coherente con esta asignación read-only vs quitable.)
- **`sc-chip`** (wrapper `p-chip`) = canónico cuando hay **quitables** (botón × / removible).
- **`sc-label-chip` (catálogo de diseño) se RETIRA** como componente aparte. Su **sistema de 8 colores categóricos + puntito** se mete como **VARIANTE** (styling) de `sc-tag`/`sc-chip`, **no** como componente propio. Los tokens `--sc-label-*` (tipo `LabelColor`, 8 colores cerrados) y el `LABEL_COLORS` que comparte con `sc-color-dot-picker` se conservan como la paleta de esa variante.
- **A validar visualmente** al ejecutar: que el puntito + los 8 colores se vean 1:1 con el Figma dentro de `sc-tag`/`sc-chip` (ver §8).

### 4.2 avatar → un solo `sc-avatar` (ilustración = fallback)

- **UN solo `sc-avatar`** alineado al **Figma genérico** (`❖ Avatar` PrimeOne 4.0). **Spec Figma objetivo:** `Type=Label/Icon/Image`, `Size=28/42/56`, `Circle true/false`, **+ Badge + AvatarGroup**. **API actual del componente de origen:** `size: 'normal'|'large'|'xlarge'`, `shape: 'square'|'circle'` — sin AvatarGroup ni Badge como componentes (no existen `avatar-group.component.ts` ni wrapper overlaybadge). Por tanto **Badge y AvatarGroup son trabajo de port hacia la spec Figma**, no algo ya construido. El `sc-avatar` del catálogo de desarrollo es la mejor base existente; el otro era el divergente.
- **`sc-illustrated-avatar` se RETIRA** como componente standalone. Su comportamiento — **si no hay foto, ilustración SVG por hash del nombre** (pools `illustrated`/`abstract`) — se conserva como **FALLBACK** que alimenta el **tipo Image** de `sc-avatar`. La foto subida sigue ganando sobre la ilustración.
- `sc-photo-upload` se reconecta a ese fallback (hoy ya cae a `sc-illustrated-avatar`/glifo).

### 4.3 section-card → SE QUEDA + evoluciona a Section → Subsection → Slot

- **`sc-section-card` SE QUEDA.** Es **custom legítimo**: el Figma lo etiqueta **"Custom"**, y `card`/`panel` (`sc-card`/`sc-panel`) **no cubren la jerarquía** Section → Subsection → Slot.
- **PERO** el `Section` del Figma es una **evolución más rica** que el código actual: una **Section contiene 1–4 Subsections**, y **cada Subsection contiene 1–5 Slots**.
- **Converger = EVOLUCIONAR** `sc-section-card` a ese sistema anidado (subsecciones + slots), **no tirarlo**. Se conservan sus modos actuales (collapsible, variante flush). Diseño del API anidado a validar al ejecutar (ver §8).

### 4.4 dynamic dialog → SEPARAR en servicio + flujo de negocio

Dos cosas distintas que no se mezclan:

1. **Servicio genérico `ScDynamicDialogService`** (catálogo de desarrollo): infra reutilizable para **abrir cualquier componente standalone como diálogo al vuelo** con `inputValues`, envolviendo `DialogService.open` de `primeng/dynamicdialog`. Expone `open<…>(componentType, config)` → `ScDynamicDialogRef` propio (observables `onClose`/`onDestroy`/… + `close()`/`destroy()`), con `provideScDynamicDialog()`. **Se ADOPTA** como infra de DS. (Los diálogos del catálogo de diseño usan el patrón `[visible]` declarativo; este servicio es complementario, no lo reemplaza.)
2. **`sc-bulk-transcription-modal`** = **FLUJO DE NEGOCIO**, no pieza de DS. Sigue siendo **feature de Memory**. Al **migrar Memory** se validan las dos implementaciones existentes (la del catálogo de desarrollo compone `sc-button` + `sc-toggle-switch`, i18n propio `sc.bulkTranscriptionModal`, animaciones hero/delta y contadores elegibles).

---

## 5. Huecos

### 5.a Solo en el catálogo de desarrollo → entran al repo unificado

Wrappers PrimeNG genéricos que el catálogo de diseño no tenía:

- `sc-avatar` (canónico, ver §4.2), `sc-badge`, `sc-button`, `sc-card`, `sc-chip`, `sc-drawer`, `sc-message`, `sc-panel`, `sc-progressbar`, `sc-progressspinner`, `sc-radiobutton`, `sc-skeleton`, `sc-tag`, `sc-textarea`, `sc-toast`.
- Infra: `ScDynamicDialogService` (+ `ScDynamicDialogRef` + `provideScDynamicDialog`), `ScToastService` (+ `provideScToast`).
- **Infra de iconos que se arrastra al portar esos wrappers:** `sc-component-icon-resolver` (`lib/core/icons/`) — capa de compat de nombres de icono **pi→Material Symbols** de la que dependen avatar/button/chip/message/tag y otros. **Decidir si se porta tal cual o se sustituye por el mapeo del catálogo de diseño**; es una dependencia transitiva real. Junto con ello llegan los **tipos públicos** de `lib/core/types` (`theme-component.types.ts`: `ScSeverity`/`ScComponentSize`/`ScInputVariant`/`ScDialogPosition`/`ScAvatarSize`/`ScAvatarShape`/`ScSkeletonShape`/`ScSkeletonAnimation`/`ScProgressBarMode`; `button.types.ts`; `badge.types.ts`), exportados por su `public-api` — superficie a portar/reconciliar.
- **Cobertura de preset sin wrapper aún** (el preset cubre ~80–87 módulos PrimeNG): `accordion`, `datatable`, `breadcrumb`, `menu`, `stepper`, `tabs`, etc. → el **styling** llega vía preset aunque el **wrapper Angular** todavía no exista (ver 5.c).

### 5.b Solo en el catálogo de diseño → entran al repo unificado

Todo lo de §3.2 + §3.3: los wrappers PrimeNG exclusivos (`sc-datepicker`, `sc-multiselect`, `sc-inputnumber`, `sc-search`, `sc-inputgroup`, `sc-divider`, `sc-column-selector`, `sc-group-popover`, `sc-confirmdialog`/`sc-confirm-host`) y **todos los custom** (`sc-bulk-action-bar`, `sc-bulk-edit-menu`, `sc-color-dot-picker`, `sc-command-palette`, `sc-empty-state`, `sc-form-danger-zone`, `sc-form-section-nav`, `sc-icon`, `sc-inline-rename-cell`, `sc-keyboard-shortcuts`, `sc-page-header`, `sc-photo-upload`, `sc-section-card`, `sc-sticky-form-header`, `sc-delete-entity-dialog`, `sc-impact-preview-dialog`).

> **Deuda de aislamiento a saldar al portar:** varios custom acoplan servicios que vivían **fuera** del package, en el `@core`/`@shared` de la app de origen: `CommandPaletteService`, `ConfirmHostService`, `KeyboardShortcutsService`, `ClipboardService`, `MessageService`, `NAV_ICONS`, `@shared/utils/icon-size`. No son 100% portables sin mover/abstraer esos paths. Resolver al meterlos en `@smartcontact/components`.

### 5.c Faltan en ambos (huecos reales del DS)

Componentes que **ningún origen** tiene como wrapper Angular, pero el **preset ya estila** — candidatos a crear durante el port:

- **`sc-datatable`** (wrapper de tabla / data-table) — el más prioritario: las list pages lo necesitan y hoy no hay wrapper en ningún lado (solo styling en preset).
- `sc-accordion`, `sc-breadcrumb`, `sc-menu`, `sc-stepper`, `sc-tabs` — estilados por preset, sin wrapper Angular en ninguno de los dos catálogos.

---

## 6. Estructura y empaquetado objetivo

**Molde:** split de paquetes + `provideSmartContactUi()` del catálogo de desarrollo + tokens/preset/tooling del catálogo de diseño. *(Esta estructura ya está materializada en este repo — fundaciones cerradas; ver §12.)*

### 6.1 Split de 3 paquetes ng-packagr publicables + demo

| Paquete | npm name | Project | Contenido | peerDeps clave |
|---|---|---|---|---|
| tokens | `@smartcontact/styles` | `projects/design-tokens/` | **tokens 14-base** (7 capas `01-primitive…07-dark.css` en `src/lib/styles/tokens/layers/`, escala `--sc-scale-*`, alias font-size/line-height) + reset/globals | — (solo tslib) |
| iconos | `@smartcontact/icons` | `projects/ui-smartcontact-icons/` | `<sc-icon>` + Material Symbols generados (el `sc-icon` del catálogo de diseño migra aquí) | `@angular/core` + `@angular/common` |
| componentes | `@smartcontact/components` | `projects/ui-smartcontact/` | wrappers `sc-*` (ambos orígenes) + **preset modular** (`src/lib/theme/sc-preset/`) + `provideSmartContactUi` | primeng, @primeuix/themes, `@smartcontact/icons`, `@smartcontact/styles`, ngx-translate |
| demo | (privado) | `projects/sc-demo/` | app consumidora de referencia / doc-site | — |

Cada lib compila con **ng-packagr** (`ng-package.json` → `dist/<lib>`); peerDeps por versión exacta. Esto da **publicabilidad real** (paquetes versionados, no consumo por path).

### 6.2 Tokens y preset dentro del molde

- **Tokens:** las capas 14-base viven en `projects/design-tokens/src/lib/styles/tokens/layers/`, **sustituyendo** el `spacing.css`/`radius.css` 8-point de origen. Se conserva el patrón de **auto-generación desde el export de Figma** pero **alimentado por la ley de escala 14-base** — **ambos generadores fundidos en uno** DTCG-aware.
- **Preset:** dentro de `@smartcontact/components`, estructura **modular por-componente** (**~82 módulos + `base.ts` + `index.ts` con `} satisfies Preset` + `extend.ts` = 85 ficheros** en `projects/ui-smartcontact/src/lib/theme/sc-preset/`), con **cada slot apuntando a `var(--sc-*)`**. **`base.ts` reescrito** (sin hex hardcodeados). `prefix:'p'` (variables runtime `--p-*` → redirigidas a `--sc-*`).
- **Tooling de parity/gen** conectado al pipeline: el import DTCG + `tokens:parity` como guardarraíl (cruza el export del Kit contra `--sc-*` + preset, bloquea drift).

### 6.3 API de setup pública

- **`provideSmartContactUi(config?)`** (en `@smartcontact/components`) como **única frontera de setup**: envuelve `providePrimeNG` + aplica el preset. Elimina el cableado a mano por app (`providePrimeNG({ theme: { preset: ScPreset … }})`).
- `prefix` defaultea a `'p'` — coincide con lo necesario, se mantiene.
- El default `darkModeSelector` del provider de origen era `'none'` (dark mode desactivado por defecto); en el repo unificado el default es **`.sc-dark`**, alineado con la clase de dark mode del DS.

### 6.4 Build / export portable

- Pipeline: `build:design-tokens` → `build:icons` → `build:components` (cada uno `ng build <proj>` → `dist/<proj>`); export = `ng build` + `npm pack dist/<proj> --pack-destination dist/archives`.
- Los scripts `export:*` de origen estaban lockeados a PowerShell (Windows) → portados a Node (`mkdir -p` portable, CI Linux + macOS). El flujo `ng build → npm pack → dist/archives` se conserva.

### 6.5 Consumo final por una app

Tres piezas con frontera limpia:

1. CSS global: `@import @smartcontact/styles/index.css` + `@import @smartcontact/icons/…`.
2. Provider: `provideSmartContactUi()` en `app.config.ts`.
3. Wrappers `sc-*` standalone desde `@smartcontact/components`.

Las apps consumidoras (supervisor, doc-site) migran de imports por path de monorepo a los **paquetes versionados**.

---

## 7. Plan de port (fases)

> Orden por dependencia: nada de componentes antes de que la escala/preset estén sólidos. El choque de escala §2.2 era **bloqueante** y fue Fase 0. **Las Fases 0–1 están completadas en este repo** (fundaciones); las Fases 2–5 son la Mitad B (ver `component-port-plan.md`).

### Fase 0 — Resolver el choque de escala (bloqueante) ✓

- Tabla única = **14-base**, regenerada en `@smartcontact/styles`.
- Barrido de los wrappers `sc-*` de origen que consumen `--sc-spacing-*`/`--sc-space-*` → repuntar a `--sc-scale-*` (se completa pieza a pieza al portar cada wrapper).
- Generadores de tokens fundidos en uno DTCG-aware.

### Fase 1 — Fundaciones (tokens / escala / preset / setup) ✓

- Split de 3 paquetes ng-packagr + `sc-demo`.
- Capas 14-base + alias semánticos en `@smartcontact/styles`.
- Preset modular apuntando a `var(--sc-*)` (sin hex en `base.ts`); overrides portados a la estructura por-componente.
- `tokens:parity`/generador/auditor de escala conectados al pipeline; `export:*` portados a Node.
- `provideSmartContactUi()` como frontera de setup, con `darkModeSelector` por defecto **`.sc-dark`**; reconciliación de `@smartcontact/icons` con `sc-icon` y destino de `sc-component-icon-resolver` → decisión por-componente diferida a la Mitad B (§8.8).

### Fase 2 — Primitivos PrimeNG que faltan

- **Del catálogo de desarrollo (5.a):** adoptar `sc-avatar`, `sc-badge`, `sc-button`, `sc-card`, `sc-chip`, `sc-drawer`, `sc-message`, `sc-panel`, `sc-progressbar`, `sc-progressspinner`, `sc-radiobutton`, `sc-skeleton`, `sc-tag`, `sc-textarea`, `sc-toast` + infra `ScToastService` / `ScDynamicDialogService` (+ se arrastra `sc-component-icon-resolver` y `lib/core/types`).
- **Del catálogo de diseño (5.b wrappers):** portar `sc-datepicker`, `sc-multiselect`, `sc-inputnumber`, `sc-search`, `sc-inputgroup`, `sc-divider`, `sc-column-selector`, `sc-group-popover`, `sc-confirmdialog`.
- **Comunes (3.1):** convergir `sc-inputtext` / `sc-select` / `sc-toggleswitch` / `sc-dialog` / `sc-checkbox` (renames DD-12 + reconciliar APIs; decidir base de `sc-checkbox`).
- **Hueco real (5.c):** crear `sc-datatable` (prioritario) y, según necesidad, `sc-accordion`/`sc-breadcrumb`/`sc-menu`/`sc-stepper`/`sc-tabs`.

### Fase 3 — Custom del catálogo de diseño

- Portar todos los custom de §3.3 a `@smartcontact/components`.
- **Saldar la deuda de aislamiento** (5.b): abstraer/mover `CommandPaletteService`, `ConfirmHostService`, `KeyboardShortcutsService`, `ClipboardService`, `MessageService`, `NAV_ICONS`, `icon-size` para que los custom sean portables.
- `sc-sticky-form-header` se porta **retenido** (rollback DD#65).

### Fase 4 — Solapes (migraciones)

- **tag/chip/label-chip (§4.1):** retirar `sc-label-chip`; meter 8 colores + puntito como variante de `sc-tag`/`sc-chip`; migrar los 3 usos de solo lectura a `sc-tag`.
- **avatar (§4.2):** retirar `sc-illustrated-avatar` standalone; cablear el fallback por hash al tipo Image de `sc-avatar`; reconectar `sc-photo-upload`. Portar Badge + AvatarGroup hacia la spec Figma (no existen aún como componentes).
- **section-card (§4.3):** evolucionar a Section → Subsection → Slot (1–4 / 1–5).
- **dynamic-dialog (§4.4):** integrar `ScDynamicDialogService` como infra (ya adoptado en Fase 2).

### Fase 5 — Flujos / piloto

- Migrar **Memory** y, al hacerlo, validar las dos implementaciones de `sc-bulk-transcription-modal` (§4.4).
- Migrar las apps consumidoras (supervisor, doc-site) de imports por path a los paquetes versionados.
- Usar `sc-demo` como app de referencia / piloto de validación.

> **Red de seguridad:** tras cualquier toque cross-surface (tokens, preset, renames cross-app, sweeps masivos), correr el e2e smoke por inercia.

---

## 8. Pendientes / anexos — a validar al ejecutar

1. **`sc-section-card` → Section/Subsection/Slot (§4.3):** diseñar el API anidado (Section contiene 1–4 Subsections; Subsection contiene 1–5 Slots) **1:1 con el Figma "Section"**, conservando collapsible + flush. Sacar medidas reales del Figma antes de codear.
2. **`ScDynamicDialogService` (§4.4):** al adoptarlo, verificar que `inputValues` + el `ScDynamicDialogRef` propio (observables + `close()`/`destroy()`) encajan con los patrones del DS; convive con —no reemplaza— el patrón `[visible]` declarativo de los diálogos existentes.
3. **`sc-bulk-transcription-modal` (§4.4):** al **migrar Memory**, comparar las dos implementaciones (componibilidad `sc-button`+`sc-toggleswitch`, i18n, animaciones hero/delta, contadores elegibles) y elegir/fundir. **No** es pieza de DS.
4. **Cheque visual del puntito (§4.1):** verificar 1:1 contra Figma que los 8 colores categóricos + el puntito se ven correctos como **variante** de `sc-tag`/`sc-chip` (no como componente aparte).
5. **`sc-checkbox` — base única (§3.1):** decidir entre el `<input>` nativo tri-estado (a11y de browser) y el wrapper `p-checkbox` con `indeterminate`, **conservando el tri-estado** none/some/all. Validar al ejecutar.
6. **`sc-dialog` — reconciliar APIs (§3.1):** el `sc-dialog` del catálogo de diseño pinta toda la card canónica (`[visible]` declarativo, header icon+title+subtitle+close, footer projection); el del catálogo de desarrollo es wrapper fino (`header`/`position`/`draggable`). Decidir si la card canónica se mantiene como capa sobre el wrapper fino o se unifican inputs.
7. **`sc-confirm-host` → ¿`sc-confirmdialog`? (§3.2):** decidir si bajo DD-12 se renombra a `sc-confirmdialog` (envuelve `p-confirmdialog`) o se mantiene el nombre de host por su acoplamiento a `ConfirmHostService`. Borde de la regla pegado-vs-kebab.
8. **`sc-icon` vs `@smartcontact/icons` + `sc-component-icon-resolver` (§3.3 / §5.a):** confirmar que la migración al paquete de iconos conserva los ejes FILL/wght/opsz (font-variation-settings) y el proveedor por ligadura; **decidir si `sc-component-icon-resolver` (compat pi→Material) se porta tal cual o se sustituye por el mapeo del catálogo de diseño**, sabiendo que casi todos los wrappers de origen dependen de él.
9. **Deuda de aislamiento (§5.b):** inventariar y resolver los acoplamientos a `@core`/`@shared` antes de declarar portables los custom.
10. **Naming aliases vivos durante la transición:** mientras los 5 wrappers con guión se realinean a pegado, mantener nota de alias para no romper imports a media migración.

---

## 9. Contraste con las convenciones documentadas del catálogo de desarrollo (`AGENTS.md` + skills)

El repo de origen del catálogo de desarrollo trae un setup de agente que **codifica** sus convenciones: `AGENTS.md`, `PROMPTS.md` y skills (`token-inspector`, `component-generator`, `primeng-wrapper`, `docs-generator`, `workspace-sync`, `smartcontact-i18n`, `smartcontact-consumer-integration`, `angular-version-migration`). Contrastadas contra este manifiesto:

### 9.1 Coincidencias (misma doctrina en ambos orígenes)

- **Tokens:** su `AGENTS.md` fija *"nunca inventar tokens · `--sc-*` = contrato público · `--p-*` = capa adaptadora (preset/wrapper internals) · los custom NO dependen de `--p-*` · la paleta se alinea por el preset, no copiando variables PrimeNG"*. Es **idéntico** a la arquitectura del catálogo de diseño (DD-1/DD-2 + migration-safety). **El repo unificado la cumple incluso mejor:** el `base.ts` de origen hardcodeaba hex (contra su propio "no hardcodear"); §6.2 lo reescribe a `var(--sc-*)`.
- **Wrapper vs custom = principio de reutilización:** la regla *"usa wrapper PrimeNG si el comportamiento existe / es un primitivo estilizado; custom solo si es composite / layout / no soportado"* es la misma lente de reutilización (minimal customization). La auditoría de reutilización (§10) se apoya en esa misma regla.
- **Pipeline de agente** (token-inspector → component-generator → primeng-wrapper → docs-generator → workspace-sync): el repo unificado encaja en ese pipeline.
- Standalone Angular 21, "extender el repo, no inventar arquitectura", docs-driven, i18n no en wrappers primitivos (texto vía inputs del consumer): alineado.

### 9.2 Choques documentados (la convergencia toca docs, no solo código)

1. **Naming** — el `AGENTS.md` + skills de origen mandan kebab-case + BEM (`sc-toggle-switch`, `sc-button--primary`), y usan `sc-toggle-switch`/`sc-input-text` como componentes de referencia de las skills. DD-12 fija **pegado** para wrappers PrimeNG. → Converger **no es solo renombrar 5 selectores**: hay que **actualizar `AGENTS.md` + `component-generator` + `primeng-wrapper` + los ejemplos de referencia** a pegado, o el pipeline de generación seguirá produciendo kebab. (La regla kebab para *custom* sí se conserva — ahí no hay choque.)
2. **Escala** — las skills de origen mandan tokens unitless + `calc(var(--token)/16*1rem)` (base 16). La unificada es **14-base** con rem centralizado (§2.2). → Converger la escala **cambia también la convención de generación** (la regla del `/16` en `token-inspector`/`primeng-wrapper`), no solo los valores de los tokens.

### 9.3 Acción derivada

Las instrucciones de agente de este repo ya reflejan las convenciones unificadas (naming pegado DD-12, escala 14-base, tooling de parity). Al portar cada pieza, verificar que ningún ejemplo o skill heredado regenere la divergencia cerrada (kebab en wrappers PrimeNG, regla `/16`).

---

## 10. Auditoría de reutilización (custom → ¿primitivo PrimeNG?)

Lente (= la regla wrapper-vs-custom de §9.1): para cada custom "puro" (`Base PrimeNG = none`), ¿hay un primitivo PrimeNG que **ningún origen** envolvió y que lo cubriría? Cruzado contra el catálogo **completo** de PrimeNG 21 (~90 componentes).

| Custom | Primitivo PrimeNG candidato | Clasificación | Acción al portar |
|---|---|---|---|
| `sc-inline-rename-cell` | **`p-inplace`** (+ `p-inputtext`) | **reutilizar** | `p-inplace` ES exactamente "mostrar → editar in-place". Reconstruir encima en vez de `<input>` a mano. |
| `sc-photo-upload` | **`p-fileupload`** (+ `sc-avatar`) | **reutilizar** | `p-fileupload` aporta la mecánica de subida; la parte propia = display avatar + fallback ilustración. |
| `sc-command-palette` | `p-dialog` + `p-autocomplete`/`p-listbox` | componer | Overlay Cmd/Ctrl+K sobre primitivos en vez de bespoke total. |
| `sc-keyboard-shortcuts` | `p-dialog` + contenido | componer | Cheat sheet = dialog + tabla. |
| `sc-section-card` | `p-panel` / `p-fieldset` (por subsección) | componer | Ya en §4.3 (evolución Section→Subsection→Slot apoyada en panel/fieldset). |
| `sc-bulk-action-bar` | `p-toolbar` (solo armazón) | bespoke (shell opcional) | Layout/UX específico (overlay, no-CLS, bulk-i18n); `p-toolbar` solo daría el marco. |
| `sc-color-dot-picker` | — (`p-colorpicker` es spectrum, no categórico) | **bespoke** | Selección categórica de 8 colores; no hay primitivo que encaje. |
| `sc-empty-state` | — | **bespoke** | Patrón de layout simple. |
| `sc-form-section-nav` | — (`p-tabs` no hace scroll-spy + dots de error) | **bespoke** | Comportamiento custom. |
| `sc-page-header` | — | **bespoke** | Patrón de layout. |
| `sc-icon` | `@smartcontact/icons` | reconciliar | Ver §3.3 (migrar al paquete de iconos; PrimeNG usa PrimeIcons, no aplica). |
| `sc-sticky-form-header` | — | bespoke (retenido) | Rollback DD#65, no en uso activo. |

**Resultado:** de las 12 piezas "puras", **2 son reutilización fuerte** (`p-inplace`, `p-fileupload`), **3 se componen sobre primitivos** (`p-dialog`/`p-panel`), y solo **~5 son bespoke legítimos** (sin primitivo que encaje). Recorta el código propio a mantener y cumple *"no acumular, reutilizar de PrimeNG"*. **A confirmar pieza a pieza al portar** — no forzar un primitivo que no encaje (eso es peor que el bespoke).

---

## 11. Qué aporta cada origen al repo unificado

El repo unificado no elige un origen sobre otro: combina lo más sólido de cada uno.

**Del catálogo de diseño:**
- La mayor cobertura de componentes (32 piezas, incluidos todos los custom de producto).
- Los guardarraíles automáticos anti-drift (`tokens:parity`, generador de escala, `tokens:guard`, auditoría de tipos, e2e) que convierten "cada valor trazable a Figma" en una verificación de máquina.
- El contrato de tokens ejecutado de punta a punta: preset que resuelve a `var(--sc-*)`, sin valores hardcodeados.
- API moderna de Angular (signals `input()/output()`) y la disciplina de diseño 1:1 con Figma (DECISIONS, customs-catalog, naming DD-12, escala formalizada).

**Del catálogo de desarrollo:**
- El empaquetado para producción: 3 paquetes publicables (`@smartcontact/styles · icons · components`) + `provideSmartContactUi()` + ng-packagr + tarballs.
- El preset modular por-componente (85 ficheros) frente al monolito.
- El paquete de iconos más maduro (Material Symbols generados) y el mecanismo de rem centralizado (mejor accesibilidad de zoom).
- Un conjunto de primitivos PrimeNG genéricos (avatar, badge, button, card, drawer, message, panel, skeleton, toast…) y la infra de servicios (toast, dynamic dialog).

**Convergencia ya verificada entre ambos:** misma doctrina de tokens (`--sc-*` contrato · `--p-*` adaptador · no inventar tokens · paleta por preset) y misma regla wrapper-vs-custom. Los choques históricos (naming kebab vs pegado, escala 8-point vs 14-base) están resueltos por decisión (DD-12, §2.2) y materializados en este repo.

---

## 12. Estado al cierre de fundaciones

Las fundaciones (Fases 0–1) están cerradas en este repo:

- **Escala unificada:** 14-base con naming v/14 (`--sc-scale-*`), conversión a `rem` centralizada en un punto único. El choque 8-point ↔ 14-base está resuelto a nivel de fundaciones; el barrido de consumos heredados se completa pieza a pieza durante el port (ver `component-port-plan.md`).
- **Theme Designer:** exporta DTCG; el export del Kit se versiona en **`projects/design-tokens/scripts/kit-export-dtcg.json`** y es la fuente de verdad de valores que el generador y `tokens:parity` consumen.
- El detalle de cada decisión tomada durante la construcción de fundaciones está en **`DECISIONS-LOG.md`** (raíz del repo); el rationale en `docs/foundations-rationale.md`.
