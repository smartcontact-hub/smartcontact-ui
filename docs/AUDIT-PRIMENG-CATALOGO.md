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

## Cifras

Las da el gate en cada `verify`; estas son las del 2026-10-11.

| | Cuántos |
|---|---|
| Módulos de PrimeNG 22.1.0 con interfaz | 108 (sin contar las utilidades de base, `api`, `dom`, `utils`… ni los iconos) |
| Envueltos por el DS | 36 módulos, en 36 componentes `sc-*` envoltorio (de 61; los otros 25 son propios) |
| Usados directamente por alguna app, sin wrapper del DS | 13 (sección 3; cinco son directivas o piezas internas) |
| Sin usar en ninguna parte | 59 (secciones 1, 4 y 5) |

## 1. Lo que PrimeNG trae, no usamos y tiene un caso en el producto

Ordenado por lo que ahorraría. «Caso» es dónde se usaría hoy.

| Prioridad | Componente | Caso en el producto | Decisión (DD-195) |
|---|---|---|---|
| Alta | **InputTags** | «Dominios permitidos» de Web Chat (campo + «Añadir» + chips). También etiquetas libres. | **Hecho**: `sc-inputtags` (wrapper Extended), en los dominios de la ficha de grupo. Sustituye a las tres piezas hechas a mano. |
| Alta | **TreeSelect · Tree** | Las tipificaciones son un árbol de niveles. | **No**: DD-187 §5 dibuja el árbol entero en columnas por nivel (DD-174), con «+» por fila y tirador, que Tree no da; y el grupo elige una tipificación entera (un desplegable), no una hoja. TreeSelect tendría caso en sc-agent, al cerrar una conversación: se decide allí. |
| Alta | **OrderList** | Ordenar columnas en el selector de columnas de los listados. | **No**: DD-176 §7 ya calca el ejemplo «Column Toggle» de primeng.dev (Popover, Checkbox y arrastre), que es nativo; con teclado ordena Alt+↑/↓ (DD-203). OrderList añadiría una segunda lista con sus cuatro botones de mover. |
| Media | **CommandMenu** | La paleta de comandos (Cmd+K). | **No** (revisado): ver `sc-command-palette` en la sección 2. |
| Media | **Editor** | El cuerpo de las plantillas de email (hoy, texto plano). | Sin decidir: sería nuevo; se abre con la pantalla. |
| Media | **Rating** | La valoración del chat («de una a cinco estrellas», revisión del 2026-10-06) en el agente y en los informes. | Sin decidir: sería nuevo. |
| Media | **Timeline** | La historia de un ticket en CusCare y la de una conversación en Memory. | Sin decidir. CusCare es réplica (DD-35): allí no se toca. |
| Media | **InputMask** | Teléfonos y extensiones con formato. | Sin decidir: validación propia (`telefonoValido`); ojo con los internacionales. |
| Media | **ConfirmPopup** | Confirmaciones pequeñas junto al botón (quitar un contacto, un trigger). | Sin decidir: hoy son diálogos enteros. |
| Baja | **Accordion · Fieldset** | Los slots plegables («Mensajes en cola») y las subsecciones. | No compensa: `sc-slot collapsible` y `sc-subsection` llevan el árbol del DS (DD-157). |
| Baja | **ContextMenu** | Clic derecho en las filas de los listados. | No en los listados: el «⋮» ya lo cubre. Solo en el laboratorio del árbol (sección 3). |
| Baja | **InputOtp** | Un segundo factor en el acceso, si llega. | Con su pantalla. |
| Baja | **Stepper** | Las altas largas. | Se quitó a propósito (DD-143): no vuelve sin motivo nuevo. |
| Baja | **Slider · Knob** | Volúmenes y umbrales. | Con su pantalla. |
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
| Menu | supervisor (el menú de fila de Reglas, Entidades y la agenda; el «⋮» del Monitor) | Envolver o documentar en sc-docs — ver nota de abajo. |
| Listbox | supervisor, cuscare | Documentar en sc-docs — ver nota de abajo. |
| Toolbar | supervisor | Documentar — ver nota de abajo. |
| Checkbox | supervisor (el «Column Toggle», DD-176 §7), sc-docs | **Bien directo** (revisado): el «Column Toggle» calca el ejemplo nativo de primeng.dev (DD-176 §7), que liga cada casilla a un array por `[value]` + un `ngModel` compartido. `sc-checkbox` no modela ese patrón — su `state` es `input.required<TriState>()` (none/some/all), pensado para una casilla de «todos» por columna, no para una lista de casillas binarias independientes (`projects/ui-smartcontact/src/lib/components/checkbox/sc-checkbox.component.ts`). Dos casillas con trabajos distintos, no una inconsistencia. |
| Inplace | supervisor (`sc-name-inplace`) | Bien directo: ver sección 2. |
| MeterGroup | supervisor (resumen de grupo) | Documentar — ver nota de abajo. |
| Tooltip · AutoFocus · ScrollArea · DynamicDialog · InputGroupAddon | supervisor, sc-docs | Directivas y piezas internas de otro componente: bien directas. |
| ToggleButton | cuscare | Réplica (DD-35): no se toca. |
| Sidebar | supervisor (página de laboratorio) | **Se queda.** Es el menú lateral nuevo de la 22, en prueba para la versión «no se cierra nada» del sidebar (frente `supervisor-sidebar`, DD-118). |
| Rating | supervisor (`lab/tabla`, celda de «Valoración» en modo `readonly`) | El nativo tal cual (DD-113): el DS ya trae el tema listo (`sc-preset/rating.ts`), sin wrapper propio todavía. Demuestra contenido rico en celda (estrellas), no sustituye ningún componente del DS. |
| TreeTable | supervisor (`lab/arbol`) | El nativo tal cual: el DS ya trae el tema listo (`sc-preset/treetable.ts`), sin wrapper propio todavía. Jerarquía de verdad (equipos → agentes), no una tabla plana, no sustituye a `sc-datatable`. |
| ContextMenu | supervisor (`lab/arbol`, «Menú contextual») | El nativo tal cual, solo en el laboratorio: es el ejemplo «ContextMenu» de primeng.dev/treetable (`ttContextMenuRow`), en el `body` para que salga en el clic. En los listados sigue sin caso: el «⋮» ya lo cubre. |

