# Auditoría · el catálogo de PrimeNG contra el DS

> **Qué es.** Un cruce de tres listas contra PrimeNG **22.1.0** (el de `package-lock.json`): los módulos que trae
> PrimeNG (`node_modules/primeng/fesm2022`), lo que envuelve el DS (`docs/_component-status.json`, columna «PrimeNG
> base») y lo que las apps importan de `primeng/*` directamente. Se hizo el 2026-10-07 (DD-186) y se decidió el
> 2026-10-11 (DD-195). Nace porque `sc-fileupload` (DD-184) existía en PrimeNG desde siempre y se nos pasó.
>
> **Cómo se mantiene.** Lo vigila `npm run audit:primeng-catalog` (dentro de `verify`): se pone rojo si PrimeNG cambia
> de versión, si un módulo no tiene fila, si una app importa algo sin wrapper que la sección 3 no cuenta, si una fila de
> la sección 3 ya no la usa nadie o si algo de la sección 4 empieza a usarse. Las listas las saca el gate; el juicio de
> cada fila, no. Antes de construir una fila de la sección 1, la documentación entera: `node tools/primeng-doc.mjs
> <componente>` (AGENTS.md, «Componentes de primeng.dev»).
>
> ⚠️ **Dos errores de la primera versión, corregidos el 2026-10-11.** Decía PrimeNG 22.1.2: era la versión del
> compilador de Angular que `tools/primeng-doc.mjs` leía dentro del `.mjs` (ya lee `package.json`). Y mandaba quitar
> Sidebar «por obsoleto»: en la 22, `primeng/sidebar` es el menú lateral nuevo (`p-sidebar-layout`, raíl, plegado), no
> el Drawer de antes.
>
> **Para elegir entre hermanos**, la sección 6 agrupa los 109 por el trabajo que hacen y dice, de cada uno, para qué
> sirve y cuándo elegirlo frente a su vecino (2026-10-14). La pinta la página «PrimeNG» de sc-docs, y el gate
> comprueba que la página cuadra con ella.
>
> ⚠️ **Hasta el 2026-10-14 eran 108**: el gate contaba `primeng/compare` como utilidad sin interfaz, y es `p-compare`,
> el sucesor de ImageCompare.

## Cifras

Las da el gate en cada `verify`; estas son las del 2026-10-15.

| | Cuántos |
|---|---|
| Módulos de PrimeNG 22.1.0 con interfaz | 109 (sin contar las utilidades de base, `api`, `dom`, `utils`… ni los iconos) |
| Envueltos por el DS | 38 módulos |
| Usados directamente por alguna app, sin wrapper del DS | 18 (sección 3; cinco son directivas o piezas internas) |
| Sin usar en ninguna parte | 53 (secciones 1, 4 y 5) |

## 1. Lo que PrimeNG trae, no usamos y tiene un caso en el producto

Ordenado por lo que ahorraría. «Caso» es dónde se usaría hoy.

| Prioridad | Componente | Caso en el producto | Decisión (DD-195) |
|---|---|---|---|
| Alta | **InputTags** | «Dominios permitidos» de Web Chat (campo + «Añadir» + chips). También etiquetas libres. | **Hecho**: `sc-inputtags` (wrapper Extended), en los dominios de la ficha de grupo. Sustituye a las tres piezas hechas a mano. |
| Alta | **TreeSelect · Tree** | Las tipificaciones son un árbol de niveles. | **No**: DD-187 §5 dibuja el árbol entero en columnas por nivel (DD-174), con «+» por fila y tirador, que Tree no da; y el grupo elige una tipificación entera (un desplegable), no una hoja. TreeSelect tendría caso en sc-agent, al cerrar una conversación: se decide allí. |
| Alta | **OrderList** | Ordenar columnas en el selector de columnas de los listados. | **No**: DD-176 §7 ya calca el ejemplo «Column Toggle» de primeng.dev (Popover, Checkbox y arrastre), que es nativo; con teclado ordena Alt+↑/↓ (DD-203). OrderList añadiría una segunda lista con sus cuatro botones de mover. |
| Media | **CommandMenu** | La paleta de comandos (Cmd+K). | **No** (revisado): ver `sc-command-palette` en la sección 2. |
| Media | **Rating** | La valoración del chat («de una a cinco estrellas», revisión del 2026-10-06) en el agente y en los informes. | Sin decidir: sería nuevo. |
| Media | **Timeline** | La historia de un ticket en CusCare y la de una conversación en Memory. | Sin decidir. CusCare es réplica (DD-35): allí no se toca. |
| Media | **InputMask** | Teléfonos y extensiones con formato. | Sin decidir: validación propia (`telefonoValido`); ojo con los internacionales. |
| Media | **ConfirmPopup** | Confirmaciones pequeñas junto al botón (quitar un contacto, un trigger). | **Hecho** (DD-205): `sc-confirmdialog` lo monta junto al diálogo y `ScConfirmService.request({ target })` lo abre pegado a lo que pregunta. Lo usan las casillas de «todos» de las tablas de asignar y «Expirar contraseña». |
| Baja | **Accordion · Fieldset** | Los slots plegables («Mensajes en cola») y las subsecciones. | No compensa: `sc-slot collapsible` y `sc-subsection` llevan el árbol del DS (DD-157). |
| Baja | **ContextMenu** | Clic derecho en las filas de los listados. | No en los listados: el «⋮» ya lo cubre. Solo en el laboratorio del árbol (sección 3). |
| Baja | **InputOtp** | Un segundo factor en el acceso, si llega. | Con su pantalla. |
| Baja | **Stepper** | Las altas largas. | Se quitó a propósito (DD-143): no vuelve sin motivo nuevo. |
| Baja | **Knob** | Volúmenes y umbrales. | Con su pantalla. Slider ya se usa: sección 3. |
| Baja | **AutoComplete** | Añadir un agente a un grupo escribiendo su nombre. | No: lo cubre el buscador de la tabla de asignación. |

## 2. Lo nuestro que repite algo nativo

