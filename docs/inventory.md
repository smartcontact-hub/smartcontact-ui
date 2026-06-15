# Inventario del Design System — componentes

> El "tracklist" del DS: cada componente, su selector, y si es **wrapper** (estiliza un
> componente de PrimeNG) o **pure-custom** (pieza propia, cero PrimeNG). Reemplaza el tracker
> que vivía en `ds-docs` (consolidado aquí, 2026-06-15). El catálogo **visual** vivo está en
> `sc-demo` ([showcase en Pages/Cloudflare](README.md)); este doc es el índice **textual**,
> findable y mantenible.
>
> **Fuente**: `projects/ui-smartcontact/src/lib/components/`. Para regenerar la clasificación:
> por cada componente, "wrapper" = su `.ts` importa de `primeng/`; "pure" = no.

## Resumen

- **47 componentes** + `ScDynamicDialogService` (servicio, sin componente).
- **13 pure-custom** (~28%) — el diseño **original** del DS, no "estilar PrimeNG".
- **34 wrappers/híbridos** — interpretación 1:1 de PrimeNG con el contrato `--sc-*`.

## Pure-custom (13) — pieza propia, cero PrimeNG

| Componente | Selector | Notas |
|---|---|---|
| bulk-action-bar | `sc-bulk-action-bar` | Barra de acciones en selección masiva |
| bulk-transcription-modal | `sc-bulk-transcription-modal` | Modal presentacional |
| checkbox | `sc-checkbox` | `<input type=checkbox>` nativo tri-estado (NO wrapper p-checkbox) |
| color-dot-picker | `sc-color-dot-picker` | Selector de color por puntos |
| command-palette | `sc-command-palette` | ⌘K, data-driven (`setCommands`) |
| empty-state | `sc-empty-state` | Estado vacío con CTA |
| form-section-nav | `sc-form-section-nav` | Navegación de secciones de formulario |
| inline-rename-cell | `sc-inline-rename-cell` | Renombrado inline en celda |
| keyboard-shortcuts | `sc-keyboard-shortcuts` | Cheat-sheet `?`, data-driven (`[groups]`) |
| page-header | `sc-page-header` | Cabecera de página con acciones |
| section-card | `sc-section-card` | Card de sección (+ subsection + slot) |
| slot | `sc-slot` | Fila titulada con divisor |
| subsection | `sc-subsection` | Card blanca dentro de section-card |

## Wrappers / híbridos (34) — sobre PrimeNG, contrato `--sc-*`

`sc-avatar` · `sc-badge` · `sc-bulk-edit-menu` · `sc-button` · `sc-card` · `sc-chip` ·
`sc-column-selector` · `sc-confirmdialog` · `sc-datatable` · `sc-datepicker` ·
`sc-delete-entity-dialog` · `sc-dialog` · `sc-divider` · `sc-drawer` · `sc-form-danger-zone` ·
`sc-group-popover` · `sc-impact-preview-dialog` · `sc-inputgroup` · `sc-inputnumber` ·
`sc-inputtext` · `sc-message` · `sc-multiselect` · `sc-panel` · `sc-photo-upload` ·
`sc-progressbar` · `sc-progressspinner` · `sc-radiobutton` · `sc-search` · `sc-select` ·
`sc-skeleton` · `sc-sticky-form-header` · `sc-tag` · `sc-textarea` · `sc-toast` · `sc-toggleswitch`

## Gaps abiertos (el consumidor real los necesita; el DS aún no los cubre)

Estos 4 mantienen una **copia local en el Supervisor** (`projects/supervisor/src/app/shared/components/`)
hasta que el DS los resuelva. Detalle + disparador en [`ROADMAP.md`](ROADMAP.md):

| Gap | Local en el Supervisor | Qué falta en el DS |
|---|---|---|
| Iconos Outlined | `icon` (IconComponent) | `@smartcontact-hub/icons` usa Rounded; decidir ejes Material |
| Avatar en px | `illustrated-avatar` | `sc-avatar` solo expone buckets, no px |
| Tag `xs` | `label-chip` | `sc-tag` no expone tamaño `xs` |
| Icono de confirm overridable | `confirm-host` | `ScConfirmService` hardcodea el icono de cabecera |

(`group-popover` types — `GroupRef` — también local: el DS lo define pero no lo exporta.)
