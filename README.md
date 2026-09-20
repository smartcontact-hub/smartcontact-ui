# Smart Contact Design System

[![Versión](https://img.shields.io/badge/versi%C3%B3n-1.0.0-0B2C5C)](https://github.com/smartcontact-hub/smartcontact-ui/releases/latest)
![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![PrimeNG](https://img.shields.io/badge/PrimeNG-22-10B981)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Packages](https://img.shields.io/badge/packages-3-blue)
[![License](https://img.shields.io/badge/license-Proprietary-lightgrey)](LICENSE)

**Español** · [English](README.en.md)

El design system de Smart Contact: **56 componentes `sc-*`** sobre Angular y PrimeNG, con un
tema donde **cada valor es trazable al Kit de Figma y verificable por máquina**.

> 📖 **[Documentación viva: sc-doc.pages.dev](https://sc-doc.pages.dev)** · catálogo de
> componentes, fundamentos, patrones de pantalla y ejemplos ejecutables.
>
> ⚖️ Repositorio **público pero no libre**. Se puede leer, enlazar, citar y forkear para
> evaluarlo; cualquier otro uso necesita permiso por escrito ([LICENSE](LICENSE)).

## Instalar
<!--sc:sec=install-->

Cada versión es una [release de GitHub](https://github.com/smartcontact-hub/smartcontact-ui/releases/latest)
con los tres paquetes adjuntos como tarball. No hace falta clonar ni compilar:

```bash
npm i https://github.com/smartcontact-hub/smartcontact-ui/releases/download/v1.0.0/smartcontact-hub-styles-1.0.0.tgz
```

Si ya tienes acceso a la org `smartcontact-hub`, los mismos tres paquetes están en **GitHub
Packages** (privados): los publica [`publish-packages.yml`](.github/workflows/publish-packages.yml)
al publicarse la release, desde el commit del tag. Dos caminos según quién seas: el **tarball**
desde fuera, el **registro** desde dentro.

Qué cambia en cada versión: [CHANGELOG.md](CHANGELOG.md). Cómo integrarlo en una app que ya
existe: [docs/consumer-onboarding.md](docs/consumer-onboarding.md).

## Los paquetes
<!--sc:sec=packages-->

| Paquete | Proyecto | Contenido |
| ------- | -------- | --------- |
| `@smartcontact-hub/styles` | [`projects/design-tokens`](projects/design-tokens/README.md) | Tokens `--sc-*` (7 capas, escala 14-base en rem), reset y globals |
| `@smartcontact-hub/icons` | [`projects/ui-smartcontact-icons`](projects/ui-smartcontact-icons/README.md) | `<sc-icon>` y los Material Symbols generados |
| `@smartcontact-hub/components` | [`projects/ui-smartcontact`](projects/ui-smartcontact/README.md) | `provideSmartContactUi()`, el preset modular y los componentes `sc-*` ([inventario](docs/inventory.md)) |

## Las apps del repo
<!--sc:sec=apps-->

Cinco, las cinco en producción en Cloudflare Pages.

| App | Qué es | En producción |
| --- | ------ | ------------- |
| [`sc-docs`](projects/sc-docs/README.md) | Showcase: fundamentos, catálogo, uso real y Lab | [sc-doc.pages.dev](https://sc-doc.pages.dev) |
| [`supervisor`](projects/supervisor/README.md) | **La app real.** Consumo canónico: solo `sc-*` y tokens | [sc-supervisor.pages.dev](https://sc-supervisor.pages.dev) |
| [`agent`](projects/agent/README.md) | Réplica del dashboard del agente | [sc-agent.pages.dev](https://sc-agent.pages.dev) |
| [`agent-mini`](projects/agent-mini/README.md) | Réplica del Comunicador suelto | [agent-mini.pages.dev](https://agent-mini.pages.dev) |
| [`cuscare`](projects/cuscare/README.md) | Réplica de la herramienta de tickets | [sc-cuscare.pages.dev](https://sc-cuscare.pages.dev) |

Las apps de este repo **importan el DS desde `dist/`**, por rutas de `tsconfig`, no como
paquete de npm. Así tocas un token y lo ves al instante en las cinco, sin publicar nada. El
porqué, en [DD-17](docs/DECISIONS.md); por qué publicar por release no lo reabre, en DD-58.

> ⚠️ **Las réplicas (`agent`, `agent-mini`, `cuscare`) no se tokenizan, y es a propósito**
> (DD-35, DD-37). Una réplica tiene que parecerse al **original**, no a nuestro DS: sus
> valores se extraen del sitio real y `tokens:guard` las exime. **No las "arregles" para que
> usen `--sc-*`.**

## Construir
<!--sc:sec=build-->

```bash
npm ci
npm run build          # design-tokens + icons + components a dist/
npm start              # sc-docs en local (ng serve)
npm run build:docs     # docs de producción
npm run export:all     # tarballs npm en dist/archives/
```

## Verificar
<!--sc:sec=verify-->

```bash
npm run verify         # los 41 checks estáticos encadenados (~40s)
npm run e2e            # smoke en navegador (Playwright)
npm run preflight      # gates + builds AOT + baselines visuales (~5 min), antes de pushear
```

La cadena `verify` es la composición canónica, y este README es su fuente única (lo exige el
CHECK B de `docs:coherence`). **El porqué de cada uno vive en
[docs/guardarrailes.md](docs/guardarrailes.md)**, junto con `preflight`, las tres redes de e2e
y los otros workflows.

| Familia | Comandos | Qué garantiza |
| ------- | -------- | ------------- |
| Tokens | `tokens:gen` · `tokens:gen-component` · `tokens:gen-color` · `tokens:gen-cmp-color` · `tokens:gen-effects` · `tokens:parity` · `tokens:guard` · `tokens:export-clean` · `tokens:cmp-rewire` · `tokens:effects-rewire` · `tokens:type-parity` | Cada valor del tema reproduce el export del Kit, y `--p-*` no sale del preset |
| Pantalla | `audit:theme-scale` · `audit:border-surfaces` · `audit:screen-hygiene` · `audit:page-anatomy` · `audit:screen-vocabulary` · `audit:text-styles` · `audit:titulo-contenido` · `audit:base-href` | Las pantallas miden por token, con un solo vocabulario y sin saltos de layout |
| Componentes | `audit:components` · `audit:api-era` · `audit:datatables` · `audit:datatable-slots` · `audit:primeng-coupling` · `audit:doc-snippets` · `test:components` | La API pública, el acoplamiento a PrimeNG y lo que la doc enseña cuadran con el código |
| Contenido y docs | `i18n:check` · `novedades:check` · `usage:check` · `variables:check` · `audit:seed-pii` · `docs:guard` · `docs:coherence` · `docs:readme-parity` | Multiidioma de verdad, cero datos de contacto reales en demos, y ninguna doc que mienta |
| Repo | `proto:check` · `explorations:check` · `guard:backticks` · `test:unit` · `typecheck` · `lint` · `build` | Versiones congeladas localizables, tipos limpios y las libs construyendo |

El mismo gate corre en CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)), que son
**nueve pasos**: `verify` por sí solo no construye las apps ni corre los e2e.

## De Figma al código
<!--sc:sec=figma-->

1. El Kit se re-exporta en DTCG y se versiona en `projects/design-tokens/scripts/kit-export-dtcg.json`.
2. `npm run tokens:import` regenera las zonas `@sc-gen:*`. La cascada (aliases, semántica, preset) propaga sola.
3. `npm run verify` confirma la paridad. Si algo diverge, o se corrige o se documenta como divergencia consciente en [docs/customs-catalog.md](docs/customs-catalog.md). Nunca se deja en silencio.

## Documentación
<!--sc:sec=docs-->

| Documento | Para qué |
| --------- | -------- |
| [docs/DOCS-INDEX.md](docs/DOCS-INDEX.md) | **Índice maestro**: qué documento manda en cada tema |
| [docs/guardarrailes.md](docs/guardarrailes.md) | Qué garantiza cada gate, y `preflight` a fondo |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Decisiones de arquitectura (DD-\*), con las alternativas descartadas |
| [docs/guia-tokens.md](docs/guia-tokens.md) | Guía del sistema de tokens, para diseño |
| [docs/customs-catalog.md](docs/customs-catalog.md) | Divergencias conscientes con Figma |
| [docs/migration-safety.md](docs/migration-safety.md) | Patrones de cambio seguro sobre PrimeNG |
| [AGENTS.md](AGENTS.md) | Convenciones de contribución y del pipeline de agente |

## Licencia
<!--sc:sec=license-->

Repositorio **público pero no libre**: [LICENSE](LICENSE) reserva todos los derechos a Smart
Contact, en la misma línea que los tres paquetes, que se publican como `UNLICENSED` y con
acceso restringido. Se puede leer, enlazar, citar y forkear para evaluarlo o proponer cambios;
cualquier otro uso necesita permiso por escrito. Las dependencias conservan su licencia (las
tipografías que viajan en los sitios publicados son OFL 1.1).

El aviso legal de los cinco sitios es una página del propio sc-docs:
[sc-doc.pages.dev/#/aviso-legal](https://sc-doc.pages.dev/#/aviso-legal).