**Tabs** ya tiene wrapper (`sc-tabs`, DD-195): Plantillas, el reproductor de Memory y la página «Uso» de sc-docs lo
usan. Solo las pestañas del Monitor siguen en `p-tabs` directo: se arrastran para ordenarse y se renombran con doble
clic, y eso necesita sus directivas sobre cada `p-tab`.

⚠️ **«Documentar en sc-docs» no tiene a dónde ir hoy.** sc-docs solo tiene página para wrappers `sc-*`
(`component-catalog.ts` deriva el showcase de `SC_DEMO_COMPONENT_PAGES`, un registro de wrappers); no hay
precedente de una página para un nativo SIN wrapper — ni para Menu/Listbox/Toolbar/MeterGroup ni para los que
ya están «bien directos» (Inplace, Tooltip, Sidebar, las pestañas del Monitor). No es un hueco de estos cuatro:
es que el showcase no tiene todavía un sitio para «esto es nativo, y así se usa aquí». Antes de escribir páginas
nuevas hace falta decidir esa forma (¿una categoría «Nativos» en el catálogo? ¿una sola página «PrimeNG directo»
con una sección por módulo?) — queda en `docs/handoff/supervisor-fichas.md`, no se inventa aquí sin que el
equipo la mire.

## 4. Sin caso en el producto hoy

Carousel, Galleria, Gallery, Image, ImageCompare, Dock, SpeedDial, Terminal, OrganizationChart, PickList, DataView,
MegaMenu, Menubar, PanelMenu, TieredMenu, Splitter, ScrollTop, BlockUI, CascadeSelect, ButtonGroup, SplitButton,
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

## Siguientes pasos

1. **Las «Sin decidir» de la sección 1** se abren con su pantalla, no antes.
2. **La sección 3, revisado el 2026-10-12**: las dos casillas son intencionales (ver su fila). Documentar Menu,
   Listbox, Toolbar y MeterGroup en sc-docs sigue pendiente — primero decidir DÓNDE vive un nativo sin wrapper en el
   showcase (nota de la sección 3), que no es solo cosa de estos cuatro.
3. **`sc-command-palette` frente a CommandMenu** (sección 2) — revisado el 2026-10-12: se mantiene.
4. Cuando suba PrimeNG, el gate se pone rojo: rehacer esta tabla con la versión nueva.
