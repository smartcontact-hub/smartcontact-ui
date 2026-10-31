/**
 * Curaduría del audit de componentes (Fase 2). Lo DETERMINISTA lo deriva `component-audit.mjs`
 * del código (provenance, primengBase, CVA, inputs, anidados, demo, dónde-se-usa). Lo que pide
 * JUICIO humano vive aquí — fuente única, editable a mano sin tocar el generador.
 */

/**
 * STANDARD vs EXTENDED es una línea fina (un wrapper "puro passthrough" vs uno con API/CVA propia).
 * El generador propone por heurística (CVA o muchos inputs propios → EXTENDED). Para FORZAR la
 * clasificación de un wrapper concreto, ponlo aquí: 'standard' | 'extended'. (Confirmado en revisión.)
 */
export const PROVENANCE_OVERRIDE = {
  // ej.: 'card': 'standard',  // aunque tenga inputs, es passthrough visual
};

/**
 * Componentes SIN página demo a propósito (servicios, piezas internas, no-presentacionales).
 * El guard NO falla por estos. Cualquier OTRO componente sin demo → ROJO (hay que darle demo).
 */
export const DEMO_EXEMPT = new Set([
  'dynamic-dialog', // ScDynamicDialogService — servicio, no componente con plantilla
]);

/** Imports de `primeng/*` que NO cuentan como "base PrimeNG" (utilidades, no el componente). */
export const PRIMENG_UTIL = new Set(['api']);

/** Anidados a ignorar al listar composición (primitivos, no "componentes de negocio"). */
export const NESTED_IGNORE = new Set(['sc-icon']);

/**
 * CUÁNDO se usa cada componente — la capa que faltaba, y la primera que un agente necesita.
 *
 * Por qué existe (medido el 2026-09-19): en todo el repo había **cero líneas** sobre cuándo usar
 * un componente. El contrato contesta «¿qué props tiene `sc-select`?»; nadie contestaba la
 * pregunta ANTERIOR, que es «¿uso un select, un selectbutton o unas tarjetas?». Sin eso, quien
 * construye elige por lo que recuerda haber visto, y así es como dos pantallas resuelven lo mismo
 * de dos maneras.
 *
 * FORMATO: una línea, empezando por el CASO, no por la descripción. «Para elegir UNO de pocos…»
 * sirve; «Componente de selección» no sirve, porque no ayuda a decidir. Donde hay un vecino con
 * el que se confunde, se nombra: la mitad del valor está en decir «esto NO, aquello SÍ».
 *
 * Es JUICIO, no dato derivado, y por eso vive aquí y no en el generador: este fichero es el de la
 * curaduría humana. `audit:components` exige que ningún componente se quede sin su
 * línea, así que uno nuevo no puede entrar mudo.
 */