| Nuestro | Nativo | Veredicto | Por qué |
|---|---|---|---|
| `sc-checkbox` (input nativo) | Checkbox | **Mantener** | `p-checkbox` no modela el ciclo ninguno/alguno/todos que piden las casillas de «todos» (su `indeterminate` es binario). Escrito en el componente. |
| `sc-inputnumber` (sobre InputText) | InputNumber | **Mantener** (revisado, DD-195) | El motivo sigue: enteros sin formato. La unidad, los topes y las flechas ya los da, y acota al salir del campo, como `p-inputnumber` (medido en su código: `onInputBlur`, Enter y Tab). Pasarse cambiaría dos cosas a peor: la unidad entraría en el texto del número, con su color, y el valor solo llega tecla a tecla (pegar con el ratón, el dictado o un `fill` esperan a salir del campo). |
| `sc-photo-upload` | FileUpload (basic) + Avatar | **Mantener** | Recorte e ilustración de reserva; decisión §10 del componente. El resto de subidas, `sc-fileupload` (DD-184). |
| `sc-inline-rename-cell` | Inplace | **Mantener** (revisado, DD-195) | No es lo mismo que `sc-name-inplace` (el `p-inplace` nativo del nombre de las fichas, de reposo a edición). La celda no tiene reposo: aparece ya editando tras duplicar una fila, o en el globo de renombrar del Monitor, con confirmar y cancelar. Un `p-inplace` en la fila pelearía con el clic que abre la ficha. |
| `sc-command-palette` | CommandMenu | **Mantener** (revisado) | CommandMenu (22.1.0, `node_modules/primeng/types/primeng-commandmenu.d.ts`) agrupa igual que `sc-command-palette` —un `MenuItem` sin `command`, con `items`, es cabecera de grupo no plegable— y filtra igual o mejor (`filteredModel`, con su `defaultFilter` por etiqueta+`keywords` o un `filter` propio). Pero `sc-command-palette` no es solo esa lista: la mitad de su código es la paleta en sí —Cmd+K/Ctrl+K global, abrir/cerrar, backdrop, Esc, `/` que enfoca el buscador más cercano, resaltado solo con `mousemove` (medido el 2026-08-24, ver el componente)— y CommandMenu no trae nada de eso: es un widget embebido (buscador + lista), no un overlay. Migrar cambiaría el buscador y la lista por los de CommandMenu y dejaría exactamente la misma paleta alrededor, sin ganar la parte que de verdad pesa. |
| `sc-delete-entity-dialog` | ConfirmDialog | **Mantener** | Lista de lo que se borra y su recuento; ConfirmDialog solo da un mensaje. |
| `sc-section-card` · `sc-subsection` · `sc-slot` | Card · Fieldset · Panel | **Mantener** | El árbol del DS (DD-157) con sus fondos y medidas; ninguno de los nativos lo da. |
| `sc-bulk-action-bar` · `sc-sticky-form-header` | Toolbar | **Mantener** | Lógica de selección y de guardado que Toolbar no tiene; la app usa Toolbar directamente donde basta. |
| `sc-color-dot-picker` | ColorPicker | **Mantener** | Elige de la paleta de etiquetas, no un color libre. |
| `sc-gauge` | Knob · ProgressSpinner | **Mantener** | Lectura, no entrada; el anillo del resumen ya es ProgressSpinner (DD-161). |
| `sc-option-cards` | SelectButton · RadioButton | **Mantener** | Opciones que necesitan explicarse; si se explican solas, `sc-selectbutton`. |
| `sc-permission-matrix` | Table + Checkbox | **Mantener** | Casillas de «todos» por columna con el tri-estado de `sc-checkbox`. |

## 3. PrimeNG usado directamente por las apps, sin wrapper del DS

Lo que una pantalla importa de `primeng/*` sin pasar por un `sc-*`. Es legítimo («el nativo tal cual», DD-113), pero sin
wrapper no tiene página en sc-docs ni medida en la línea base de estilos. El gate exige una fila por módulo.

| Módulo | Quién | Veredicto |
|---|---|---|
| Editor | supervisor (el contenido de una plantilla: `template-editor-page`) | El nativo tal cual (DD-113), con su barra a medida del canal (`#header`) y los `formats` que cada canal admite (WhatsApp, solo negrita, cursiva y tachado); el DS ya trae el tema (`sc-preset/editor.ts`). **Riesgo conocido:** PrimeNG avisa de que lo retirará a favor de un editor de pago; el contenido que guarda (HTML saneado, o el texto de WhatsApp) no depende de Quill, así que cambiarlo solo toca la página del editor. Sin wrapper todavía: una pantalla. |
| Menu | supervisor (el menú de fila de Reglas, Entidades y la agenda; el «⋮» de las pestañas del Monitor; los datos de prueba de Conversaciones, candidato 28) | En la página PrimeNG de sc-docs (nota de abajo); envolverlo, si llega a hacer falta. |
| TieredMenu | supervisor (el «⋮» de cada widget del Monitor, candidato 24 del barrido) | El nativo tal cual (DD-113, DD-205): Tipo y Canal son submenús y el menú se queda en cuatro filas. El rojo de «Quitar widget» lo pone el tema (`sc-menu-item--danger`, también sobre `p-tieredmenu-item-*`). En la página PrimeNG de sc-docs (nota de abajo). |
| Listbox | supervisor (Numeración especial y Regeneración de contraseñas, en Sistema; el asistente de widgets), cuscare | En la página PrimeNG de sc-docs (nota de abajo). |
| Slider | supervisor (la barra del reproductor de Memory, candidato 1 del barrido) | El nativo tal cual (DD-113): el DS ya trae el tema (`sc-preset/slider.ts`). En la página PrimeNG de sc-docs (nota de abajo). |
| Toolbar | supervisor | En la página PrimeNG de sc-docs (nota de abajo). |
| Checkbox | supervisor (el «Column Toggle», DD-176 §7), sc-docs | **Bien directo** (revisado): el «Column Toggle» calca el ejemplo nativo de primeng.dev (DD-176 §7), que liga cada casilla a un array por `[value]` + un `ngModel` compartido. `sc-checkbox` no modela ese patrón — su `state` es `input.required<TriState>()` (none/some/all), pensado para una casilla de «todos» por columna, no para una lista de casillas binarias independientes (`projects/ui-smartcontact/src/lib/components/checkbox/sc-checkbox.component.ts`). Dos casillas con trabajos distintos, no una inconsistencia. |
| Inplace | supervisor (`sc-name-inplace`) | Bien directo: ver sección 2. |
| MeterGroup | supervisor (resumen de grupo) | En la página PrimeNG de sc-docs (nota de abajo). |
| Tooltip · AutoFocus · ScrollArea · DynamicDialog · InputGroupAddon | supervisor, sc-docs | Directivas y piezas internas de otro componente: bien directas. |
| ToggleButton | cuscare | Réplica (DD-35): no se toca. |
| Sidebar | supervisor (página de laboratorio) | **Se queda.** Es el menú lateral nuevo de la 22, en prueba para la versión «no se cierra nada» del sidebar (frente `supervisor-sidebar`, DD-118). |
| Rating | supervisor (`lab/tabla`, celda de «Valoración» en modo `readonly`) | El nativo tal cual (DD-113): el DS ya trae el tema listo (`sc-preset/rating.ts`), sin wrapper propio todavía. Demuestra contenido rico en celda (estrellas), no sustituye ningún componente del DS. |
| TreeTable | supervisor (`lab/arbol`) | El nativo tal cual: el DS ya trae el tema listo (`sc-preset/treetable.ts`), sin wrapper propio todavía. Jerarquía de verdad (equipos → agentes), no una tabla plana, no sustituye a `sc-datatable`. |
| ContextMenu | supervisor (`lab/arbol`, «Menú contextual») | El nativo tal cual, solo en el laboratorio: es el ejemplo «ContextMenu» de primeng.dev/treetable (`ttContextMenuRow`), en el `body` para que salga en el clic. En los listados sigue sin caso: el «⋮» ya lo cubre. |

**Tabs** ya tiene wrapper (`sc-tabs`, DD-195): Plantillas, el reproductor de Memory y la página «Uso» de sc-docs lo
usan. Solo las pestañas del Monitor siguen en `p-tabs` directo: se arrastran para ordenarse y se renombran con doble
clic, y eso necesita sus directivas sobre cada `p-tab`.

