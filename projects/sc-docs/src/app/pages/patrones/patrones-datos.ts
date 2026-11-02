/**
 * Un patrón de pantalla: su clave i18n, su icono y su dirección. Los textos (título, nombre corto del lateral, la regla
 * en positivo, el anti-patrón y con qué del sistema ya se resuelve) viven en `fundamentos.patterns.principles.<clave>`.
 */
export interface Patron {
  readonly clave: string;
  readonly icono: string;
  /** `/fundamentos/patrones/<ruta>`, en castellano como el resto de direcciones de la doc. */
  readonly ruta: string;
}

/**
 * Los patrones, en el orden de la doc: primero lo que el sistema ya te da (color, carga, textos, iconos), luego las
 * reglas que no viven en ningún componente (densidad, estabilidad, agrupación). Una lista para tres sitios: el índice,
 * cada página (anterior y siguiente) y el lateral.
 */
export const PATRONES: readonly Patron[] = [
  { clave: 'color', icono: 'palette', ruta: 'color' },
  { clave: 'loading', icono: 'progress_activity', ruta: 'carga' },
  { clave: 'copy', icono: 'subject', ruta: 'textos' },
  { clave: 'icons', icono: 'grid_view', ruta: 'iconos' },
  { clave: 'density', icono: 'table_rows', ruta: 'densidad' },
  { clave: 'a11y', icono: 'accessibility_new', ruta: 'accesibilidad' },
  { clave: 'motion', icono: 'animation', ruta: 'sin-saltos' },
  { clave: 'type', icono: 'text_fields', ruta: 'tipografia' },
  { clave: 'grouping', icono: 'view_agenda', ruta: 'agrupacion' },
  { clave: 'fill', icono: 'height', ruta: 'tablas' },
  { clave: 'blame', icono: 'pending', ruta: 'lo-que-falta' },
];
