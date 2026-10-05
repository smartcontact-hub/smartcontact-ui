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

- **`@smartcontact-hub/components` · preparada 1.1.0, sin publicar** — `sc-multiselect` gana
  `iconOnly` e `icon` para elegir columnas con nombre accesible. `ScColumnDef` publica `frozen`
  y `alignFrozen`: posiciones nativas y sombra solo cuando hay contenido oculto. Las tablas con
  scroll encogen dentro de flex, con fondos opacos en los estados de fila. ([DD-153](docs/DECISIONS.md))


### Added

- **`@smartcontact-hub/components`** — `sc-button` gana `ariaHasPopup`, `ariaExpanded` y `ariaControls`: llegan
  al `<button>` real por passthrough, no al host `<sc-button>` (que nunca recibe el foco). Sin fijar ninguna,
  nada cambia. La «Columnas» de una lista, el ⋮ de un widget del Dashboard y «Agentes» del widget «Grupos» (con
  varios grupos) las usan: antes, el lector de pantalla no decía que abren algo ni si ya está abierto.
  ([DD-171](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — `sc-select`, `sc-multiselect`, `sc-inputnumber`, `sc-toggleswitch`,
  `sc-textarea` y `sc-selectbutton` ganan `ariaDescribedBy`: ids, separados por espacios, de la ayuda que va al lado del
  campo y no debajo. Se oye después de la ayuda propia. Sin él, nada cambia. ([DD-133](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — `sc-select` gana `ariaLabel`, el nativo de `p-select`: nombra el combobox cuando
  no hay rótulo a la vista. Sin ningún nombre, PrimeNG lo nombraba con la opción elegida, y el lector oía el valor en
  lugar de lo que se pide. ([DD-133](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — `sc-datatable` gana `first`, la primera fila de la página abierta, en las dos
  direcciones como en `p-table` (`[(first)]`). Quien filtra las filas fuera de la tabla la vuelve a `0` al cambiar la
  búsqueda: el paginador de PrimeNG solo retrocede una página cuando la abierta queda fuera de rango, y desde la
  tercera la tabla se quedaba en blanco. Sin enlazarlo, nada cambia. ([DD-163](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — `sc-group-popover` gana `activated`, la salida al pulsar la cifra (clic, Intro o
  Espacio): lo que se hace con esa relación, si quien la pinta lo quiere. Al pulsar, el globo se cierra; al pasar o
  con el foco, sigue enseñando los nombres. Sin nadie que la escuche, nada cambia. ([DD-159](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — `sc-slot` se pliega como ya hacía `sc-subsection`: `collapsible` e
  `initiallyCollapsed`, con el título entero como botón, `aria-expanded` y el chevron del DS. `sc-subsection` gana
  `titleId`: con él, su título lleva ese `id` y acepta el foco por programa, para ser el destino de un salto. Las dos,
  apagadas por defecto: nada cambia sin pedirlo. El título de un slot ya no se parte cuando su aclaración es larga.
  ([DD-157](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — `sc-datatable` gana `externalSort`: la tabla pinta el indicador de
  orden y emite `(sortChange)`, pero **no reordena** las filas; el orden lo pone quien la usa. Sin él,
  p-table vuelve a ordenar por el valor crudo del campo encima del orden que recibe, y un orden propio
  (una prioridad por rango, nombres con locale) no llegaba a verse. Por defecto apagado: ninguna tabla
  cambia sin pedirlo.
- **`@smartcontact-hub/components`** — `sc-form-section-nav` es un índice de ENLACES: cada sección puede
  llevar su `href` (la URL de la sección, que prepara quien lo pinta). Un clic principal sin teclas sigue
  emitiendo `activeChange` y la página navega; cualquier otro gesto de enlace (Cmd/Ctrl, Mayús, Alt o el
  clic central) lo hace el navegador, la misma regla que `routerLink`. Sin `href`, la fila apunta a `#`
  como hasta ahora. Gana además `titleKey` (un rótulo visible encima de las filas, que nombra el índice)
  y `sectionsWithChanges` (un punto en el color de marca en las secciones con cambios sin guardar,
  distinto del rojo de lo que falta). ([DD-122](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — `sc-form-section-nav` gana `sectionsDone`: un ✓ en el verde de éxito detrás
  de la etiqueta de las secciones que la página da por hechas (en las altas del Supervisor, las que se dejaron
  completas), que el enlace dice («Esta sección está completa»). Se ve una sola marca: lo que falta y los cambios
  sin guardar ganan al ✓, y se oyen todas. Entra con escala, opacidad y desenfoque si llega con el índice ya a la
  vista, y quieto con `prefers-reduced-motion`. Su diccionario (`sc.formSectionNav.*`) pasa a los cuatro idiomas:
  en francés y en portugués se decía en español. Por defecto vacío: ningún índice cambia sin pedirlo.
  ([DD-143](docs/DECISIONS.md))

### Changed

- **`@smartcontact-hub/components`** — el icono pesa lo que su texto (DD-130 §6, figma-pendiente §29). En
  `sc-form-section-nav` plano, el índice de todo el Supervisor, el icono y el ✓ de la fila activa van a 600 y los de
  las demás a 400, como sus rótulos; en el de por defecto, a 500, el medium de su rótulo. El icono del título de
  `sc-subsection` va a 600, como su texto en semibold y como ya iba el de `sc-section-card`; el chevron de la
  plegable sigue a 400. ([DD-130](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — las filas de `sc-form-section-nav` dejan de llevar `role="tab"`,
  que anunciaba una pestaña sin lista de pestañas, y la actual se anuncia con `aria-current="page"` en
  vez de `"true"`. El texto del punto rojo pasa de un `aria-label` en un `span` sin rol (ARIA 1.2 lo
  prohíbe; Chrome lo leía igual) a texto oculto dentro del enlace. No se mueve un píxel: ningún estilo
  miraba esos atributos. Quien los use como selector, que pase a `.form-nav__item--active` o al rol
  `link`. ([DD-122](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — `sc-section-card` mide 17,5 arriba y abajo en las dos pieles (antes, 22,75
  la gris y 24,5 la blanca), también plegada. Los lados y el aire del título a su contenido no cambian. El relleno
  vertical no separaba nada: la caja ya la delimitan su borde y su fondo. ([DD-125](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — `sc-dialog` con cuerpo deja la botonera a 28 del contenido (el pie gana 10,5
  arriba) y separa a los hermanos del cuerpo 14 en vez de 15,75. A 17,5, el botón quedaba más cerca del último
  campo que dos campos entre sí y se leía como parte de ese campo. Sin cuerpo (una confirmación) y con `flushBody`,
  como estaba. ([DD-123](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — el botón `variant="danger" appearance="text"` sube de `red-500` a
  `red-600`: 3.76:1 sobre blanco no llegaba al 4.5:1 de WCAG AA, el mismo fallo que el `danger` sólido ya
  había corregido en julio. Sin cambio en oscuro (ya usaba `red-400`). Todo consumidor de esa combinación,
  no solo el «Eliminar» de las fichas, hereda el color. ([DD-128](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — `sc-select` y `sc-multiselect` sacan sus textos fijos de su diccionario
  (`sc.select.*`, en español, inglés, francés y portugués), como `sc-drawer`: «Sin opciones», «Sin resultados»,
  «Buscar» y «{0} seleccionados». Eran literales en español en sus `input()`, y un desplegable en otro idioma los
  seguía diciendo en español. Sin cambio en español; quien los pase por entrada, manda. ([DD-133](docs/DECISIONS.md))

### Fixed

- **`@smartcontact-hub/components`** — `sc-button` con `variant="secondary" appearance="text"` se lee en claro: su
  etiqueta e icono medían 2,95:1 (slate-500, el mismo valor que `outlined secondary`, en otra `appearance`). Ahora
  `--sc-cmp-button-text-secondary-color` sube a slate-600 (4,52:1), el mismo escalón que ya llevaban
  `outlined secondary` y `text danger`. Afecta a todo botón secundario de texto: «Añadir alternativa (O)» del
  constructor de reglas, los «⋮» de fila, deshacer-10s del reproductor, cerrar del toast… ([DD-169](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — El marcador de `sc-photo-upload` sin foto se ve a 3:1, lo que pide un icono: usaba
  el color de texto apagado y medía 2,58:1 en claro. Ahora, `--sc-icon-secondary` (3,96:1). ([DD-136](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — La ayuda, el error y lo obligatorio de `sc-multiselect` se anuncian con su
  combobox, el `<input>` que recibe el foco: iban en la envoltura `<p-multiselect>`, y el lector no los oía.
  ([DD-133](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — Las opciones apagadas de `sc-select` dicen `aria-disabled`; antes solo lo decían
  su color y `data-p-disabled`. Y `sc-bulk-edit-menu` nombra sus tres desplegables con las palabras de su frase
  («Cambiar», «de», «a»), que se oían con su valor. ([DD-133](docs/DECISIONS.md))

- **`@smartcontact-hub/components`** — La cifra de `sc-group-popover` se pulsa en al menos 24,5 × 24,5 (WCAG 2.5.8):
  un `::after` invisible y centrado agranda la zona sin cambiar cómo se ve. Pintaba lo que mide su número (15 × 20
  con dos dígitos), y desde DD-159 abre la asignación de un grupo.
- **`@smartcontact-hub/components`** — `sc-checkbox` desactivado aplica la opacidad UNA vez, el 60 % de Figma
  (`disabled/opacity`). La caja llevaba además la suya y las dos se multiplicaban (0,36), así que una casilla
  marcada y desactivada, un valor fijo que no se quita desde ahí, se leía como apagada y no como marcada. Todo
  consumidor hereda el arreglo: las casillas desactivadas se ven algo más oscuras. ([DD-131](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — `sc-select` pone `aria-describedby`, `aria-required` y `aria-invalid` en el
  elemento que recibe el foco (el `span[role=combobox]`, o el `<input>` si es editable), por passthrough, como
  `sc-password`. Iban en la envoltura `<p-select>`, y un lector de pantalla no anunciaba la ayuda ni el error, ni
  sabía que el campo era obligatorio. ([DD-133](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — `sc-dialog` se anuncia como UN diálogo modal, con el título de nombre y el
  subtítulo de descripción. Exponía dos `role="dialog"` modales, uno dentro de otro: el `p-dialog` de PrimeNG, sin
  nombre (su `aria-labelledby` apuntaba a una cabecera que no se pinta), y la card del DS. El rol se queda en el de
  PrimeNG, que es el que atrapa el foco, nombrado por `pt`, y la card deja de llevarlo. El foco al abrir, Tab y
  Escape no cambian. Quien buscara la card por `[role="dialog"]` la encuentra por `.sc-dialog`.
  ([DD-140](docs/DECISIONS.md))
- **`@smartcontact-hub/components`** — `sc-datatable` con lista virtual vuelve a contar sus filas cuando su caja
  cambia de alto, no solo cuando cambia la ventana. Con «reducir movimiento», el listado de agentes del Supervisor
  salía sin ninguna fila: la lista virtual contaba en el fotograma en que la tabla aún medía 0. Sin API nueva.

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