**Dónde vive en sc-docs un nativo sin wrapper** (decidido el 2026-10-14): en la página **Todo PrimeNG** de sc-docs (`/#/components/primeng`, bajo Componentes),
que pinta la sección 6 con todos los módulos, su estado y su enlace a primeng.dev. Una página para todos, no una por
nativo: se descartaron una categoría «Nativos» con una página por módulo (más trabajo y no enseña lo que no se usa) y
las dos a la vez. Una página propia para un nativo se abre si llega a usarse en tres pantallas o más.

## 4. Sin caso en el producto hoy

Carousel, Galleria, Gallery, Image, ImageCompare, Compare, Dock, SpeedDial, Terminal, OrganizationChart, PickList, DataView,
MegaMenu, Menubar, PanelMenu, Splitter, ScrollTop, BlockUI, CascadeSelect, ButtonGroup, SplitButton,
FloatLabel, IftaLabel, InputColor, KeyFilter, Chart, Steps (la documentación ya no lo trae; su sucesor es Stepper).
Se reabren si aparece el caso.

## 5. Directivas, piezas de otros componentes y obsoletos

No se deciden solos: van dentro de otro componente o son ayudas de una plantilla.

- **Piezas de otro componente**: Paginator (de Table), Overlay (el globo de Select, AutoComplete…), Scroller (la lista
  virtual de Table y Select).
- **Directivas**: Ripple, StyleClass, FocusTrap, AnimateOnScroll, DragDrop (el arrastre del repo es el de CDK), Fluid,
  Label (`pLabel`).
- **Obsoletos en la 22**: Password (lo sustituye InputPassword, que envuelve `sc-password`) y ScrollPanel (lo sustituye
  ScrollArea).

## 6. Por familias: para qué sirve cada uno y cuándo elegirlo

Los 109, agrupados por el trabajo que hacen. Un uso equivocado casi nunca es «este componente no sirve»: es que su
**hermano** encajaba mejor en ese caso. Cada familia empieza por la pregunta que decide entre hermanos.

- **Fuente**: la descripción y la API de la versión instalada (`node_modules/primeng/types/primeng-<x>.d.ts`, también lo
  OBSOLETO) y la documentación (`node tools/primeng-doc.mjs <x>`). La columna «Elígelo cuando…» es juicio nuestro sobre
  esa fuente: para construir, la documentación entera sigue mandando.
- **«Aquí»** es lo que mide el gate hoy: el wrapper del DS que lo envuelve, la app que lo usa sin wrapper, o «sin uso»
  con la decisión que lo dejó fuera (secciones 1 a 5).
- **Obsoleto** quiere decir marcado `@deprecated` en la 22.1.0: funciona, pero PrimeNG ya dice qué lo sustituye.

### 6.1 Elegir de una lista

¿Cuántas opciones hay, caben a la vista y el usuario sabe ya lo que busca?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| Select | Uno de una lista cerrada que se despliega. | Hay más de 5 opciones o poco sitio. `filter` si pasan de unas 15 y hay que buscar; `group` si llevan cabeceras de grupo (un solo nivel). Con niveles de verdad, TreeSelect o CascadeSelect. | `sc-select` |
| MultiSelect | Varios de una lista que se despliega. | Obsoleto: PrimeNG pide `p-select` con `multiple`. Lo envolvemos igual porque a `multiple` le faltan seis entradas que usamos (handoff del DS, «Fuera de PrimeNG jubilado»). | `sc-multiselect` |
| Listbox | La lista siempre a la vista; uno o varios. | Hay sitio y ver todas a la vez ayuda (comparar, revisar lo marcado). Trae `checkbox`, `filter`, `showToggleAll` y `dragdrop` para ordenar en la misma lista. | Sin wrapper: supervisor y cuscare-ds (sección 3) |
| AutoComplete | Escribir y elegir entre sugerencias. | La lista es larga o vive en el servidor y el usuario sabe qué busca. `multiple` para varios; `forceSelection` si solo vale lo de la lista. | Sin uso: descartado para añadir agentes a un grupo (sección 1) |
| SelectButton | Pocas opciones como botones, todas a la vista. | De 2 a 5 opciones cortas que se entienden sin explicar y se cambian a menudo. Para cambiar de colección, Tabs. | `sc-selectbutton` (DD-113) |
| RadioButton | Una de pocas opciones, cada una con su texto. | Las opciones necesitan una frase para entenderse o compararse. Si se explican solas, SelectButton. | `sc-radiobutton`; `sc-option-cards` cuando cada opción se explica (sección 2) |

### 6.2 Sí o no

¿El cambio se aplica al momento o al guardar?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| Checkbox | Marcar sí o no, o varios de una lista corta. | El cambio se confirma al guardar, o la casilla es parte de una lista. | `sc-checkbox` propio, con su tri-estado (sección 2); `p-checkbox` directo en el «Column Toggle» (sección 3) |
| ToggleSwitch | Encender o apagar algo. | El efecto es inmediato (habilitado, activo). | `sc-toggleswitch` |
| ToggleButton | Un botón que se queda pulsado. | Una barra de herramientas (silenciar, negrita), donde un interruptor desentona. | Sin wrapper: cuscare-ds; en cuscare, réplica (DD-35) |

### 6.3 Elegir en una jerarquía

¿Vale elegir cualquier nivel o solo el último? ¿La jerarquía es un campo o es la pantalla?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| TreeSelect | Un desplegable con un árbol: uno, varios o con casillas (`selectionMode`). | Las opciones tienen niveles, vale elegir cualquiera y ayuda ver el árbol para orientarse. `filter` busca dentro. | Sin uso: descartado para tipificaciones (DD-195); caso abierto en sc-agent, al cerrar una conversación |
| CascadeSelect | Un desplegable por niveles, en columnas que se abren una tras otra. | Hay que llegar a una hoja por pocos niveles bien conocidos (país, provincia, ciudad). No busca ni elige varias, y solo elige hojas. | Sin caso hoy (sección 4) |
| Tree | El árbol a la vista, con selección, casillas, arrastre y filtro. | La jerarquía es el contenido de la pantalla, no un campo. | Sin uso: descartado para tipificaciones, que se dibujan en columnas por nivel (DD-174, DD-195) |

### 6.4 Ordenar y repartir

¿Se ordena una lista o se reparte entre dos?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| OrderList | Ordenar una lista con botones de mover y arrastre. | Ordenar es la tarea entera. Para ordenar y además marcar, Listbox con `dragdrop` y `checkbox`. | Sin uso: descartado para las columnas (DD-176 §7) |
| PickList | Dos listas: pasar elementos de una a otra. | Repartir un conjunto entre «disponibles» y «elegidos» viendo los dos lados, sobre todo si son cientos y hay que buscar. | Sin caso hoy (sección 4); se valoró para las columnas (DD-162) |

### 6.5 Escribir texto

