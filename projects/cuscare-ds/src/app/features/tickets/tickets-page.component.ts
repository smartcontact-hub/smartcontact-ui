import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import {
  ScButtonComponent,
  ScTagComponent,
  type ColumnDef,
  type ScColumnCellContext,
  type ScColumnDef,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { TooltipModule } from 'primeng/tooltip';
import { ListPageComponent } from '../../shared/list-page/list-page.component';
import { plain, type FilterContext, type FilterDef, type FilterOption, type OptionsTextValue } from '../../shared/list-page/list-filters';
import { REFUND_METHODS, REFUND_STATES, REQUEST_TYPES, SUB_STATUSES, TICKETS_ALL, type TicketRow, type TicketStatus } from '../../data/seed';
import { RequestTypeFilterComponent } from './request-type-filter.component';
import {
  DEFAULT_REQUEST_TYPE_FILTER,
  EMPTY_TYPE,
  isRequestTypeActive,
  matchesRequestType,
  type RequestTypeFilter,
} from './request-type';

/** Cada columna de la tabla (ancho en rem; con el de cada placeholder de filtro entero, sin cortarse): su clave, su rótulo, su ancho y si ordena. Las 19 de CusCare. */
const COLUMNS: readonly (Omit<ScColumnDef<TicketRow>, 'cellTemplate'> & { readonly locked?: boolean; readonly hidden?: boolean })[] = [
  { field: 'id', header: 'ID', width: '13rem', sortable: true, locked: true, frozen: true },
  { field: 'status', header: 'Status', width: '8rem', sortable: true },
  { field: 'requestTypes', header: 'Request type', width: '18rem', sortable: true },
  { field: 'assignedTo', header: 'Assigned to', width: '14rem', sortable: true },
  { field: 'group', header: 'Group', width: '9rem', sortable: true },
  { field: 'channel', header: 'Channel', width: '9rem', sortable: true },
  { field: 'source', header: 'Source', width: '10rem', sortable: true },
  { field: 'email', header: 'Email', width: '12rem', sortable: true },
  { field: 'country', header: 'Country', width: '8rem', sortable: true },
  { field: 'products', header: 'Products', width: '20rem', sortable: true },
  { field: 'created', header: 'Created', width: '13rem', sortable: true },
  { field: 'updated', header: 'Updated', width: '13rem', sortable: true },
  { field: 'description', header: 'Description', width: '16rem', sortable: true },
  { field: 'priority', header: 'Priority', width: '9rem', sortable: true },
  { field: 'subStatus', header: 'Sub-status', width: '10rem', hidden: true, sortable: true },
  { field: 'refund', header: 'Refund', width: '9rem', hidden: true, sortable: true },
  { field: 'gdpr', header: 'GDPR', width: '9rem', hidden: true, sortable: true },
  { field: 'carrier', header: 'Carrier', width: '9rem', hidden: true, sortable: true },
  { field: 'moErrorContent', header: 'MO Error Content', width: '12rem', hidden: true, sortable: true },
];

const STATUS_SEVERITY: Record<TicketStatus, 'info' | 'success' | 'warn' | 'secondary'> = {
  open: 'info',
  resolved: 'success',
  pending: 'warn',
  closed: 'secondary',
};

/** El agente de la sesión, para «Mis tickets». Inventado, como el resto de datos. */
const CURRENT_AGENT = 'ES Agent - M. Angeles';

const ALL = '__all';
const UNASSIGNED = '__unassigned';
const MINE = '__mine';

/** «11-08-2026 09:14» → fecha. El filtro de rango compara por día. */
function parseTicketDate(text: string): Date | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})/.exec(text);
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
}

/** Las opciones de los desplegables empiezan siempre por mayúscula; el valor con el que se filtra no cambia. */
const cap = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** Los valores distintos de una columna, en orden, como opciones de filtro. */
function optionsOf(field: keyof TicketRow): FilterOption[] {
  const values = new Set(TICKETS_ALL.map((r) => String(r[field] ?? '')));
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((value) => ({
    value,
    label: value === '-' || value === '' ? '—' : cap(value),
  }));
}

const AGENT_OPTIONS: FilterOption[] = [
  { label: 'All', value: ALL },
  { label: 'Unassigned', value: UNASSIGNED },
  { label: 'My tickets', value: MINE },
  ...optionsOf('assignedTo').filter((o) => o.value !== 'Unassigned'),
];