export const CUANDO = {
  'sc-avatar': 'Para representar a una PERSONA con su foto; sin foto cae a una ilustración estable, siempre la misma para la misma persona.',
  'sc-avatargroup': 'Para apilar varios avatares cuando importa «quiénes» y no «cuántos» exactamente.',
  'sc-badge': 'Para un contador o un rótulo muy corto PEGADO a otra cosa. Si va suelto en la fila, es `sc-tag`.',
  'sc-breadcrumb': 'Para decir dónde estás dentro de una jerarquía y poder subir. No es navegación principal.',
  'sc-bulk-action-bar': 'Para las acciones que aparecen al seleccionar varias filas. Sale con la selección; tras aplicar un cambio en lote, se queda para contarlo con su «Deshacer».',
  'sc-bulk-edit-menu': 'Para cambiar UN campo en muchos elementos a la vez, desde la barra de selección.',
  'sc-bulk-transcription-modal': 'Solo para el procesado masivo de conversaciones. Es específico del dominio y hoy solo lo usa la demo.',
  'sc-button': 'Para una ACCIÓN. Si navega a otro sitio sin cambiar nada, debería ser un enlace.',
  'sc-card': 'Para agrupar contenido suelto con una superficie propia. Si el grupo tiene título y pertenece a un formulario, es `sc-section-card`.',
  'sc-checkbox': 'Para un sí/no independiente, o para la casilla de un grupo elegido A MEDIAS (tiene tercer estado). Para activar algo al instante, `sc-toggleswitch`.',
  'sc-chip': 'Para un valor ya elegido que se puede quitar (un filtro puesto, un destinatario). No es un botón.',
  'sc-color-dot-picker': 'Para elegir un color de una paleta corta y cerrada, con su nombre — el color solo no se puede oír.',
  'sc-column-selector': 'Para que el usuario decida qué columnas ve en una tabla.',
  'sc-command-palette': 'Para llegar a cualquier sitio o acción escribiendo, sin recorrer menús. Es atajo, nunca el único camino.',
  'sc-alert-modal': 'Para un aviso o una pregunta con una acción clara (borrar, descartar cambios, sesión caducada), abierto por `ScDynamicDialogService` como en ui.smart-contact.com. La variante dice la intención: `error` destruye o bloquea, `warning` pide atención, `info` informa y `default` confirma algo neutro. La superficie dice quién lo provoca: blanca (`surface: \'plain\'`) si decide el usuario (borrar, descartar), teñida (`tinted`, la de siempre) si es un error del sistema (sin micrófono). Mide de 320 a 480 px y hasta 400 de alto. Si lleva más que texto, `sc-custom-modal`.',
  'sc-confirmdialog': 'Retirado (DD-241): para confirmar, `sc-alert-modal`. Queda solo el globo pegado al botón (`ScConfirmService.request({ target })`), para una frase sobre lo que se acaba de pulsar.',
  'sc-custom-modal': 'Para un modal con contenido propio (un formulario, una tabla, un reproductor): la carcasa que comparten los dos DS. Se abre por `ScDynamicDialogService`, como en ui.smart-contact.com, o con `[(visible)]` si su formulario se ata al estado de la pantalla. Para un aviso con una acción, `sc-alert-modal`.',
  'sc-datatable': 'Para datos tabulares con columnas comparables. Si cada fila es en realidad un formulario, NO es una tabla.',
  'sc-datepicker': 'Para elegir una fecha del calendario, cuando importa el día concreto y no un rango relativo («últimos 7 días»).',
  'sc-delete-entity-dialog': 'Para confirmar un borrado ENSEÑANDO qué se borra, en singular o en bloque.',
  'sc-dialog': 'Retirado (DD-241): usa `sc-custom-modal`, la carcasa que comparten los dos DS.',
  'sc-divider': 'Para separar visualmente dos bloques cuando el espacio no basta.',
  'sc-drawer': 'Para un panel lateral con trabajo que conserva el contexto de detrás.',
  'sc-empty-state': 'Para cuando no hay nada que enseñar: dice por qué está vacío y qué hacer. Una lista vacía sin esto parece rota.',
  'sc-field-label': 'Solo al construir un campo NUEVO del DS: es la pieza de la etiqueta. En una pantalla se usa el campo entero (`sc-inputtext`, `sc-select`…), nunca esto suelto.',
  'sc-field-msg': 'Solo al construir un campo NUEVO del DS: es la pieza de la ayuda y del error. En una pantalla se usa el campo entero, nunca esto suelto.',
  'sc-form-danger-zone': 'Para la acción irreversible al final de un formulario, separada del resto y explicada.',
  'sc-form-section-nav': 'Para el índice lateral de un formulario largo, que dice por dónde vas.',
  'sc-gauge': 'Para una magnitud contra su máximo, de un vistazo. Para progreso de una tarea, `sc-progressbar`.',
  'sc-group-popover': 'Para asomar los grupos de algo sin salir de la fila.',
  'sc-impact-preview-dialog': 'Para enseñar a QUÉ va a afectar un cambio masivo ANTES de aplicarlo.',
  'sc-inline-rename-cell': 'Para renombrar en el sitio, sin abrir un formulario.',
  'sc-inputgroup': 'Para un campo con algo pegado (icono, botón, prefijo). Mantiene alineadas las dos piezas.',
  'sc-inputnumber': 'Para una cantidad acotada, con mínimo, máximo y paso. Si el número es un identificador (un teléfono, un código), es texto: `sc-inputtext`.',
  'sc-inputtext': 'Para texto de una línea. Si puede ocupar varias, `sc-textarea`.',
  'sc-keyboard-shortcuts': 'Para enseñar los atajos disponibles en la pantalla.',
  'sc-message': 'Para un aviso EN LA PÁGINA, junto a lo que explica. Si es el resultado de una acción y puede desaparecer, `sc-toast`.',
  'sc-multiselect': 'Para elegir VARIAS de una lista larga. Si son pocas y caben, casillas sueltas se leen mejor.',
  'sc-option-cards': 'Para elegir una de pocas opciones que necesitan explicarse. Si se explican solas, `sc-selectbutton`.',
  'sc-panel': 'Para un bloque con cabecera propia, plegable y con acciones.',
  'sc-password': 'Para una contraseña, con su ojo para mostrarla.',
  'sc-permission-matrix': 'Para dar permisos cruzando quién con qué, marcando por columna entera.',
  'sc-photo-upload': 'Para la foto de una persona, con ilustración de reserva.',
  'sc-progressbar': 'Para el avance de una tarea de la que SÍ se sabe cuánto queda. Si no se sabe, `sc-progressspinner`.',
  'sc-progressspinner': 'Para una espera de duración desconocida. Si la espera es de contenido que va a aparecer, `sc-skeleton` desconcierta menos.',
  'sc-radiobutton': 'Para elegir UNA de pocas opciones excluyentes, todas a la vista. Si son muchas, `sc-select`.',
  'sc-search': 'Para filtrar escribiendo. Solo se lleva el foco al entrar si buscar es LA acción de la pantalla.',
  'sc-section-card': 'Para una sección con título dentro de un formulario o una ficha.',
  'sc-select': 'Para elegir UNA de muchas. Si son pocas y caben a la vista, `sc-radiobutton` o `sc-selectbutton` ahorran un clic.',
  'sc-step-marker': 'Para decir dónde está cada sección de un recorrido (sin ver, completa, con algo por hacer) en el índice de un alta. Un estado suelto de un campo es su mensaje (`sc-field-msg`); una marca de cambios sin guardar, el punto del índice.',
  'sc-icon-tile': 'Para dar a una fila de datos o a un título su icono con peso propio (un resumen). Un icono suelto junto a un texto es `sc-icon`; una persona, `sc-avatar`.',
  'div[scFactRow]': 'Para pares clave/valor que se leen de un vistazo (un resumen), en un `dl`. Un campo que se edita es `sc-field`; muchos datos en columnas, `sc-datatable`.',
  'sc-fileupload': 'Para subir uno o varios archivos con zona de soltar (audios, importaciones, adjuntos). La foto de una persona o entidad, con su recorte, es `sc-photo-upload`.',
  'sc-inputtags': 'Para varios valores cortos que escribe el usuario (dominios, etiquetas libres, correos). Si salen de una lista cerrada, `sc-multiselect`; si es uno solo, `sc-inputtext`.',
  'sc-tabs': 'Para vistas hermanas de una misma cosa que cambian lo de debajo (Chat y Email, Transcripción y Análisis). Para elegir el valor de un campo, `sc-selectbutton`.',
  'sc-selectbutton': 'Para elegir una opción de 2-4 que se explican solas, todas visibles. Si cambia de COLECCIÓN en vez de filtrar, son pestañas (DD-113).',
  'sc-skeleton': 'Para el hueco de lo que está cargando, con su forma. Evita el salto que da aparecer de golpe.',
  'sc-slot': 'Para una ranura con título dentro de una composición.',
  'sc-sticky-form-header': 'Para la cabecera fija de un formulario largo, con guardar y cancelar siempre a mano.',
  'sc-subsection': 'Para un nivel más dentro de una sección, plegable si lo secundario estorba.',
  'sc-tag': 'Para clasificar o marcar un estado EN la fila. Si es un contador pegado a algo, `sc-badge`; si el usuario lo puede quitar, `sc-chip`.',
  'sc-textarea': 'Para texto que puede ocupar varias líneas: una descripción, una nota, el motivo de algo. Si siempre cabe en una, `sc-inputtext`.',
  'sc-toast': 'Para el resultado de una acción, que se va solo. Si el aviso pertenece a la página y debe quedarse, `sc-message`.',
  'sc-toggleswitch': 'Para encender o apagar algo CON EFECTO INMEDIATO. Si el cambio se guarda al enviar el formulario, `sc-checkbox`.',
  pTooltip: 'Para lo que se lee al pasar el ratón: un icono con significado, un texto cortado (con `showOnEllipsis`) o por qué un botón está apagado. Nunca un `title`, que el navegador enseña con su globo; el de un botón de solo icono ya lo pone `sc-button`.',
};