¿El texto tiene formato fijo, caracteres prohibidos o varias líneas?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| InputText | Una línea de texto. | La base de cualquier campo de texto. | `sc-inputtext` (y por dentro de `sc-inputnumber` y `sc-search`) |
| Textarea | Varias líneas, con `autoResize`. | El texto puede pasar de una línea (notas, mensajes). | `sc-textarea` |
| InputMask | Texto con un formato fijo (`99/99/9999`, `aaa-999`). | El formato es fijo y conocido. Con teléfonos internacionales, de largo variable, no encaja. | Sin uso: «sin decidir» para teléfonos (sección 1) |
| KeyFilter | Directiva que impide teclear lo que no vale (`int`, `num`, `alphanum`, `email` o una expresión). | Hay que restringir caracteres sin imponer un formato (solo cifras, sin espacios). | Sin caso hoy (sección 4) |
| InputOtp | Casillas para un código de un solo uso (`length`, `integerOnly`). | Códigos de verificación. | Sin uso: con su pantalla (sección 1) |
| InputPassword | Contraseña con el ojo para verla. | Siempre que se pida una contraseña. | `sc-password` (DD-110) |
| Password | La de antes, con medidor de fuerza. | Obsoleto: InputPassword. | Sin uso (sección 5) |
| Editor | Texto con formato (negrita, listas, enlaces). | El contenido necesita formato. Obsoleto: PrimeNG lo retirará a favor de un editor de pago. | En uso: el contenido de las plantillas (sección 3) |
| InputTags | Varias etiquetas libres, con sugerencias si se quiere (`typeahead`). | El usuario escribe valores nuevos (dominios, palabras clave). Si solo valen los de una lista, MultiSelect o AutoComplete `multiple`. | `sc-inputtags` (DD-195) |

### 6.6 Números, fechas y colores

¿Importa la cifra exacta o el orden de magnitud?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| InputNumber | Número con formato, topes y flechas. | Cifras con moneda, decimales o separadores. Los enteros sin formato van por `sc-inputnumber` propio (sección 2). | `sc-inputnumber` va sobre InputText, no sobre este |
| Slider | Un valor o un rango (`range`) arrastrando. | Importa más el rango que la cifra exacta (volumen, umbral), y la cifra se ve al lado. | Sin wrapper: supervisor (sección 3) |
| Knob | Un dial para un número. | Casi nunca en una app de gestión: ocupa mucho y se lee peor que un Slider. | Sin uso: con su pantalla (sección 1) |
| Rating | Estrellas para valorar, o para leer una valoración (`readonly`). | Valoraciones de 1 a N. | Sin wrapper: supervisor (`lab/tabla`, solo lectura); «sin decidir» para la valoración del chat |
| DatePicker | Fecha, rango (`selectionMode="range"`), hora o mes. | Cualquier fecha u hora. | `sc-datepicker` |
| ColorPicker | Un color libre. | Obsoleto: InputColor. | Sin uso; `sc-color-dot-picker` elige de la paleta (sección 2) |
| InputColor | Selector de color por piezas (área, deslizadores, cuentagotas). | El color es libre. Si sale de una paleta cerrada, `sc-color-dot-picker`. | Sin caso hoy (sección 4) |

### 6.7 Montar un campo

Piezas que van alrededor de un campo, no campos.

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| IconField e InputIcon | Un icono dentro del campo. | Buscadores, o un icono que dice algo del valor. | Por dentro de `sc-search` |
| InputGroup e InputGroupAddon | Pegar al campo un texto, icono o botón. | La pieza es parte del valor (unidad, prefijo) o una acción del campo. | `sc-inputgroup`; el Addon, directo en supervisor (sección 3) |
| FloatLabel | La etiqueta dentro del campo, que sube al escribir. | Formularios muy densos. Choca con el campo del DS, rótulo encima (DD-44). | Sin caso hoy (sección 4) |
| IftaLabel | La etiqueta fija arriba, dentro del campo. | Lo mismo que FloatLabel. | Sin caso hoy (sección 4) |
| Label | Tema para `<label>` (`pLabel`). | Pieza de los campos. | Sección 5 |
| Fluid | Que los campos de dentro ocupen todo el ancho. | Formularios a una columna. | Sección 5 |

### 6.8 Acciones

¿Hay una acción principal con variantes, o varias del mismo peso?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| Button | Una acción. | Obsoleto como componente: la 22 pide la directiva `[pButton]`. | `sc-button`, todavía sobre el componente (handoff del DS, «Fuera de PrimeNG jubilado») |
| ButtonGroup | Varios botones pegados en un bloque. | Acciones hermanas del mismo peso. Si se elige una entre ellas, SelectButton. | Sin caso hoy (sección 4) |
| SplitButton | Una acción por defecto y sus variantes en un menú pegado. | Hay una acción principal clara y dos o más variantes («Guardar» y «Guardar como borrador»). | Sin caso hoy (sección 4) |
| SpeedDial | Un botón flotante que abre varias acciones. | Móvil o lienzos; no en escritorio de gestión. | Sin caso hoy (sección 4) |
| Toolbar | Barra con zonas de inicio, centro y fin. | Agrupar las acciones de una vista o de una tabla. | Sin wrapper: supervisor y cuscare-ds (sección 3) |
| CommandMenu | Lista de comandos con buscador, dentro de la página. | Una paleta embebida. La de Cmd+K es `sc-command-palette` (sección 2). | Sin uso (sección 2) |

### 6.9 Menús

¿Tiene niveles? ¿Es navegación o acciones sobre algo?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| Menu | Lista de acciones, fija o emergente (`popup`); con `toggleable`, grupos plegables. | El «⋮» de una fila, el menú de usuario. Desde la 22 sustituye a PanelMenu. | Sin wrapper: supervisor (sección 3) |
| TieredMenu | Menú con submenús en capas. | Acciones con un segundo nivel. | Sin wrapper: el «⋮» de cada widget del Monitor (sección 3) |
| ContextMenu | Menú al clic derecho o pulsación larga. | Un atajo de lo que ya está en el «⋮», nunca el único camino. | Sin wrapper: supervisor, solo en `lab/arbol` (sección 3); en los listados, descartado: el «⋮» lo cubre (sección 1) |
| Menubar | Menú horizontal con desplegables. | La navegación superior de una web. | Sin caso hoy (sección 4) |
| MegaMenu | Submenús en columnas, todos a la vez. | Navegaciones con muchas secciones. | Sin caso hoy (sección 4) |
| PanelMenu | Menú vertical en acordeón. | Obsoleto: Menu con `toggleable`. | Sin caso hoy (sección 4) |
| Dock | Barra de iconos al estilo de un escritorio. | Lanzadores; sin caso en gestión. | Sin caso hoy (sección 4) |

### 6.10 Navegar

¿Cambias de sitio, de vista hermana o de paso?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| Breadcrumb | Dónde estás en la jerarquía de páginas. | Páginas de detalle bajo un listado. | `sc-breadcrumb` (DD-33) |
| Tabs | Vistas hermanas en el mismo sitio. | Cambiar de colección o de vista (DD-113). Para filtrar la misma lista, SelectButton. | `sc-tabs`; `p-tabs` directo en el Monitor (sección 3) |
| Stepper | Pasos en orden; `linear` impide saltarse uno. | El orden importa de verdad y cada paso depende del anterior. | Quitado a propósito de las altas (DD-143) |
| Steps | Indicador de pasos. | Fuera de la documentación; su sucesor es Stepper. | Sin caso (sección 4) |
| Sidebar | El menú lateral nuevo de la 22 (raíl, plegado, `collapsible`). | La navegación principal de una app. | Sin wrapper: supervisor, en laboratorio (DD-118) |
| Paginator | Páginas de una colección. | Pieza de Table y DataView; suelto, en una lista propia. | Sección 5 |
| ScrollTop | Botón de volver arriba. | Páginas muy largas. | Sin caso hoy (sección 4) |

