# Figma — lo que falta por tocar allí, una cosa a la vez

> **Para qué es este fichero.** Hay cambios que el código no puede cerrar solo: viven en el fichero
> de Figma del DS y los hace una persona. Antes estaban repartidos por las bandejas de los hand-offs
> y se leían como «nota al margen». Aquí están juntos, **cada uno verificado contra el fichero real**
> y con lo que hace falta para atacarlo sin releer media sesión.
>
> **Fichero**: «Smart-Contact Design System» — `khNq9dJKNi13pNllrqm6dx` (110 páginas).
>
> **Cómo se mantiene.** Lo cerrado se marca aquí, con la fecha. Lo nuevo entra aquí y **no** en la
> bandeja del hand-off: una cosa que solo se puede hacer en Figma no es trabajo de la próxima sesión.
>
> ⚠️ **Verificado el 2026-09-12** leyendo el fichero con el server de Figma. Cada ficha dice de dónde
> sale su evidencia; si una dice «sin verificar», es que se arrastra de un hand-off y hay que
> comprobarla antes de actuar.

---

## 1 · Publicar la librería

**Estado:** pendiente · **Dónde:** Figma, panel *Assets* → icono de librerías → *Publicar* · **Esfuerzo:** un minuto

Los cambios del 2026-09-13 (el título de `Section` a `h3` y el borrado de `app/typography/xl|xxl`)
están hechos en el fichero del DS, pero **los ficheros que usan la librería no los ven hasta que se
publica**. Publicarla es un paso de persona: no lo hace ninguna herramienta desde aquí.

**Cómo sabes que está hecho:** en un fichero que tenga activada la librería del DS, el aviso de
actualizaciones pendientes desaparece. (Qué ficheros la tienen activada no lo he comprobado.)

---

## 2 · Lo que Config cambió en código y Figma aún no sabe (2026-09-13)

**Estado:** pendiente de decidir, una a una: bajarla al Kit o revertirla en código · **Sin
verificar** contra el fichero del DS: sale de la sesión de `/config/aed/*`, medido en código.

- **Pastillas (`sc-tag`, `sc-chip`) sin punto y a 600.** Decisión de Rafa: en una pastilla tintada el
  color ya está en el fondo y en el texto. El Kit sigue dibujando el punto y el peso 500.
- **`--sc-text-heading`** (slate-800 en claro, slate-0 en oscuro) para títulos de sección: existe
  solo en código. En Figma haría falta la variable y atarla al título.
- **Tarjetas de opción (`sc-option-cards`)** en Servicio en lugar del modal de Figma `103:2718`.
- **Etiqueta IFTA (dentro del campo) a 600**, y el **interruptor a la derecha** en la lista de
  ajustes de Grupos (a la izquierda en General y Agentes: va donde van los controles de su patrón).

---

## 3 · La cabecera y el aire de página se compactaron en código (2026-09-14)

**Estado:** pendiente de bajarlo al fichero · **Sin verificar** contra el fichero del DS: medido en
código, en builds estáticos del Supervisor a 1440.

- **TopBar a 56 de alto** (`scale/4`; Figma `12277-4705` dibuja 72, con 20 arriba y abajo): el mismo token que
  el bloque del logo de la barra lateral, para que las dos rayas casen. Avatar a `--sc-cmp-avatar-width` (28) y la
  miga sin relleno propio (DD-90).
- **Página:** barra → título 17,5 (`scale/1-25`), lados 28 (`scale/2`), título → contenido 14 (`scale/1`)
  y buscador → tabla 12,25 (`scale/0-875`).

---

## 4 · Las medidas de PrimeOne que Aura 3 cambió: el código ya sigue a Aura (2026-09-14)

**Estado:** pendiente de bajarlo al fichero · **Sin verificar** contra el fichero del DS: sale del export
del Kit en `main` (`kit-export-dtcg.json`) y está medido en builds estáticos (DD-97; vista previa en
`~/Documents/Claude/2026-09 aura-marca/figma-se-alinea.html`).

