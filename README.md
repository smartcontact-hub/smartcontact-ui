# Smart Contact Design System

[![Versión](https://img.shields.io/badge/versi%C3%B3n-1.0.0-0B2C5C)](https://github.com/smartcontact-hub/smartcontact-ui/releases/latest)
![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![PrimeNG](https://img.shields.io/badge/PrimeNG-22-10B981)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Packages](https://img.shields.io/badge/packages-3-blue)
[![License](https://img.shields.io/badge/license-Proprietary-lightgrey)](LICENSE)

Lo que se diseña en Figma (el archivo **Smart Contact Design System**) se refleja en el
código, y **cada valor es trazable al export del Kit y verificable por máquina**.

### Cómo se consume el DS hoy

Las apps de este repo **importan el DS directamente desde `dist/`**, por rutas de
`tsconfig`. No se instala como paquete de npm: no hay `npm install @smartcontact-hub/...`
en ningún sitio.

En la práctica eso significa que **editas un token y lo ves al instante** en las cuatro
apps, sin publicar nada ni subir una versión.

### Cómo se lo descarga alguien de fuera

Cada versión es una [**release de GitHub**](https://github.com/smartcontact-hub/smartcontact-ui/releases/latest)
con los tres paquetes adjuntos como tarball. No hace falta clonar ni compilar:

```bash
npm i https://github.com/smartcontact-hub/smartcontact-ui/releases/download/v1.0.0/smartcontact-hub-styles-1.0.0.tgz
```

Lo que cambia en cada versión está en [CHANGELOG.md](CHANGELOG.md), y la release enseña esa
misma nota: hay **una** fuente, no dos. La corta `npm run release` (dry-run por defecto;
`-- --publish` para hacerla), que reconstruye los tarballs desde el commit del tag para que
lo que se descarga sea lo que el tag dice.

La misma release **publica los tres paquetes en GitHub Packages** (privados, org
`smartcontact-hub`), sin que nadie tenga que acordarse: lo hace
[`publish-packages.yml`](.github/workflows/publish-packages.yml) al publicarse la release. Así
que hay dos caminos según quién seas: el **tarball** si vienes de fuera, el **registro** si ya
tienes acceso a la org.

Lo que **sigue aparcado a propósito** es el ciclo **diario** de publicar-versionar-instalar:
las cinco apps de aquí consumen el DS desde `dist/` y no instalan nada, que es justo lo que
hace que tocar un token se vea al instante. El porqué, en [DD-17](docs/DECISIONS.md); el
matiz de por qué publicar por release no lo reabre, en [DD-58](docs/DECISIONS.md).

## Paquetes

| Paquete                        | Proyecto                                                                     | Contenido                                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@smartcontact-hub/styles`     | [`projects/design-tokens`](projects/design-tokens/README.md)                 | Tokens `--sc-*` (7 capas, escala 14-base en rem) más reset y globals                                                                                  |
| `@smartcontact-hub/icons`      | [`projects/ui-smartcontact-icons`](projects/ui-smartcontact-icons/README.md) | `<sc-icon>` y los Material Symbols generados                                                                                                          |
| `@smartcontact-hub/components` | [`projects/ui-smartcontact`](projects/ui-smartcontact/README.md)             | `provideSmartContactUi()`, el preset modular (`theme/sc-preset`, cada slot a `var(--sc-*)`) y 50 componentes `sc-*` ([inventario](docs/inventory.md)) |

Y **cinco apps** que lo consumen, las cinco en producción en Cloudflare Pages:

| App          | Proyecto                                               | Qué es                                                           | En producción                                              |
| ------------ | ------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| `sc-docs`    | [`projects/sc-docs`](projects/sc-docs/README.md)       | Showcase: fundaciones, catálogo, uso real y Lab                  | [sc-doc.pages.dev](https://sc-doc.pages.dev)               |
| `supervisor` | [`projects/supervisor`](projects/supervisor/README.md) | **La app real**. Consumo canónico: solo `sc-*` y tokens          | [sc-supervisor.pages.dev](https://sc-supervisor.pages.dev) |
| `agent`      | [`projects/agent`](projects/agent/README.md)           | **Réplica** del dashboard del agente                             | [sc-agent.pages.dev](https://sc-agent.pages.dev)           |
| `agent-mini` | [`projects/agent-mini`](projects/agent-mini/README.md) | **Réplica** del Comunicador suelto (dialpad a pantalla completa) | [agent-mini.pages.dev](https://agent-mini.pages.dev)       |
| `cuscare`    | [`projects/cuscare`](projects/cuscare/README.md)       | **Réplica** de la herramienta de tickets                         | [sc-cuscare.pages.dev](https://sc-cuscare.pages.dev)       |

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

Y para que no dependa de acordarse, **un hook lo corre solo**: `.githooks/pre-push` lanza
`preflight:scope` antes de cada `git push` y aborta si algo falla; si el árbol ya lleva la marca
`.preflight-ok` de un carril en verde (la escribe `scripts/preflight-mark.mjs` al final de
`preflight`, `preflight:fast` y `preflight:scope -- --run`), sube sin repetir la cadena. Se activa
una vez con `npm run hooks:install`. Y el hook de Claude (`.claude/settings.json` →
`scripts/hooks/bash-guard.mjs`) deniega el `git push` antes de llegar aquí si la marca no cuadra
con el árbol, junto con los otros comandos que LEARNINGS #7, #11 y #12 prohíben. La salida de emergencia es `SKIP_PREFLIGHT=1 git push`, y avisa por
pantalla de que te la has saltado. Existe porque esta regla era la más incumplida del repo:
se lee al empezar la tarea y el disparador salta horas después.

> **Y después de pushear, lee el CI.** `gh run list --branch main --workflow ci --limit 1`.
> Un preflight verde no es un CI verde: el paso `npm ci` resuelve dependencias contra el
> registro y en la plataforma del runner, así que puede caerse con tu árbol local intacto.
> `npm run guard:lockfile` cubre la parte comprobable; el resto solo lo sabe el CI.

### Los guardarraíles

El detalle de por qué existe cada uno vive en la cabecera de su propio script. Aquí solo
qué garantiza.

| Guardarraíl            | Comando                                                                                                    | Qué garantiza                                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generadores            | `tokens:gen` · `tokens:gen-component` · `tokens:gen-color` · `tokens:gen-cmp-color` · `tokens:gen-effects` | Los bloques `@sc-gen` reproducen el export del Kit                                                                                                                                                 |
| Paridad                | `tokens:parity`                                                                                            | Escala, radios, sizing y colores de marca 1:1 con el export, y completitud: una hoja nueva del Kit sin clasificar pone rojo                                                                        |
| Guard                  | `tokens:guard`                                                                                             | `--p-*` solo en el preset · componentes con alias `--sc-spacing-*` · sin escala 8-point · campos PrimeNG solo vía wrapper · font-size solo por token                                               |
| Export limpio          | `tokens:export-clean`                                                                                      | En local, `kit-export-dtcg.json` coincide con HEAD (caza el export sucio que deja un `preview:live` zombie)                                                                                        |
| Repunte de color       | `tokens:cmp-rewire`                                                                                        | Cada `colorScheme` repuntado a `var(--sc-cmp-*)` es un no-op demostrable, sin hex sueltos                                                                                                          |
| Repunte de sombras     | `tokens:effects-rewire`                                                                                    | Ningún preset deja un `shadow:` con hex para un slot que generamos                                                                                                                                 |
| Tipografía             | `tokens:type-parity`                                                                                       | Cada `font-size` y `line-height` del Kit tiene su token 1:1 por valor                                                                                                                              |
| Escala del preset      | `audit:theme-scale`                                                                                        | Cero `px` en el preset, sin `css:` por componente, sin hack de `html{font-size}`                                                                                                                   |
| Bordes vs lienzo       | `audit:border-surfaces`                                                                                    | Ningún `--sc-border-*` queda a menos de 1.02:1 de su superficie **en su tema**                                                                                                                     |
| Audit de componentes   | `audit:components`                                                                                         | La pokédex (`docs/inventory.md`) está al día con el código                                                                                                                                         |
| Era de la API          | `audit:api-era`                                                                                            | Nada nuevo estrena `@Input()/@Output()` (DD-38). Trinquete de 16 componentes que solo puede menguar                                                                                                |
| i18n                   | `i18n:check`                                                                                               | Que la app sea multiidioma de verdad: claves 1:1 entre locales, toda clave que pide el código existe, variables `{{x}}` intactas, una sola traducción por frase, cero copy a pelo en atributos y ningún formato de fecha clavado a un idioma                                                                                                           |
| Novedades de la web     | `novedades:check`                                                                                          | La página `/novedades` de `sc-docs` cuadra con `CHANGELOG.md`. La pinta un artefacto generado (`npm run novedades:gen`), no un texto a mano: sin esto, la web podría anunciar una versión distinta de la que el repo publica, que es la misma clase de fallo de escribir dos veces el mismo anuncio |
| Uso real                | `usage:check`                                                                                              | La galería de uso (`public/usage/`) cuadra con la captura versionada; se regenera con `usage:capture`                                                                                              |
| Conexión de variables   | `variables:check`                                                                                          | El mapa Figma → tema → navegador (CSV + JSON de sc-docs) cuadra con el crudo medido; se regenera con `variables:map`                                                                               |
| Tests unitarios        | `test:unit`                                                                                                | Suites de los generadores y scripts                                                                                                                                                                |
| Docs                   | `docs:guard` · `docs:coherence`                                                                            | Todo `.md` mapeado en `DOCS-INDEX` y sus links resuelven; la doc cuadra con el repo                                                                                                                |
| Tests del DS           | `test:components`                                                                                          | `TestBed` sobre vitest, para los casos límite que la e2e no alcanza                                                                                                                                |
| Acoplamiento a PrimeNG | `audit:primeng-coupling`                                                                                   | Las 36 clases `.p-*` que usamos siguen existiendo, y el número no crece                                                                                                                            |
| Tablas del DS          | `audit:datatables`                                                                                         | Invariantes de toda página con `<sc-datatable>`                                                                                                                                                    |
| Higiene de pantalla    | `audit:screen-hygiene`                                                                                     | Sin emojis nuevos en la interfaz (los iconos salen de `<sc-icon>`) y sin `<img>`/`<iframe>` nuevos sin `width`+`height` o `aspect-ratio` (evita saltos de layout). Dos trinquetes que solo menguan |
| Datos de contacto      | `audit:seed-pii`                                                                                           | Ningún teléfono ni correo en los datos de demostración sin estar declarado inventado, con su motivo escrito. Nació el 2026-09-07, cuando se encontraron 7 teléfonos de la extracción publicados en `agent/seed.ts`: la regla estaba escrita en dos cabeceras de fichero y aun así se saltó, porque un teléfono inventado y uno real se ven igual |
| Anatomía de página     | `audit:page-anatomy`                                                                                       | Cada página del Supervisor declara su arquetipo de `.page__inner` (o está exenta con su motivo), ninguna re-declara el molde compartido (`--with-panel` · `.page__form` · `.ipanel`) ni pisa su propio ancho, y los anchos sueltos ≥600px son un trinquete que solo mengua |
| Base de la SPA         | `audit:base-href`                                                                                          | Las 5 apps declaran `<base href="/">`. Con la base vacía los assets se piden RELATIVOS a la URL, así que toda ruta de dos segmentos (`/componentes/button`) recibe el index.html del SPA fallback y deja la PÁGINA EN BLANCO al entrar por enlace directo o al recargar. En las cuatro apps que enrutan por path eso rompe hoy mismo; `sc-docs` arrastraba la base vacía desde el primer commit y se salvaba solo porque usa `withHashLocation()` — o sea, una trampa armada para el día que se quiten los `#` |
| Estilos de texto       | `audit:text-styles`                                                                                        | Las 12 clases `.sc-text-*` resuelven, cadena de tokens incluida, al font-size / line-height / peso / familia de su text style del Figma del DS, y las apps que consumen el DS cargan el CSS que las define. `tokens:type-parity` solo vigila el último eslabón (peldaño ↔ export); esto vigila el tramo de en medio y la llegada |
| Título contenido       | `audit:titulo-contenido`                                                                                   | En una pantalla con índice lateral, el `<h1>` lo pinta un `<sc-section-card [headingLevel]="1">` y no una etiqueta suelta: contenido en su sección, el título ACOTA su caja y arranca en la misma línea que el rail. Y al revés, nadie más se pone el nivel de página. Los formularios quedan fuera: su `<h1>` está oculto a propósito porque la identidad la pinta la ficha del rail |
| Versiones congeladas   | `proto:check`                                                                                              | Cada fila de `docs/PROTOTIPOS.md` tiene su etiqueta, y cada etiqueta `proto/*` su fila. Es la tabla que se enlaza desde Jira y Confluence en lugar de la URL viva: sin esto, una versión congelada puede quedarse sin registro (o al revés) y el enlace del ticket vuelve a envejecer solo |
| Snippets de la doc     | `audit:doc-snippets`                                                                                       | El código que enseña `sc-docs` usa componentes y propiedades que EXISTEN: todo tag `sc-*` es un selector real y todo binding es un `input`/`model`/`output` suyo. No compara el snippet con su plantilla a propósito: medido, 40 de 71 divergen por decisiones deliberadas |
| Backticks              | `guard:backticks`                                                                                          | Ningún backtick suelto dentro de un `template:` o `styles:`, que rompe el build con un error que no los menciona                                                                                   |
| Lockfile               | `guard:lockfile`                                                                                           | El lock cuadra con `package.json` **en la plataforma del runner**, no solo en la tuya                                                                                                              |
| Tipos y lint           | `typecheck` · `lint`                                                                                       | `tsc` sobre las 2 libs, las 4 apps y el arnés de la raíz                                                                                                                                           |
| e2e smoke              | `e2e`                                                                                                      | La demo levanta y el botón y el form field renderizan la métrica del Kit medida en navegador                                                                                                       |

El mismo gate corre en CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)). Cuando un
e2e falla, el CI **sube la traza y la captura** de Playwright como artifact (7 días): un rojo
deja algo que mirar en vez de una línea de texto.

### Los otros workflows

| Workflow                                                        | Cuándo                    | Qué hace                                                                                                                                                                                                     |
| --------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`publish-packages.yml`](.github/workflows/publish-packages.yml) | Al publicarse una release | Publica los 3 paquetes en GitHub Packages desde el commit del tag. Sin tokens personales                                                                                                                     |
| [`deploy-record.yml`](.github/workflows/deploy-record.yml)       | Al empujar a `main`       | Registra en *Deployments* qué sirve cada uno de los 5 sitios, **después de comprobarlo**: cada build se sella con su commit (`stamp-build.mjs` → `build.json`) y el registro espera a verlo. Sin sello, rojo |
| [`tokens-sync.yml`](.github/workflows/tokens-sync.yml)           | Al empujar tokens         | Verifica el PR del puente de Figma                                                                                                                                                                          |

> ⚠️ Los cinco `build:*` terminan en `node scripts/stamp-build.mjs <app>`, y son los comandos
> que corre Cloudflare. **Quitar ese eslabón deja el sitio sin sello**, y `deploy-record` lo
> marcará en rojo hasta que vuelva. Ver [DD-59](docs/DECISIONS.md).

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

## Licencia

Repositorio **público pero no libre**: [LICENSE](LICENSE) reserva todos los derechos a Smart
Contact, en la misma línea que los tres paquetes, que ya se publican como `UNLICENSED` y con
acceso restringido. Se puede leer, enlazar, citar y forkear para evaluarlo o proponer cambios;
cualquier otro uso necesita permiso por escrito. Las dependencias conservan su licencia (las
tipografías que viajan en los sitios publicados son OFL 1.1).

El aviso legal de los cinco sitios desplegados es una página del propio sc-docs:
[sc-doc.pages.dev/#/aviso-legal](https://sc-doc.pages.dev/#/aviso-legal) (fuente en
`projects/sc-docs/src/app/pages/aviso-legal/`).
