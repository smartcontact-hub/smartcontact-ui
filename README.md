# Smart Contact UI — Design System

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![PrimeNG](https://img.shields.io/badge/PrimeNG-21-10B981)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Packages](https://img.shields.io/badge/packages-3-blue)
![License](https://img.shields.io/badge/license-Proprietary-lightgrey)

Design System de Smart Contact, consolidado en el monorepo (consumo LOCAL; publicación a GitHub Packages **aparcada** — ver AGENTS.md / DD-17). Lo que se diseña en
Figma (Smart Contact Prime UI Kit) se refleja directamente en el código y
**cada valor es trazable al export del Kit y verificable por máquina**.

## Paquetes

| Paquete | Proyecto | Contenido |
|---|---|---|
| `@smartcontact-hub/styles` | [`projects/design-tokens`](projects/design-tokens/README.md) | Tokens `--sc-*` (7 capas, escala 14-base en rem) + reset/globals |
| `@smartcontact-hub/icons` | [`projects/ui-smartcontact-icons`](projects/ui-smartcontact-icons/README.md) | `<sc-icon>` + Material Symbols generados |
| `@smartcontact-hub/components` | [`projects/ui-smartcontact`](projects/ui-smartcontact/README.md) | `provideSmartContactUi()` + preset modular (`theme/sc-preset`, cada slot → `var(--sc-*)`) + 50 wrappers/customs `sc-*` ([inventario](docs/inventory.md)) |

Y **cuatro apps** que consumen el DS en local (por tsconfig paths → `dist/`, así que un cambio de
token se ve al instante). Las cuatro están en producción en Cloudflare Pages:

| App | Proyecto | Qué es | En producción |
|---|---|---|---|
| `sc-docs` | [`projects/sc-docs`](projects/sc-docs/README.md) | Showcase: fundaciones + catálogo + uso real + Lab | [sc-doc.pages.dev](https://sc-doc.pages.dev) |
| `supervisor` | [`projects/supervisor`](projects/supervisor/README.md) | **La app real**: consumo canónico (solo `sc-*` + tokens) | [sc-supervisor.pages.dev](https://sc-supervisor.pages.dev) |
| `agent` | [`projects/agent`](projects/agent/README.md) | **Réplica** del dashboard del agente | [sc-agent.pages.dev](https://sc-agent.pages.dev) |
| `cuscare` | [`projects/cuscare`](projects/cuscare/README.md) | **Réplica** de la herramienta de tickets | [sc-cuscare.pages.dev](https://sc-cuscare.pages.dev) |

> ⚠️ Las dos **réplicas** (`agent`, `cuscare`) **NO se tokenizan a propósito** — DD-35 y DD-37.
> Una réplica debe parecerse al ORIGINAL, no a nuestro DS: sus valores se extraen del sitio real
> y `token-guard` las exime de las reglas de tipografía. Su gate no es la paridad de tokens, es
> la fidelidad medida contra el sitio original. `cuscare` tiene suite propia
> (`npm run e2e:cuscare`, con clics reales, en CI); `agent` aún no.
> No las "arregles" para que usen `--sc-*`.

## Construir

```bash
npm ci
npm run build          # design-tokens + icons + components → dist/
npm run build:docs     # docs producción
npm start              # docs en local (ng serve)
npm run export:all     # tarballs npm en dist/archives/
```

## Verificar (guardarraíles)

```bash
npm run verify         # todos los checks estáticos (~40s)
npm run e2e            # smoke en navegador (Playwright)
npm run e2e:contrast   # carril rápido para cambios de COLOR (~80s)
npm run preflight      # TODO lo que corre el CI (los 8 pasos), antes de pushear
```

> **Regla de la casa**: una comprobación que no está en una cadena automática no
> es una comprobación, es documentación — y la documentación que hay que
> recordar se pierde. Todo check nuevo entra en `verify` (o en un `e2e:*`), no
> como comando suelto. `e2e:contrast` es la excepción legítima: no añade
> comprobaciones, es un ATAJO a un subconjunto de las que ya corren en CI.

> **Antes de pushear, `npm run preflight`**: encadena los OCHO pasos de `ci.yml`
> (verify + build de docs + AOT de supervisor/agent/cuscare + los e2e) en un solo
> comando, para que "verde en local" signifique "verde en CI". Nace de que `verify`
> por sí solo NO corre el `e2e`: en s29 un cambio de `line-height` pasó los 26 gates y
> aun así tumbó el CI (movió un baseline de `component-structure`). Un test
> (`scripts/ci-preflight-parity.mjs`, dentro de `test:unit`) se pone rojo si `preflight`
> y `ci.yml` se desincronizan, así que no se pudre cuando alguien añade un paso al CI.
> El smoke completo se corre ENTERO, solo que como `CI=1 npm run e2e`: esa variable —la
> que el runner ya tiene puesta— hace no-op los `screenshotBaseline()`, que son los que
> fallan siempre en macOS. Antes se sustituía por `e2e:structure`, o sea UN test en vez
> de 68, y eso dejaba fuera del pre-push los 56 de `components.spec.ts`.

> **Si tocas un token de color, `e2e:contrast` es el bucle corto**: reconstruye
> tokens y corre solo contraste (los dos temas) + anillo de foco, sin la suite
> entera. Lleva dentro un **guardián de build rancio**: si el dev server está
> sirviendo un bundle anterior a tu edición —pasa tras un `verify`, que
> reescribe `dist/` por debajo del `ng serve`— la prueba lo dice en vez de
> devolverte números viejos. Ver `asegurarBuildFresco` en `e2e/supervisor/helpers.ts`.

| Guardarraíl | Comando | Qué garantiza | Estado |
|---|---|---|---|
| Generadores | `npm run tokens:gen` · `tokens:gen-component` · `tokens:gen-color` · `tokens:gen-cmp-color` · `tokens:gen-effects` | Los bloques `@sc-gen` (primitivos v/14 en rem, sizing, color semántico, **color de componente** y **sombras** `aura/effects`) reproducen el export del Kit | ✅ |
| Paridad | `npm run tokens:parity` | Escala/radios completos + 53 valores de sizing del preset + colores de marca 1:1 con el export + **completitud** (§8: cada hoja de `semantic/common`·`app`·`effects` clasificada en `coverage-map.mjs` + rampa `primary`=`blue` 1:1; una hoja nueva del Kit sin clasificar → rojo) — divergencias conscientes listadas | ✅ |
| Guard | `npm run tokens:guard` | `--p-*` solo en el preset · componentes con alias `--sc-spacing-*` · sin escala 8-point · campos PrimeNG solo vía wrapper · font-size solo por token | ✅ |
| Export limpio | `npm run tokens:export-clean` | En LOCAL, `kit-export-dtcg.json` coincide con HEAD (caza el export sucio que deja un `preview:live` zombie; se salta en CI, donde el sync lo aplica sobre main a propósito) | ✅ |
| Repunte de color | `npm run tokens:cmp-rewire` | Cada `colorScheme` repuntado a `var(--sc-cmp-*)` es value-equal vs HEAD (no-op demostrable) y no deja hex hardcodeado para un slot que sí generamos | ✅ |
| Repunte de sombras | `npm run tokens:effects-rewire` | Ningún preset deja un `shadow:` con hex hardcodeado para un slot que generamos (`@sc-gen:effects`) → la sombra se lee de `var(--sc-cmp-*-shadow)` y fluye del Kit | ✅ |
| Tipografía | `npm run tokens:type-parity` | **Paridad** de tipografía: cada `font-size` Y `line-height` del Kit tiene su `--sc-font-size-*`/`--sc-line-height-*` 1:1 por valor (un cambio de tipografía de Figma no se escapa). El `font-size` literal lo bloquea `tokens:guard` | ✅ |
| Escala del preset | `npm run audit:theme-scale` | Cero `px` en el preset · sin `css:` por-componente · sin hack de `html{font-size}` | ✅ |
| Bordes vs lienzo | `npm run audit:border-surfaces` | Ningún `--sc-border-*` resuelve, **en su tema**, a menos de 1.02:1 de `--sc-bg-surface` o `--sc-bg-default`. Nace de `--sc-border-subtle`, que valía `slate-900` en oscuro (= la superficie que bordeaba, 1.00:1) y dejó 56 filos sin pintar durante meses sin que nada lo cazara: `theme-contrast` mide texto sobre fondo, no bordes contra su lienzo. Las exenciones son **condicionales** — valen solo mientras el token no lo lea nadie, y el guardián comprueba esa condición (`scripts/check-border-surfaces.mjs`) | ✅ |
| Audit de componentes | `npm run audit:components` | La pokédex (`docs/inventory.md` + `_component-status.json`) está al día con el código: provenance/PrimeNG-base/API/anidados/demo/uso-en-Supervisor derivados; falla si la tabla se desfasa (cobertura demo se informa) | ✅ |
| Era de la API | `npm run audit:api-era` | La era objetivo es **señales** (DD-38): nada nuevo puede estrenar `@Input()/@Output()`. Trinquete de 16 componentes de la librería que aún los usan (`LEGACY_PENDIENTES`, `scripts/audit-api-era.mjs`): la lista solo mengua, así que también se pone rojo si dejas dentro uno ya migrado, o si un fichero mezcla las dos eras | ✅ |
| i18n | `npm run i18n:check` | Paridad de **claves** entre los locales del Supervisor (`es` canónico ↔ `en`/`fr`/`pt`): ni claves sin traducir ni huérfanas, para que la UI no muestre la clave cruda. No juzga la calidad de la traducción (`scripts/i18n-check.mjs`) | ✅ |
| Tests unitarios | `npm run test:unit` | Suites de los generadores/scripts (`scripts/__tests__/*.test.mjs`) | ✅ |
| Docs | `npm run docs:guard` · `docs:coherence` | Todo `.md` mapeado en `DOCS-INDEX` + links resuelven · la doc cuadra con el repo (comandos/scripts existen, cadena `verify` documentada, sin tokens muertos) | ✅ |
| Tests unitarios del DS | `npm run test:components` | `TestBed` sobre vitest (Angular 21). Cubre los CASOS LÍMITE que la e2e no alcanza sin montar una página entera: `field` inexistente en `[visibleColumns]`, array vacío, `colspan` con columnas ocultas | ✅ |
| Acoplamiento a PrimeNG | `npm run audit:primeng-coupling` | Las clases `.p-*` que nuestro SCSS usa **no son API pública**: una subida de versión puede renombrarlas y las pantallas revierten sin que falle ningún test de comportamiento. Comprueba que las 36 siguen existiendo en `node_modules/primeng` y que el número no crece (trinquete, no meta: el objetivo es BAJARLO) | ✅ |
| Tablas del DS | `npm run audit:datatables` | Invariantes de toda página con `<sc-datatable>`: la piel `list-table`, columnas en `computed` (en un campo los `cellTemplate` se quedan en `undefined`), plantillas fuera del componente, `<th scope="row">` que el DS no sabe emitir, columna de acciones con nombre accesible, cabeceras que reaccionan al cambio de idioma, y que su ruta esté en el guardián de la gramática | ✅ |
| Tipos + lint | `npm run typecheck` · `npm run lint` | `tsc` sobre las 2 libs, las 4 apps **y el arnés de la raíz** (`tsconfig.harness.json`: 33 ficheros que hasta s32 no miraba NADIE — los 4 `playwright*.config.ts`, `eslint.config.js` y los 28 de `e2e/`; los `tsconfig` de apps y libs arrancan todos en `src/`). Por ese hueco pasó un `reducedMotion` suelto en `use` en vez de dentro de `contextOptions`: error de tipo real, `verify` entero en verde y la suite de CusCare inestable bajo carga. `code-connect/` queda fuera a propósito (son plantillas del CLI de Code Connect, no código; su gate es `figma:connect:parse`) | ✅ |
| e2e smoke | `npm run e2e` | La demo levanta y el botón/form field renderizan la métrica del Kit medida en navegador (10.5/7, radio 6, font 14) | ✅ |

El mismo gate corre en CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Flujo Figma → código

1. El Kit se re-exporta (DTCG) → se versiona en
   `projects/design-tokens/scripts/kit-export-dtcg.json`.
2. `npm run tokens:import` regenera las zonas `@sc-gen:*` de
   `01-primitive.css` (escala/radios/paleta complementaria). La cascada
   (aliases → semántica → preset) propaga sola.
3. `npm run verify` confirma paridad. Si algo diverge, o se corrige o se
   documenta como divergencia consciente — nunca se deja en silencio.

## Documentación

- [docs/DECISIONS.md](docs/DECISIONS.md) — decisiones de arquitectura (DD-*)
- [docs/guia-tokens.md](docs/guia-tokens.md) — guía del sistema de tokens (diseño)
- [projects/design-tokens/README.md](projects/design-tokens/README.md) — referencia técnica de tokens
- [docs/customs-catalog.md](docs/customs-catalog.md) — divergencias conscientes vs Figma
- [docs/migration-safety.md](docs/migration-safety.md) — patrones de cambio seguro
- [AGENTS.md](AGENTS.md) — convenciones para el pipeline de agente
