# @smartcontact-hub/components

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![PrimeNG](https://img.shields.io/badge/PrimeNG-21-10B981)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-Proprietary-lightgrey)

Componentes Angular del Design System Smart Contact: el **preset modular** de
PrimeNG (capa 6 del sistema de tokens), la **frontera de setup**
`provideSmartContactUi()`, y los **wrappers `sc-*`** (botón, datatable, dialog,
formularios, command-palette…).

> ¿Buscas cómo **consumir** el DS en una app (autenticación, setup, los dos modos
> de consumo)? → [`../../docs/consumer-onboarding.md`](../../docs/consumer-onboarding.md).
> Este README es la referencia del **paquete**.

## Qué expone

- **`provideSmartContactUi(options?)`** — la única frontera de tema. Envuelve
  `providePrimeNG` + registra el preset `--sc-*`. Una línea en `app.config.ts` y
  la app queda tematizada con la marca.
- **`scPreset`** (export `default`) — el preset modular `definePreset(Aura, …)`,
  un archivo por componente, cada slot → `var(--sc-*)`. Exportado por si necesitas
  componerlo o inspeccionarlo.
- **~55 componentes `sc-*`** — wrappers de PrimeNG pegados a la marca (`sc-button`,
  `sc-datatable`, `sc-dialog`, `sc-select`, `sc-inputtext`, `sc-multiselect`…) +
  custom de dominio (`sc-empty-state`, `sc-page-header`, `sc-command-palette`,
  `sc-bulk-action-bar`, `sc-keyboard-shortcuts`…). Lista completa y estable en
  [`src/public-api.ts`](src/public-api.ts).
- **Servicios** — `ScToastService`, `sc-confirm.service` (`ScConfirmRequest`),
  `ScDynamicDialogService`, `ScCommandPaletteService`, `ScKeyboardShortcutsService`,
  `ScClipboardService`.
- **Tipos** — `button.types`, `badge.types`, `label.types`, `datatable.types`,
  `theme-component.types`.

## Setup (en una app consumidora)

`app.config.ts` — una sola frontera de tema:

```ts
import { provideSmartContactUi } from '@smartcontact-hub/components';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSmartContactUi(), // envuelve providePrimeNG + el preset --sc-*
    // …router, animations, http, ngx-translate…
  ],
};
```

`styles.scss` — los tokens + iconos viven en los paquetes hermanos:

```scss
@import '@smartcontact-hub/styles/styles/index.css';
@import '@smartcontact-hub/icons/styles/index.css';
```

Dark mode: añade la clase `.sc-dark` a un ancestro (selector por defecto del preset).

## Usar

Componentes standalone — se importan por nombre:

```ts
import { ScDatatableComponent, ScInputTextComponent } from '@smartcontact-hub/components';
```

```html
<sc-inputtext [(value)]="name" fluid></sc-inputtext>
```

> Varios componentes reciben **claves i18n** (`titleKey`, `bodyKey`…) que resuelve
> `@ngx-translate`, no texto directo. Registra tu diccionario o las claves se
> renderizan crudas. Detalle y resto de gotchas → [`../../docs/consumer-onboarding.md`](../../docs/consumer-onboarding.md#5-gotchas-descubiertos-dogfoodeando-el-supervisor).

## Peer dependencies

Angular `^21`, `primeng ^21`, `@primeuix/themes ^2`, `@ngx-translate/core ^17`,
`rxjs ^7.8`, y los hermanos `@smartcontact-hub/styles` + `@smartcontact-hub/icons`
(**misma versión**, los tres en lockstep).

## Build

Desde la raíz del workspace:

```bash
npm run build:components    # → dist/ui-smartcontact
npm run export:components    # tarball npm en dist/archives/
```

## El preset (capa 6) — dónde vive el bridge a PrimeNG

El puente PrimeNG **no es un CSS**: vive aquí como preset modular en
[`src/lib/theme/sc-preset/`](src/lib/theme/sc-preset) (un archivo por componente +
la base compartida). Cada slot resuelve a `var(--sc-*)`, así que los componentes
PrimeNG consumen la marca de Smart Contact y la fuente de verdad sigue en las 7
capas de [`@smartcontact-hub/styles`](../design-tokens/README.md). Este paquete
**consume** esas capas, no las redefine.

## Referencia viva

- **Catálogo** de componentes renderizados → la app `sc-demo`
  ([`../sc-demo/README.md`](../sc-demo/README.md)).
- **Consumo canónico real** → la app `supervisor`
  ([`../supervisor/README.md`](../supervisor/README.md)), construida solo con `sc-*`.
- **Convenciones** (naming wrapper/custom, migration-safety) → [`../../AGENTS.md`](../../AGENTS.md).
