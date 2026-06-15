# Consumir `@smartcontact-hub/*` en una app

Guía para que una app Angular consuma el Design System publicado en GitHub Packages
(privado, org `smartcontact-hub`). Validado por `projects/supervisor` (la app real, ya en
el monorepo), que consume el DS **por nombre** igual que una app externa.

> **Nota (DD-17, 2026-06-15)** · Los paquetes están **APARCADOS**: hoy el único consumidor
> (el Supervisor) vive en este mismo repo y resuelve `@smartcontact-hub/*` **local** por
> `tsconfig paths` → `./dist/*` (instantáneo, sin publicar). Esta guía aplica si vuelve a
> entrar un consumidor **externo** que instale los paquetes publicados.

## 1. Autenticación (GitHub Packages privado)

Crea un `.npmrc` en la raíz de tu app (gitignóralo) con un token de scope `read:packages`:

```
@smartcontact-hub:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Exporta `GITHUB_TOKEN` en tu entorno / CI (nunca lo commitees).

## 2. Instalar

```
npm install @smartcontact-hub/styles @smartcontact-hub/icons @smartcontact-hub/components
```

Los tres se versionan en **lockstep** — instala la misma versión de los tres. Las
versiones de GitHub Packages son inmutables; para actualizar: `npm update` /
`npm install @smartcontact-hub/components@<nueva>`.

Peer deps (deben existir en tu app): Angular ^21, `primeng` ^21, `@primeuix/themes` ^2,
`@ngx-translate/core` ^17.

## 3. Setup (una vez)

**`app.config.ts`** — una sola frontera de tema:

```ts
import { provideSmartContactUi } from '@smartcontact-hub/components';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSmartContactUi(),   // envuelve providePrimeNG + el preset --sc-*
    // …router, animations, ngx-translate…
  ],
};
```

**`styles.scss`** — el CSS de tokens + iconos:

```scss
@import '@smartcontact-hub/styles/styles/index.css';
@import '@smartcontact-hub/icons/styles/index.css';
```

Dark mode: añade la clase `.sc-dark` a un ancestro (el selector por defecto del preset).

## 4. Usar

Componentes standalone — impórtalos por nombre y úsalos:

```ts
import { ScDatatableComponent, ScInputTextComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
```

```html
<sc-icon name="group"></sc-icon>
<sc-inputtext [(value)]="name" fluid></sc-inputtext>
```

## 5. Gotchas (descubiertos dogfoodeando el Supervisor)

- **Componentes i18n-key-driven.** Varios (`sc-page-header`, `sc-empty-state`,
  `sc-section-card`/`sc-subsection`/`sc-slot`…) reciben **claves** (`titleKey`,
  `bodyKey`), no texto: las resuelve `@ngx-translate`. Registra tu diccionario, o las
  claves se renderizan tal cual (fallback de ngx-translate). Los componentes con copy
  fijo propio (inline-rename, bulk-action-bar) ya traen su diccionario.
- **Inputs booleanos: atributo escueto OK** (desde 0.2.0). Los `input<boolean>()` llevan
  `transform: booleanAttribute`, así que `<sc-inputtext fluid>` funciona (como
  `<input disabled>`). `[fluid]="true"` también vale.
- **`--sc-*` es el contrato.** Tematiza con los tokens `--sc-*` (públicos). Nunca uses
  `--p-*` (viven solo dentro del preset).

## 6. Referencia viva

`projects/supervisor` es el ejemplo canónico de consumo (la app real construida
solo con `sc-*` + tokens). El catálogo completo está en el demo (`projects/sc-demo`).
