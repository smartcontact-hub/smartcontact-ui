# Auditoría · el catálogo de PrimeNG contra el DS

> **Qué es.** Un cruce de tres listas contra PrimeNG **22.1.0** (el de `package-lock.json`): los módulos que trae
> PrimeNG (`node_modules/primeng/fesm2022`), lo que envuelve el DS (`docs/_component-status.json`, columna «PrimeNG
> base») y lo que las apps importan de `primeng/*` directamente. Se hizo el 2026-10-07 (DD-186) y se decidió el
> 2026-10-11 (DD-194). Nace porque `sc-fileupload` (DD-184) existía en PrimeNG desde siempre y se nos pasó.
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

| Prioridad | Componente | Caso en el producto | Decisión (DD-194) |
|---|---|---|---|
| Alta | **InputTags** | «Dominios permitidos» de Web Chat (campo + «Añadir» + chips). También etiquetas libres. | **Hecho**: `sc-inputtags` (wrapper Extended), en los dominios de la ficha de grupo. Sustituye a las tres piezas hechas a mano. |
| Alta | **TreeSelect · Tree** | Las tipificaciones son un árbol de niveles. | **No**: DD-187 §5 dibuja el árbol entero en columnas por nivel (DD-174), con «+» por fila y tirador, que Tree no da; y el grupo elige una tipificación entera (un desplegable), no una hoja. TreeSelect tendría caso en sc-agent, al cerrar una conversación: se decide allí. |
| Alta | **OrderList** | Ordenar columnas en el selector de columnas de los listados. | **No**: DD-176 §7 ya calca el ejemplo «Column Toggle» de primeng.dev (Popover, Checkbox y arrastre), que es nativo; con teclado ordenan «Subir» y «Bajar» (DD-162). OrderList añadiría una segunda lista con sus cuatro botones de mover. |
| Media | **CommandMenu** | La paleta de comandos (Cmd+K). | Sin decidir: ver `sc-command-palette` en la sección 2. |
| Media | **Editor** | El cuerpo de las plantillas de email (hoy, texto plano). | Sin decidir: sería nuevo; se abre con la pantalla. |
| Media | **Rating** | La valoración del chat («de una a cinco estrellas», revisión del 2026-10-06) en el agente y en los informes. | Sin decidir: sería nuevo. |
| Media | **Timeline** | La historia de un ticket en CusCare y la de una conversación en Memory. | Sin decidir. CusCare es réplica (DD-35): allí no se toca. |
| Media | **InputMask** | Teléfonos y extensiones con formato. | Sin decidir: validación propia (`telefonoValido`); ojo con los internacionales. |
| Media | **ConfirmPopup** | Confirmaciones pequeñas junto al botón (quitar un contacto, un trigger). | Sin decidir: hoy son diálogos enteros. |
| Baja | **Accordion · Fieldset** | Los slots plegables («Mensajes en cola») y las subsecciones. | No compensa: `sc-slot collapsible` y `sc-subsection` llevan el árbol del DS (DD-157). |
| Baja | **ContextMenu** | Clic derecho en las filas de los listados. | No: el «⋮» ya lo cubre. |
| Baja | **InputOtp** | Un segundo factor en el acceso, si llega. | Con su pantalla. |
| Baja | **Stepper** | Las altas largas. | Se quitó a propósito (DD-143): no vuelve sin motivo nuevo. |
| Baja | **Slider · Knob** | Volúmenes y umbrales. | Con su pantalla. |
| Baja | **AutoComplete** | Añadir un agente a un grupo escribiendo su nombre. | No: lo cubre el buscador de la tabla de asignación. |

## 2. Lo nuestro que repite algo nativo

| Nuestro | Nativo | Veredicto | Por qué |
|---|---|---|---|
| `sc-checkbox` (input nativo) | Checkbox | **Mantener** | `p-checkbox` no modela el ciclo ninguno/alguno/todos que piden las casillas de «todos» (su `indeterminate` es binario). Escrito en el componente. |
| `sc-inputnumber` (sobre InputText) | InputNumber | **Mantener** (revisado, DD-194) | El motivo sigue: enteros sin formato. La unidad, los topes y las flechas ya los da, y acota al salir del campo, como `p-inputnumber` (medido en su código: `onInputBlur`, Enter y Tab). Pasarse cambiaría dos cosas a peor: la unidad entraría en el texto del número, con su color, y el valor solo llega tecla a tecla (pegar con el ratón, el dictado o un `fill` esperan a salir del campo). |
| `sc-photo-upload` | FileUpload (basic) + Avatar | **Mantener** | Recorte e ilustración de reserva; decisión §10 del componente. El resto de subidas, `sc-fileupload` (DD-184). |
| `sc-inline-rename-cell` | Inplace | **Mantener** (revisado, DD-194) | No es lo mismo que `sc-name-inplace` (el `p-inplace` nativo del nombre de las fichas, de reposo a edición). La celda no tiene reposo: aparece ya editando tras duplicar una fila, o en el globo de renombrar del Monitor, con confirmar y cancelar. Un `p-inplace` en la fila pelearía con el clic que abre la ficha. |
| `sc-command-palette` | CommandMenu | **Revisar** | Mirar si CommandMenu cubre la búsqueda por grupos y los atajos antes de tocarla. |
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
| Menu | supervisor (el menú de fila de Reglas, Entidades y la agenda; el «⋮» del Monitor) | Envolver o documentar en sc-docs. |
| Listbox | supervisor, cuscare | Documentar en sc-docs. |
| Toolbar | supervisor | Documentar. |
| Checkbox | supervisor (el «Column Toggle», DD-176 §7), sc-docs | Revisar: el DS tiene `sc-checkbox`; dos casillas distintas en la misma app. |
| Inplace | supervisor (`sc-name-inplace`) | Bien directo: ver sección 2. |
| MeterGroup | supervisor (resumen de grupo) | Documentar. |
| Tooltip · AutoFocus · ScrollArea · DynamicDialog · InputGroupAddon | supervisor, sc-docs | Directivas y piezas internas de otro componente: bien directas. |
| ToggleButton | cuscare | Réplica (DD-35): no se toca. |
| Sidebar | supervisor (página de laboratorio) | **Se queda.** Es el menú lateral nuevo de la 22, en prueba para la versión «no se cierra nada» del sidebar (frente `supervisor-sidebar`, DD-118). |

**Tabs** ya tiene wrapper (`sc-tabs`, DD-194): Plantillas, el reproductor de Memory y la página «Uso» de sc-docs lo
usan. Solo las pestañas del Monitor siguen en `p-tabs` directo: se arrastran para ordenarse y se renombran con doble
clic, y eso necesita sus directivas sobre cada `p-tab`.

## 4. Sin caso en el producto hoy

Carousel, Galleria, Gallery, Image, ImageCompare, Dock, SpeedDial, Terminal, OrganizationChart, PickList, DataView,
MegaMenu, Menubar, PanelMenu, TieredMenu, Splitter, ScrollTop, BlockUI, CascadeSelect, ButtonGroup, SplitButton,
FloatLabel, IftaLabel, InputColor, KeyFilter, Chart, Steps (la documentación ya no lo trae; su sucesor es Stepper),
TreeTable. Se reabren si aparece el caso.

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
2. **La sección 3**: documentar en sc-docs Menu, Listbox, Toolbar y MeterGroup; revisar las dos casillas.
3. **`sc-command-palette` frente a CommandMenu** (sección 2).
4. Cuando suba PrimeNG, el gate se pone rojo: rehacer esta tabla con la versión nueva.
