import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';

import { TICKETS, TICKETS_TOTAL, TicketRow } from '../../data/seed';

/** Definición de columna: `key` casa con el campo de `TicketRow`. */
interface Col {
  readonly key: keyof TicketRow | 'select';
  readonly header: string;
  /** Ancho fijo medido del real; sin él la columna encoge al contenido. */
  readonly width: string;
  /** Tipo de filtro de la fila de filtros (la real mezcla input y select). */
  readonly filter: 'text' | 'select' | 'none';
}

/**
 * Vista Tickets — la tabla principal de CusCare.
 *
 * Se construye sobre `p-table` de PrimeNG A PROPÓSITO: la tabla del sitio real ES
 * un p-table (clases `p-datatable-scrollable-table p-datatable-table` medidas en
 * vivo), así que el DOM sale idéntico en vez de aproximado. El LOOK va en CSS
 * plano con los valores extraídos, no con tokens `--sc-*` (DD-35).
 *
 * Medido del real: 19 columnas, `th` 12px/600 `#4f5663` sobre `#f7f8fa` con
 * `padding:12px 8px`, filas de 47.5px separadas por `1px #dadfe6`, scroll
 * horizontal (la tabla mide 2694px), 10 filas por página de 2298 resultados.
 */
@Component({
  selector: 'app-tickets-page',
  standalone: true,
  imports: [TableModule, RouterLink],
  templateUrl: './tickets-page.component.html',
  styleUrl: './tickets-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketsPageComponent {
  /** `p-table` pide un array mutable; el seed es readonly, así que se copia. */
  protected readonly rows: TicketRow[] = [...TICKETS];
  protected readonly total = TICKETS_TOTAL;
  protected readonly selected = signal<readonly string[]>([]);

  /**
   * Las 18 columnas del real (+ la de selección, aparte), en orden.
   * Los anchos son los MEDIDOS en el sitio en vivo (`getBoundingClientRect` sobre
   * cada `th`) — no estimados; sumados dan los 2694px de tabla que mide la real.
   */
  protected readonly cols: readonly Col[] = [
    { key: 'id', header: 'ID', width: '80px', filter: 'text' },
    { key: 'status', header: 'Status', width: '120px', filter: 'select' },
    { key: 'assignedTo', header: 'Assigned to', width: '186px', filter: 'text' },
    { key: 'group', header: 'Group', width: '130px', filter: 'select' },
    { key: 'channel', header: 'Channel', width: '110px', filter: 'select' },
    { key: 'source', header: 'Source', width: '140px', filter: 'text' },
    { key: 'email', header: 'Email', width: '167px', filter: 'text' },
    { key: 'country', header: 'Country', width: '101px', filter: 'select' },
    { key: 'products', header: 'Products', width: '348px', filter: 'text' },
    { key: 'created', header: 'Created', width: '167px', filter: 'none' },
    { key: 'updated', header: 'Updated', width: '167px', filter: 'none' },
    { key: 'description', header: 'Description', width: '250px', filter: 'none' },
    { key: 'priority', header: 'Priority', width: '110px', filter: 'select' },
    { key: 'subStatus', header: 'Sub-status', width: '130px', filter: 'select' },
    { key: 'refund', header: 'Refund', width: '130px', filter: 'text' },
    { key: 'gdpr', header: 'GDPR', width: '155px', filter: 'select' },
    { key: 'carrier', header: 'Carrier', width: '150px', filter: 'none' },
    { key: 'moErrorContent', header: 'MO Error Content', width: '167px', filter: 'none' },
  ];

  protected readonly bulkActions = ['Assign', 'Change status', 'Unsubscribe', 'Archive'];

  protected value(row: TicketRow, key: Col['key']): string {
    if (key === 'select') return '';
    const v = row[key as keyof TicketRow];
    return Array.isArray(v) ? v.join(', ') : String(v ?? '');
  }
}
