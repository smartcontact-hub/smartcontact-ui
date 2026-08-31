import { SC_DEMO_COMPONENT_PAGES, ScDemoComponentPage } from './component-pages';

/**
 * Catálogo del showcase: EVOLUCIONA `component-pages.ts` añadiendo la categoría. No duplica
 * el registro — lo deriva, así las rutas y el catálogo nunca se desfasan. La categoría agrupa
 * la sidebar. (Ya no hay flag «storyfied»: los 49 están en formato story.)
 */
export type ComponentCategory =
  | 'Botones'
  | 'Inputs'
  | 'Datos'
  | 'Overlays'
  | 'Feedback'
  | 'Layout'
  | 'Patrones';

/** Orden de las secciones en la sidebar. */
export const CATEGORY_ORDER: readonly ComponentCategory[] = [
  'Botones',
  'Inputs',
  'Datos',
  'Overlays',
  'Feedback',
  'Layout',
  'Patrones',
];

/** path (sin guiones, = el de component-pages) → categoría. */
const CATEGORY: Record<string, ComponentCategory> = {
  button: 'Botones',
  // Inputs
  checkbox: 'Inputs',
  colordotpicker: 'Inputs',
  datepicker: 'Inputs',
  inputgroup: 'Inputs',
  inputnumber: 'Inputs',
  inputtext: 'Inputs',
  multiselect: 'Inputs',
  photoupload: 'Inputs',
  radiobutton: 'Inputs',
  search: 'Inputs',
  select: 'Inputs',
  textarea: 'Inputs',
  toggleswitch: 'Inputs',
  // Datos
  avatar: 'Datos',
  badge: 'Datos',
  chip: 'Datos',
  columnselector: 'Datos',
  datatable: 'Datos',
  gauge: 'Datos',
  inlinerenamecell: 'Datos',
  tag: 'Datos',
  // Overlays
  commandpalette: 'Overlays',
  confirmdialog: 'Overlays',
  deleteentitydialog: 'Overlays',
  dialog: 'Overlays',
  drawer: 'Overlays',
  grouppopover: 'Overlays',
  impactpreviewdialog: 'Overlays',
  keyboardshortcuts: 'Overlays',
  // Feedback
  emptystate: 'Feedback',
  message: 'Feedback',
  progressbar: 'Feedback',
  progressspinner: 'Feedback',
  skeleton: 'Feedback',
  toast: 'Feedback',
  // Layout
  card: 'Layout',
  divider: 'Layout',
  formdangerzone: 'Layout',
  formsectionnav: 'Layout',
  panel: 'Layout',
  sectioncard: 'Layout',
  slot: 'Layout',
  stickyformheader: 'Layout',
  subsection: 'Layout',
  // Patrones
  bulkactionbar: 'Patrones',
  bulkeditmenu: 'Patrones',
};

/**
 * Para qué sirve cada componente, en una línea (tono UX eng / UI dev). Lo consume la
 * portada de Componentes para que se pueda escanear el catálogo sin abrir 49 páginas.
 * Fuente única: si cambia el propósito de un wrapper, se edita aquí.
 */