PrimeOne 4.0.0 dibujó el Aura de 2024 y Aura 3 cambió 55 de esas medidas. El código ya lleva el valor de
Aura con el **paso de escala con el nombre del rem de Aura** (como DD-81), que es una variable que ya
existe. Mientras Figma no cambie, `PENDIENTE_FIGMA` (`scripts/sizing-map.mjs`) impide que un export
devuelva el código a PrimeOne.

**Cómo se hace, sin crear primitivos:** cada variable de la tabla pasa a apuntar (alias) al paso de la
columna «Aura». Las tres marcadas «separar» son hoy una sola variable donde Aura pone dos valores: se
crean `…/y` y `…/x` como en `divider/horizontal/content/padding`, cada una con alias a un paso que ya
existe, y la capa del maestro se ata a las dos.

**Cómo sabes que está hecho:** tras exportar, el robot pasa `token-parity` y avisa «pendiente(s) que el
export YA dice igual: quita la fila». Se quitan esas filas de `PENDIENTE_FIGMA`. En las tres separadas,
además, las filas pasan a leer `…padding.y` y `…padding.x` en `exp`.

| Colección | Variable | Hoy en el Kit | Aura |
|---|---|---|---|
| Semantic Common | `list/option/padding/y` | scale/0-5 | scale/0-25 |
| Semantic Common | `list/option/group/padding/y` | scale/0-5 | scale/0-25 |
| Semantic Common | `navigation/item/padding/y` | scale/0-5 | scale/0-25 |
| Semantic Common | `navigation/submenu/label/padding/y` | scale/0-5 | scale/0-25 |
| Component Common | `message/content/sm/padding/y` | scale/0-375 | scale/0-25 |
| Semantic Common | `list/option/padding/x` | scale/0-75 | scale/0-625 |
| Semantic Common | `list/option/group/padding/x` | scale/0-75 | scale/0-625 |
| Semantic Common | `navigation/item/padding/x` | scale/0-75 | scale/0-625 |
| Semantic Common | `navigation/submenu/label/padding/x` | scale/0-75 | scale/0-625 |
| Component Common | `tooltip/padding/x` | scale/0-75 | scale/0-625 |
| Component Common | `message/content/padding/x` | scale/0-75 | scale/0-625 |
| Component Common | `radiobutton/icon/size` | scale/0-75 | scale/0-625 |
| Component Common | `badge/font/size` | scale/0-75 | scale/0-625 |
| Semantic Common | `navigation/submenu/icon/size` | scale/0-875 | scale/0-75 |
| Component Common | `message/content/lg/padding/x` | scale/0-875 | scale/0-75 |
| Component Common | `radiobutton/icon/lg/size` | scale/1 | scale/0-75 |
| Component Common | `badge/lg/font/size` | scale/0-875 | scale/0-75 |
| Component Common | `tooltip/padding/y` | scale/0-5 | scale/0-375 |
| Component Common | `tag/padding/x` | scale/0-5 | scale/0-375 |
| Component Common | `message/content/padding/y` | scale/0-5 | scale/0-375 |
| Component Common | `divider/vertical/content/padding/y` | scale/0-5 | scale/0-375 |
| Component Common | `divider/horizontal/content/padding/x` | scale/0-5 | scale/0-375 |
| Component Common | `divider/vertical/padding` | 0 | **separar en `divider/vertical/padding/y` → scale/0-375 y `divider/vertical/padding/x` → 0** |
| Component Common | `badge/padding/x` | scale/0-5 | scale/0-375 |
| Component Common | `paginator/padding/y` | scale/0-5 | scale/0-375 |
| Component Common | `message/content/lg/padding/y` | scale/0-625 | scale/0-5 |
| Component Common | `message/content/sm/padding/x` | scale/0-625 | scale/0-5 |
| Component Common | `badge/sm/font/size` | scale/0-625 | scale/0-5 |
| Component Common | `divider/horizontal/padding` | 0 | **separar en `divider/horizontal/padding/y` → 0 y `divider/horizontal/padding/x` → scale/0-875** |
| Component Common | `paginator/padding/x` | scale/1 | scale/0-875 |
| Component Common | `inputgroup/addon/padding` | scale/0-5 | **separar en `inputgroup/addon/padding/y` → 0 y `inputgroup/addon/padding/x` → scale/0-5** |
| Component Common | `panel/toggleable/header/padding/x` | scale/1-125 | scale/1 |
| Component Common | `panel/header/padding` | scale/1-125 | scale/1 |
| Component Common | `popover/arrow/offset` | scale/1-25 | scale/1-125 |
| Component Common | `radiobutton/width` | scale/1-25 | scale/1-125 |
| Component Common | `radiobutton/height` | scale/1-25 | scale/1-125 |
| Component Common | `progressbar/height` | scale/1-25 | scale/1-125 |
| Component Common | `card/body/padding` | scale/1-25 | scale/1-125 |
| Component Common | `badge/sm/min/width` | scale/1-25 | scale/1-125 |
| Component Common | `badge/sm/height` | scale/1-25 | scale/1-125 |
| Component Common | `radiobutton/lg/width` | scale/1-5 | scale/1-25 |
| Component Common | `radiobutton/lg/height` | scale/1-5 | scale/1-25 |
| Component Common | `badge/min/width` | scale/1-5 | scale/1-25 |
| Component Common | `badge/height` | scale/1-5 | scale/1-25 |
| Component Common | `avatar/lg/font/size` | scale/1-5 | scale/1-25 |
| Component Common | `avatar/lg/icon/size` | scale/1-5 | scale/1-25 |
| Component Common | `confirmdialog/icon/size` | scale/2 | scale/1-5 |
| Component Common | `badge/lg/min/width` | scale/1-75 | scale/1-5 |
| Component Common | `badge/lg/height` | scale/1-75 | scale/1-5 |
| Component Common | `inputgroup/addon/min/width` | scale/2-5 | scale/2-25 |
| Component Common | `paginator/jump/to/page/input/max/width` | scale/2-5 | scale/2-25 |
| Component Common | `paginator/nav/button/width` | scale/2-5 | scale/2-25 |
| Component Common | `paginator/nav/button/height` | scale/2-5 | scale/2-25 |
| Component Common | `avatar/xl/group/offset` | scale/neg-1-5 | scale/neg-1-25 |
| Component Common | `avatar/group/offset` | scale/neg-0-75 | scale/neg-0-625 |

