import { SC_DEMO_COMPONENT_PAGES, ScDemoComponentPage } from './component-pages';

/**
 * Catálogo del showcase: EVOLUCIONA `component-pages.ts` añadiendo categoría + flag de
 * «storyfied» (migrado al motor story). No duplica el registro — lo deriva, así las rutas
 * y el catálogo nunca se desfasan. La categoría agrupa la sidebar; el flag pinta el badge.
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
  pageheader: 'Layout',
  panel: 'Layout',
  sectioncard: 'Layout',
  slot: 'Layout',
  stickyformheader: 'Layout',
  subsection: 'Layout',
  // Patrones
  bulkactionbar: 'Patrones',
  bulkeditmenu: 'Patrones',
  bulktranscriptionmodal: 'Patrones',
};

/** Componentes migrados al motor story (pintan badge «nuevo» en la sidebar). */
const STORYFIED = new Set<string>(['button', 'select', 'datatable']);

export interface CatalogEntry extends ScDemoComponentPage {
  readonly category: ComponentCategory;
  readonly storyfied: boolean;
}

/** Catálogo plano, derivado del registro de páginas. */
export const COMPONENT_CATALOG: readonly CatalogEntry[] = SC_DEMO_COMPONENT_PAGES.map((page) => ({
  ...page,
  category: CATEGORY[page.path] ?? 'Patrones',
  storyfied: STORYFIED.has(page.path),
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
