import { ChangeDetectionStrategy, Component, TemplateRef, computed, signal, viewChild } from '@angular/core';
import type { FilterMetadata } from 'primeng/api';
import type { TableLazyLoadEvent } from 'primeng/table';

import {
  ScColumnCellContext,
  ScColumnDef,
  ScDatatableComponent,
  ScDatatableRowEvent,
  ScRowStyleClassFn,
} from '@smartcontact-hub/components';
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

<!-- La celda custom NO es una ranura del componente: es un TemplateRef que viaja
     dentro de la definición de columna, en \`cellTemplate\`. Vive fuera de la
     tabla, en la plantilla de la página, y \`columns()\` lo recoge con viewChild.
     (Las ranuras que sí acepta son las 38 de p-table: #header, #body, #footer...) -->`;

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

const GESTURES_SNIPPET = `<sc-datatable
  [value]="agents()"
  [columns]="gestureColumns"
  [visibleColumns]="visibleFields()"
  [rowStyleClass]="rowClassFn"
  dataKey="id"
  selectionMode="multiple"
  [selection]="selection()"
  (selectionChange)="onSelectionChange($event)"
  (rowClick)="onRowOpen($event)"
  (rowContextMenu)="onRowMenu($event)"
/>

<!-- rowClassFn es una propiedad, NO un método: se resuelve en cada render y
     una flecha nueva por ciclo tiraría OnPush al suelo. -->
protected readonly rowClassFn: ScRowStyleClassFn<Agent> = (agent) =>
  agent.status === 'inactive' ? 'dt-row--inactive' : undefined;

<!-- \`dataKey\` es lo que hace que la selección sobreviva a un re-render: sin él,
     PrimeNG compara por referencia y al llegar filas nuevas se pierde. -->

<!-- Para conmutar columnas con la chrome del DS en vez de estos botones, la
     pieza es \`<sc-column-selector scTableCaption>\`: tiene su propia página. -->`;