**Tres cosas más de la misma tanda:**

- **Desenfoque del toast en claro:** `toast/blur` en modo claro vale 1,5 y en oscuro 10; Aura pone 10 en
  los dos. El código ya usa 10 en claro. En Figma: el modo claro al mismo valor que el oscuro.
- **Paneles pequeño y grande de select y multiselect:** el código ya no les da relleno ni letra propios a
  la cabecera, la lista y las opciones (siguen a `list/option/*`); solo el buscador conserva la talla del
  trigger. Si algún maestro de panel sm/lg dibuja otro relleno, se ata a `list/option/padding/*`.
- **Se quedan como están, a propósito:** `toast/width` (`scale/25`) y `toggleswitch/height` (`scale/1-5`).
  Aura pide 22 rem y 1,375 rem, que no existen en la escala; el paso existente más cercano es el que ya
  tienen (en el interruptor, 1-25 y 1-5 quedan a la misma distancia y se conserva el actual).

---

## 5 · El índice lateral de las pantallas con rail no es componente de la librería (2026-09-14)

**Estado:** pendiente · **Verificado** con el server de Figma el 2026-09-14: en el fichero del DS no hay
ningún componente de índice lateral (revisados sus 228 componentes y conjuntos); en el fichero Supervisor
el único dibujo es un MARCO, no una instancia: `393:12565`, «sc-form-section-nav (pure-sc)», 196 de
ancho, dentro de la maqueta de Contact Center.

En código es `sc-form-section-nav` con `[flush]`, y desde el 2026-09-14 lo usan igual Contact Center y
las fichas de agente, grupo y usuario (con la ficha de identidad encima). Mientras sea un marco suelto,
cada maqueta nueva lo vuelve a dibujar a mano y puede salir distinto: es justo lo que pasó con la
generación anterior (`12277:4818`, panel gris con el icono en su cajita).

