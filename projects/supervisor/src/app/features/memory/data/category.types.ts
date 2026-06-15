/**
 * Modelo de Categoría IA Memory · temas y motivos de contacto que la
 * IA etiqueta sobre las conversaciones (ej. "queja de facturación",
 * "consulta técnica", "venta cruzada").
 *
 * Migrado desde `CategoriesContext.tsx` del prototipo React.
 *
 * **Bidireccionalidad Rule ↔ Category (S49 §10 #13)**: la fuente de verdad
 * de qué reglas usan una categoría es `Rule.categorias[]`. El contador
 * `usedInRules` se deriva en runtime desde `RulesStore.rulesByCategoryId`,
 * NO se persiste aquí — evita estado duplicado y desincronización.
 */
export interface Category {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly group?: string;
  readonly isActive: boolean;
  /** Llamadas clasificadas con esta categoría — mock estático. Vendrá de
   *  backend cuando exista. */
  readonly classifiedCalls: number;
  readonly createdAt: string;
  readonly isTemplate?: boolean;
}
