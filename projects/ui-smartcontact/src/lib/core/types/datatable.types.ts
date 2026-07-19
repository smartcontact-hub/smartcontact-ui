import type { TemplateRef } from '@angular/core';

/** Contexto de la plantilla de celda custom de una columna. */
export interface ScColumnCellContext<T = unknown> {
  /** La fila de datos. */
  readonly $implicit: T;
  /** Índice de la fila en el render actual. */
  readonly rowIndex: number;
  /**
   * La columna que se está pintando (`let-col="col"`).
   *
   * Imprescindible para las tablas con columnas CONFIGURABLES, que no pueden
   * declarar un `<ng-template>` por columna porque no saben cuáles habrá: con
   * una sola plantilla genérica, sin esto no hay forma de saber qué campo leer
   * ni cómo pintarlo. Las tablas de columnas fijas pueden ignorarlo.
   */
  readonly col: ScColumnDef<T>;
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
  /**
   * Propiedad de la fila que se lee y por la que se ordena. Es también la
   * identidad de la columna: `[visibleColumns]` casa por este valor, así que
   * una columna sin datos (acciones, kebab) necesita igualmente un `field`
   * único aunque no exista en la fila.
   */
  readonly field: string;
  /** Cabecera ya traducida por el consumidor. */
  readonly header: string;
  /** Nombre accesible de la cabecera cuando `header` va vacío.
   *
   * Las columnas de acciones (kebab, menú) se pintan con `header: ''` a
   * propósito: visualmente no deben decir nada. Pero un `<th>` vacío es una
   * cabecera de columna ANÓNIMA para un lector de pantalla, y las tablas a
   * mano que se migraron sí llevaban su `aria-label="Acciones"` — o sea que
   * la migración lo perdía en silencio. Lo destaparon tres revisiones
   * independientes el 2026-07-19, cada una en su tabla. */
  readonly headerAriaLabel?: string;
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
  /**
   * La celda de esta columna NO dispara `(rowClick)`.
   *
   * Para columnas de acciones: el kebab ya para la propagación por su cuenta,
   * pero el HUECO alrededor —el padding de la celda— no, así que fallar el
   * botón por unos píxeles abría la ficha. Antes de migrar lo tragaba el `<td>`
   * de la página; ahora el `<td>` lo pinta el DS, y por eso se declara aquí.
   */
  readonly stopRowClick?: boolean;
}

/**
 * Payload de los gestos de fila (`rowClick`, `rowContextMenu`).
 *
 * Lleva el evento original **sin consumir**: el DS solo hace el
 * `preventDefault()` del menú contextual (evitar el menú nativo del navegador
 * es la única lectura posible de ese gesto). Todo lo demás —parar la
 * propagación, leer `shiftKey`— es del consumidor, que es quien sabe qué
 * significa un click en su tabla.
 */
export interface ScDatatableRowEvent<T = unknown> {
  /** La fila sobre la que se hizo el gesto. */
  readonly row: T;
  /** Índice de la fila en el render actual (ojo: cambia al ordenar/paginar). */
  readonly index: number;
  /** El evento del DOM, por si el consumidor necesita `shiftKey` o coordenadas. */
  readonly originalEvent: MouseEvent;
}

/**
 * Payload de `rowKeydown`. Igual que `ScDatatableRowEvent` pero con el evento
 * de teclado, para que el consumidor lea `key` sin castear.
 */
export interface ScDatatableRowKeyEvent<T = unknown> {
  readonly row: T;
  readonly index: number;
  readonly originalEvent: KeyboardEvent;
}

/**
 * Clases extra por fila. Se resuelve en cada render, así que debe ser barata y
 * pura: nada de leer señales que no dependan de la propia fila.
 */
export type ScRowStyleClassFn<T = unknown> = (row: T, index: number) => string | undefined;