**Cómo se hace:** convertir el marco `393:12565` en componente del DS con dos estados de item (reposo y
activo: fondo `--sc-bg-hover`, texto en semibold), el icono de 20 y la etiqueta en `Body/body-regular`.
Opcional, la ficha de encima (avatar 36, nombre en `Body/body-semibold`, dato en `Caption/caption-regular`).

**Cómo sabes que está hecho:** la maqueta de Contact Center usa una instancia del componente en lugar
del marco.

---

## 6 · La miga: un tramo que se puede pulsar se subraya al pasar el ratón (2026-09-14)

**Estado:** pendiente de bajarlo al fichero · **Verificado el 2026-09-14** contra el fichero del DS con el
server de la nube: página `❖ Breadcrumb` (`6738:52933`), conjunto `breadcrumb-item` (`6115:29096`). Las
dos variantes `Type=Label, Hover=True` (`6115:29104` sin foco y `6115:29419` con foco) solo oscurecen el
texto; ninguna lo subraya. El código ya subraya (DD-103).

**Qué cambia en Figma:**

- **`Type=Label, Hover=True`**, con y sin foco: el texto, subrayado. Grosor y posición los de la fuente;
  el color no cambia respecto a lo que ya dibuja.
- **`Type=Icon, Hover=True`**: sin subrayado. Un icono subrayado no se lee; el icono ya cambia de color.
- **El tramo actual** (el último, en color pleno y peso medio desde el 2026-08-31) **no se subraya nunca**:
  no se puede pulsar. Si el maestro `breadcrumb` (`185:6637`) usa una variante con hover para ese tramo,
  hay que quitársela.
- **La manita no se dibuja**, pero se anota en la descripción del componente: «los tramos que llevan a
  algún sitio muestran la mano; el tramo actual, no». Es lo que hace el código, y quien lea Figma no
  tiene otro sitio donde verlo.

**Lo que dice PrimeNG** ([primeng.dev/breadcrumb](https://primeng.dev/breadcrumb), sección Accessibility,
leída el 2026-09-14):

- La miga es un `nav` y se describe con `aria-label` o `aria-labelledby`.
- Los tramos van en una lista ordenada y los separadores se ocultan al lector de pantalla.
- «Si el último enlace es la ruta actual, se le añade `aria-current="page"`». ⚠️ **PrimeNG Angular no lo
  hace**: medido el 2026-09-14 en sc-docs y en el Supervisor (`null`), y no aparece en
  `primeng-breadcrumb.mjs`. Para Figma no cambia nada; en código queda anotado en el wrapper.
- Teclado: ninguna interacción especial; cada tramo entra en el orden del tabulador.
- Su CSS de la miga no pide la manita en ningún sitio (su menú sí). Por eso la pone nuestro tema.

**Lo que dicen las guías de comportamiento:**

- **W3C, patrón Breadcrumb** ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/)): región de
  navegación con nombre; el enlace a la página actual lleva `aria-current="page"`, y si la página actual
  no es un enlace, es opcional. Sin interacción de teclado propia.
