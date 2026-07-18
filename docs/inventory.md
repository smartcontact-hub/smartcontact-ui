# Inventario del Design System — componentes

> El "tracklist" del DS: cada componente, su selector, y si es **wrapper** (estiliza un
> componente de PrimeNG) o **pure-custom** (pieza propia, cero PrimeNG). Reemplaza el tracker
> que vivía en `ds-docs` (consolidado aquí, 2026-06-15). El catálogo **visual** vivo está en
> `sc-demo` ([showcase en Pages/Cloudflare](README.md)); este doc es el índice **textual**,
> findable y mantenible.
>
> **Fuente**: `projects/ui-smartcontact/src/lib/components/`. La tabla de abajo es **auto-generada**
> por `scripts/component-audit.mjs` (comando `audit:components`): provenance, base PrimeNG, API propia
> (CVA / nº de inputs), anidados, cobertura demo y **uso real en el Supervisor** se DERIVAN del código.
> El juicio standard-vs-extended y las exenciones de demo se curan en `scripts/component-audit-map.mjs`
> (lo confirma Rafa). **No editar la tabla a mano** → `node scripts/component-audit.mjs --write`.
> Manifiesto máquina: `docs/_component-status.json`.
>
> **¿Dónde se usa cada componente?** La galería **Uso real** en `sc-demo` (ruta `/uso`) muestra las
> pantallas REALES del Supervisor donde aparece cada componente — capturas del DOM renderizado,
> auto-generadas por `npm run usage:capture` (no se desfasan). Manifiesto:
> `projects/sc-demo/public/usage/_usage-status.json`.
>
> **Leyenda:** *CUSTOM* = pieza propia, cero PrimeNG · *STANDARD* = wrapper passthrough sobre PrimeNG ·
> *EXTENDED* = wrapper con API propia (CVA, inputs, comportamiento) · *Anidados* = otros `sc-*` que
> compone (sin contar `sc-icon`) · *Usos en Supervisor* = adopción en la app real.

## Clasificación (auto-generada)

<!-- @audit:components — TABLA GENERADA por `node scripts/component-audit.mjs --write`. NO editar a mano. -->
**49 componentes** · 15 custom · 11 standard · 23 extended · 32 usados en Supervisor.

