import { NgTemplateOutlet } from '@angular/common';
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

import { ScColumnDef } from '../../core/types/datatable.types';
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
 */
@Component({
  selector: 'sc-datatable',
  imports: [TableModule, NgTemplateOutlet],
  templateUrl: './sc-datatable.component.html',
  styleUrl: './sc-datatable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScDatatableComponent<T = unknown> {
  readonly value = input<readonly T[]>([]);
  readonly columns = input<readonly ScColumnDef<T>[]>([]);
  readonly dataKey = input<string | undefined>(undefined);

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

  /** Mapea sm/md/lg a la prop `size` de p-table (md = sin atributo → padding base del preset). */
  protected readonly pSize = computed<'small' | 'large' | undefined>(() => {
    const s = this.size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });

  /** colspan de la fila vacía: columnas + la de checkbox si aplica. */
  protected readonly colspan = computed<number>(
    () => this.columns().length + (this.selectionMode() === 'multiple' ? 1 : 0),
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

  protected onSortEvent(event: { field?: string; order?: number }): void {
    this.sortChange.emit({ field: event.field, order: event.order ?? 1 });
  }
}