const text = (placeholder = 'Type to filter'): FilterDef<TicketRow> => ({ kind: 'text', placeholder });

/**
 * Un filtro por columna, como el Figma «V2 – Tabla tickets + filtros» y sus comentarios:
 *   · ID y Productos: una opción de una lista corta Y un texto, a la vez (la lógica de producción);
 *   · select (una opción): Asignado a (con buscador) y GDPR;
 *   · multiselect: Estado, Grupo, Canal, País, Prioridad, Sub-estado y Reembolso, con buscador;
 *   · texto: Origen, Email, Descripción, Operador y Contenido error MO;
 *   · calendario (rango): Creado y Actualizado;
 *   · a medida: Request type (Figma 2404:35544).
 */
const FILTERS: Readonly<Record<string, FilterDef<TicketRow>>> = {
  id: {
    kind: 'optionsText',
    options: [
      { label: 'All', value: 'all' },
      { label: 'New', value: 'new' },
      { label: 'Updated', value: 'updated' },
    ],
    textPlaceholder: 'Search ID',
    predicate: (row, value) => {
      const { mode, text } = value as OptionsTextValue;
      return (mode === 'all' || row.badge === mode) && (text.trim() === '' || row.id.includes(text.trim()));
    },
  },
  status: { kind: 'multiselect', search: true, options: optionsOf('status') },
  requestTypes: {
    kind: 'custom',
    isActive: (value) => isRequestTypeActive(value as RequestTypeFilter | undefined),
    predicate: (row, value) => matchesRequestType(row.requestTypes, value as RequestTypeFilter | undefined),
  },
  assignedTo: {
    kind: 'select',
    search: true,
    options: AGENT_OPTIONS,
    /* «All» no filtra; «Unassigned» y «My tickets» son reglas, y cualquier otra opción es un agente. */
    predicate: (row, value) => {
      if (value === ALL) return true;
      if (value === UNASSIGNED) return row.assignedTo === 'Unassigned';
      if (value === MINE) return row.assignedTo === CURRENT_AGENT;
      return row.assignedTo === value;
    },
  },
  group: { kind: 'multiselect', search: true, options: optionsOf('group') },
  channel: { kind: 'multiselect', search: true, options: optionsOf('channel') },
  source: text(),
  email: text(),
  country: { kind: 'multiselect', search: true, options: optionsOf('country') },
  products: {
    kind: 'optionsText',
    options: [
      { label: 'All', value: 'all' },
      { label: 'With active service', value: 'active' },
      { label: 'Without active service', value: 'inactive' },
      { label: 'No services', value: 'none' },
    ],
    textPlaceholder: 'Search product',
    predicate: (row, value) => {
      const { mode, text } = value as OptionsTextValue;
      const typed = plain(text.trim());
      return (
        (mode === 'all' || row.serviceState === mode) &&
        (typed === '' || row.products.some((p) => plain(p).includes(typed)))
      );
    },
  },
  created: { kind: 'date', read: (row) => parseTicketDate(row.created) },
  updated: { kind: 'date', read: (row) => parseTicketDate(row.updated) },
  description: text(),
  priority: { kind: 'multiselect', search: true, options: optionsOf('priority') },
  subStatus: { kind: 'multiselect', search: true, options: SUB_STATUSES.map((v) => ({ label: cap(v), value: v })) },
  /* Los diez botones de producción: seis estados y cuatro medios. Basta con que el ticket tenga uno de los marcados. */
  refund: {
    kind: 'multiselect',
    options: [...REFUND_STATES, ...REFUND_METHODS].map((v) => ({ label: v, value: v })),
  },
  gdpr: {
    kind: 'select',
    options: [
      { label: 'Pending GDPR', value: 'Pending GDPR' },
      { label: 'Not pending GDPR', value: 'Not pending GDPR' },
    ],
  },
  carrier: text(),
  moErrorContent: text(),
};

