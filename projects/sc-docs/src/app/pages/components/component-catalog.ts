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
 * El «para qué sirve» de cada componente (una línea, tono UX eng / UI dev) que pinta la
 * portada de Componentes vive ahora en i18n, bajo la clave `components.blurb.<path>`
 * (`projects/sc-docs/public/assets/i18n/{es,en}.json`). Fuente única y bilingüe: si cambia
 * el propósito de un wrapper, se edita ahí, en los dos idiomas (lo vigila `i18n:check`).
 */

export interface CatalogEntry extends ScDemoComponentPage {
  readonly category: ComponentCategory;
}

/** Catálogo plano, derivado del registro de páginas. */
export const COMPONENT_CATALOG: readonly CatalogEntry[] = SC_DEMO_COMPONENT_PAGES.map((page) => ({
  ...page,
  category: CATEGORY[page.path] ?? 'Patrones',
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
