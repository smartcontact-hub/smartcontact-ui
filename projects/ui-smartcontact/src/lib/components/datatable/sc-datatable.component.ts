import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { TableModule, type TablePageEvent } from 'primeng/table';

import { ScColumnDef } from '../../core/types/datatable.types';
import { ScComponentSize } from '../../core/types/theme-component.types';

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

  readonly paginator = input<boolean>(false);
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
  readonly scrollable = input<boolean>(false);
  readonly scrollHeight = input<string | undefined>(undefined);
  readonly stripedRows = input<boolean>(false);
  readonly showGridlines = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly sortChange = output<ScDatatableSortEvent>();
  readonly page = output<TablePageEvent>();

  /** Mapea sm/md/lg a la prop `size` de p-table (md = sin atributo → padding base del preset). */
  protected readonly pSize = computed<'small' | 'large' | undefined>(() => {
    const s = this.size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });

  /** colspan de la fila vacía: columnas + la de checkbox si aplica. */
  protected readonly colspan = computed<number>(
    () => this.columns().length + (this.selectionMode() === 'multiple' ? 1 : 0),
  );

  /** Lee `row[field]` sin indexar `unknown` directo en plantilla. */
  protected cellValue(row: T, field: string): unknown {
    return (row as Record<string, unknown>)[field];
  }

  protected onSortEvent(event: { field?: string; order?: number }): void {
    this.sortChange.emit({ field: event.field, order: event.order ?? 1 });
  }
}