@Component({
  selector: 'app-tickets-page',
  imports: [ListPageComponent, RequestTypeFilterComponent, ScButtonComponent, ScIconComponent, ScTagComponent, TooltipModule],
  templateUrl: './tickets-page.component.html',
  styleUrl: './tickets-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketsPageComponent {
  protected readonly rows = TICKETS_ALL;
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly hasSelection = computed(() => this.selectedIds().size > 0);

  /** Gestor de columnas: qué se puede enseñar, y cuáles nacen ocultas. */
  protected readonly managedColumns: readonly ColumnDef[] = COLUMNS.map((c) => ({
    key: c.field,
    label: c.header,
    locked: c.locked,
    defaultVisible: !c.hidden,
  }));

  /** La suma de lo que mide cada columna, más la de las casillas: por debajo, la tabla se recorre de lado. */
  protected readonly tableMinWidth = `${COLUMNS.reduce((sum, c) => sum + parseFloat(c.width ?? '0'), 0) + 3}rem`;

  protected readonly filters = FILTERS;
  protected readonly requestTypes: readonly string[] = [...REQUEST_TYPES, EMPTY_TYPE];
  protected readonly defaultRequestType = DEFAULT_REQUEST_TYPE_FILTER;

  private readonly requestTypeTpl = viewChild.required<TemplateRef<FilterContext>>('requestTypeFilter');
  protected readonly filterTemplates = computed(() => ({ requestTypes: this.requestTypeTpl() }));

  /** Lo que se ordena de cada celda: fechas por fecha (no por texto), listas por sus nombres, el resto por su texto. */
  private sortKey(row: TicketRow, field: string): string | number {
    if (field === 'created' || field === 'updated') return parseTicketDate(row[field])?.getTime() ?? 0;
    const value = (row as unknown as Record<string, unknown>)[field];
    if (Array.isArray(value)) {
      return value.map((v) => (typeof v === 'string' ? v : (v as { label: string }).label)).join(', ');
    }
    return String(value ?? '');
  }

  protected readonly sortFn = (a: TicketRow, b: TicketRow, field: string): number => {
    const x = this.sortKey(a, field);
    const y = this.sortKey(b, field);
    return typeof x === 'number' && typeof y === 'number'
      ? x - y
      : String(x).localeCompare(String(y), undefined, { numeric: true });
  };

  private readonly cell = viewChild.required<TemplateRef<ScColumnCellContext<TicketRow>>>('cell');

  protected readonly columns = computed<readonly ScColumnDef<TicketRow>[]>(() =>
    COLUMNS.map((c) => ({ ...c, cellTemplate: this.cell() })),
  );

  /** Un ticket que gestiona otro agente sale apagado y no se puede marcar. */
  protected readonly rowClass = (row: TicketRow): string | undefined =>
    row.locked ? 'row--locked' : row.status === 'resolved' ? 'row--resolved' : undefined;
  /** Los resueltos y los que gestiona otro agente salen apagados y no se pueden marcar. */
  protected readonly selectable = (row: TicketRow): boolean => !row.locked && row.status !== 'resolved';

  protected readonly rowLabel = (row: TicketRow): string => `ticket ${row.id}`;

  /** El buscador mira el ID, el estado, el agente, el grupo, el origen, el email, la descripción y los productos. */
  protected readonly matchesSearch = (row: TicketRow, query: string): boolean =>
    [row.id, row.status, row.assignedTo, row.group, row.source, row.email, row.description, ...row.products]
      .join(' ')
      .toLowerCase()
      .includes(query);

  /** Descarga lo que se ve (filas en su orden y columnas visibles) como CSV. */
  protected onExport(event: { readonly rows: readonly TicketRow[]; readonly columns: readonly string[] }): void {
    const cols = COLUMNS.filter((c) => event.columns.includes(c.field));
    const cell = (row: TicketRow, field: string): string => {
      const value = (row as unknown as Record<string, unknown>)[field];
      const text = Array.isArray(value)
        ? value.map((v) => (typeof v === 'string' ? v : (v as { label: string }).label)).join('; ')
        : String(value ?? '');
      return `"${text.replaceAll('"', '""')}"`;
    };
    const lines = [cols.map((c) => `"${c.header}"`).join(','), ...event.rows.map((r) => cols.map((c) => cell(r, c.field)).join(','))];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tickets.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  protected severity(status: TicketStatus): 'info' | 'success' | 'warn' | 'secondary' {
    return STATUS_SEVERITY[status];
  }

  protected statusLabel(status: TicketStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  protected text(row: TicketRow, field: string): string {
    const value = (row as unknown as Record<string, unknown>)[field];
    /* Una celda sin dato lleva un guion largo: dice que está vacía a propósito, y no parece que no haya cargado. El Supervisor
     * hace lo mismo (el teléfono de un grupo sin canal de voz). Los «-» de los datos de ejemplo cuentan como vacíos. */
    return typeof value === 'string' && value.trim() !== '' && value.trim() !== '-' ? value : '—';
  }
}