const LIST_SNIPPET = `<!-- La gramática de tabla-lista: cabecera silenciosa (12/500 gris, sin fondo),
     fila alta, hairline \`--sc-border-default\` y reparto de columnas fijo.
     Es la piel de las nueve tablas de administración del Supervisor.

     La publica el TEMA, no la app: viaja con el preset, así que un consumidor
     nuevo la pide y le sale igual sin copiar una línea de CSS. Hasta el
     2026-09-10 vivía como CSS de app y NO viajaba. -->
<sc-datatable
  variant="list"
  [value]="agents()"
  [columns]="columns()"
  [rowStyleClass]="listRowClassFn"
  dataKey="id"
/>

<!-- El hover SOLO si la fila hace algo. Lo dice el consumidor, fila a fila,
     con la clase del DS \`sc-row--clickable\`; una tabla inerte que se ilumina
     al pasar el ratón es una afordancia mentirosa. -->
protected readonly listRowClassFn: ScRowStyleClassFn<Agent> = () => 'sc-row--clickable';`;

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
  protected readonly gesturesTpl = viewChild<TemplateRef<StoryContext>>('gestures');
  protected readonly listTpl = viewChild<TemplateRef<StoryContext>>('list');

  /* Propiedad, no método: una flecha nueva por ciclo tira OnPush al suelo (la
   * misma razón que `rowClassFn` de la story de gestos). `sc-row--clickable` es
   * la clase del DS que enciende cursor y hover — sin ella la fila no se
   * ilumina, que es lo correcto en una tabla que no abre nada. */
  protected readonly listRowClassFn: ScRowStyleClassFn<Agent> = () => 'sc-row--clickable';

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

  // --- B4: gestos de fila + columnas conmutables ---------------------------
  // Estas dos capacidades NO las ejercita el piloto del supervisor (labels y
  // templates no tienen click de fila ni selector de columnas), así que su
  // única verificación real está aquí. Los `data-testid` son para eso.

  /** Última fila abierta con click. Marca que `rowClick` llegó. */
  protected readonly lastOpened = signal('—');
  /** Última fila con click derecho. Marca que `rowContextMenu` llegó. */
  protected readonly lastContext = signal('—');
  /** Cuántas veces se abrió: si la casilla disparase `rowClick`, subiría al marcar. */
  protected readonly openCount = signal(0);

  protected readonly gestureColumns: readonly ScColumnDef<Agent>[] = [
    { field: 'name', header: 'Nombre', sortable: true },
    { field: 'extension', header: 'Extensión', width: '10rem', align: 'center' },
    { field: 'status', header: 'Estado', align: 'center' },
  ];

  /** Visibles y en orden — el array manda sobre el orden declarado. */
  protected readonly visibleFields = signal<readonly string[]>([
    'name',
    'extension',
    'status',
  ]);

  /* Propiedad, no método: `rowStyleClass` se resuelve en cada render y una
   * flecha nueva por ciclo de CD haría trabajar a OnPush de más. */
  protected readonly rowClassFn: ScRowStyleClassFn<Agent> = (agent) =>
    agent.status === 'inactive' ? 'dt-row--inactive' : undefined;

  protected onRowOpen(event: ScDatatableRowEvent<Agent>): void {
    this.lastOpened.set(event.row.name);
    this.openCount.update((n) => n + 1);
  }

  protected onRowMenu(event: ScDatatableRowEvent<Agent>): void {
    this.lastContext.set(event.row.name);
  }

  protected toggleField(field: string): void {
    this.visibleFields.update((current) =>
      current.includes(field) ? current.filter((f) => f !== field) : [...current, field],
    );
  }

  /** Invierte el orden para enseñar que `visibleColumns` reordena, no solo filtra. */
  protected reverseFields(): void {
    this.visibleFields.update((current) => [...current].reverse());
  }

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
      'Tabla de datos sobre `p-table`. El wrapper aporta la API data-driven (column-defs + `cellTemplate` por columna) y los slots `[scTableCaption]` / `[scTableEmpty]`. Orden y paginación client-side; modo `[lazy]` para server-driven. `header` va ya traducido por el consumidor. `variant="list"` enciende la gramática de tabla-lista, que publica el TEMA (viaja con el preset, no con la app).',
    argTypes: [
      { name: 'paginator', control: { kind: 'boolean' } },
      { name: 'rows', control: { kind: 'number', min: 1, max: 20, step: 1 } },
      { name: 'stripedRows', control: { kind: 'boolean' } },
      { name: 'showGridlines', control: { kind: 'boolean' } },
      { name: 'selectionMode', control: { kind: 'select', options: ['single', 'multiple'] } },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'variant', control: { kind: 'select', options: ['default', 'list'] } },
      { name: 'loading', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      paginator: true,
      rows: 5,
      stripedRows: true,
      showGridlines: false,
      selectionMode: 'multiple',
      size: 'md',
      variant: 'default',
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
      {
        name: 'variant',
        type: 'ScDatatableVariant',
        default: "'default'",
        description:
          'Piel de la tabla. `list` enciende la GRAMÁTICA DE TABLA-LISTA que publica el tema: cabecera silenciosa sin fondo, fila alta, hairline y `table-layout: fixed`. Opt-in a propósito — una tabla que no es una lista de administración se queda en `default`.',
      },
      { name: 'stripedRows', type: 'boolean', default: 'false' },
      { name: 'showGridlines', type: 'boolean', default: 'false' },
      { name: 'scrollable', type: 'boolean', default: 'false' },
      { name: 'loading', type: 'boolean', default: 'false' },
      { name: 'lazy', type: 'boolean', default: 'false', description: 'Server-driven (emite `(lazyLoad)`).' },
      { name: 'totalRecords', type: 'number', default: '—', description: 'Total del servidor (modo lazy).' },
      { name: 'globalFilterFields', type: 'string[]', default: '—' },
      { name: 'visibleColumns', type: 'string[]', default: '—', description: 'Columnas visibles por `field`, EN ORDEN. Formato de `sc-column-selector`.' },
      { name: 'rowStyleClass', type: '(row: T, i: number) => string | undefined', default: '—', description: 'Clases extra por fila.' },
      { name: 'selectionChange', type: 'EventEmitter<T | T[] | null>' },
      { name: 'sortChange', type: 'EventEmitter<ScDatatableSortEvent>' },
      { name: 'lazyLoad', type: 'EventEmitter<TableLazyLoadEvent>' },
      { name: 'rowClick', type: 'EventEmitter<ScDatatableRowEvent<T>>', description: 'Click en la fila. NO se emite desde la celda de selección.' },
      { name: 'rowContextMenu', type: 'EventEmitter<ScDatatableRowEvent<T>>', description: 'Click derecho, con el menú nativo ya cancelado.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const mvp = this.mvpTpl();
    const lz = this.lazyTpl();
    const gs = this.gesturesTpl();
    const ls = this.listTpl();
    const st = this.statusTpl();
    // `st` (statusTpl) alimenta `columns()`; espera a que resuelva para no
    // pintar la story MVP con la columna de estado sin su cellTemplate.
    if (!pg || !mvp || !lz || !gs || !ls || !st) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Columnas, selección múltiple y paginador', template: mvp, snippet: MVP_SNIPPET },
      { name: 'Lazy (server-driven): paginación + orden + filtro global', template: lz, snippet: LAZY_SNIPPET },
      { name: 'Gestos de fila y columnas conmutables', template: gs, snippet: GESTURES_SNIPPET },
      { name: 'variant="list" · la gramática de tabla-lista', template: ls, snippet: LIST_SNIPPET },
    ];
  });
}
