import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import type { FilterMetadata } from 'primeng/api';
import {
  Table,
  TableModule,
  type TableFilterEvent,
  type TableLazyLoadEvent,
  type TablePageEvent,
} from 'primeng/table';

import {
  ScColumnDef,
  ScDatatableRowEvent,
  ScRowStyleClassFn,
} from '../../core/types/datatable.types';
import { ScComponentSize } from '../../core/types/theme-component.types';

/** Mapa de filtros de p-table (por campo + `global`). */
export type ScDatatableFilters = Record<string, FilterMetadata | FilterMetadata[]>;

/** Payload de `sortChange` (orden single client-side). */
export interface ScDatatableSortEvent {
  readonly field: string | undefined;
  readonly order: number;
}

/**
 * Tabla de datos sobre PrimeNG `<p-table>`. El theming lo resuelve el preset
 * `datatable.ts` (ya tokenizado a `--sc-scale-*`); el wrapper aporta solo la
 * superficie de API data-driven (column-defs + template de celda por columna) y
 * la proyección de slots.
 *
 * MVP no-lazy (lote 8-2): `value`/`columns`/`sortable`/`paginator`/`selección`.
 * El orden y la paginación los resuelve p-table client-side; lazy/filter llegan
 * en 8-3 como output `(lazyLoad)`.
 *
 * Slots de proyección:
 *   - `[scTableCaption]` → cabecera de la tabla (toolbar: search, column-selector…).
 *   - `[scTableEmpty]`   → fila sin-datos (envuelve `sc-empty-state`).
 * Celdas custom: `ScColumnDef.cellTemplate` (contexto `{ $implicit: row, rowIndex }`).
 *
 * B4 añade las 4 capacidades que las tablas del supervisor traían a mano y que
 * eran justo lo que impedía migrarlas:
 *   - `[rowStyleClass]`     → clases por fila (seleccionada, clicable, leída…).
 *   - `(rowClick)`          → la fila abre; la casilla de selección no.
 *   - `(rowContextMenu)`    → click derecho, para el `<p-menu>` compartido.
 *   - `[visibleColumns]`    → visibilidad y ORDEN, cableable a `sc-column-selector`.
 */