### 6.11 Capas

¿El usuario necesita ver lo de detrás mientras la usa? ¿Hay algo que pulsar dentro?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| Dialog | Ventana modal con contenido propio. | Una tarea que se termina o se cancela antes de seguir. | `sc-dialog` (DD-140) |
| DynamicDialog | El mismo diálogo, abierto desde código con un componente dentro. | El contenido es un componente que se abre desde varios sitios. | `ScDynamicDialogService`; directo en sc-docs (sección 3) |
| Drawer | Un panel que sale de un borde (`position`). | Consultar o editar algo sin perder la pantalla de detrás. | `sc-drawer` |
| Popover | Una capa pegada a su botón, con contenido libre. | Contenido pequeño e interactivo (filtros, columnas, una ficha corta). | Por dentro de `sc-column-selector` y `sc-group-popover`; directo en supervisor y cuscare-ds |
| Tooltip | Texto de ayuda al pasar o al enfocar. | Solo texto, nunca algo que pulsar. | Por dentro de `sc-button` (DD-200); directo en supervisor y cuscare-ds |
| Overlay | La capa de Select, AutoComplete y compañía. | Pieza interna. | Sección 5 |
| BlockUI | Tapa una zona o la página mientras algo trabaja. | Una operación que no admite cambios mientras dura. | Sin caso hoy (sección 4) |

### 6.12 Confirmar y avisar

¿Es grave? ¿Tiene que quedarse a la vista?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| ConfirmDialog | Una pregunta de sí o no en un modal. | La consecuencia hay que explicarla (borrar una rama con sus hijas) o no hay un botón al que pegarse (al guardar, al salir). Para borrar una entidad, `sc-delete-entity-dialog` (sección 2). | `sc-confirmdialog` |
| ConfirmPopup | La misma pregunta, pegada al botón que la lanza. | Una pregunta de una frase sobre lo que se acaba de pulsar, aunque no se deshaga (DD-205). | `sc-confirmdialog` con `target` en `ScConfirmService.request` |
| Toast | Aviso flotante que se va solo (`life`). | Confirmar que algo pasó («Guardado») sin interrumpir. | `sc-toast` |
| Message | Aviso dentro de la página. | Algo que hay que leer en su sitio y se queda. | `sc-message` |

### 6.13 Agrupar contenido

¿La caja se pliega? ¿El usuario reparte el sitio?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| Card | Una caja de contenido. | Bloques sueltos. Para las secciones de una pantalla, `sc-section-card` (DD-57). | `sc-card` |
| Panel | Una caja con cabecera que se pliega (`toggleable`). | Bloques plegables sueltos. | `sc-panel` |
| Fieldset | Un grupo de campos con leyenda, plegable. | Agrupar campos. Aquí lo hace `sc-subsection` (DD-157). | Descartado (sección 1) |
| Accordion | Varias secciones plegables, una o varias abiertas (`multiple`). | Mucho contenido secundario que se consulta a trozos. | Descartado frente a `sc-slot collapsible` (DD-157) |
| Divider | Una línea que separa. | Separar dos bloques. | `sc-divider` |
| Splitter | Paneles cuyo tamaño ajusta el usuario. | Un maestro y detalle donde el usuario quiere repartir el ancho. | Sin caso hoy (sección 4) |
| ScrollArea | Zona con scroll y barras con el tema. | Zonas con scroll propio. | Sin wrapper: supervisor (sección 3) |
| ScrollPanel | La de antes. | Obsoleto: ScrollArea. | Sin uso (sección 5) |
| Inplace | Un dato que al pulsarlo se vuelve editable. | Editar un dato suelto sin abrir un formulario. | Sin wrapper: `sc-name-inplace` del supervisor (sección 2) |

### 6.14 Datos y colecciones

¿Cada elemento es una fila, una tarjeta o un momento? ¿Tiene hijos?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| Table | Filas y columnas con orden, filtro, selección, páginas y lista virtual. | Comparar registros por columnas. | `sc-datatable` |
| TreeTable | Una tabla cuyas filas se despliegan en hijas. | Los registros tienen padre e hijos y además columnas. | Sin wrapper: supervisor (`lab/arbol`) |
| DataView | Lista o rejilla de tarjetas con orden y páginas (`layout`). | Cada elemento es una tarjeta, no una fila. | Sin caso hoy (sección 4) |
| Timeline | Eventos en orden temporal. | La historia de algo (un ticket, una conversación). | Sin uso: «sin decidir» (sección 1) |
| OrganizationChart | Un organigrama. | Jerarquías que se leen dibujadas. | Sin caso hoy (sección 4) |
| Scroller | Lista virtual para miles de elementos. | Listas muy largas fuera de una tabla o un Select. | Sección 5 (pieza de Table y Select) |
| Carousel | Elementos que pasan de lado. | Rara vez en una app de gestión. | Sin caso hoy (sección 4) |

### 6.15 Estado, identidad y progreso

¿Se lee, se quita o se espera?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| Tag | Etiqueta de solo lectura (estado, categoría). | Leer un estado. Si el usuario la quita, Chip. | `sc-tag` |
| Chip | Un valor elegido que se puede quitar. | Lo elegido se quita con su ×. | `sc-chip` |
| Badge | Una cifra o un punto pequeño. | El contador de una pieza. | `sc-badge` |
| OverlayBadge | El Badge encima de otro elemento. | Avisos sobre un icono o un avatar. | Por dentro de `sc-avatar`; directo en supervisor |
| Avatar | Una persona: foto, iniciales o icono. | Identificar a alguien. | `sc-avatar` |
| AvatarGroup | Varios avatares apilados. | Un grupo de personas en poco sitio. | `sc-avatargroup` |
| ProgressBar | Progreso con cifra, o sin ella mientras no se sabe. | Esperas de 3 a 10 s, con cifra (DD-188). | `sc-progressbar` |
| ProgressSpinner | Un giro de espera. | Esperas cortas en una pieza; para una pantalla, Skeleton. Aquí también es el anillo del resumen (DD-161). | `sc-progressspinner` |
| MeterGroup | Varias medidas en una barra. | Cómo se reparte un total. | Sin wrapper: supervisor, resumen de grupo (sección 3) |
| Skeleton | El hueco con la forma de lo que viene. | Cargas de 1 a 3 s (DD-188, DD-201). | `sc-skeleton` |

### 6.16 Archivos, imágenes y gráficos

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| FileUpload | Subir archivos: botón suelto o lista con arrastre. | Cualquier subida (DD-184). La foto de perfil, `sc-photo-upload` (sección 2). | `sc-fileupload` |
| Gallery | La galería nueva de la 22: pantalla completa, zoom, girar, descargar. | Ver imágenes en grande. Sustituye a Galleria e Image. | Sin caso hoy (sección 4) |
| Galleria | La galería de antes. | Obsoleto: Gallery. | Sin caso (sección 4) |
| Image | Imagen con vista previa. | Obsoleto: Gallery. | Sin caso (sección 4) |
| ImageCompare | Comparar dos imágenes con un tirador. | Obsoleto: Compare. | Sin caso (sección 4) |
| Compare | Dos imágenes o vistas una sobre otra, con un tirador que se mueve también con teclado. | Enseñar un antes y un después. Sustituye a ImageCompare. | Sin caso hoy (sección 4) |
| Chart | Gráficos sobre Chart.js. | Obsoleto: PrimeNG lo retirará a favor de gráficos de pago. | Sin caso hoy (sección 4) |

