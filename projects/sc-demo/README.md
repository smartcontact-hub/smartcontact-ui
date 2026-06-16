# sc-demo — showcase del Design System

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![PrimeNG](https://img.shields.io/badge/PrimeNG-21-10B981)
![App](https://img.shields.io/badge/app-privada%20(no%20se%20publica)-lightgrey)

App de referencia del DS Smart Contact: el **catálogo vivo**. No es un paquete (no
se publica) — es donde se ven las fundaciones (escala, color, tipografía) y cada
componente `sc-*` renderizado con la marca. También es el **smoke test** del tema:
la usa el e2e de Playwright.

## Qué hay

| Ruta | Contenido |
|---|---|
| `/foundations` | Escala, color, radios, sombras |
| `/foundations-type` | Tipografía |
| `/theme` | El tema aplicado (light / dark) |
| `/components` | Un page por componente del catálogo (`@smartcontact-hub/components`) |

## Cómo consume el DS

Igual que una app externa: arranca con `provideSmartContactUi()` y usa los `sc-*`
por nombre. Es la prueba de que el paquete funciona consumido "desde fuera".

## Correr

Desde la raíz del workspace:

```bash
npm start            # ng serve (build:icons + demo en local)
npm run build:demo   # build de producción → dist/sc-demo
```

## Enlaces (Cloudflare Pages)

- **Producción:** https://sc-demo.pages.dev
- **Preview por rama** (cambios de Figma antes de mergear):
  https://design-tokens-sync.sc-demo.pages.dev

> El loop Figma → preview está descrito en
> [`../../NEXT-SESSION.md`](../../NEXT-SESSION.md) y [`../../docs/guia-tokens.md`](../../docs/guia-tokens.md).
