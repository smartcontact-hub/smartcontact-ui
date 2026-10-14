import { ChangeDetectionStrategy, Component, TemplateRef, computed, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { FilterMetadata, SortMeta } from 'primeng/api';
import type { TableLazyLoadEvent } from 'primeng/table';

import {
  ScColumnCellContext,
  ScColumnDef,
  ScDatatableComponent,
  ScDatatableRowEvent,
  ScInputNumberComponent,
  ScInputTextComponent,
  ScPanelComponent,
  ScRowStyleClassFn,
  ScSelectComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';
import type { ScDatatableFilters } from '@smartcontact-hub/components';
import { ArgType, StoryContext, StoryControlsContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

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
  imports: [
    RouterLink,
    ScDatatableComponent,
    ScInputNumberComponent,
    ScInputTextComponent,
    ScPanelComponent,
    ScSelectComponent,
    ScToggleSwitchComponent,
    StoryHostComponent,
  ],
  templateUrl: './datatable-demo.component.html',
  styleUrl: './datatable-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatatableDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly controlsTpl = viewChild<TemplateRef<{ $implicit: StoryControlsContext }>>('controls');
  protected readonly mvpTpl = viewChild<TemplateRef<StoryContext>>('mvp');
  protected readonly lazyTpl = viewChild<TemplateRef<StoryContext>>('lazy');
  protected readonly gesturesTpl = viewChild<TemplateRef<StoryContext>>('gestures');
  protected readonly frozenTpl = viewChild<TemplateRef<StoryContext>>('frozen');
  protected readonly multiSortTpl = viewChild<TemplateRef<StoryContext>>('multisort');
  /** primeng.dev/table «Multiple Columns» y «Presort»: sale ordenada por estado y, dentro, por nombre. */
  protected readonly multiSortColumns: readonly ScColumnDef<Agent>[] = [
    { field: 'name', header: 'Nombre', sortable: true },
    { field: 'status', header: 'Estado', sortable: true, width: '10rem' },
    { field: 'extension', header: 'Extensión', width: '10rem', align: 'center' },
  ];
  protected readonly presortMeta: readonly SortMeta[] = [
    { field: 'status', order: 1 },
    { field: 'name', order: 1 },
  ];
  protected readonly frozenColumns: readonly ScColumnDef<Agent>[] = [
    { field: 'name', header: 'Nombre', width: '14rem', frozen: true, rowHeader: true },
    { field: 'extension', header: 'Extensión' },
    { field: 'status', header: 'Estado', width: '10rem', frozen: true, alignFrozen: 'right' },
  ];
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
      { name: 'paginator', label: 'Paginación', control: { kind: 'boolean' } },
      { name: 'rows', label: 'Filas por página', control: { kind: 'number', min: 1, max: 20, step: 1 } },
      { name: 'first', label: 'Primera fila visible', control: { kind: 'number', min: 0, max: 6, step: 1 }, description: 'La primera fila de la página abierta, en las dos direcciones. Quien filtra las filas fuera de la tabla la vuelve a 0 al buscar.' },
      { name: 'stripedRows', label: 'Filas alternas (cebra)', control: { kind: 'boolean' } },
      { name: 'showGridlines', label: 'Líneas de rejilla', control: { kind: 'boolean' } },
      { name: 'size', label: 'Tamaño', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'variant', label: 'Variante', control: { kind: 'select', options: ['default', 'list'] } },
      { name: 'loading', label: 'Cargando', control: { kind: 'boolean' } },
      { name: 'skeleton', label: 'Esqueleto de carga', control: { kind: 'boolean' }, description: 'Esqueleto de carga: la cabecera se queda y cada celda es un `p-skeleton`, como el ejemplo «DataTable» de primeng.dev/skeleton. Es el que piden las pantallas que esperan datos (regla 2 de «UX de pantalla»), no el spinner de `loading`.' },
      { name: 'skeletonRows', label: 'Filas del esqueleto', control: { kind: 'number', min: 1, max: 20, step: 1 }, description: 'Cuántas filas pinta el esqueleto.' },
      { name: 'selectionMode', label: 'Modo de selección', control: { kind: 'select', options: ['single', 'multiple'] } },
      { name: 'selectionColumn', label: 'Con qué se marca', control: { kind: 'select', options: ['checkbox', 'radio', 'none'] }, description: 'Los cuatro ejemplos de primeng.dev/table «Selection»: checkbox (con multiple), radio (con single), none (sin columna: la fila y el teclado ↑ ↓ Espacio Intro). Si no casa con el modo, la tabla usa el de siempre: casilla en multiple, fila en single.' },
      { name: 'metaKeySelection', label: 'Cmd/Ctrl para añadir', control: { kind: 'boolean' }, description: 'Cuando se marca clicando la fila: un clic sustituye la selección y Cmd/Ctrl+clic añade o quita.' },
      { name: 'sortField', label: 'Ordenar por columna', control: { kind: 'text' }, description: 'Columna por la que sale ordenada.' },
      { name: 'sortOrder', label: 'Sentido del orden', control: { kind: 'select', options: [1, -1] }, description: '1 ascendente, -1 descendente.' },
      { name: 'externalSort', label: 'Orden gestionado fuera', control: { kind: 'boolean' }, description: 'El orden lo pone quien usa la tabla: pinta la flecha y emite (sortChange), pero no mueve las filas.' },
      { name: 'sortMode', label: 'Ordenar por varias', control: { kind: 'select', options: ['single', 'multiple'] }, description: 'multiple: un clic ordena por esa columna sola; Cmd/Ctrl+clic la añade detrás. El orden inicial va en [multiSortMeta].' },
      { name: 'removableSort', label: 'Quitar el orden', control: { kind: 'boolean' }, description: 'El tercer clic en la misma columna quita el orden y las filas vuelven al de partida.' },
      { name: 'rowsFocusable', label: 'Filas navegables con teclado', control: { kind: 'boolean' }, description: 'Las filas entran en el orden de tabulación.' },
      { name: 'scrollable', label: 'Scroll propio', control: { kind: 'boolean' }, description: 'Cabecera fija y cuerpo con scroll propio.' },
      { name: 'scrollHeight', label: 'Alto del scroll', control: { kind: 'text' }, description: 'Alto de ese scroll (p.ej. 240px).' },
      { name: 'stickyHeader', label: 'Cabecera fija', control: { kind: 'boolean' }, description: 'Cabecera fija al scroll de la página (sin scroll propio).' },
      { name: 'virtualScroll', label: 'Lista virtual', control: { kind: 'boolean' }, description: 'Lista virtual con scroll propio: entra por encima de 100 filas (esta demo tiene 7).' },
      { name: 'fill', label: 'Llega al pie', control: { kind: 'boolean' }, description: 'Llega al pie de su contenedor aunque no haga falta lista virtual: mismo CSS de «llega al pie» (DD-160), sin pagar la ventana.' },
      { name: 'tableMinWidth', label: 'Ancho mínimo', control: { kind: 'text' }, description: 'Ancho mínimo (p.ej. 60rem): por debajo la tabla se desplaza de lado en vez de cortar texto.' },
      { name: 'resizableColumns', label: 'Redimensionar columnas', control: { kind: 'boolean' }, description: 'Ancho de columna ajustable arrastrando el borde de la cabecera (el nativo de p-table).' },
      { name: 'columnResizeMode', label: 'Modo de redimensión', control: { kind: 'select', options: ['fit', 'expand'] }, description: 'fit: la tabla no cambia de ancho. expand: crece con la columna.' },
      { name: 'reorderableColumns', label: 'Reordenar columnas', control: { kind: 'boolean' }, description: 'Orden de columnas arrastrando la cabecera (el nativo de p-table); la tabla avisa con (columnOrderChange).' },
    ],
    defaultArgs: {
      paginator: true,
      rows: 5,
      first: 0,
      stripedRows: true,
      showGridlines: false,
      selectionMode: 'multiple',
      selectionColumn: 'checkbox',
      metaKeySelection: false,
      size: 'md',
      variant: 'default',
      loading: false,
      skeleton: false,
      skeletonRows: 10,
          // El knob arranca VACÍO a propósito: con `sortField: 'name'` la tabla salía ya ordenada y
      // cambiaba cuál es la primera fila, que es lo que miden los e2e de gestos. Un valor por
      // defecto en la ficha no puede cambiar el comportamiento de la demo.
      sortField: '',
      sortOrder: 1,
      externalSort: false,
      sortMode: 'single',
      removableSort: false,
      scrollable: false,
      scrollHeight: '240px',
      stickyHeader: false,
      virtualScroll: false,
      fill: false,
      rowsFocusable: false,
      // Vacío: un ancho mínimo por defecto cambiaría la demo que miden los e2e.
      tableMinWidth: '',
      // Apagado: con los tiradores puestos, las e2e de gestos que pulsan cabeceras medirían otra cosa.
      resizableColumns: false,
      columnResizeMode: 'fit',
      reorderableColumns: false,
    },
  };

  /**
   * Agrupación de los knobs del Playground para no-devs (BI, PMs en la reunión de tablas):
   * híbrido entre el vocabulario del Excel de BI (Selección, Scroll, Columnas — mismas palabras
   * que en la reunión) y menos grupos que sus 17, para que cada acordeón quepa de un vistazo.
   * «General» empieza abierto (lo primero que se toca); el resto, plegado.
   */
  protected readonly controlGroupDefs: readonly { title: string; open: boolean; names: readonly string[] }[] = [
    { title: 'General', open: true, names: ['paginator', 'rows', 'first', 'stripedRows', 'showGridlines', 'size', 'variant', 'loading', 'skeleton', 'skeletonRows'] },
    { title: 'Selección y orden', open: false, names: ['selectionMode', 'selectionColumn', 'metaKeySelection', 'rowsFocusable', 'sortField', 'sortOrder', 'sortMode', 'removableSort', 'externalSort'] },
    { title: 'Scroll y tamaño', open: false, names: ['scrollable', 'scrollHeight', 'stickyHeader', 'virtualScroll', 'fill', 'tableMinWidth'] },
    { title: 'Columnas', open: false, names: ['resizableColumns', 'columnResizeMode', 'reorderableColumns'] },
  ];

  /** Resuelve cada grupo contra `meta.argTypes`: una sola fuente de verdad para kind/opciones/label. */
  protected readonly controlGroups: readonly { title: string; open: boolean; knobs: readonly ArgType[] }[] =
    this.controlGroupDefs.map((g) => ({
      title: g.title,
      open: g.open,
      knobs: g.names
        .map((n) => this.meta.argTypes.find((at) => at.name === n))
        .filter((at): at is ArgType => !!at),
    }));

  protected asStr(v: unknown): string {
    return typeof v === 'string' ? v : v == null ? '' : String(v);
  }
  protected asNum(v: unknown): number | null {
    return typeof v === 'number' ? v : null;
  }
  protected asBool(v: unknown): boolean {
    return !!v;
  }
  protected selectOptions(at: ArgType): readonly { label: string; value: string | number }[] {
    return at.control.kind === 'select' ? at.control.options.map((o) => ({ label: String(o), value: o })) : [];
  }

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const controls = this.controlsTpl();
    const mvp = this.mvpTpl();
    const lz = this.lazyTpl();
    const gs = this.gesturesTpl();
    const ls = this.listTpl();
    const st = this.statusTpl();
    // `st` (statusTpl) alimenta `columns()`; espera a que resuelva para no
    // pintar la story MVP con la columna de estado sin su cellTemplate.
    const fr = this.frozenTpl();
    const ms = this.multiSortTpl();
    if (!pg || !controls || !mvp || !lz || !gs || !ls || !st || !fr || !ms) return [];
    return [
      { name: 'Playground', playground: true, template: pg, controlsTemplate: controls },
      { name: 'Columnas, selección múltiple y paginador', template: mvp, snippet: MVP_SNIPPET },
      { name: 'Lazy (server-driven): paginación + orden + filtro global', template: lz, snippet: LAZY_SNIPPET },
      { name: 'Gestos de fila y columnas conmutables', template: gs, snippet: GESTURES_SNIPPET },
      { name: 'variant="list" · la gramática de tabla-lista', template: ls, snippet: LIST_SNIPPET },
      { name: 'Columnas fijas', template: fr, snippet: `<!-- ScColumnDef: frozen fija la columna (alignFrozen elige el lado); rowHeader la pinta como <th scope="row">. -->
<sc-datatable [value]="agents()" [columns]="frozenColumns" scrollable tableMinWidth="70rem" selectionMode="multiple" dataKey="id" />` },
      { name: 'Orden por varias columnas', template: ms, snippet: `<!-- sortMode="multiple": Cmd/Ctrl+clic añade una columna detrás de las que ya ordenan. -->
<!-- multiSortMeta: el orden de entrada, por prioridad: [{ field: 'status', order: 1 }, { field: 'name', order: 1 }]. -->
<sc-datatable [value]="agents()" [columns]="multiSortColumns" sortMode="multiple" [multiSortMeta]="presortMeta" removableSort dataKey="id" />` },
    ];
  });
}