### 6.17 Directivas y utilidades

Ayudas de plantilla; no se eligen frente a un hermano.

| Componente | Para qué sirve | Aquí |
|---|---|---|
| AutoFocus | Pone el foco en un elemento al cargar. | Directo en supervisor (sección 3) |
| FocusTrap | Mantiene el foco dentro de una zona al tabular. | Sección 5 |
| DragDrop | Arrastrar y soltar (`pDraggable`, `pDroppable`). | Sección 5: el arrastre del repo es el de CDK |
| AnimateOnScroll | Anima al entrar o salir de la vista. | Sección 5 |
| Ripple | La onda al pulsar. | Sección 5 |
| StyleClass | Pone y quita clases al entrar o salir. | Sección 5 |
| Terminal | Una consola de texto. | Sin caso hoy (sección 4) |

## 7. Barrido de usos: dónde un hermano encajaría mejor (2026-10-14)

Con la sección 6 delante se repasó cada uso en `projects/supervisor` y `projects/cuscare-ds` (las réplicas no, DD-35),
en cuatro familias: elegir, capas y avisos, acciones y menús, escribir y enseñar datos. **Es lectura de código, no
medida en el navegador**: cada fila dice qué falta medir. Nada está decidido; lo que se decida va a una DD y, si es una
regla, a la tabla «Bifurcaciones al componer» de AGENTS.md.

Casi todos los usos están bien elegidos o ya los decidió una DD; salen 25 candidatos. Donde más pesan es en piezas hechas a mano que imitan a un nativo (un `role="slider"`, un `role="menu"`, un
grupo de radios con botones) y no traen su teclado. Desde el 2026-10-15 esas piezas las vigila `audit:screen-hygiene` (8),
que al estrenarse sumó cuatro que el barrido no vio: del 26 al 29.

### 7.1 Teclado y lector que hoy no funcionan

| # | Dónde | Hoy | Encajaría | Qué cambia para el usuario | Confianza y qué falta |
|---|---|---|---|---|---|
| 1 | Memory, reproductor (`conversation-player-modal.component.html:36`; el de varias grabaciones, `multi-recording-player.component.html:38`) | Un `<button role="slider">` que solo atiende al clic | `p-slider` (flechas, Inicio, Fin, arrastre; el tema ya está en `sc-preset/slider.ts`) | Avanzar y retroceder la grabación con el teclado, y arrastrar | Alta en el de una grabación; media en el de varias, partido en tramos |
| 2 | Configuración › Sistema, Numeración especial (`numeracion-especial-section.component.html:22`) | 236 países, cada uno un botón con una casilla y otro botón dentro | `p-listbox` con `multiple`, `checkbox`, `filter` y `virtualScroll` | Una parada de Tab y flechas, en vez de dos o tres paradas por país | Alta; contar las paradas en local |
| 3 | Configuración › Sistema, Regeneración de contraseñas (`sistema-page.component.html:199`) | 500 agentes en filas-botón con casilla, sin lista virtual | `p-listbox` con `showToggleAll`, o `sc-datatable` con selección si hacen falta columnas | Marcar cientos con flechas y Espacio, sin pintar 500 filas | Alta en el problema; la casilla «todas» de Listbox no tiene estado intermedio |
| 4 | Barra superior, menú del avatar (`top-bar.component.html:82`) | Un `div role="menu"` a mano: no mete el foco, sin flechas, con contenido que no es opción dentro | `p-menu` con `popup`, la identidad en `#start`, como los otros nueve menús | Abrirlo y recorrerlo con teclado como cualquier «⋮» | Alta; mantener que «Cerrar sesión» navegue primero (DD-110 §5) |
| 5 | Todo el Supervisor, hoja de atajos con `?` (`sc-keyboard-shortcuts`) | Capa propia con `aria-modal`, sin meter, retener ni devolver el foco | `sc-dialog` (DD-140) | Quien usa teclado entra al abrirla y vuelve a su sitio al cerrarla | Alta |
| 6 | Reglas de Memory, valor de una condición (`rule-condition-value-picker.component.html:1`) | Desplegable a mano: 500 agentes como botones; la tipificación, un árbol de tres niveles aplanado | MultiSelect con `group` y `filter`; para la tipificación, **TreeSelect** con `selectionMode="checkbox"` y sin propagar | Teclado y lector como en cualquier desplegable | Media; preguntar si elegir «Ventas» incluye sus hijas. DD-195 descartó TreeSelect para otro caso, no este |
| 7 | Ficha de grupo, estrategia en el resumen (`group-summary.component.html:104`) | Tres `<button role="radio">` con su ayuda | `sc-option-cards` (radios nativos) | Flechas entre opciones, y un grupo de radios de verdad para el lector | Media; medir si cabe en 240 px |
| 8 | Monitor, categoría del asistente de widgets (`widget-assistant.component.html:15`) | Seis `<button role="radio">` | `sc-selectbutton` con `#item` | Flechas entre opciones | Media-baja; puede no caber |
| 26 | Etiquetas, el color de una etiqueta (`sc-color-dot-picker.component.html:1`, del DS) | Botones con `role="radio"`, sin flechas | `sc-selectbutton` con `#item`, o radios nativos | Flechas entre colores, como en cualquier grupo de opciones | Media; lo cazó el gate, sin medir |
| 27 | Lab, selector de columnas (`sc-column-selector.component.html:12`, del DS) | `role="menu"` sobre casillas nativas | `sc-multiselect iconOnly`, como las tablas (DD-153) | El lector deja de anunciar un menú que no lo es | Media; solo lo usan el Lab y su demo de sc-docs |
| 28 | Memory, selector de datos de prueba (`mock-sample-switcher.component.html:19`) | `role="menu"` con `menuitemradio` a mano dentro de un Popover | `p-menu` con `popup` | Abrirlo y recorrerlo con teclado | Baja; es una herramienta de demo |
| 29 | Etiquetas, Repositorios y Plantillas, el panel de alta en línea (`label-form-panel`, `repo-form-panel`, `template-form-panel`) | `role="dialog"` no modal: mete el foco y cierra con Escape | Medir si devuelve el foco al cerrar; si no, `p-popover` o `sc-dialog` | Quien usa teclado vuelve a su sitio al cerrar | Baja; puede estar bien, falta medirlo |

### 7.2 Avisos y confirmaciones fuera de su sitio