| Componente | Tipo | PrimeNG base | API propia | Anidados | Demo | Usos en Supervisor |
|---|---|---|---|---|---|---|
| `sc-avatar` | EXTENDED | primeng/avatar, primeng/overlaybadge | 11 inputs | — | ✓ | — |
| `sc-badge` | STANDARD | primeng/badge | 3 inputs | — | ✓ | — |
| `sc-bulk-action-bar` | CUSTOM | — | 0 inputs | — | ✓ | 7 |
| `sc-bulk-edit-menu` | STANDARD | primeng/button | 1 inputs | sc-select | ✓ | 2 |
| `sc-bulk-transcription-modal` | CUSTOM | — | 16 inputs | sc-button sc-toggleswitch | ✓ | — |
| `sc-button` | EXTENDED | primeng/button | 15 inputs | — | ✓ | 58 |
| `sc-card` | STANDARD | primeng/card | 2 inputs | — | ✓ | — |
| `sc-checkbox` | CUSTOM | — | 5 inputs | — | ✓ | 16 |
| `sc-chip` | EXTENDED | primeng/chip | 9 inputs | — | ✓ | 1 |
| `sc-color-dot-picker` | CUSTOM | — | 1 inputs | — | ✓ | 3 |
| `sc-column-selector` | STANDARD | primeng/popover | 1 inputs | — | ✓ | 3 |
| `sc-command-palette` | CUSTOM | — | 0 inputs | — | ✓ | 4 |
| `sc-confirmdialog` | STANDARD | primeng/confirmdialog | 0 inputs | — | ✓ | 1 |
| `sc-datatable` | EXTENDED | primeng/table | 19 inputs | — | ✓ | — |
| `sc-datepicker` | EXTENDED | primeng/datepicker | CVA · 17 inputs | — | ✓ | 2 |
| `sc-delete-entity-dialog` | STANDARD | primeng/button | 2 inputs | sc-dialog | ✓ | 9 |
| `sc-dialog` | EXTENDED | primeng/dialog | 12 inputs | — | ✓ | 10 |
| `sc-divider` | STANDARD | primeng/divider | 3 inputs | — | ✓ | 4 |
| `sc-drawer` | EXTENDED | primeng/drawer | 8 inputs | — | ✓ | — |
| `sc-empty-state` | CUSTOM | — | 1 inputs | — | ✓ | 8 |
| `sc-form-danger-zone` | STANDARD | primeng/button | 3 inputs | — | ✓ | — |
| `sc-form-section-nav` | CUSTOM | — | 4 inputs | — | ✓ | 5 |
| `sc-gauge` | CUSTOM | — | 8 inputs | — | ✓ | — |
| `sc-group-popover` | STANDARD | primeng/popover | 0 inputs | — | ✓ | 2 |
| `sc-impact-preview-dialog` | STANDARD | primeng/button | 3 inputs | sc-dialog | ✓ | 2 |
| `sc-inline-rename-cell` | CUSTOM | — | 2 inputs | — | ✓ | 3 |
| `sc-inputgroup` | STANDARD | primeng/inputgroup | 2 inputs | — | ✓ | — |
| `sc-inputnumber` | EXTENDED | primeng/inputtext | CVA · 13 inputs | — | ✓ | 4 |
| `sc-inputtext` | EXTENDED | primeng/inputtext | CVA · 18 inputs | — | ✓ | 29 |
| `sc-keyboard-shortcuts` | CUSTOM | — | 1 inputs | — | ✓ | 2 |
| `sc-message` | EXTENDED | primeng/message | 6 inputs | — | ✓ | 1 |
| `sc-multiselect` | EXTENDED | primeng/multiselect | CVA · 23 inputs | — | ✓ | 10 |
| `sc-page-header` | CUSTOM | — | 3 inputs | — | ✓ | 1 |
| `sc-panel` | EXTENDED | primeng/panel | 4 inputs | — | ✓ | — |
| `sc-photo-upload` | CUSTOM | — | 6 inputs | — | ✓ | 2 |
| `sc-progressbar` | EXTENDED | primeng/progressbar | 4 inputs | — | ✓ | — |
| `sc-progressspinner` | EXTENDED | primeng/progressspinner | 4 inputs | — | ✓ | — |
| `sc-radiobutton` | EXTENDED | primeng/radiobutton | 7 inputs | — | ✓ | 2 |
| `sc-search` | EXTENDED | primeng/iconfield, primeng/inputicon, primeng/inputtext | CVA · 9 inputs | — | ✓ | 8 |
| `sc-section-card` | CUSTOM | — | 6 inputs | — | ✓ | 11 |
| `sc-select` | EXTENDED | primeng/select | CVA · 22 inputs | — | ✓ | 33 |
| `sc-skeleton` | EXTENDED | primeng/skeleton | 6 inputs | — | ✓ | — |
| `sc-slot` | CUSTOM | — | 2 inputs | — | ✓ | — |
| `sc-sticky-form-header` | EXTENDED | primeng/button | 4 inputs | — | ✓ | 3 |
| `sc-subsection` | CUSTOM | — | 4 inputs | — | ✓ | — |
| `sc-tag` | EXTENDED | primeng/tag | 6 inputs | — | ✓ | — |
| `sc-textarea` | EXTENDED | primeng/textarea | 13 inputs | — | ✓ | 1 |
| `sc-toast` | EXTENDED | primeng/toast | 6 inputs | — | ✓ | — |
| `sc-toggleswitch` | EXTENDED | primeng/toggleswitch | 7 inputs | — | ✓ | 21 |
<!-- @audit:components:end -->

## Gaps abiertos (el consumidor real los necesita; el DS aún no los cubre)

Estos 4 mantienen una **copia local en el Supervisor** (`projects/supervisor/src/app/shared/components/`)
hasta que el DS los resuelva. Detalle + disparador en [`ROADMAP.md`](ROADMAP.md):

| Gap | Local en el Supervisor | Qué falta en el DS |
|---|---|---|
| Iconos Outlined | `icon` (IconComponent) | Estilo resuelto (DD-31): el DS sirve **Outlined** self-hospedado; queda converger el `IconComponent` local a `<sc-icon>` + decidir peso/ejes |
| Avatar en px | `illustrated-avatar` | `sc-avatar` solo expone buckets, no px |
| Tag `xs` | `label-chip` | `sc-tag` no expone tamaño `xs` |
| Icono de confirm overridable | `confirm-host` | `ScConfirmService` hardcodea el icono de cabecera |

(`group-popover` types — `GroupRef` — también local: el DS lo define pero no lo exporta.)
