# Auditoría · el catálogo de PrimeNG contra el DS

> **Qué es.** Un cruce, hecho una vez el 2026-10-07 contra PrimeNG **22.1.2** (el instalado), de tres listas: los
> módulos que trae PrimeNG (`node_modules/primeng/fesm2022`), lo que envuelve el DS (`docs/_component-status.json`,
> columna «PrimeNG base») y lo que las apps importan de `primeng/*` directamente. **No construye nada**: es la tabla con la
> que se decide qué entra. Nace porque `sc-fileupload` (DD-184) existía en PrimeNG desde siempre y se nos pasó: lo único
> que avisaba de «¿PrimeNG ya trae esto?» era el gancho de un enlace pegado (`primeng-doc-guard`).
>
> **Cómo se rehace.** Las tres listas salen de un script de diez líneas (catálogo, `primengBase` del manifiesto y los
> `from 'primeng/…'` de `projects/*/src`); el juicio de cada fila, no. Antes de construir una fila de la sección 1, la
> documentación entera: `node tools/primeng-doc.mjs <componente>` (AGENTS.md, «Componentes de primeng.dev»).

## Cifras

| | Cuántos |
|---|---|
| Módulos de PrimeNG 22.1.2 | 112 (unos 20 son utilidades sin interfaz: `api`, `base`, `dom`, `ripple`, `bind`…) |
| Envueltos por el DS | 34 módulos, en 34 componentes `sc-*` envoltorio (de 59; los otros 25 son propios) |
| Usados directamente por alguna app, sin wrapper del DS | 14 (sección 3; cinco son directivas o piezas internas) |
| Sin usar en ninguna parte | 50 con interfaz (secciones 1 y 4) |

## 1. Lo que PrimeNG trae, no usamos y tiene un caso en el producto

Ordenado por lo que ahorraría. «Caso» es dónde se usaría hoy; ninguna fila está decidida.

| Prioridad | Componente | Caso en el producto | Qué sustituiría |
|---|---|---|---|
| Alta | **TreeSelect · Tree** | Las tipificaciones son un árbol de niveles donde cada rama tiene su profundidad (la revisión del 2026-10-06). TreeSelect para elegir una en un grupo o al cerrar una conversación; Tree para editar el árbol. | El editor de niveles hecho a mano (`tipificacion-niveles`) y la elección por listas encadenadas. Encaja con la propuesta pendiente de tipificaciones. |
| Alta | **InputTags** | «Dominios permitidos» de Web Chat (campo + «Añadir» + chips). También etiquetas libres. | Tres piezas a mano en la ficha de grupo por una nativa. |
| Alta | **OrderList** | Ordenar columnas en `sc-column-selector` («Subir» y «Bajar» hechos a mano, DD-176 §7). | El reordenado propio del selector de columnas. |
| Media | **CommandMenu** | La paleta de comandos (Cmd+K). | `sc-command-palette`, hecho a mano. Mirar antes si cubre la búsqueda por grupos y los atajos. |
| Media | **Editor** | El cuerpo de las plantillas de email (hoy, texto plano). | — (no hay nada; sería nuevo). |
| Media | **Rating** | La valoración del chat («de una a cinco estrellas», revisión del 2026-10-06) en el agente y en los informes. | — (nuevo). |
| Media | **Timeline** | La historia de un ticket en CusCare y la de una conversación en Memory. | Listas de eventos hechas a mano. |
| Media | **InputMask** | Teléfonos y extensiones con formato. | Validación propia (`telefonoValido`); ojo con los internacionales. |
| Media | **ConfirmPopup** | Confirmaciones pequeñas junto al botón (quitar un contacto, un trigger). | Diálogos enteros para una confirmación de una línea. |
| Baja | **Accordion · Fieldset** | Los slots plegables («Mensajes en cola») y las subsecciones. | `sc-slot collapsible` y `sc-subsection`. Hoy no compensa: los nuestros llevan el árbol del DS (DD-157). |
| Baja | **ContextMenu** | Clic derecho en las filas de los listados. | — (el kebab ya lo cubre). |
| Baja | **InputOtp** | Un segundo factor en el acceso, si llega. | — |
| Baja | **Stepper** | Las altas largas. | Se quitó a propósito (DD-143): no volver sin motivo nuevo. |
| Baja | **Slider · Knob** | Volúmenes y umbrales. | — |
| Baja | **AutoComplete** | Añadir un agente a un grupo escribiendo su nombre. | El buscador de la tabla de asignación. |

## 2. Lo nuestro que repite algo nativo

Cada fila, con lo que el repo ya decidió. «Revisar» es que el motivo de entonces ya no está o no se escribió.