| # | Dónde | Hoy | Encajaría | Qué cambia para el usuario | Confianza y qué falta |
|---|---|---|---|---|---|
| 9 | Fichas de agente y de usuario, foto rechazada (`sc-photo-upload.component.ts:94`) | Toast abajo a la derecha que se va a los 3,5 s | `sc-message` de error bajo la foto (DD-191) | Ve junto a la foto por qué no entró, y no se le escapa | Alta. `audit:screen-hygiene` no ve los toasts que lanza un wrapper del DS |
| 10 | Tablas de asignación, casillas de «todos» (`agent-channel-table.component.ts:379`, `group-assignment-table.component.ts:350`) | Modal centrado con una línea, que tapa la tabla | ConfirmPopup pegado a la casilla | Pregunta junto a la columna, con las filas que cambian a la vista | Media-alta; ver dónde cae a 1440 y mantener el nombre del `alertdialog` que busca el e2e |
| 11 | Tipificación, borrar una opción con hijas (`tipificacion-niveles.component.html:99`) | `sc-dialog` de una línea que tapa las hijas | ConfirmPopup en la papelera, con el foco en «Cancelar» | Ves qué rama se va mientras decides | Alta |
| 12 | Memory, descargar desde el reproductor (`conversation-player-modal.component.html:92`) | Un segundo modal con casillas, como mucho una activa; sin grabación, todo apagado | Descargar directamente y apagar el botón si no hay nada | Un clic en vez de dos, y ningún modal sin salida | Media; preguntar si el SC real lo pide para una sola |
| 13 | Ficha de agente, «Expirar contraseña» (`agent-form-page.component.ts:1105`) | Modal centrado de una frase | ConfirmPopup junto al botón | Pregunta y resultado en el mismo sitio | Alta; acción rara |
| 14 | Listados, número que despliega nombres (`sc-group-popover`) | Popover con `role="dialog"` sin nada que pulsar; el lector no dice los nombres | `pTooltip` con plantilla, como la celda Niveles | Con lector se oyen los nombres | Media; leer el árbol de accesibilidad |
| 15 | Diálogo de borrar, «Copiado» (`sc-delete-entity-dialog.component.ts:165`) | Toast además del ✓ | Solo el ✓; el fallo, en `sc-message` | Un aviso menos y el error no se va solo | Alta; valor bajo |

### 7.3 Campos que aceptan cualquier cosa, o piden más pasos de los necesarios

| # | Dónde | Hoy | Encajaría | Qué cambia para el usuario | Confianza y qué falta |
|---|---|---|---|---|---|
| 16 | Entidades, sinónimos de un valor (`entity-form-modal.component.html:95`) | Texto separado por comas | `sc-inputtags` (DD-195) | Cada sinónimo se ve como se guarda y se quita con su × | Alta |
| 17 | Configuración › Servicio, motivos de «No disponible» (`aed-servicio-page.component.html:118`) | Chips, «Añadir» que se vuelve campo, error de repetido a mano | `sc-inputtags` | Pegar varios de una vez, igual que Dominios | Media-alta; el wrapper no expone `#item` para el rojo |
| 18 | Ficha de agente, teléfono y PIN (`agent-form-page.component.html:237` y `:298`) | Teléfono sin ninguna comprobación; la agenda sí usa `telefonoValido` | `telefonoValido` y KeyFilter; el PIN, `pKeyFilter="pint"` | No se puede guardar «abc» como el móvil donde suena la extensión | Alta en el hueco; KeyFilter pide abrirlo en `sc-inputtext` |
| 19 | Emails › Cuentas, puerto (`email-cuenta-editor-page.component.html:51`) | Texto libre | `sc-inputnumber`, de 1 a 65535 | Ni letras ni puertos imposibles | Alta; valor medio (DD-185 §9) |
| 20 | Ficha de grupo, mensajes de voz de la cola (`group-form-page.component.html:877`) | Una línea en media columna; los de Chat ya son `sc-textarea` | `sc-textarea` con `autoResize` | Lee entero lo que oirá el cliente | Media; falta la longitud típica |
| 21 | Conversaciones, «Más filtros» (`type-filter-button.component.html:33`) | Tres pares de casillas; quitar las dos de un par deja la tabla en 0 | `sc-selectbutton` con `multiple` y `allowEmpty` en falso, uno por par | No se llega a «0 conversaciones» por error | Media; medir si caben en el globo |
| 22 | Repositorios, «Estado» Activa o Inactiva (`repo-form-panel.component.html:24`, `agenda-editor-page.component.html:42`) | `sc-select` de dos opciones | `sc-toggleswitch`, como Usuarios y Reglas | Un clic y el estado a la vista | Media |
| 23 | Contact Center › Grupos, «Caducar sesión» (`aed-grupos-page.component.html:193`) | `sc-select` de 5 a 60; la ficha ya lo escribe en `sc-inputnumber` | El mismo control que la ficha (DD-152) | El valor por defecto y la ficha aceptan lo mismo | Baja-media; saber si DD-184 §3 dejó Contact Center atrás a propósito |
| 24 | Monitor, «⋮» de cada widget (`widget-card.component.html:82`) | `p-menu` de 12 filas: dos grupos de filtros, «Editar» y «Quitar» | TieredMenu, o Menu con `toggleable` | Cuatro filas, y «Quitar» deja de estar bajo siete filtros | Media-baja; el original los pone planos |
| 25 | Lab, «Tabla \| Árbol» (`table-lab-page.component.html:5`) | `sc-selectbutton` que cambia de ruta | Tabs sin paneles (ejemplo «tabmenu») | Ninguno para el usuario; solo el lector | Baja |

### 7.4 Fallos que salieron de paso (no son de elegir componente)

Leídos en el código; sin medir en el navegador.

- **Los avisos de progreso de Conversaciones no se ven.** Se lanzan con `key: 'dispatch-progress'`
  (`conversations-page.component.ts:296`) y el único `<p-toast>` de la app no tiene clave (`app.component.html:1`);
  PrimeNG solo pinta un mensaje si las claves coinciden (`primeng-toast.mjs:949`).
- **Las confirmaciones abren con el foco en «Aceptar».** `p-confirmdialog` trae `defaultFocus: 'accept'` y ni el DS
  ni las apps lo cambian: en una confirmación de borrar, Intro ejecuta.
- **«Caracteres especiales» se mueve y no guarda**: `[checked]="true"` sin `(checkedChange)`
  (`sistema-page.component.html:159`).
- **«Ayuda», en el menú del avatar, no hace nada**: no tiene `(click)` (`top-bar.component.html:94`).
- **«Nueva regla» y los «⋮» de fila** no dicen que abren un menú (`ariaHasPopup`, `ariaExpanded`; DD-171).
- **cuscare-ds escribe «—» a mano en celdas** (`tickets-page.component.html:66` y `:75`; DD-197).
- **Antes de los candidatos 2, 3 y 6**: `sc-select` y `sc-multiselect` no pasan `group`, `optionGroupLabel`,
  `optionGroupChildren` ni `virtualScroll`. Hace falta el nativo directo (DD-113) o abrirlas en el wrapper.

### 7.5 Descartes, para no volver a mirarlos

- **Ya decididos**: tipificación del grupo con `sc-select filter` (DD-195); vista del agente de la tipificación,
  réplica (DD-177); tiempos y tipo de cola (DD-152); columnas (DD-162, DD-176 §7); Accordion, Fieldset, Card y Panel
  (DD-157); nivel de 1 a 10 con su control actual (comentario de `agent-channel-table`); la cifra de las tarjetas en
  `sc-tag` (DD-165); `sc-delete-entity-dialog` frente a ConfirmDialog (sección 2).
