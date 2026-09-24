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
import type { ScDatatableFilters } from '@smartcontact-hub/components';
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
  [filters]="lazyFilters()"
  [paginator]="true"
  [rows]="5"
  (lazyLoad)="onLazyLoad($event)"
/>`;

// El mapa de filtros lo MANDA el consumidor: la tabla no guarda estado propio en modo lazy,
// así que lo que se le pasa es lo que pinta. En el evento viaja de vuelta.
// protected readonly lazyFilters = signal<ScDatatableFilters>({});

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

const LIST_SNIPPET = `<!-- La tabla-lista: la de las tablas de administración del Supervisor.

     El ASPECTO es el de Aura tal cual (primeng.dev/table): desde el 2026-09-13 el
     tema no le pinta nada propio a la tabla. \`variant="list"\` solo añade
     COMPORTAMIENTO que Aura no trae: reparto de columnas fijo (ordenar no mueve
     anchos), hover solo en filas que hacen algo, fila seleccionada marcada y la
     banda de caption oculta cuando va vacía.

     Lo publica el TEMA, no la app: un consumidor nuevo lo pide y le sale igual sin
     copiar CSS. Ante la duda de cómo montar algo (filtros, columnas congeladas,
     expansión…), la receta es la de primeng.dev: pega su plantilla de \`p-table\`. -->
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
protected readonly listRowClassFn: ScRowStyleClassFn<Agent> = () => 'sc-row--clickable';

<!-- ACCIONES DE FILA: un botón ⋮ al final de la fila que abre un \`p-menu\` en
     modo popup, UNO por tabla (no uno por fila). Es lo que usan las listas del
     Supervisor. El menú de click derecho (\`rowContextMenu\`) es solo un atajo:
     lo que ofrezca tiene que estar también en el ⋮, porque en táctil y con
     teclado no existe. -->
<p-menu #rowMenu [model]="menuItems()" [popup]="true" appendTo="body" />`;

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

  /**
   * El mapa de filtros, que en modo lazy lo manda el CONSUMIDOR: la tabla no guarda estado
   * propio, así que lo que recibe es lo que pinta, y en `lazyLoad` viaja de vuelta.
   */
  protected readonly lazyFilters = signal<ScDatatableFilters>({});
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
      'Tabla de datos sobre `p-table`. El wrapper aporta la API data-driven (column-defs + `cellTemplate` por columna) y los slots `[scTableCaption]` / `[scTableEmpty]`. Orden y paginación client-side; modo `[lazy]` para server-driven. `header` va ya traducido por el consumidor. El aspecto es el de Aura tal cual (primeng.dev/table): si una receta de `p-table` existe allí, se usa esa. `variant="list"` añade el comportamiento de tabla-lista, que publica el TEMA (viaja con el preset, no con la app).',
    argTypes: [
      { name: 'paginator', control: { kind: 'boolean' } },
      { name: 'rows', control: { kind: 'number', min: 1, max: 20, step: 1 } },
      { name: 'stripedRows', control: { kind: 'boolean' } },
      { name: 'showGridlines', control: { kind: 'boolean' } },
      { name: 'selectionMode', control: { kind: 'select', options: ['single', 'multiple'] } },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'variant', control: { kind: 'select', options: ['default', 'list'] } },
      { name: 'loading', control: { kind: 'boolean' } },
          { name: 'sortField', control: { kind: 'text' }, description: 'Columna por la que sale ordenada.' },
      { name: 'sortOrder', control: { kind: 'select', options: [1, -1] }, description: '1 ascendente, -1 descendente.' },
      { name: 'scrollable', control: { kind: 'boolean' }, description: 'Cabecera fija y cuerpo con scroll propio.' },
      { name: 'scrollHeight', control: { kind: 'text' }, description: 'Alto de ese scroll (p.ej. 240px).' },
      { name: 'stickyHeader', control: { kind: 'boolean' }, description: 'Cabecera fija al scroll de la página (sin scroll propio).' },
      { name: 'virtualScroll', control: { kind: 'boolean' }, description: 'Lista virtual con scroll propio: entra por encima de 100 filas (esta demo tiene 7).' },
      { name: 'rowsFocusable', control: { kind: 'boolean' }, description: 'Las filas entran en el orden de tabulación.' },
      { name: 'tableMinWidth', control: { kind: 'text' }, description: 'Ancho mínimo (p.ej. 60rem): por debajo la tabla se desplaza de lado en vez de cortar texto.' },
      { name: 'resizableColumns', control: { kind: 'boolean' }, description: 'Ancho de columna ajustable arrastrando el borde de la cabecera (el nativo de p-table).' },
      { name: 'columnResizeMode', control: { kind: 'select', options: ['fit', 'expand'] }, description: 'fit: la tabla no cambia de ancho. expand: crece con la columna.' },
      { name: 'reorderableColumns', control: { kind: 'boolean' }, description: 'Orden de columnas arrastrando la cabecera (el nativo de p-table); la tabla avisa con (columnOrderChange).' },
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
          // El knob arranca VACÍO a propósito: con `sortField: 'name'` la tabla salía ya ordenada y
      // cambiaba cuál es la primera fila, que es lo que miden los e2e de gestos. Un valor por
      // defecto en la ficha no puede cambiar el comportamiento de la demo.
      sortField: '',
      sortOrder: 1,
      scrollable: false,
      scrollHeight: '240px',
      stickyHeader: false,
      virtualScroll: false,
      rowsFocusable: false,
      // Vacío: un ancho mínimo por defecto cambiaría la demo que miden los e2e.
      tableMinWidth: '',
      // Apagado: con los tiradores puestos, las e2e de gestos que pulsan cabeceras medirían otra cosa.
      resizableColumns: false,
      columnResizeMode: 'fit',
      reorderableColumns: false,
    },
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