const BLURB: Record<string, string> = {
  // Botones
  button: 'Acción primaria, secundaria o de texto. Severidades de marca, tamaños y estado de carga.',
  // Inputs
  inputtext: 'Campo de texto de una línea, la base de todo formulario.',
  textarea: 'Texto multilínea con autoajuste de alto y contador opcional de caracteres.',
  inputnumber: 'Entrada numérica con pasos, mínimo/máximo y formato de miles o moneda.',
  select: 'Selección única desplegable, con búsqueda y agrupación de opciones.',
  multiselect: 'Selección de varios valores de una lista, con búsqueda y fichas de lo elegido.',
  checkbox: 'Casilla booleana, o selección múltiple dentro de una lista de opciones.',
  radiobutton: 'Elección única dentro de un grupo de opciones excluyentes.',
  toggleswitch: 'Interruptor on/off para ajustes que se aplican al instante.',
  datepicker: 'Selección de fecha o rango con calendario y entrada por teclado.',
  search: 'Campo de búsqueda con icono, borrado rápido y debounce para filtrar en vivo.',
  inputgroup: 'Compón un campo con adornos pegados: prefijo, sufijo, botón o icono.',
  colordotpicker: 'Elige un color de la paleta de marca como punto, para etiquetar o categorizar.',
  photoupload: 'Sube y previsualiza una imagen (avatar, logo) con recorte y validación.',
  // Datos
  badge: 'Contador o punto de estado sobre un icono o acción: no leídos, alertas.',
  chip: 'Ficha compacta y descartable para filtros activos, tags o valores seleccionados.',
  tag: 'Etiqueta de estado de solo lectura, con severidad de marca y punto de color opcional.',
  avatar: 'Foto, iniciales o icono de una persona o entidad, con tamaños y estado.',
  gauge: 'Indicador radial de un valor dentro de un rango: ocupación, progreso, umbral.',
  datatable: 'Tabla de datos con orden por cabecera, paginación, selección y columnas gestionables.',
  columnselector: 'Muestra, oculta y reordena las columnas de una tabla arrastrando.',
  inlinerenamecell: 'Renombra un valor en la propia celda, sin abrir un diálogo aparte.',
  // Overlays
  dialog: 'Ventana modal para una tarea enfocada: formulario, detalle o decisión.',
  confirmdialog: 'Pide confirmar una acción antes de ejecutarla, con foco en el botón seguro.',
  deleteentitydialog: 'Confirmación de borrado con el nombre de la entidad, para no equivocar el objetivo.',
  impactpreviewdialog: 'Enseña qué quedará afectado antes de aplicar un cambio en cascada.',
  drawer: 'Panel lateral que entra desde el borde para detalles o formularios sin salir de la página.',
  grouppopover: 'Popover anclado para editar o elegir sin perder el contexto de fondo.',
  commandpalette: 'Buscador de acciones y navegación por teclado (⌘K), tipo paleta de comandos.',
  keyboardshortcuts: 'Hoja de los atajos de teclado disponibles, agrupados por contexto.',
  // Feedback
  message: 'Aviso en línea dentro del flujo: info, éxito, advertencia o error.',
  toast: 'Notificación efímera que aparece y se va sola, sin bloquear la pantalla.',
  emptystate: 'Pantalla cuando no hay datos: explica qué es y ofrece el siguiente paso.',
  skeleton: 'Silueta gris mientras carga el contenido, para que el layout no salte.',
  progressbar: 'Barra de progreso determinado, con el porcentaje de una tarea larga.',
  progressspinner: 'Girador de carga para esperas de duración desconocida.',
  // Layout
  card: 'Contenedor con superficie, sombra y radio para agrupar contenido relacionado.',
  panel: 'Bloque con cabecera y cuerpo, plegable, para seccionar una página.',
  sectioncard: 'Tarjeta de sección con título y descripción para agrupar campos de un formulario.',
  subsection: 'Subdivisión con encabezado ligero dentro de una sección mayor.',
  divider: 'Línea o espacio con margen para cortar visualmente entre bloques.',
  slot: 'Hueco de composición: mete cualquier contenido en un patrón sin acoplarlo.',
  formsectionnav: 'Navegación lateral de las secciones de un formulario largo, con salto y estado.',
  formdangerzone: 'Zona final del formulario para acciones destructivas: borrar, desactivar.',
  stickyformheader: 'Cabecera de formulario que se fija arriba al hacer scroll, con guardar y cancelar.',
  // Patrones
  breadcrumb: 'Ruta de migas de la jerarquía actual, con el tramo activo resaltado.',
  bulkactionbar: 'Barra que aparece al seleccionar filas, con el recuento y las acciones en bloque.',
  bulkeditmenu: 'Menú de acciones para aplicar a varias filas seleccionadas a la vez.',
  bulktranscriptionmodal: 'Modal para lanzar la transcripción de varias conversaciones en lote.',
};

export interface CatalogEntry extends ScDemoComponentPage {
  readonly category: ComponentCategory;
  /** Para qué sirve, en una línea (portada de Componentes). '' si aún no tiene. */
  readonly blurb: string;
}

/** Catálogo plano, derivado del registro de páginas. */
export const COMPONENT_CATALOG: readonly CatalogEntry[] = SC_DEMO_COMPONENT_PAGES.map((page) => ({
  ...page,
  category: CATEGORY[page.path] ?? 'Patrones',
  blurb: BLURB[page.path] ?? '',
}));

export interface CatalogGroup {
  readonly category: ComponentCategory;
  readonly items: readonly CatalogEntry[];
}

/** Agrupa (en el orden de CATEGORY_ORDER) y filtra por texto (label + path). */
export function groupCatalog(query = ''): readonly CatalogGroup[] {
  const q = query.trim().toLowerCase();
  const match = (e: CatalogEntry): boolean =>
    !q || e.label.toLowerCase().includes(q) || e.path.toLowerCase().includes(q);
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: COMPONENT_CATALOG.filter((e) => e.category === category && match(e)),
  })).filter((g) => g.items.length > 0);
}