- **Sin un botón al que pegar un ConfirmPopup**: «¿Quitar canales?» al guardar, «¿Descartar cambios?» al salir,
  restaurar datos.
- **Acciones distintas, no variantes de una** (ni SplitButton ni ButtonGroup): «Reproducir» y su intervalo, «Añadir
  widget» y «Dividir», «Deshacer» y «Guardar», las acciones en lote.
- **Selects cortos de 2 a 6 opciones** en listas de ajustes: un segmentado rompería la columna de controles. El tipo
  de entidad (18 opciones) ya salta al teclear la inicial.
- **Secciones del usuario como Tree**: la madre habilita a la hija, no la selecciona.
- **Los motivos de «No disponible» (17) en `sc-inputtags`**, decidido el 2026-10-16: su rojo dice «No disponible», como
  en la columna Estado de Agentes, y el wrapper no lo pinta (no expone `#item`). Lo que ganaría, pegar varios de una
  vez, es raro en una lista de pocos motivos, y la fila ya se maneja con el teclado. Se reabre si `sc-inputtags` expone
  `#item` por otro caso.
- **Transcripción como Timeline o Scroller**: burbujas de alto variable, sin tamaños que pidan lista virtual.
- **Se reabren si…**: destino del correo (15 opciones sin `filter`) si un cliente pasa de unos 20 grupos; servicios
  del usuario (8 casillas) si son decenas; el reembolso de cuscare-ds si producción lo enseña en dos grupos.

## Siguientes pasos

1. **Las «Sin decidir» de la sección 1** se abren con su pantalla, no antes.
2. **La sección 3, revisado el 2026-10-12**: las dos casillas son intencionales (ver su fila). Menu, Listbox,
   Toolbar y MeterGroup ya tienen sitio en sc-docs desde el 2026-10-14: la página PrimeNG (nota de la sección 3).
3. **`sc-command-palette` frente a CommandMenu** (sección 2) — revisado el 2026-10-12: se mantiene.
4. Cuando suba PrimeNG, el gate se pone rojo: rehacer esta tabla con la versión nueva.
5. **El barrido (sección 7), decidido el 2026-10-15**: se hacen los que ya resuelve una DD o una regla (1 a 5, 7, 8, 9,
   14 a 20 y 22) y lo que queda de 7.4; 10, 11, 13, 21 y 24 cambian cómo se ve la pantalla y esperan a que se vean el
   antes y el después; 6, 12 y 23 esperan una respuesta de desarrollo; 25 se queda como está (el Lab no lo ve ningún
   cliente). Del 26 al 29 se deciden igual. Lo decidido que sea regla va a «Bifurcaciones al componer» de AGENTS.md.
   **Ronda de teclado, hecha el 2026-10-15**: 2, 3, 4, 5, 7 y el reproductor de una grabación (1), con su prueba en
   `e2e/supervisor/barrido-teclado.spec.ts`. En el 4, los atajos pasan a ser una opción del menú: un botón dentro del
   `#start` de `p-menu` no se alcanza con el teclado. Quedan: el 8 (seis categorías no caben en un `sc-selectbutton`
   de 443 px; se decidió mantener las fichas en 3×2 con radios a la vista), el reproductor de varias grabaciones (su
   barra va en tramos y cambiarla cambia cómo se ve) y el 14 (medir antes qué oye el lector).
   **Cambios visibles, hechos el 2026-10-15** (decisión de producto, DD-205): 10 y 13 preguntan en un ConfirmPopup
   pegado a la casilla o al botón; 21 es un `sc-selectbutton` de varios por par que no se queda vacío; 24, un
   `p-tieredmenu` con Tipo y Canal en submenús. El 11 sigue en diálogo: borra una rama con sus hijas, y eso es una
   confirmación compleja. Prueba: `e2e/supervisor/barrido-visibles.spec.ts`.
   **Ronda de campos, hecha el 2026-10-15**: 8 (las seis categorías en fichas 3×2 con su radio a la vista, un grupo de
   radios nativo con flechas), 16 (`sc-inputtags`), 18 (el teléfono con `telefonoValido`; el PIN con KeyFilter espera
   a abrirlo en `sc-inputtext`), 19 (`sc-inputnumber` de 1 a 65535) y 20 (`sc-textarea` con `autoResize` y nombre).
   Prueba: `e2e/supervisor/barrido-campos.spec.ts`. El 17 espera a producto: con `sc-inputtags` los motivos perderían
   su rojo, porque el wrapper no expone `#item`.
   **Ronda de avisos y lo que quedaba, hecha el 2026-10-15**: 9 (la foto rechazada lo dice en la línea de su ayuda, en
   rojo, y no se va), 15 (copiar: el ✓ y una región viva para el lector; el fallo, un `sc-message` que se queda), 22
   (Estado, interruptor: tipo `switch` de `repo-form-panel`), 14 (la cifra lleva los nombres como descripción; el
   globo queda solo para la vista), 26 (`sc-color-dot-picker` sobre `sc-selectbutton`, con el nombre del elegido
   debajo; su teclado es el de SelectButton, Tab y Espacio, porque PrimeNG 22 no conecta sus flechas), 27 (sin
   `role="menu"`), 28 (`p-menu` emergente; la lista sigue al foco), 29 (los paneles de alta devuelven el foco al
   cerrarse, `focoDeVueltaAlCerrar`) y lo de 7.4: los «⋮» de fila y «Nueva regla» con `ariaHasPopup` y `ariaExpanded`,
   el «—» de cuscare-ds con su «Sin dato», el plural del aviso parcial. Prueba: `e2e/supervisor/barrido-avisos.spec.ts`.
   Medido en el 26: los puntos sin elegir, sobre el fondo del segmentado (#eceff3), quedan bajo 3:1 en gris (2,56),
   naranja (2,43), ámbar (1,86), verde (2,2) y turquesa (2,16); el color no es lo único que dice cuál es (el nombre se
   lee debajo y lo oye el lector), así que la paleta no se toca sin decisión.
   **Lo que quedaba, decidido el 2026-10-16**: el reproductor de varias grabaciones lleva `p-slider` en el tramo activo,
   con el aspecto del tema (el mismo que el de una grabación), y los demás tramos son su misma pista sin mando: de tramo
   se cambia en la fila de etiquetas, como antes. Prueba en `e2e/supervisor/barrido-teclado.spec.ts`. El 17 se queda
   como está (ver 7.5). El 23, hecho el mismo día: lo resolvía el repo. DD-152 quiere el mismo control en la ficha y
   en Contact Center, y DD-184 §3 pasó la ficha a minutos escritos tras revisarla contra Voice; Contact Center se había
   quedado con el desplegable de 5 a 60. Ahora los dos escriben los minutos (`sc-inputnumber`, desde 1), y el catálogo
   de minutos sale del código. Prueba en `e2e/supervisor/grupo-tiempos-horarios.spec.ts`. Quedan 6 y 12.
6. **La sección 6 en sc-docs**: hecho el 2026-10-14, la página PrimeNG. Si cambias la sección 6, `npm run
   primeng-catalog:gen` rehace su artefacto (el gate se pone rojo hasta entonces).
