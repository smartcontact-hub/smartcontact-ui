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
| `@smartcontact-hub/components` | [`projects/ui-smartcontact`](projects/ui-smartcontact/README.md) | `provideSmartContactUi()` + preset modular (`theme/sc-preset`, cada slot → `var(--sc-*)`) + 49 wrappers/customs `sc-*` ([inventario](docs/inventory.md)) |
| `sc-demo` _(app privada)_ | [`projects/sc-demo`](projects/sc-demo/README.md) | Showcase: fundaciones + catálogo + smoke del tema |
| `supervisor` _(app privada)_ | [`projects/supervisor`](projects/supervisor/README.md) | App real: consumo canónico (solo `sc-*` + tokens) |

## Construir

```bash
npm ci
npm run build          # design-tokens + icons + components → dist/
npm run build:demo     # demo producción
npm start              # demo en local (ng serve)
npm run export:all     # tarballs npm en dist/archives/
```

## Verificar (guardarraíles)

```bash
npm run verify         # todos los checks estáticos (~40s)
npm run e2e            # smoke en navegador (Playwright)
npm run e2e:contrast   # carril rápido para cambios de COLOR (~80s)
```

> **Regla de la casa**: una comprobación que no está en una cadena automática no
> es una comprobación, es documentación — y la documentación que hay que
> recordar se pierde. Todo check nuevo entra en `verify` (o en un `e2e:*`), no
> como comando suelto. `e2e:contrast` es la excepción legítima: no añade
> comprobaciones, es un ATAJO a un subconjunto de las que ya corren en CI.

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
| Audit de componentes | `npm run audit:components` | La pokédex (`docs/inventory.md` + `_component-status.json`) está al día con el código: provenance/PrimeNG-base/API/anidados/demo/uso-en-Supervisor derivados; falla si la tabla se desfasa (cobertura demo se informa) | ✅ |
| i18n | `npm run i18n:check` | Paridad de **claves** entre los locales del Supervisor (`es` canónico ↔ `en`/`fr`/`pt`): ni claves sin traducir ni huérfanas, para que la UI no muestre la clave cruda. No juzga la calidad de la traducción (`scripts/i18n-check.mjs`) | ✅ |
| Tests unitarios | `npm run test:unit` | Suites de los generadores/scripts (`scripts/__tests__/*.test.mjs`) | ✅ |
| Docs | `npm run docs:guard` · `docs:coherence` | Todo `.md` mapeado en `DOCS-INDEX` + links resuelven · la doc cuadra con el repo (comandos/scripts existen, cadena `verify` documentada, sin tokens muertos) | ✅ |
| Tests unitarios del DS | `npm run test:components` | `TestBed` sobre vitest (Angular 21). Cubre los CASOS LÍMITE que la e2e no alcanza sin montar una página entera: `field` inexistente en `[visibleColumns]`, array vacío, `colspan` con columnas ocultas | ✅ |
| Acoplamiento a PrimeNG | `npm run audit:primeng-coupling` | Las clases `.p-*` que nuestro SCSS usa **no son API pública**: una subida de versión puede renombrarlas y las pantallas revierten sin que falle ningún test de comportamiento. Comprueba que las 41 siguen existiendo en `node_modules/primeng` y que el número no crece (trinquete, no meta: el objetivo es BAJARLO) | ✅ |
| Tablas del DS | `npm run audit:datatables` | Invariantes de toda página con `<sc-datatable>`: la piel `list-table`, columnas en `computed` (en un campo los `cellTemplate` se quedan en `undefined`), plantillas fuera del componente, `<th scope="row">` que el DS no sabe emitir, columna de acciones con nombre accesible, cabeceras que reaccionan al cambio de idioma, y que su ruta esté en el guardián de la gramática | ✅ |
| Tipos + lint | `npm run typecheck` · `npm run lint` | | ✅ |
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
- [docs/convergence-manifesto.md](docs/convergence-manifesto.md) — catálogo unión y plan de convergencia
- [docs/foundations-rationale.md](docs/foundations-rationale.md) — racional de las fundaciones
- [docs/component-port-plan.md](docs/component-port-plan.md) — plan del port de componentes (Mitad B)
- [docs/history/DECISIONS-LOG.md](docs/history/DECISIONS-LOG.md) — log de construcción (archivado)
- [AGENTS.md](AGENTS.md) — convenciones para el pipeline de agente