| Nuestro | Nativo | Veredicto | Por qué |
|---|---|---|---|
| `sc-checkbox` (input nativo) | Checkbox | **Mantener** | `p-checkbox` no modela el ciclo ninguno/alguno/todos que piden las casillas de «todos» (su `indeterminate` es binario). Escrito en el componente. |
| `sc-inputnumber` (sobre InputText) | InputNumber | **Revisar** | Se eligió el input nativo porque los usos eran enteros sin formato. Ya hay minutos, segundos y tamaños de cola con sufijo: `p-inputnumber` da sufijo, mínimos, máximos y teclas sin código propio. |
| `sc-photo-upload` | FileUpload (basic) + Avatar | **Mantener** | Recorte e ilustración de reserva; decisión §10 del componente. El resto de subidas, `sc-fileupload` (DD-184). |
| `sc-inline-rename-cell` | Inplace | **Revisar** | La app ya usa `p-inplace` directamente para el nombre de las fichas (`sc-name-inplace`). Dos maneras de lo mismo. |
| `sc-command-palette` | CommandMenu | **Revisar** | Ver sección 1. |
| `sc-delete-entity-dialog` | ConfirmDialog | **Mantener** | Lista de lo que se borra y su recuento; ConfirmDialog solo da un mensaje. |
| `sc-section-card` · `sc-subsection` · `sc-slot` | Card · Fieldset · Panel | **Mantener** | El árbol del DS (DD-157) con sus fondos y medidas; ninguno de los nativos lo da. |
| `sc-bulk-action-bar` · `sc-sticky-form-header` | Toolbar | **Mantener** | Lógica de selección y de guardado que Toolbar no tiene; la app usa Toolbar directamente donde basta. |
| `sc-color-dot-picker` | ColorPicker | **Mantener** | Elige de la paleta de etiquetas, no un color libre. |
| `sc-gauge` | Knob · ProgressSpinner | **Mantener** | Lectura, no entrada; el anillo del resumen ya es ProgressSpinner (DD-161). |
| `sc-option-cards` | SelectButton · RadioButton | **Mantener** | Opciones que necesitan explicarse; si se explican solas, `sc-selectbutton`. |
| `sc-permission-matrix` | Table + Checkbox | **Mantener** | Casillas de «todos» por columna con el tri-estado de `sc-checkbox`. |

## 3. PrimeNG usado directamente por las apps, sin wrapper del DS

Lo que una pantalla importa de `primeng/*` sin pasar por un `sc-*`. Es legítimo («el nativo tal cual», DD-113), pero sin
wrapper no tiene página en sc-docs ni medida en la línea base de estilos.

| Módulo | Quién | Veredicto |
|---|---|---|
| Tabs | supervisor, sc-docs | Envolver: está en cuatro pantallas y su `aria-label` va por `pt` (DD-113), un detalle que cada uso repite. |
| Menu | supervisor (el menú de fila de Reglas, Entidades y la agenda) | Envolver o documentar en sc-docs. |
| Listbox | supervisor, cuscare | Documentar en sc-docs. |
| Toolbar | supervisor | Documentar. |
| Checkbox | supervisor, sc-docs | **Revisar**: el DS tiene `sc-checkbox`; dos casillas distintas en la misma app. |
| Inplace | supervisor (`sc-name-inplace`) | Ver sección 2. |
| MeterGroup | supervisor (resumen de grupo) | Documentar. |
| Tooltip · AutoFocus · ScrollArea · DynamicDialog · InputGroupAddon | supervisor, sc-docs | Directivas y piezas internas de otro componente: bien directas. |
| ToggleButton | cuscare | Réplica (DD-35): no se toca. |
| Sidebar | supervisor (página de laboratorio) | **Quitar**: obsoleto en PrimeNG 22 (es Drawer) y solo vive en el laboratorio. |

## 4. Sin caso en el producto hoy

Carousel, Galleria, Gallery, Image, ImageCompare, Dock, SpeedDial, Terminal, OrganizationChart, PickList, DataView,
MegaMenu, Menubar, PanelMenu, TieredMenu, Splitter, ScrollTop, BlockUI, CascadeSelect, ButtonGroup, SplitButton,
FloatLabel, IftaLabel, InputColor, KeyFilter, Chart, Steps (obsoleto), TreeTable. Se reabren si aparece el caso.

## Siguientes pasos

Nada se construye sin decidirlo. Lo que sale de aquí, por orden:
1. **Decidir la sección 1**: TreeSelect/Tree (con la propuesta de tipificaciones), InputTags y OrderList son los que más
   código propio quitarían.
2. **Las dos «Revisar» de la sección 2**: `sc-inputnumber` sobre `p-inputnumber` y una sola manera de editar un nombre en
   su sitio.
3. **La sección 3**: envolver Tabs y quitar Sidebar del laboratorio.
4. **Que no se vuelva a pasar**: que esta tabla se rehaga cuando suba PrimeNG, junto con `audit:primeng-coupling`.