@Component({
  selector: 'sc-datatable',
  imports: [TableModule, NgClass, NgTemplateOutlet],
  templateUrl: './sc-datatable.component.html',
  styleUrl: './sc-datatable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScDatatableComponent<T = unknown> {
  readonly value = input<readonly T[]>([]);
  readonly columns = input<readonly ScColumnDef<T>[]>([]);
  readonly dataKey = input<string | undefined>(undefined);

  /**
   * Columnas visibles, por `field` y **en orden de pintado**. Es el formato que
   * emite `sc-column-selector` en `(orderedVisibleChange)` (su `key` = nuestro
   * `field`), así que cablear las dos es pasar el array tal cual.
   *
   * Sin informar, se pintan todas las de `columns()` en su orden declarado. Un
   * `field` del array que no exista en `columns()` se ignora.
   */
  readonly visibleColumns = input<readonly string[] | undefined>(undefined);

  readonly paginator = input(false, { transform: booleanAttribute });
  readonly rows = input<number | undefined>(undefined);
  readonly rowsPerPageOptions = input<number[] | undefined>(undefined);

  /** `'single'` (click en la fila) · `'multiple'` (checkboxes) · `null` (sin selección). */
  readonly selectionMode = input<'single' | 'multiple' | null>(null);
  /** Selección two-way: la fila (single) o el array de filas (multiple). */
  readonly selection = model<T | readonly T[] | null>(null);

  /** Orden inicial (client-side; p-table reordena `value`). */
  readonly sortField = input<string | undefined>(undefined);
  readonly sortOrder = input<number>(1);

  readonly size = input<ScComponentSize>('md');
  readonly scrollable = input(false, { transform: booleanAttribute });
  readonly scrollHeight = input<string | undefined>(undefined);
  readonly stripedRows = input(false, { transform: booleanAttribute });
  readonly showGridlines = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Clases extra por fila — el equivalente a los `[class.table__row--x]` que
   * cada tabla del supervisor escribe a mano. Se aplica con `ngClass`, que
   * convive con las clases que p-table pone por su cuenta (`p-highlight` al
   * seleccionar) en vez de pisarlas como haría un `[class]` a pelo.
   */
  readonly rowStyleClass = input<ScRowStyleClassFn<T> | undefined>(undefined);

  /**
   * Modo lazy (server-driven): p-table deja de ordenar/paginar/filtrar en cliente
   * y emite `(lazyLoad)` con los metadatos (page/sort/filter). El consumidor
   * busca los datos y actualiza `value` + `totalRecords`.
   */
  readonly lazy = input(false, { transform: booleanAttribute });
  /** Total de registros del lado servidor (paginador en modo lazy). */
  readonly totalRecords = input<number | undefined>(undefined);
  /** Mapa de filtros (controlado por el consumidor; en lazy viaja en el evento). */
  readonly filters = input<ScDatatableFilters | undefined>(undefined);
  /** Campos sobre los que aplica el filtro `global`. */
  readonly globalFilterFields = input<readonly string[] | undefined>(undefined);

  readonly sortChange = output<ScDatatableSortEvent>();
  readonly page = output<TablePageEvent>();
  readonly lazyLoad = output<TableLazyLoadEvent>();
  readonly filterChange = output<TableFilterEvent>();

  /**
   * Click en la fila. **No se emite desde la celda de selección**: esa celda
   * corta la propagación, porque el reparto canónico es «la fila abre, la
   * casilla selecciona» y si el click de la casilla también abriera, marcar
   * cinco filas abriría cinco veces el detalle.
   */
  readonly rowClick = output<ScDatatableRowEvent<T>>();

  /**
   * Click derecho en la fila, con el menú nativo ya cancelado.
   *
   * Emite un evento en vez de montar un `<p-contextmenu>` dentro: la app tiene
   * UN `<p-menu popup>` por tabla que sirven a la vez el kebab y el click
   * derecho (Ola 2 mató justo el segundo motor de menú). Un menú propio del DS
   * volvería a poner dos modelos donde ahora hay uno.
   */
  readonly rowContextMenu = output<ScDatatableRowEvent<T>>();

  /** Mapea sm/md/lg a la prop `size` de p-table (md = sin atributo → padding base del preset). */
  protected readonly pSize = computed<'small' | 'large' | undefined>(() => {
    const s = this.size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });

  /**
   * Las columnas que se pintan de verdad: `columns()` filtrada y REORDENADA por
   * `visibleColumns()`. El orden lo manda el array de visibles, no el declarado,
   * porque `sc-column-selector` deja arrastrar para reordenar y esa es la única
   * forma de que la tabla obedezca al arrastre.
   */
  protected readonly visibleCols = computed<readonly ScColumnDef<T>[]>(() => {
    const declared = this.columns();
    const visible = this.visibleColumns();
    if (!visible) return declared;
    const byField = new Map(declared.map((col) => [col.field, col] as const));
    return visible
      .map((field) => byField.get(field))
      .filter((col): col is ScColumnDef<T> => col !== undefined);
  });

  /**
   * En `multiple`, `pSelectableRow` de PrimeNG selecciona al clicar la fila —
   * y eso choca con el modelo canónico que fijó la Ola 6: **la fila abre, la
   * casilla selecciona**. Con los dos activos, un click hacía las dos cosas.
   *
   * En `single` no se desactiva: ahí seleccionar ES clicar la fila, que es lo
   * que ese modo significa en p-table.
   */
  protected readonly rowSelectDisabled = computed<boolean>(() => {
    const mode = this.selectionMode();
    return !mode || mode === 'multiple';
  });

  /** colspan de la fila vacía: columnas VISIBLES + la de checkbox si aplica. */
  protected readonly colspan = computed<number>(
    () => this.visibleCols().length + (this.selectionMode() === 'multiple' ? 1 : 0),
  );

  /** Filtros para p-table: referencia estable `{}` cuando el consumidor no informa. */
  protected readonly pFilters = computed<ScDatatableFilters>(() => this.filters() ?? {});

  /** totalRecords efectivo: el del servidor (lazy) o el largo del array (cliente). */
  protected readonly pTotalRecords = computed<number>(() => this.totalRecords() ?? this.value().length);

  private readonly table = viewChild.required(Table);

  /**
   * Filtra por el término global (imperativo — p-table no reacciona a cambios del
   * input `[filters]`, que es solo estado inicial). En cliente re-filtra `value`
   * por `globalFilterFields`; en lazy dispara `(lazyLoad)` con el filtro en el
   * evento. El consumidor lo cablea desde su input de búsqueda.
   */
  filterGlobal(value: string, matchMode = 'contains'): void {
    this.table().filterGlobal(value, matchMode);
  }

  /** Lee `row[field]` sin indexar `unknown` directo en plantilla. */
  protected cellValue(row: T, field: string): unknown {
    return (row as Record<string, unknown>)[field];
  }

  /** Clases de la fila; `ngClass` acepta `undefined` sin quejarse. */
  protected rowClass(row: T, index: number): string | undefined {
    return this.rowStyleClass()?.(row, index);
  }

  protected onRowClick(event: MouseEvent, row: T, index: number): void {
    this.rowClick.emit({ row, index, originalEvent: event });
  }

  protected onRowContextMenu(event: MouseEvent, row: T, index: number): void {
    // El menú nativo del navegador tapa el nuestro y no ofrece ninguna de las
    // acciones de la fila: cancelarlo es la única lectura útil del gesto.
    event.preventDefault();
    this.rowContextMenu.emit({ row, index, originalEvent: event });
  }

  protected onSortEvent(event: { field?: string; order?: number }): void {
    this.sortChange.emit({ field: event.field, order: event.order ?? 1 });
  }
}
