import { ChangeDetectionStrategy, Component, TemplateRef, computed, signal, viewChild } from '@angular/core';
import type { FilterMetadata } from 'primeng/api';
import type { TableLazyLoadEvent } from 'primeng/table';

import {
  ScColumnCellContext,
  ScColumnDef,
  ScDatatableComponent,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

interface Agent {
  id: number;
  name: string;
  extension: string;
  status: 'active' | 'inactive';
}

const AGENTS: readonly Agent[] = [
  { id: 1, name: 'Inés García', extension: '101', status: 'active' },
  { id: 2, name: 'Marc Soler', extension: '102', status: 'active' },
  { id: 3, name: 'Lucía Pérez', extension: '103', status: 'inactive' },
  { id: 4, name: 'Diego Romero', extension: '104', status: 'active' },
  { id: 5, name: 'Sara Vidal', extension: '105', status: 'inactive' },
  { id: 6, name: 'Tomás Ruiz', extension: '106', status: 'active' },
  { id: 7, name: 'Elena Marín', extension: '107', status: 'active' },
];

const MVP_SNIPPET = `<sc-datatable
  [value]="agents()"
  [columns]="columns()"
  dataKey="id"
  selectionMode="multiple"
  [selection]="selection()"
  (selectionChange)="onSelectionChange($event)"
  [paginator]="true"
  [rows]="5"
  [rowsPerPageOptions]="[5, 10]"
  [stripedRows]="true"
>
  <div scTableCaption>Agentes ({{ agents().length }})</div>
  <div scTableEmpty>No hay agentes</div>
</sc-datatable>

<!-- columns(): el consumidor las construye; la celda 'status' usa un cellTemplate. -->
<ng-template #statusTpl let-agent>
  <span [attr.data-active]="agent.status === 'active'">
    {{ agent.status === 'active' ? 'Activo' : 'Inactivo' }}
  </span>
</ng-template>`;

const LAZY_SNIPPET = `<input (input)="lazyTable.filterGlobal($any($event.target).value, 'contains')" />
<sc-datatable
  #lazyTable
  [value]="lazyRows()"
  [columns]="lazyColumns"
  dataKey="id"
  [lazy]="true"
  [totalRecords]="lazyTotal()"
  [globalFilterFields]="['name']"
  [paginator]="true"
  [rows]="5"
  (lazyLoad)="onLazyLoad($event)"
/>`;

/** Demo de `sc-datatable` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-datatable-demo',
  imports: [ScDatatableComponent, StoryHostComponent],
  templateUrl: './datatable-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatatableDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly mvpTpl = viewChild<TemplateRef<StoryContext>>('mvp');
  protected readonly lazyTpl = viewChild<TemplateRef<StoryContext>>('lazy');

  protected readonly statusTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('statusTpl');

  protected readonly agents = signal<readonly Agent[]>(AGENTS);
  protected readonly selection = signal<readonly Agent[]>([]);

  // El consumidor construye las columns: header YA traducido, y la celda de
  // estado se compone con un cellTemplate propio (el DS no conoce el tipo).
  protected readonly columns = computed<readonly ScColumnDef<Agent>[]>(() => [
    { field: 'name', header: 'Nombre', sortable: true },
    { field: 'extension', header: 'Extensión', sortable: true, width: '10rem', align: 'center' },
    { field: 'status', header: 'Estado', align: 'center', cellTemplate: this.statusTpl() },
  ]);

  // Columnas simples (sin cellTemplate) para el Playground.
  protected readonly playColumns: readonly ScColumnDef<Agent>[] = [
    { field: 'name', header: 'Nombre', sortable: true },
    { field: 'extension', header: 'Extensión', width: '10rem', align: 'center' },
  ];

  protected onSelectionChange(sel: Agent | readonly Agent[] | null): void {
    this.selection.set(Array.isArray(sel) ? (sel as readonly Agent[]) : []);
  }

  protected clear(): void {
    this.agents.set([]);
  }

  // --- Lazy (server-driven): el consumidor sirve los datos desde (lazyLoad) ---
  protected readonly lazyRows = signal<readonly Agent[]>([]);
  protected readonly lazyTotal = signal(0);
  protected readonly lazyColumns: readonly ScColumnDef<Agent>[] = [
    { field: 'name', header: 'Nombre', sortable: true },
    { field: 'extension', header: 'Extensión', width: '10rem', align: 'center' },
  ];

  protected onLazyLoad(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 5;
    let data = [...AGENTS];

    // Filtro global (lo trae el evento; el "servidor" lo aplica).
    const globalMeta = event.filters?.['global'] as FilterMetadata | undefined;
    const query = String(globalMeta?.value ?? '')
      .toLowerCase()
      .trim();
    if (query) {
      data = data.filter((a) => a.name.toLowerCase().includes(query));
    }

    // Orden (también server-side).
    const sortField = event.sortField;
    if (typeof sortField === 'string' && sortField) {
      const dir = event.sortOrder ?? 1;
      data = [...data].sort((a, b) => {
        const av = String((a as unknown as Record<string, unknown>)[sortField]);
        const bv = String((b as unknown as Record<string, unknown>)[sortField]);
        return av.localeCompare(bv, 'es') * dir;
      });
    }

    this.lazyTotal.set(data.length);
    this.lazyRows.set(data.slice(first, first + rows));
  }

  protected readonly meta: StoryMeta = {
    tag: 'sc-datatable',
    title: 'Datatable',
    description:
      'Tabla de datos sobre `p-table`. El wrapper aporta la API data-driven (column-defs + `cellTemplate` por columna) y los slots `[scTableCaption]` / `[scTableEmpty]`. Orden y paginación client-side; modo `[lazy]` para server-driven. `header` va ya traducido por el consumidor.',
    argTypes: [
      { name: 'paginator', control: { kind: 'boolean' } },
      { name: 'rows', control: { kind: 'number', min: 1, max: 20, step: 1 } },
      { name: 'stripedRows', control: { kind: 'boolean' } },
      { name: 'showGridlines', control: { kind: 'boolean' } },
      { name: 'selectionMode', control: { kind: 'select', options: ['single', 'multiple'] } },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'loading', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      paginator: true,
      rows: 5,
      stripedRows: true,
      showGridlines: false,
      selectionMode: 'multiple',
      size: 'md',
      loading: false,
    },
    props: [
      { name: 'value', type: 'T[]', default: '[]', description: 'Filas de datos.' },
      { name: 'columns', type: 'ScColumnDef<T>[]', default: '[]', description: 'Column-defs (field/header/…/cellTemplate).' },
      { name: 'dataKey', type: 'string', default: '—', description: 'Campo clave único de la fila.' },
      { name: 'paginator', type: 'boolean', default: 'false' },
      { name: 'rows', type: 'number', default: '—', description: 'Filas por página.' },
      { name: 'rowsPerPageOptions', type: 'number[]', default: '—' },
      { name: 'selectionMode', type: "'single' | 'multiple' | null", default: 'null', description: 'single · multiple · null' },
      { name: 'selection', type: 'T | T[] | null', default: 'null', description: 'Selección two-way.' },
      { name: 'sortField', type: 'string', default: '—', description: 'Orden inicial (client-side).' },
      { name: 'size', type: 'ScComponentSize', default: "'md'", description: 'sm · md · lg' },
      { name: 'stripedRows', type: 'boolean', default: 'false' },
      { name: 'showGridlines', type: 'boolean', default: 'false' },
      { name: 'scrollable', type: 'boolean', default: 'false' },
      { name: 'loading', type: 'boolean', default: 'false' },
      { name: 'lazy', type: 'boolean', default: 'false', description: 'Server-driven (emite `(lazyLoad)`).' },
      { name: 'totalRecords', type: 'number', default: '—', description: 'Total del servidor (modo lazy).' },
      { name: 'globalFilterFields', type: 'string[]', default: '—' },
      { name: 'selectionChange', type: 'EventEmitter<T | T[] | null>' },
      { name: 'sortChange', type: 'EventEmitter<ScDatatableSortEvent>' },
      { name: 'lazyLoad', type: 'EventEmitter<TableLazyLoadEvent>' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const mvp = this.mvpTpl();
    const lz = this.lazyTpl();
    const st = this.statusTpl();
    // `st` (statusTpl) alimenta `columns()`; espera a que resuelva para no
    // pintar la story MVP con la columna de estado sin su cellTemplate.
    if (!pg || !mvp || !lz || !st) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Columnas, selección múltiple y paginador', template: mvp, snippet: MVP_SNIPPET },
      { name: 'Lazy (server-driven): paginación + orden + filtro global', template: lz, snippet: LAZY_SNIPPET },
    ];
  });
}
