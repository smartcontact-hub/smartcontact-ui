import { COMPONENT_CATALOG, CatalogEntry } from './component-catalog';

const PORRUTA = new Map(COMPONENT_CATALOG.map((e) => [e.path, e]));

/**
 * La ficha de un componente del contrato, si la tiene: su ruta es su nombre sin guiones (`section-card` →
 * `sectioncard`), la misma regla con la que `audit:components` decide si tiene demo. `null` si no hay página.
 */
export function fichaDe(selector: string, name?: string): CatalogEntry | null {
  const base = (name ?? selector.replace(/^sc-/, '')).replace(/-/g, '');
  return PORRUTA.get(base) ?? null;
}