- **Nielsen Norman Group** ([Breadcrumbs: 11 Design Guidelines](https://www.nngroup.com/articles/breadcrumbs/)):
  la miga muestra jerarquía, no historial; incluye la página actual como último tramo, **y ese tramo no es
  un enlace**; se distingue a la vista de los tramos que sí lo son; todos los demás llevan a una página
  real; no se parte en dos líneas.
- **Accesibilidad del repo** (`better-accessibility`): lo que lleva a otra página es un enlace con
  dirección (Cmd+clic, «copiar enlace»), y **un estado no se dice solo con color**. El subrayado es esa
  segunda pista: al pasar el ratón, el padre acaba en el mismo gris que el tramo actual.

**Cómo sabes que está hecho:** captura de `6115:29096` con las dos `Label, Hover=True` subrayadas y las de
icono sin subrayar; el maestro `185:6637` sin subrayado en el último tramo; y la descripción del
componente con la nota de la manita. Luego, publicar la librería (ficha 1).

---

## 7 · Los iconos pintan un tercio más grande en código que en Figma (2026-09-14)

**Estado:** pendiente de decidir cómo se refleja en el fichero · **Sin verificar** contra el fichero del DS:
medido en código (DD-104), no en Figma.

El código calibra el glifo de Material Symbols con `scale: calc(24 / 18)`: la caja del icono mide lo mismo,
pero el dibujo crece hasta ocupar la caja entera, como hacía PrimeIcons, de donde salen los tamaños del Kit.
Un icono de 12 dentro de un botón pinta ahora 12, no 9. En Figma el glifo sigue a su tamaño literal, así que
**toda maqueta con iconos de Material se ve más pequeña que la app**: botones de solo icono, lupa de los
buscadores, índice de las fichas, barra lateral y menús.

- **Qué hay que mirar en el fichero:** si el `IconSet` y los maestros que lo usan atan el glifo al tamaño
  de su caja (W/H atada a la variable de font-size, DD-24). Si es así, la vía más limpia es agrandar el
  glifo dentro de la caja un 33% (24/18) sin tocar la caja, que es lo que hace el código.
- **Dos casos ya corregidos en código:** el índice de Contact Center (`393:12565`, `IconSet` `393:12581` a 20) y
  el de las fichas de agente, grupo y usuario, que es la misma pieza (§5), llevan en código el icono al tamaño de
  su etiqueta (14 de caja). Si en Figma se alinea el glifo, ese 20 debería bajar a 14.
- **Se queda fuera, a propósito:** la réplica `agent` no calibra (DD-35), porque sus tamaños se midieron sobre
  el Comunicador en vivo.

**Cómo sabes que está hecho:** una captura del botón `sm` de solo icono en Figma y otra de
`#/components/button` en sc-docs, puestas lado a lado, pintan la papelera del mismo tamaño.

---

## 8 · Grises intermedios: los textos y la opción no elegida, un paso más oscuros (2026-09-14)

**Estado:** pendiente de hacer en el fichero · decidido por Rafa el 2026-09-14 (DD-106) · **Verificado de
punta a punta en código, no en el fichero**: se simuló este cambio en `kit-export-dtcg.json`, `tokens:import`
lo escribió, se construyó y el Supervisor pintó los grises nuevos (`theme-contrast`: 53 de 53). Las rutas de
variable salen del export; sus nombres en el fichero no se han mirado. Capturas de las tres versiones en
`~/Documents/Claude/2026-09 grises-y-primario/grises-y-primario.html`.

**Cómo se hace, sin crear variables ni tocar la paleta:** cada una pasa a apuntar a otro paso. Todo en modo
claro; el oscuro no se toca.

| Export | Variable | Hoy | Nuevo | Qué consigue |
|---|---|---|---|---|
| `aura/semantic/light` | `text/color` | `surface/700` | **`surface/800`** | texto principal 7,38 → 12,16:1 |
| `aura/semantic/light` | `form/field/color` | `surface/700` | **`surface/800`** | alimenta el mismo `--sc-text-primary` (`color-map.mjs`): se mueven juntas |
| `aura/semantic/light` | `text/muted/color` | `slate/600` | **`slate/700`** | texto secundario 4,52 → 7,38:1 |
| `aura/component/light` | `togglebutton/color` | `surface/500` | **`surface/700`** | opción no elegida de SelectButton 2,56 → 6,40:1 |
| `aura/component/light` | `togglebutton/hover/color` | `surface/700` | **`surface/900`** | que el ratón encima se siga notando |
| `aura/component/light` | `togglebutton/icon/color` | `surface/500` | **`surface/700`** | el icono, igual que su texto |
| `aura/component/light` | `togglebutton/icon/hover/color` | `surface/700` | **`surface/900`** | ídem |

**Dos preguntas para el fichero, de la misma tanda:**

- `text/hover/color` es hoy `surface/800`, el mismo gris que el principal nuevo: el texto con el ratón encima
  dejaría de cambiar. ¿Pasa a `surface/900`?
- `--sc-text-heading` (§2, solo en código) es `slate-800`: con el principal en 800, título y texto miden igual.
  ¿El título sube a `slate-900`?

**Lo que cierra el código cuando llegue el export** (Figma no lo alcanza):

- `togglebutton.ts` lee en claro `{surface.*}` escrito a mano: sus 8 slots de `root` pasan a
  `var(--sc-cmp-togglebutton-*)`, o el cambio de Figma no llega a la pantalla (medido: el export decía 700 y la
  opción seguía pintando 500). El guard ya lo permite (DD-106).
- `--sc-text-subtle` vive fuera de la zona generada: pasa a `slate-700` a mano, con el secundario.
- En `e2e/supervisor/theme-contrast.spec.ts` la excepción `fg=rgb(111,119,132)` (secundario en 600) deja de
  aplicar: se borra.

**Cómo sabes que está hecho:** el PR del robot trae `--sc-text-primary: var(--sc-color-slate-800)` y
`--sc-text-secondary: var(--sc-color-slate-700)` en `02-semantic.css`, y `--sc-cmp-togglebutton-color:
var(--sc-color-slate-700)` en `04-component.css`.

---

## 9 · El Dashboard: lo que PrimeNG ya tiene y el fichero del DS aún no dibuja (2026-09-14)

**Estado:** pendiente · **Verificado el 2026-09-14** con el bridge contra el fichero del DS y contra PrimeOne 4.0.0
(`bJ01Ym4NrCvxFm7dJXvhqp`), y en el código de PrimeNG 22.1.0. Rafa pidió que las piezas del Dashboard (en obra,
rama `arebury/dashboard-adapt-supervisor-monitor`) salgan de los componentes de [primeng.dev](https://primeng.dev)
con los valores y variables de Aura, para que en Figma ya tengan esos valores.

**Lo que ya está en Figma, atado a sus variables** (no hay que hacer nada; sirve para maquetar el Dashboard):

| Pieza del Dashboard | Componente de primeng.dev | En el fichero del DS |
|---|---|---|
| Pestañas de monitor | Tabs | `❖ Tabs` (`6738:49740`): `tabs` `320:12276`, `tabs-tab` `320:12255`, variables `tabs/*` |
| Número de la campana | Badge / OverlayBadge | `❖ Badge` (`6738:55106`): `badge` `330:13237`, `overlaybadge` `6998:92179` |
| Aviso en la cabecera del widget | Tag | `❖ Tag` (`6738:55116`): `tag` `373:13337`, con icono y `Rounded` |
| Barras de proporción | MeterGroup | `❖ MeterGroup` (`6738:55111`): `metergroup` `6962:59067`; alto `metergroup/meters/size` → `scale/0-5` (7) |
| Tarjeta de widget con acciones arriba | Panel con plantilla `icons` | `❖ Panel` (`6738:49736`): `panel` `229:10217`, variante `Custom Icon=True` |
| Lista de entidades con buscador | Listbox | `❖ Listbox` (`6738:22650`): `listbox` `6212:6733` con `Show Filter` |
| Lista del panel de alertas | Menu (popup) y Popover | `❖ Menu` (`6738:52936`), `❖ Popover` (`6738:50211`) |
| Selector de tipo de widget | SelectButton | `❖ SelectButton` (`6738:46433`); no hace rejilla con icono |

**Qué falta en Figma:**

- **Tabs, el peso del texto.** Las tres variantes de `tabs-tab` (`320:12255`) dibujan Inter **Bold 700** con el peso sin
  atar. La variable `tabs/tab/font/weight` existe y vale `semibold` (600), que es lo que dice Aura y lo que pinta el
  código (`sc-preset/tabs.ts`). Atar el peso a la variable.
- **Tabs, las flechas de desbordamiento** (`scrollable` en primeng.dev). Las variables existen (`tabs/nav/button/*`:
  fondo, color, ancho `scale/2-5` = 35, hover, foco) pero no hay dibujo, ni en el DS ni en PrimeOne. En código salen
  cuando las pestañas no caben (`--sc-cmp-tabs-nav-button-width` 35, sombra `--sc-cmp-tabs-nav-button-shadow`).
  Dibujar el botón de cada lado sobre `tabs`.
- **Tabs, la barra activa y los bordes.** Hoy el tab activo la dibuja como borde inferior de 1 en
  `tabs/tab/active/border/color`, y cada tab lleva `tabs/tab/border/width` 1. Desde DD-107 el código sigue a Aura 3:
  la pestaña no tiene borde (`tabs/tab/border/width` → 0, colores de borde transparentes), la tira lleva la raya de
  abajo (`tabs/tablist/border/width`) y la marca de la activa es la barra (`tabs/active/bar/height` 1,
  `tabs/active/bar/bottom` → 0, `tabs/active/bar/background` → primario). Mide lo mismo a la vista.
- **Badge, el punto.** En primeng.dev, un Badge sin valor es un punto (`p-badge-dot`): la pieza que cubre el punto de
  presencia y el de «en vivo» del Dashboard. La variable `badge/dot/size` existe (`scale/0-5`, 7) pero `badge` no tiene variante de
  punto, ni aquí ni en PrimeOne. Añadir `Dot=True` con cada `Severity`.
- **El hueco discontinuo de «Añadir widget».** No hay nada equivalente en PrimeNG, PrimeOne ni el DS, y en el Supervisor
  hay 5 cajas discontinuas hechas a mano con bordes y radios distintos. Es pieza propia: diseñarla en `Custom`
  (`12508:5736`) con un borde, un radio y los dos botones (`Añadir widget` outlined, `Dividir en cuatro` text).
- **Fuera, a propósito:** la sparkline del KPI. primeng.dev la resolvería con Chart (Chart.js), que no está en PrimeOne.

**Cómo sabes que está hecho:** en `❖ Tabs` las tres variantes con el peso atado a `tabs/tab/font/weight` y un `tabs`
con flechas; en `❖ Badge` una variante de punto atada a `badge/dot/size`; y en `Custom` el hueco de añadir. Luego,
publicar la librería (ficha 1).

---

## 10 · Dos buscadores que no se parecen: decisión de Figma, no de código (2026-09-14)

**Estado:** pendiente de decidir en el fichero · **Sin verificar** contra el fichero del DS: sale de
medir la barra de Conversaciones del Supervisor en local (capturas a 3x, 2026-09-14).

En la misma barra conviven dos buscadores del DS que se leen como piezas distintas. Se probó a igualarlos
en código y **se revirtió**: el chrome de un componente del catálogo solo cambia cuando lo dice Figma
(`.impeccable.md`, «Alcance de pulir»). Queda aquí para decidirlo allí.

- **La lupa de `sc-search` es más gruesa que sus vecinos.** Es el glifo `search` de Material Symbols; al
  lado, la flecha del desplegable y el calendario son los SVG finos de PrimeNG. Pregunta para Figma: ¿la
  lupa del Input con icono sigue el trazo de los iconos de campo o el de Material?
- **La lupa del buscador de dentro de un panel va a la derecha** (`p-select` y `p-multiselect`, como
  PrimeNG), y la de `sc-search`, a la izquierda. Pregunta para Figma: ¿en qué lado va la lupa en los dos?
  Si es el mismo, cambiarlo en código cuesta cinco clases `.p-*` en el preset (medido).
- **El texto de una opción NO elegida de `SelectButton` no llegaba a AA.** El Kit pinta `surface.500`
  sobre el gris de su carril: **2,56:1** (el mínimo para texto es 4,5:1). El código ya diverge por AA
  a `surface.700` (6,40:1) y el hover a `surface.900` (customs-catalog §1.10). En Figma:
  `togglebutton/color` en claro al mismo paso, para que el preset deje de divergir.

---

## 11 · Panel en aviso: la variante `Severity` que el código ya tiene (2026-09-14)

**Estado:** pendiente · **Verificado el 2026-09-14** con el bridge: `❖ Panel` (`6738:49736`), conjunto `panel`
(`229:10217`), no tiene variante de aviso; PrimeOne 4.0.0 tampoco.

Desde DD-109, `<sc-panel severity="warn|danger">` pinta el borde del panel en `--sc-border-warning` o
`--sc-border-danger` y un anillo exterior de 1 del mismo color (sombra, no borde: el panel no cambia de tamaño). La
decidió Rafa para las tarjetas de widget del Dashboard en alerta.

**Cómo se hace:** en `panel` (`229:10217`), propiedad `Severity` con `None | Warn | Danger`. En `Warn` y `Danger` el trazo
del panel se ata a `border/warning` y `border/danger` y se añade una sombra exterior sin desenfoque, extensión 1, del
mismo color. Nada más cambia: cabecera, rellenos y radio siguen atados a `panel/*`.

**Cómo sabes que está hecho:** captura de `panel` con `Severity=Warn` y `Severity=Danger` al lado de
`#/components/panel` → «Con aviso» en sc-docs. Luego, publicar la librería (ficha 1).

---

## 12 · El botón rojo en claro, un paso más oscuro por contraste (2026-09-15)

**Estado:** pendiente de hacer en el fichero · **Sin verificar** contra el fichero del DS: sale del export en `main` y del
guard `tokens:cmp-rewire`.

El Kit pinta el botón `danger` sólido en `red/500` con texto blanco: **3,76:1**, no llega a AA. El código usa un paso más
(`red/600`, 4,83:1; hover `red/700`, pulsado `red/800`) y lo declara en `scripts/cmp-color-map.mjs` (EXCLUDE), así que el
generador no emite esos seis `--sc-cmp-button-danger-*`.

**Cómo se hace:** en `aura/component/light`, `button/danger/background` y `border/color` a `red/600`, `hover/*` a `red/700` y
`active/*` a `red/800`. **Cómo sabes que está hecho:** tras exportar, se quitan las seis filas de EXCLUDE, el preset lee
`var(--sc-cmp-button-danger-*)` y `tokens:cmp-rewire` sigue en verde.

---

## Cerrado

- ~~**El título del componente `Section` a `Heading/h3-semibold`**~~ → **HECHO el 2026-09-13**
  (DD-75). Eran **4 capas maestras, no ~35**: la cifra de este fichero mezclaba dos componentes. Las
  del conjunto `Section` son el título de sección y pasaron a `h3`; las 25 de `.Subsection` (15
  maestras y 10 copias) son el segundo nivel y se quedan en `Body/body-semibold`, como en código.
  Verificado leyendo cada capa después y con captura del componente.
- ~~**¿18 o 20?**~~ → **18**, decidido por Rafa el 2026-09-13. Se queda `h3`; no se crea un estilo de 20.
- ~~**`app/typography/xl` y `xxl`**~~ → **BORRADAS el 2026-09-13** (DD-75). Medido antes: 0 aliases,
  0 text styles, 0 capas atadas en las 110 páginas (26.498 textos, con control positivo) y 0 en el
  fichero de Supervisor. Sus valores eran alias: `xl` = size 400 / height 300 y `xxl` = size 450 /
  height 450, en la colección `Custom`, por si hubiera que recrearlas. El export y el mapa de
  cobertura del repo se actualizaron en el mismo cambio, y el CSS generado no se movió.
- ~~**`12/20` no es ningún estilo**~~ → **no era de Figma**, se arregló en código el 2026-09-13
  (DD-75): 96 textos pasan a 12/18 en 11 sitios. **Excepción deliberada: `sc-chip`**, cuyo 20 sí
  está atado en Figma.
- ~~**Las descripciones de los text styles están corridas un peldaño**~~ → **YA NO, verificado el
  2026-09-12.** El hand-off decía que `h1-semibold` reclamaba ser «el texto más grande», que
  `h2-regular` llevaba una descripción de body y que `h1-regular` y `h3-regular` estaban vacías.
  **Ninguna de las cuatro es cierta hoy**: las doce tienen su descripción correcta, con sus medidas.
  Alguien lo arregló entre medias y la bandeja se quedó rancia. Es el motivo de que este fichero
  exija verificar antes de actuar.

---

## Nota de herramienta, que cambia lo que se puede hacer desde aquí

El hand-off da por **bloqueado por herramienta** el 1:1 web↔Figma de chip · tag · toast, porque el
bridge de diario (`figma-console`) se engancha al arrancar la sesión y no se puede añadir a mitad.

**Eso sigue siendo cierto para ESE server, pero no para todos.** El 2026-09-12 se leyó este fichero
—páginas, text styles, variables y las capas de un componente— con el server de la nube
(`plugin:figma:figma`), que además **escribe** por la API de plugins. Si el 1:1 volviera a intentarse,
ese es el camino que hay que probar antes de declararlo bloqueado otra vez.
