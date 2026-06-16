# supervisor — app real (consumo canónico del DS)

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![PrimeNG](https://img.shields.io/badge/PrimeNG-21-10B981)
![App](https://img.shields.io/badge/app-privada%20(no%20se%20publica)-lightgrey)

La app de **Supervisión** de Smart Contact, construida **solo** con el DS:
componentes `sc-*` + tokens `--sc-*`, cero PrimeNG a pelo. Es el **dogfooding** del
sistema: consume `@smartcontact-hub/*` por nombre igual que una app externa, y por
eso es la **referencia canónica de consumo** (los gotchas de
[`../../docs/consumer-onboarding.md`](../../docs/consumer-onboarding.md) salieron de aquí).

No se publica. Vive en el monorepo y resuelve los paquetes en **local** por
`tsconfig paths` → `dist/` (instantáneo, sin publicar — ver
[DD-17](../../docs/DECISIONS.md)).

## Features

`supervision` · `admin` · `config` · `memory`.

## Setup del tema

Una sola frontera en [`src/app/app.config.ts`](src/app/app.config.ts):

```ts
provideSmartContactUi({
  ripple: true,
  theme: { prefix: 'p', darkModeSelector: '.sc-dark', cssLayer: { name: 'primeng', order: 'reset, primeng' } },
});
```

El orden de capas (`reset, primeng`) es **load-bearing** — ver el comentario en
el archivo.

## Correr

Desde la raíz del workspace:

```bash
npm run start:supervisor   # build del DS + ng serve
npm run build:supervisor   # build de producción
```

## Enlaces (Cloudflare Pages)

- **Producción:** https://sc-supervisor.pages.dev
- **Preview por rama:** https://design-tokens-sync.sc-supervisor.pages.dev

## Gaps mecánicos abiertos (lote W4)

3 componentes locales en [`src/app/shared/components/`](src/app/shared/components)
esperan que el DS cierre un gap para poder borrarse:

| Local | Espera en el DS |
|---|---|
| `illustrated-avatar` | `sc-avatar [size]` (px numérico) |
| `label-chip` | `sc-tag [size]="'xs'"` |
| `confirm-host` | `ScConfirmRequest { icon? }` |

Seguimiento en [`../../NEXT-SESSION.md`](../../NEXT-SESSION.md).
