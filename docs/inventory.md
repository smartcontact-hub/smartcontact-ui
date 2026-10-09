# Inventario del Design System — componentes

> El "tracklist" del DS: cada componente, su selector, y si es **wrapper** (estiliza un
> componente de PrimeNG) o **pure-custom** (pieza propia, cero PrimeNG). Reemplaza el tracker
> que vivía en `ds-docs` (consolidado aquí, 2026-06-15). El catálogo **visual** vivo está en
> `sc-docs` ([showcase en sc-doc.pages.dev](https://sc-doc.pages.dev)); este doc es el índice **textual**,
> findable y mantenible.
>
> **Fuente**: `projects/ui-smartcontact/src/lib/components/`. La tabla de abajo es **auto-generada**
> por `scripts/component-audit.mjs` (comando `audit:components`): provenance, base PrimeNG, API propia
> (CVA / nº de inputs), anidados, cobertura demo y **uso real en el Supervisor** se DERIVAN del código.
> El juicio standard-vs-extended y las exenciones de demo se curan en `scripts/component-audit-map.mjs`
> (lo confirma Rafa). **No editar la tabla a mano** → `node scripts/component-audit.mjs --write`.
> Manifiesto máquina: `docs/_component-status.json`.
>
> **¿Y qué props acepta cada uno?** El CONTRATO completo —cada miembro público con su tipo, su
> valor por defecto, su descripción, y **de quién es**: `nativo` si PrimeNG la documenta con ese
> nombre, `nuestro` si la añadimos nosotros— vive en
> `projects/sc-docs/public/components/_component-api.json`, generado por el mismo comando y
> cruzado contra la API de la versión de PrimeNG **instalada**. Lleva también las props nativas
> que NO exponemos (`ocultas`), que es la lista con la que se decide si un wrapper se queda corto.
> Es lo que hay que consultar antes de escribir un `<sc-*>`: la respuesta es exacta y no se
> desfasa, porque `audit:components` la regenera y compara byte a byte.
>
> **¿Dónde se usa cada componente?** La galería **Uso real** en `sc-docs` (ruta `/uso`) muestra las
> pantallas REALES del Supervisor donde aparece cada componente — capturas del DOM renderizado,
> auto-generadas por `npm run usage:capture` (no se desfasan). Manifiesto:
> `projects/sc-docs/public/usage/_usage-status.json`.
>
> **Leyenda:** *CUSTOM* = pieza propia, cero PrimeNG · *STANDARD* = wrapper passthrough sobre PrimeNG ·
> *EXTENDED* = wrapper con API propia (CVA, inputs, comportamiento) · *Anidados* = otros `sc-*` que
> compone (sin contar `sc-icon`) · *Usos en Supervisor* = adopción en la app real.

## Clasificación (auto-generada)

<!-- @audit:components — TABLA GENERADA por `node scripts/component-audit.mjs --write`. NO editar a mano. -->
**59 componentes** · 25 custom · 8 standard · 26 extended · 47 usados en Supervisor · estado (DD-190): 32 ready, 26 experimental, 1 deprecated.

| Componente | Tipo | Estado | PrimeNG base | API propia | Anidados | Demo | Usos en Supervisor |
|---|---|---|---|---|---|---|---|
| `sc-avatar` | EXTENDED | ready | primeng/avatar, primeng/overlaybadge | 12 inputs | — | ✓ | 3 |
| `sc-avatargroup` | STANDARD | experimental (sin demo) | primeng/avatargroup | 0 inputs | — | — | — |
| `sc-badge` | STANDARD | ready | primeng/badge | 3 inputs | — | ✓ | 6 |
| `sc-breadcrumb` | EXTENDED | ready | primeng/breadcrumb | 4 inputs | — | ✓ | 1 |
| `sc-bulk-action-bar` | CUSTOM | experimental (sin maestro en el Kit) | — | 1 inputs | — | ✓ | 2 |
| `sc-bulk-edit-menu` | CUSTOM | experimental (sin maestro en el Kit) | — | 2 inputs | sc-select sc-button | ✓ | 3 |
| `sc-bulk-transcription-modal` | CUSTOM | experimental (sin maestro en el Kit) | — | 16 inputs | sc-button sc-toggleswitch | ✓ | — |
| `sc-button` | EXTENDED | ready | primeng/button | 18 inputs | — | ✓ | 187 |
| `sc-card` | STANDARD | ready | primeng/card | 3 inputs | — | ✓ | — |
| `sc-checkbox` | CUSTOM | ready | — | 6 inputs | — | ✓ | 41 |
| `sc-chip` | EXTENDED | ready | primeng/chip | 9 inputs | — | ✓ | 6 |
| `sc-color-dot-picker` | CUSTOM | experimental (sin maestro en el Kit) | — | 1 inputs | — | ✓ | 3 |
| `sc-column-selector` | STANDARD | experimental (sin maestro en el Kit) | primeng/popover | 1 inputs | — | ✓ | — |
| `sc-command-palette` | CUSTOM | experimental (sin maestro en el Kit) | — | 0 inputs | — | ✓ | 4 |
| `sc-confirmdialog` | STANDARD | ready | primeng/confirmdialog | 0 inputs | — | ✓ | 1 |
| `sc-datatable` | EXTENDED | ready | primeng/table | 34 inputs | — | ✓ | 15 |
| `sc-datepicker` | EXTENDED | ready | primeng/datepicker | 24 inputs | sc-field-label sc-button sc-field-msg | ✓ | 1 |
| `sc-delete-entity-dialog` | CUSTOM | experimental (sin maestro en el Kit) | — | 2 inputs | sc-dialog sc-button | ✓ | 12 |
| `sc-dialog` | EXTENDED | ready | primeng/dialog | 14 inputs | — | ✓ | 22 |
| `sc-divider` | STANDARD | ready | primeng/divider | 3 inputs | — | ✓ | 31 |
| `sc-drawer` | EXTENDED | ready | primeng/drawer | 11 inputs | — | ✓ | 3 |
| `sc-empty-state` | CUSTOM | experimental (sin maestro en el Kit) | — | 4 inputs | sc-button | ✓ | 20 |
| `div[scFactRow]` | CUSTOM | experimental (sin maestro en el Kit) | — | 2 inputs | — | ✓ | — |
| `sc-field-label` | CUSTOM | experimental (sin maestro en el Kit ni demo) | — | 3 inputs | — | — | — |
| `sc-field-msg` | CUSTOM | experimental (sin maestro en el Kit ni demo) | — | 2 inputs | — | — | — |
| `sc-fileupload` | EXTENDED | ready | primeng/fileupload | 17 inputs | — | ✓ | 2 |
| `sc-form-danger-zone` | CUSTOM | experimental (sin maestro en el Kit) | — | 3 inputs | sc-button | ✓ | — |
| `sc-form-section-nav` | CUSTOM | experimental (sin maestro en el Kit) | — | 7 inputs | — | ✓ | 6 |
| `sc-gauge` | CUSTOM | experimental (sin maestro en el Kit) | — | 9 inputs | — | ✓ | 1 |
| `sc-group-popover` | STANDARD | experimental (sin maestro en el Kit) | primeng/popover | 1 inputs | — | ✓ | 5 |
| `sc-icon-tile` | CUSTOM | experimental (sin maestro en el Kit) | — | 3 inputs | — | ✓ | 2 |
| `sc-impact-preview-dialog` | CUSTOM | experimental (sin maestro en el Kit) | — | 3 inputs | sc-dialog sc-button | ✓ | 3 |
| `sc-inline-rename-cell` | CUSTOM | experimental (sin maestro en el Kit) | — | 2 inputs | — | ✓ | 4 |
| `sc-inputgroup` | STANDARD | ready | primeng/inputgroup | 2 inputs | — | ✓ | 1 |
| `sc-inputnumber` | EXTENDED | ready | primeng/inputtext | 17 inputs | sc-field-label sc-field-msg | ✓ | 11 |
| `sc-inputtext` | EXTENDED | ready | primeng/inputtext | 20 inputs | sc-field-label sc-field-msg | ✓ | 43 |
| `sc-keyboard-shortcuts` | CUSTOM | experimental (sin maestro en el Kit) | — | 1 inputs | — | ✓ | 2 |
| `sc-message` | EXTENDED | ready | primeng/message | 6 inputs | — | ✓ | 10 |
| `sc-multiselect` | EXTENDED | ready | primeng/multiselect | 34 inputs | sc-field-label sc-field-msg | ✓ | 15 |
| `sc-option-cards` | CUSTOM | experimental (sin maestro en el Kit ni demo) | — | 4 inputs | — | — | 1 |
| `sc-panel` | EXTENDED | ready | primeng/panel | 6 inputs | — | ✓ | 1 |
| `sc-password` | EXTENDED | ready | primeng/config, primeng/inputpassword | 19 inputs | sc-field-label sc-field-msg | ✓ | 2 |
| `sc-permission-matrix` | CUSTOM | experimental (sin maestro en el Kit ni demo) | — | 5 inputs | sc-checkbox | — | 2 |
| `sc-photo-upload` | CUSTOM | experimental (sin maestro en el Kit) | — | 6 inputs | — | ✓ | 2 |
| `sc-progressbar` | EXTENDED | ready | primeng/progressbar | 4 inputs | — | ✓ | — |
| `sc-progressspinner` | EXTENDED | ready | primeng/progressspinner | 4 inputs | — | ✓ | — |
| `sc-radiobutton` | EXTENDED | ready | primeng/radiobutton | 7 inputs | — | ✓ | 2 |
| `sc-search` | EXTENDED | experimental (sin maestro en el Kit) | primeng/iconfield, primeng/inputicon, primeng/inputtext | 11 inputs | — | ✓ | 12 |
| `sc-section-card` | CUSTOM | ready | — | 9 inputs | — | ✓ | 35 |
| `sc-select` | EXTENDED | ready | primeng/select | 30 inputs | sc-field-label sc-field-msg | ✓ | 64 |
| `sc-selectbutton` | EXTENDED | ready | primeng/selectbutton | 14 inputs | — | ✓ | 14 |
| `sc-skeleton` | EXTENDED | ready | primeng/skeleton | 6 inputs | — | ✓ | — |
| `sc-slot` | CUSTOM | experimental (sin maestro en el Kit) | — | 4 inputs | — | ✓ | 11 |
| `sc-sticky-form-header` | CUSTOM | deprecated | — | 4 inputs | sc-button | ✓ | 2 |
| `sc-subsection` | CUSTOM | experimental (sin maestro en el Kit) | — | 5 inputs | — | ✓ | 9 |
| `sc-tag` | EXTENDED | ready | primeng/tag | 8 inputs | — | ✓ | 28 |
| `sc-textarea` | EXTENDED | ready | primeng/textarea | 14 inputs | — | ✓ | 7 |
| `sc-toast` | EXTENDED | ready | primeng/toast | 6 inputs | — | ✓ | — |
| `sc-toggleswitch` | EXTENDED | ready | primeng/toggleswitch | 8 inputs | — | ✓ | 33 |
<!-- @audit:components:end -->

## Gaps abiertos (el consumidor real los necesita; el DS aún no los cubre)

Quedan **2**, cada uno con su copia local en el Supervisor
(`projects/supervisor/src/app/shared/components/`) hasta que el DS los resuelva. Detalle +
disparador en [`ROADMAP.md`](ROADMAP.md):

| Gap | Local en el Supervisor | Qué falta en el DS |
|---|---|---|
| Avatar en px | `illustrated-avatar` | `sc-avatar` solo expone buckets, no px |
| Tag `xs` | `label-chip` | `sc-tag` no expone **ningún** input de tamaño |

### Cerrados (verificado 2026-08-13)

Esta sección decía "estos 4" y **dos ya estaban resueltos sin tacharse**, más un tercer apunte
que era falso por las dos puntas. Un gap cerrado que sigue listado no es ruido inocuo: manda a
mantener una copia local que ya no hace falta.

- ~~**Iconos Outlined**~~ — no queda ningún `IconComponent` local (`grep "class IconComponent"`
  en el supervisor → **0**). Resuelto por DD-31.
- ~~**Icono de confirm overridable**~~ — `sc-confirm.service.ts:31` declara
  `readonly icon?: string` y `:68` resuelve `req.icon ?? 'exclamation-triangle'`. Es exactamente
  el fix que el gap pedía, y el `confirm-host` local se borró.
- ~~*"`group-popover` types — el DS lo define pero no lo exporta"*~~ — falso por partida doble:
  la copia local se borró y `public-api.ts` **sí** lo exporta.