/**
 * El nombre del MÓDULO de PrimeNG no siempre es la clave del TEMA, y confundirlos hace mentir al
 * catálogo. Medido el 2026-09-19 sobre los 33 módulos que importamos: cuatro no casan.
 *
 * El caso que lo destapó es `sc-datatable`: importa `primeng/table`, pero Aura lo tematiza bajo
 * `datatable`, así que el informe llegó a listar `datatable` como «sin envolver» teniendo trece
 * usos en el Supervisor. Los otros tres son piezas que el tema no modela por separado, sino
 * dentro de su componente padre.
 */
export const MODULO_A_TEMA = {
  table: 'datatable',
  avatargroup: 'avatar', // el tema no lo modela aparte
  inputicon: 'iconfield',
  dynamicdialog: 'dialog',
};

/**
 * Componentes de PrimeNG para los que el DS tiene pieza PROPIA, hecha a mano en vez de envuelta.
 *
 * No son «sin envolver»: la necesidad está cubierta, y decir lo contrario mandaría a alguien a
 * envolver algo que ya existe. Cada entrada dice con qué se cubre, para poder discutirlo.
 *
 * ⚠️ Solo entra aquí lo que está MEDIDO, no lo que se parece de nombre. `checkbox` está porque
 * `sc-checkbox` es CUSTOM a propósito: necesita tres estados (`none`/`some`/`all`) y el de PrimeNG
 * no los tiene.
 */
