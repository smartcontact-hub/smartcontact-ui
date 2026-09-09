# Changelog

Todos los cambios notables de los paquetes `@smartcontact-hub/*` (versionados en
lockstep). Formato basado en [Keep a Changelog](https://keepachangelog.com/es/);
versionado [SemVer](https://semver.org/lang/es/). **Desde 1.0.0 la API pública `sc-*` y el
contrato de tokens `--sc-*` son estables**: rompen solo en un major, y cuando lo hacen se
dice aquí con el porqué enlazado a su decisión.

**Dónde se descarga**: cada versión es una
[release de GitHub](https://github.com/smartcontact-hub/smartcontact-ui/releases) con los
tres tarballs adjuntos, y esa misma release **publica los paquetes en GitHub Packages**
(privados, org `smartcontact-hub`). Lo que sigue aparcado es el ciclo **diario** de
publicar-versionar-instalar: las apps de este repo consumen el DS desde `dist/`
([DD-17](docs/DECISIONS.md), [DD-58](docs/DECISIONS.md)).

Para cortar una versión: `npm run version:bump -- <x.y.z|minor> --write`, escribe la nota
de abajo, commitea, y publica la release (`npm run release -- vX.Y.Z`).

## [Unreleased]

## [1.0.0] — 2026-09-09

Primera versión **estable**. El corte no es de calendario: es que el sistema ya tiene
**cinco aplicaciones en producción** consumiéndolo, **50 componentes** inventariados, el
puente Figma → código cerrado por generadores en las **10 zonas** que se generan, y **36
gates** encadenados que ponen rojo cualquier divergencia. A partir de aquí la API pública
`sc-*` y el contrato `--sc-*` solo rompen en un major.

Trae **cambios que rompen** respecto a `0.2.0` (junio): plataforma, nombres de token y la
compatibilidad con Reactive Forms. Están todos abajo, con el porqué en su decisión.

### Removed

- **BREAKING · `@smartcontact-hub/components`** — el `ControlValueAccessor` sale de los seis
  campos (`inputtext`, `inputnumber`, `select`, `checkbox`, `toggleswitch`, `textarea`). El
  patrón compartido pasa a factories y el `value = model()` cumple **estructuralmente** con
  `FormValueControl` de Signal Forms, que es la vía de Angular 22. Quien ate un campo con
  `formControlName` tiene que pasar a `[(value)]` o envolverlo él. ([DD-44](docs/DECISIONS.md))
- **BREAKING · `@smartcontact-hub/components`** — se retira `sc-page-header`. El título de una
  pantalla vive en el **cuerpo**, dentro de su propia sección, no en una cabecera aparte: en
  una pantalla con índice lateral lo pinta un `<sc-section-card [headingLevel]="1">`, y un gate
  (`audit:titulo-contenido`) lo vigila. ([DD-33](docs/DECISIONS.md),
  [DD-57](docs/DECISIONS.md))

### Changed

- **BREAKING · plataforma** — Angular **21 → 22**, PrimeNG **21 → 22**, `@primeuix/themes`
  **2 → 3**, y los builders a `@angular/build`. Los `peerDependencies` de los tres paquetes
  suben en consecuencia. ([DD-42](docs/DECISIONS.md))
- **BREAKING · `@smartcontact-hub/styles`** — los tokens se renombran a los **nombres del Kit**
  de Figma, para que el nombre que se lee en el diseño sea el que se escribe en el código. Un
  token es una cadena literal en el CSS de quien lo consume: revisad `--sc-*` a mano.
  ([DD-23](docs/DECISIONS.md))
- **BREAKING · color** — la familia `accent` se unifica con `info` bajo `sky` (un solo acento);
  `warn` vuelve a la familia `yellow` del Kit con un paso de corrección por contraste; el
  `primary` en oscuro sube un peldaño y **diverge del Kit** a propósito, porque su rampa no
  admitía texto legible; y el lienzo de aplicación pasa a **blanco** (`--sc-bg-canvas`).
  ([DD-32](docs/DECISIONS.md), [DD-41](docs/DECISIONS.md), [DD-40](docs/DECISIONS.md),
  [DD-45](docs/DECISIONS.md))
- **BREAKING · semántica de superficie** — `--sc-bg-default` es el **suelo del shell**, nunca
  una superficie de contenido. Si lo usabais para pintar una tarjeta, el token que toca es otro.
  ([DD-34](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — la era objetivo de la API son las **señales**
  (`input()` / `output()` / `model()`). `@Input()` y `@Output()` quedan congelados con
  trinquete: 16 componentes los conservan y ese número solo puede menguar, ninguno nuevo los
  estrena. ([DD-38](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — el estilo de los **overlays** de un wrapper (panel de
  `select`, `datepicker`, `popover`) vive en su propio componente del DS, no en el CSS de la
  app. El CSS de aplicación sin capa sobre `.p-*` pasa a trinquete. ([DD-50](docs/DECISIONS.md))
- **`@smartcontact-hub/styles`** — el `line-height` de los **controles** vuelve a la métrica de
  la fuente; la rampa tipográfica se queda solo donde el Kit la ata (chip, tag, toast). El
  fallback `md` baja a 20. ([DD-51](docs/DECISIONS.md), [DD-39](docs/DECISIONS.md),
  [DD-46](docs/DECISIONS.md))
- **`@smartcontact-hub/icons`** — el icono canónico es **Material Symbols Outlined**,
  **self-hospedado**: mismo trazo en la doc y en las apps, sin pedirle nada a Google en tiempo
  de ejecución. ([DD-31](docs/DECISIONS.md))

### Added

- **`@smartcontact-hub/styles`** — **12 estilos de texto** (`.sc-text-*`) generados desde la
  **librería** del DS en Figma, que es la que manda en las escalas. Un gate
  (`audit:text-styles`) comprueba la cadena entera: token → clase → font-size, line-height,
  peso y familia del text style, y que la app que consume el DS cargue el CSS que las define.
  ([DD-46](docs/DECISIONS.md), [DD-48](docs/DECISIONS.md), [DD-54](docs/DECISIONS.md),
  [DD-55](docs/DECISIONS.md))
- **Puente Figma → código completo.** Lo que antes se copiaba a mano ahora lo escribe un
  generador por clase de valor: **sizing** de componente, **color** semántico y de componente
  (claro y oscuro), **sombras** y **tipografía**. Son **10 zonas `@sc-gen:*` repartidas en 5
  ficheros**, todas reescritas por `npm run tokens:import`, y la paridad con el export del Kit
  la comprueba `tokens:parity`. ([DD-18](docs/DECISIONS.md), [DD-19](docs/DECISIONS.md),
  [DD-20](docs/DECISIONS.md), [DD-21](docs/DECISIONS.md), [DD-46](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — el inventario queda en **50** componentes. Nuevos:
  `sc-gauge` (medidor propio, sin PrimeNG detrás) y `sc-breadcrumb`. Catálogo completo en
  [`docs/inventory.md`](docs/inventory.md), auto-generado desde el código: si el código y la
  tabla se separan, `audit:components` pone rojo.
- **Cinco aplicaciones en producción** que lo consumen, todas desde `main` y desplegadas solas:
  el showcase [`sc-docs`](https://sc-doc.pages.dev), la app real
  [`supervisor`](https://sc-supervisor.pages.dev) y tres réplicas medidas del producto vivo
  ([`agent`](https://sc-agent.pages.dev), [`cuscare`](https://sc-cuscare.pages.dev),
  [`agent-mini`](https://agent-mini.pages.dev)). Las réplicas **no se tokenizan a propósito**:
  su gate es la fidelidad contra el sitio original, no la paridad de tokens.
  ([DD-35](docs/DECISIONS.md), [DD-37](docs/DECISIONS.md))
- **Showcase con fichas por componente** al estilo Storybook, con motor propio y sin tooling
  nuevo, más una galería de **uso real** que captura el DOM renderizado de las pantallas del
  Supervisor donde aparece cada componente. ([DD-29](docs/DECISIONS.md))
- **Dos formas de bajárselo, y ninguna depende de que alguien se acuerde.** Los tres paquetes
  se adjuntan como tarballs `.tgz` en la
  [release de GitHub](https://github.com/smartcontact-hub/smartcontact-ui/releases) (abierta,
  sin token), y la propia release dispara la publicación en **GitHub Packages** (privado, para
  quien ya tiene acceso a la org). Lo que sigue aparcado es el ciclo **diario** de
  publicar-versionar-instalar, que es lo que DD-17 quitó de en medio.
  ([DD-17](docs/DECISIONS.md), [DD-58](docs/DECISIONS.md))

## [0.2.0] — 2026-06-14

### Changed
- **`@smartcontact-hub/components`** — los `input<boolean>()` de los wrappers
  (`fluid`, `required`, `invalid`, `readonly`, `collapsible`, `flush`, `stripedRows`…)
  ahora llevan `transform: booleanAttribute`: el **atributo escueto** funciona
  (`<sc-inputtext fluid>`, como `<input disabled>`). Cambio **aditivo** —
  `[fluid]="true"` sigue válido. Gap surfaceado dogfoodeando `projects/sc-prototype`.

## [0.1.0] — 2026-06-13
Primera publicación en GitHub Packages (privado, org `smartcontact-hub`).

### Added
- **`@smartcontact-hub/styles`** — 7 capas de tokens `--sc-*` (escala 14-base en rem,
  paleta, semánticos, componente, extensiones, dark) generadas desde el export DTCG
  del Kit (Theme Designer). Reset + globals.
- **`@smartcontact-hub/icons`** — `<sc-icon>` (Material Symbols por ligadura) +
  constantes `SC_ICON_SIZE_*`.
- **`@smartcontact-hub/components`** — 48 wrappers/customs `sc-*` (button, inputtext,
  select, toggleswitch, checkbox, dialog, datatable, section-card/subsection/slot,
  command-palette, bulk-transcription-modal…) + `provideSmartContactUi()` + el preset
  modular PrimeNG (cada slot → `var(--sc-*)`).
