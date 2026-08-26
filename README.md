# Smart Contact Design System

![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![PrimeNG](https://img.shields.io/badge/PrimeNG-22-10B981)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Packages](https://img.shields.io/badge/packages-3-blue)
![License](https://img.shields.io/badge/license-Proprietary-lightgrey)

Lo que se diseña en Figma (el archivo **Smart Contact Design System**) se refleja en el
código, y **cada valor es trazable al export del Kit y verificable por máquina**.

### Cómo se consume el DS hoy

Las apps de este repo **importan el DS directamente desde `dist/`**, por rutas de
`tsconfig`. No se instala como paquete de npm: no hay `npm install @smartcontact-hub/...`
en ningún sitio.

En la práctica eso significa que **editas un token y lo ves al instante** en las cuatro
apps, sin publicar nada ni subir una versión.

Los tres paquetes se pueden empaquetar (`npm run export:all` deja los tarballs en
`dist/archives/`), pero **publicarlos en GitHub Packages está aparcado a propósito**: con
un solo repo y un consumidor, el ciclo publicar-versionar-instalar cuesta más de lo que
aporta. La decisión y su porqué están en [DD-17](docs/DECISIONS.md).

## Paquetes

| Paquete                        | Proyecto                                                                     | Contenido                                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@smartcontact-hub/styles`     | [`projects/design-tokens`](projects/design-tokens/README.md)                 | Tokens `--sc-*` (7 capas, escala 14-base en rem) más reset y globals                                                                                  |
| `@smartcontact-hub/icons`      | [`projects/ui-smartcontact-icons`](projects/ui-smartcontact-icons/README.md) | `<sc-icon>` y los Material Symbols generados                                                                                                          |
| `@smartcontact-hub/components` | [`projects/ui-smartcontact`](projects/ui-smartcontact/README.md)             | `provideSmartContactUi()`, el preset modular (`theme/sc-preset`, cada slot a `var(--sc-*)`) y 50 componentes `sc-*` ([inventario](docs/inventory.md)) |

Y **cuatro apps** que lo consumen, las cuatro en producción en Cloudflare Pages:

| App          | Proyecto                                               | Qué es                                                  | En producción                                              |
| ------------ | ------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------- |
| `sc-docs`    | [`projects/sc-docs`](projects/sc-docs/README.md)       | Showcase: fundaciones, catálogo, uso real y Lab         | [sc-doc.pages.dev](https://sc-doc.pages.dev)               |
| `supervisor` | [`projects/supervisor`](projects/supervisor/README.md) | **La app real**. Consumo canónico: solo `sc-*` y tokens | [sc-supervisor.pages.dev](https://sc-supervisor.pages.dev) |
| `agent`      | [`projects/agent`](projects/agent/README.md)           | **Réplica** del dashboard del agente                    | [sc-agent.pages.dev](https://sc-agent.pages.dev)           |
| `cuscare`    | [`projects/cuscare`](projects/cuscare/README.md)       | **Réplica** de la herramienta de tickets                | [sc-cuscare.pages.dev](https://sc-cuscare.pages.dev)       |

> ⚠️ **Las dos réplicas (`agent`, `cuscare`) no se tokenizan, y es a propósito** (DD-35 y
> DD-37). Una réplica tiene que parecerse al ORIGINAL, no a nuestro DS: sus valores se
> extraen del sitio real y `token-guard` las exime de las reglas de tipografía. Su gate no
> es la paridad de tokens, es la fidelidad medida contra el sitio original. **No las
> "arregles" para que usen `--sc-*`.**
>
> `cuscare` tiene suite propia en CI (`npm run e2e:cuscare`, con clics reales). `agent`
> tiene su propio arnés de medición en [`tools/`](tools/README.md).

## Construir

```bash
npm ci
npm run build          # design-tokens + icons + components a dist/
npm run build:docs     # docs de producción
npm start              # docs en local (ng serve)
npm run export:all     # tarballs npm en dist/archives/
```

## Verificar

```bash
npm run verify         # todos los checks estáticos (~40s)
npm run e2e            # smoke en navegador (Playwright)
npm run e2e:contrast   # carril rápido para cambios de COLOR (~80s)
npm run preflight      # los 8 pasos del CI, antes de pushear
npm run preflight:fast # lo mismo, ~2x más rápido: sirve el build estático en vez de `ng serve`
```

`preflight:fast` corre los MISMOS gates —lo garantiza un test de paridad— pero sirve las
apps ya construidas en vez de arrancar tres `ng serve`, que eran la mitad del tiempo.
Medido: **4m 46s contra 8m 31s**. Un cambio hecho DESPUÉS de lanzarlo no se ve (sirve el
build de antes), así que es de un tiro sobre árbol final, igual que `preflight`.

**Regla de la casa**: una comprobación que no está en una cadena automática no es una
comprobación, es documentación, y la documentación que hay que recordar se pierde. Todo
check nuevo entra en `verify` o en un `e2e:*`, nunca como comando suelto.

`e2e:contrast` es la excepción legítima: no añade comprobaciones, es un atajo a un
subconjunto de las que ya corren en CI.

### Antes de pushear, `preflight`

Encadena los ocho pasos de `ci.yml` en un solo comando, para que "verde en local" signifique
"verde en CI". Existe porque `verify` por sí solo **no corre el `e2e`**: un cambio de
`line-height` pasó los gates estáticos y aun así tumbó el CI al mover un baseline de
`component-structure`.

Que no se pudra cuando alguien añada un paso al CI lo garantiza un test
(`scripts/ci-preflight-parity.mjs`, dentro de `test:unit`): se pone rojo si `preflight` y
`ci.yml` se desincronizan.

> **Y después de pushear, lee el CI.** `gh run list --branch main --workflow ci --limit 1`.
> Un preflight verde no es un CI verde: el paso `npm ci` resuelve dependencias contra el
> registro y en la plataforma del runner, así que puede caerse con tu árbol local intacto.
> `npm run guard:lockfile` cubre la parte comprobable; el resto solo lo sabe el CI.

### Los guardarraíles

El detalle de por qué existe cada uno vive en la cabecera de su propio script. Aquí solo
qué garantiza.

| Guardarraíl            | Comando                                                                                                    | Qué garantiza                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generadores            | `tokens:gen` · `tokens:gen-component` · `tokens:gen-color` · `tokens:gen-cmp-color` · `tokens:gen-effects` | Los bloques `@sc-gen` reproducen el export del Kit                                                                                                   |
| Paridad                | `tokens:parity`                                                                                            | Escala, radios, sizing y colores de marca 1:1 con el export, y completitud: una hoja nueva del Kit sin clasificar pone rojo                          |
| Guard                  | `tokens:guard`                                                                                             | `--p-*` solo en el preset · componentes con alias `--sc-spacing-*` · sin escala 8-point · campos PrimeNG solo vía wrapper · font-size solo por token |
| Export limpio          | `tokens:export-clean`                                                                                      | En local, `kit-export-dtcg.json` coincide con HEAD (caza el export sucio que deja un `preview:live` zombie)                                          |
| Repunte de color       | `tokens:cmp-rewire`                                                                                        | Cada `colorScheme` repuntado a `var(--sc-cmp-*)` es un no-op demostrable, sin hex sueltos                                                            |
| Repunte de sombras     | `tokens:effects-rewire`                                                                                    | Ningún preset deja un `shadow:` con hex para un slot que generamos                                                                                   |
| Tipografía             | `tokens:type-parity`                                                                                       | Cada `font-size` y `line-height` del Kit tiene su token 1:1 por valor                                                                                |
| Escala del preset      | `audit:theme-scale`                                                                                        | Cero `px` en el preset, sin `css:` por componente, sin hack de `html{font-size}`                                                                     |
| Bordes vs lienzo       | `audit:border-surfaces`                                                                                    | Ningún `--sc-border-*` queda a menos de 1.02:1 de su superficie **en su tema**                                                                       |
| Audit de componentes   | `audit:components`                                                                                         | La pokédex (`docs/inventory.md`) está al día con el código                                                                                           |
| Era de la API          | `audit:api-era`                                                                                            | Nada nuevo estrena `@Input()/@Output()` (DD-38). Trinquete de 16 componentes que solo puede menguar                                                  |
| i18n                   | `i18n:check`                                                                                               | Paridad de claves entre los locales del Supervisor (`es` canónico contra `en`/`fr`/`pt`)                                                             |
| Tests unitarios        | `test:unit`                                                                                                | Suites de los generadores y scripts                                                                                                                  |
| Docs                   | `docs:guard` · `docs:coherence`                                                                            | Todo `.md` mapeado en `DOCS-INDEX` y sus links resuelven; la doc cuadra con el repo                                                                  |
| Tests del DS           | `test:components`                                                                                          | `TestBed` sobre vitest, para los casos límite que la e2e no alcanza                                                                                  |
| Acoplamiento a PrimeNG | `audit:primeng-coupling`                                                                                   | Las 36 clases `.p-*` que usamos siguen existiendo, y el número no crece                                                                              |
| Tablas del DS          | `audit:datatables`                                                                                         | Invariantes de toda página con `<sc-datatable>`                                                                                                      |
| Backticks              | `guard:backticks`                                                                                          | Ningún backtick suelto dentro de un `template:` o `styles:`, que rompe el build con un error que no los menciona                                     |
| Lockfile               | `guard:lockfile`                                                                                           | El lock cuadra con `package.json` **en la plataforma del runner**, no solo en la tuya                                                                |
| Tipos y lint           | `typecheck` · `lint`                                                                                       | `tsc` sobre las 2 libs, las 4 apps y el arnés de la raíz                                                                                             |
| e2e smoke              | `e2e`                                                                                                      | La demo levanta y el botón y el form field renderizan la métrica del Kit medida en navegador                                                         |

El mismo gate corre en CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Flujo Figma a código

1. El Kit se re-exporta en DTCG y se versiona en
   `projects/design-tokens/scripts/kit-export-dtcg.json`.
2. `npm run tokens:import` regenera las zonas `@sc-gen:*`. La cascada (aliases, semántica,
   preset) propaga sola.
3. `npm run verify` confirma la paridad. Si algo diverge, o se corrige o se documenta como
   divergencia consciente. Nunca se deja en silencio.

## Documentación

- [docs/DECISIONS.md](docs/DECISIONS.md), decisiones de arquitectura (DD-\*)
- [docs/guia-tokens.md](docs/guia-tokens.md), guía del sistema de tokens
- [projects/design-tokens/README.md](projects/design-tokens/README.md), referencia técnica de tokens
- [docs/customs-catalog.md](docs/customs-catalog.md), divergencias conscientes con Figma
- [docs/migration-safety.md](docs/migration-safety.md), patrones de cambio seguro
- [AGENTS.md](AGENTS.md), convenciones para el pipeline de agente
