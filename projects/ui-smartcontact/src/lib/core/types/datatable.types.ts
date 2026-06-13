import type { TemplateRef } from '@angular/core';

/** Contexto de la plantilla de celda custom de una columna. */
export interface ScColumnCellContext<T = unknown> {
  /** La fila de datos. */
  readonly $implicit: T;
  /** Índice de la fila en el render actual. */
  readonly rowIndex: number;
}

/**
 * Definición de columna del `sc-datatable`. Modelo data-driven (column-def +
 * template), 1:1 con el preset PrimeNG ya tokenizado.
 *
 * `header` va **ya traducido por el consumidor** (el DS no traduce contenido —
 * misma decisión que la paleta de comandos). `cellTemplate` deja al consumidor
 * componer cualquier celda (avatar+nombre, `sc-inline-rename-cell`, badges…) sin
 * que el DS conozca tipos de celda.
 */
export interface ScColumnDef<T = unknown> {
  /** Propiedad de la fila que se lee y por la que se ordena. */
  readonly field: string;
  /** Cabecera ya traducida por el consumidor. */
  readonly header: string;
  /** Activa la UI de orden por esta columna (orden client-side de p-table). */
  readonly sortable?: boolean;
  /** Ancho CSS de la columna (p.ej. `'12rem'`, `'20%'`). */
  readonly width?: string;
  /** Alineación del texto de la celda y la cabecera. */
  readonly align?: 'left' | 'right' | 'center';
  /**
   * Plantilla de celda custom; contexto `{ $implicit: row, rowIndex }`. Si se
   * omite, la celda pinta `row[field]`.
   */
  readonly cellTemplate?: TemplateRef<ScColumnCellContext<T>>;
}