export const CUBIERTO_POR_NUESTRO = {
  checkbox: 'sc-checkbox (custom: necesita el tercer estado, el grupo elegido a medias)',
};

/**
 * Los componentes que tienen MAESTRO en el Kit: una página «❖ Nombre» en el fichero del DS
 * (`khNq9dJKNi13pNllrqm6dx`), leídas por la API de Figma el 2026-10-09 (DD-190). Es la mitad del
 * estado de un componente en sc-docs: «Ready» si tiene maestro en el Kit y página de demo,
 * «Experimental» si le falta algo, «Deprecated» si su clase lleva `@deprecated`.
 *
 * El CI no llega a Figma, así que la lista vive aquí. Si se crea o se borra una página «❖» en el
 * fichero, se actualiza esta lista (los nombres, tal cual, sin el «❖» ni espacios).
 */
export const KIT_MAESTROS = new Set([
  'AutoComplete', 'CascadeSelect', 'Checkbox', 'ColorPicker', 'DatePicker', 'Editor', 'FloatLabel', 'IftaLabel',
  'InputGroup', 'InputNumber', 'InputOtp', 'InputText', 'Knob', 'Listbox', 'MultiSelect', 'Password', 'RadioButton',
  'Rating', 'Select', 'SelectButton', 'Slider', 'Textarea', 'ToggleButton', 'ToggleSwitch', 'TreeSelect', 'Button',
  'SplitButton', 'SpeedDial', 'DataTable', 'DataView', 'OrderList', 'OrganizationChart', 'Paginator', 'PickList',
  'Timeline', 'Tree', 'TreeTable', 'Accordion', 'Card', 'Divide', 'Fieldset', 'Panel', 'ScrollPanel', 'Splitter',
  'Stepper', 'Tabs', 'Toolbar', 'ConfirmDialog', 'ConfirmPopup', 'Dialog', 'Drawer', 'Popover', 'Tooltip',
  'FileUpload', 'Breadcrumb', 'ContextMenu', 'Dock', 'Menu', 'Menubar', 'MegaMenu', 'PanelMenu', 'TieredMenu',
  'Message', 'Toast', 'Carousel', 'Galleria', 'Image', 'ImageCompare', 'Avatar', 'Badge', 'BlockUI', 'Chip',
  'Inplace', 'MeterGroup', 'ScrollTop', 'Skeleton', 'ProgressBar', 'ProgressSpinner', 'Tag', 'Terminal',
  'Custom modal', 'Alert modal', 'Sidebar', 'Navmenu', 'Section',
]);

/** Componente del DS → su página del Kit, cuando el nombre no casa solo (el Kit escribe «Divide»). */
export const KIT_ALIAS = {
  divider: 'Divide',
  'section-card': 'Section',
  avatargroup: 'Avatar',
};

/**
 * Nativos de PrimeNG que el DS adopta TAL CUAL, sin un `sc-*` que los envuelva (DD-113). Su página de sc-docs se
 * registra como la de cualquier componente, pero su contrato sale de la API instalada, no de un fichero nuestro.
 * Clave = la ruta de su página (y su nombre en el Kit); `selector`, la entrada con la que se escribe; `modulo`, el de
 * `primeng/<modulo>`.
 */
export const NATIVOS_ADOPTADOS = {
  // El tooltip del Kit es el `pTooltip` de PrimeNG (DD-212); una directiva propia que mida el recorte se descartó.
  tooltip: { selector: 'pTooltip', modulo: 'tooltip' },
};
