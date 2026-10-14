import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, viewChild, type Signal, type TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ScAvatarComponent,
  ScButtonComponent,
  ScColumnSelectorComponent,
  ScDatatableComponent,
  ScInputNumberComponent,
  ScInputTextComponent,
  ScMultiSelectComponent,
  ScSearchComponent,
  ScSelectButtonComponent,
  ScSelectComponent,
  ScTagComponent,
  ScToggleSwitchComponent,
  type ScColumnCellContext,
  type ScColumnDef,
  type ScColumnFilter,
  type ScColumnFilterContext,
  type ScDatatableRowEditEvent,
  type ScDatatableRowReorderEvent,
  type ScDatatableSortEvent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { TranslateModule } from '@ngx-translate/core';
import type { SortMeta } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { RatingModule } from 'primeng/rating';
import type {
  TableEditCancelEvent,
  TableEditCompleteEvent,
  TableEditInitEvent,
  TableRowCollapseEvent,
  TableRowExpandEvent,
  TableRowSelectEvent,
  TableRowUnSelectEvent,
} from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { SidebarDemoService } from '../../core/services/sidebar-demo.service';
import { ThemeService, type ThemeMode } from '../../core/services/theme.service';
import { TABLE_LAB_AGENTS, TABLE_LAB_COUNTRIES, TABLE_LAB_TEAMS, type TableLabAgent } from './table-lab-page.data';

type Viewport = 'desktop' | 'tablet';

/** Un interruptor del laboratorio que no es un prop de la tabla (columnas fijas, filtros, el buscador…). */
interface LabToggle {
  readonly label: string;
  readonly hint: string;
  /** Lo que mueve en código, debajo de la etiqueta. */
  readonly code: string;
  readonly ariaKey: string;
  readonly value: Signal<boolean>;
  readonly set: (on: boolean) => void;
}

/** Tipo de control (knob) de un arg de `sc-datatable`. Copiado del Playground de sc-docs: ambas
 *  páginas describen el MISMO contrato del componente, cada una en su propia app. */
interface ArgType {
  readonly name: string;
  readonly label: string;
  readonly control:
    | { readonly kind: 'boolean' }
    | { readonly kind: 'select'; readonly options: readonly (string | number)[] }
    | { readonly kind: 'number'; readonly min?: number; readonly max?: number; readonly step?: number }
    | { readonly kind: 'text' };
  readonly description?: string;
}

/**
 * Los knobs del Playground de DataTable en sc-docs (`datatable-demo.component.ts`), con sus mismas
 * etiquetas. Es el contrato real de `sc-datatable`, no una versión reducida.
 */
const ARG_TYPES: readonly ArgType[] = [
  { name: 'paginator', label: 'Paginación', control: { kind: 'boolean' }, description: 'Divide la tabla en páginas en vez de enseñarla entera de golpe.' },
  { name: 'rows', label: 'Filas por página', control: { kind: 'number', min: 1, max: 20, step: 1 }, description: 'Cuántas filas entran en cada página.' },
  { name: 'showCurrentPageReport', label: 'Texto de la página', control: { kind: 'boolean' }, description: 'Junto a las páginas, qué filas se ven de cuántas: «1 a 10 de 150». El texto lo pone quien usa la tabla, ya traducido.' },
  { name: 'paginatorPosition', label: 'Dónde va el paginador', control: { kind: 'select', options: ['bottom', 'top', 'both'] }, description: 'bottom: debajo de la tabla. top: encima. both: en los dos sitios, para tablas largas.' },
  { name: 'first', label: 'Primera fila visible', control: { kind: 'number', min: 0, max: 149, step: 1 }, description: 'Desde qué fila empieza a verse la página abierta. Solo hace algo con «Paginación» activada: sin páginas, se ven todas las filas igual.' },
  { name: 'stripedRows', label: 'Filas alternas (cebra)', control: { kind: 'boolean' }, description: 'Pinta las filas pares de otro color, para seguir la fila con la vista.' },
  { name: 'showGridlines', label: 'Líneas de rejilla', control: { kind: 'boolean' }, description: 'Dibuja líneas entre todas las celdas, como una cuadrícula.' },
  { name: 'size', label: 'Tamaño', control: { kind: 'select', options: ['sm', 'md', 'lg'] }, description: 'Qué tan compacta o espaciosa se ve cada fila.' },
  { name: 'loading', label: 'Cargando', control: { kind: 'boolean' }, description: 'Muestra el aviso de «cargando» encima de la tabla.' },
  { name: 'skeleton', label: 'Esqueleto de carga', control: { kind: 'boolean' }, description: 'En vez del aviso de carga, pinta la forma de las filas mientras llegan los datos de verdad.' },
  { name: 'skeletonRows', label: 'Filas del esqueleto', control: { kind: 'number', min: 1, max: 20, step: 1 }, description: 'Cuántas filas de mentira pinta ese esqueleto de carga.' },
  { name: 'selectionMode', label: 'Modo de selección', control: { kind: 'select', options: ['single', 'multiple'] }, description: 'Si se puede marcar una sola fila, o varias a la vez.' },
  { name: 'selectionColumn', label: 'Con qué se marca', control: { kind: 'select', options: ['checkbox', 'radio', 'none'] }, description: 'checkbox: una casilla por fila (con multiple). radio: un botón de opción por fila (con single). none: sin columna, se marca clicando la fila y con el teclado (↑ ↓ Espacio Intro). Si no casa con el modo, la tabla usa el de siempre: casilla en multiple, fila en single.' },
  { name: 'metaKeySelection', label: 'Cmd/Ctrl para añadir', control: { kind: 'boolean' }, description: 'Solo cuando se marca clicando la fila: un clic sustituye la selección y Cmd/Ctrl+clic añade o quita, Mayús+clic marca un tramo.' },
  { name: 'sortField', label: 'Ordenar por columna', control: { kind: 'text' }, description: 'Por qué columna sale ordenada la tabla nada más entrar.' },
  { name: 'sortOrder', label: 'Sentido del orden', control: { kind: 'select', options: [1, -1] }, description: '1 ascendente, -1 descendente.' },
  { name: 'externalSort', label: 'Orden gestionado fuera', control: { kind: 'boolean' }, description: 'La tabla avisa de qué columna se pulsó para ordenar (sale encima de la tabla, como sortChange), pero no mueve las filas ella sola: lo hace quien la usa.' },
  { name: 'sortMode', label: 'Ordenar por varias', control: { kind: 'select', options: ['single', 'multiple'] }, description: 'multiple: un clic ordena por esa columna sola; Cmd/Ctrl+clic la añade detrás de las que ya había.' },
  { name: 'multiSortMeta', label: 'Orden inicial por varias', control: { kind: 'select', options: ['', 'team,name', 'status,-tickets'] }, description: 'Solo con multiple: por qué columnas sale ordenada al entrar, por prioridad. El signo menos es descendente. En código es un array de { field, order }.' },
  { name: 'removableSort', label: 'Quitar el orden', control: { kind: 'boolean' }, description: 'El tercer clic en la misma columna quita el orden y las filas vuelven al de partida.' },
  { name: 'rowsFocusable', label: 'Filas navegables con teclado', control: { kind: 'boolean' }, description: 'Se puede recorrer fila a fila con el tabulador del teclado.' },
  { name: 'scrollable', label: 'Scroll propio', control: { kind: 'boolean' }, description: 'La cabecera se queda fija arriba y el resto de la tabla hace scroll por su cuenta.' },
  { name: 'scrollHeight', label: 'Alto del scroll', control: { kind: 'text' }, description: 'Cuánto alto tiene ese scroll propio (p. ej. 240px).' },
  { name: 'stickyHeader', label: 'Cabecera fija', control: { kind: 'boolean' }, description: 'La cabecera se queda fija al bajar por toda la página, no solo dentro de la tabla.' },
  { name: 'virtualScroll', label: 'Lista virtual', control: { kind: 'boolean' }, description: 'Solo pinta las filas que se ven en cada momento, para que tablas enormes no vayan lentas.' },
  { name: 'tableMinWidth', label: 'Ancho mínimo', control: { kind: 'text' }, description: 'Ancho mínimo de la tabla: si no cabe, se desplaza de lado en vez de apretar el texto.' },
  { name: 'resizableColumns', label: 'Redimensionar columnas', control: { kind: 'boolean' }, description: 'Se puede arrastrar el borde de una columna para hacerla más ancha o más estrecha.' },
  { name: 'columnResizeMode', label: 'Modo de redimensión', control: { kind: 'select', options: ['fit', 'expand'] }, description: '«fit»: la tabla no cambia de ancho. «expand»: crece con la columna.' },
  { name: 'reorderableColumns', label: 'Reordenar columnas', control: { kind: 'boolean' }, description: 'Se puede arrastrar una columna entera para cambiarla de sitio.' },
  { name: 'editMode', label: 'Cómo se edita', control: { kind: 'select', options: ['cell', 'row'] }, description: 'Con «Columnas editables»: cell, se pulsa una celda y se escribe (Intro, Tab o clic fuera lo deja; Escape lo deshace). row, un lápiz al final abre la fila entera, con guardar y cancelar.' },
  { name: 'rowGroupMode', label: 'Agrupar filas', control: { kind: 'select', options: ['', 'subheader', 'rowspan'] }, description: 'subheader: un título antes de cada grupo. rowspan: la celda del campo ocupa su grupo entero. La tabla se ordena sola por ese campo.' },
  { name: 'groupRowsBy', label: 'Agrupar por', control: { kind: 'select', options: ['team', 'status', 'country'] }, description: 'El campo que forma los grupos: equipo, estado o país.' },
  { name: 'expandableRowGroups', label: 'Grupos plegables', control: { kind: 'boolean' }, description: 'Con subheader: una flecha en el título de cada grupo lo pliega y lo despliega. Salen plegados.' },
  { name: 'reorderableRows', label: 'Reordenar filas', control: { kind: 'boolean' }, description: 'Cada fila lleva un asa al principio para arrastrarla a otro sitio.' },
  { name: 'stateStorage', label: 'Recordar el estado', control: { kind: 'select', options: ['', 'session', 'local'] }, description: 'La tabla guarda página, orden, filtros, anchos, lo marcado y lo desplegado, y lo repone al volver. session: mientras el navegador siga abierto. local: también al cerrarlo. «Salir y volver», encima de la tabla, la monta de nuevo como al volver a la pantalla.' },
  { name: 'filterDisplay', label: 'Dónde van los filtros', control: { kind: 'select', options: ['row', 'menu'] }, description: 'row: una fila bajo la cabecera con un control por columna. menu: un botón junto al título que abre sus reglas (cómo compara, Y/O, varias reglas).' },
];

const DEFAULT_ARGS: Record<string, unknown> = {
  paginator: true,
  rows: 10,
  showCurrentPageReport: false,
  paginatorPosition: 'bottom',
  first: 0,
  stripedRows: true,
  showGridlines: false,
  size: 'md',
  loading: false,
  skeleton: false,
  skeletonRows: 8,
  selectionMode: 'multiple',
  selectionColumn: 'checkbox',
  metaKeySelection: false,
  sortField: '',
  sortOrder: 1,
  externalSort: false,
  sortMode: 'single',
  multiSortMeta: '',
  removableSort: false,
  rowsFocusable: false,
  scrollable: false,
  scrollHeight: '420px',
  stickyHeader: false,
  virtualScroll: false,
  tableMinWidth: '',
  resizableColumns: false,
  columnResizeMode: 'fit',
  reorderableColumns: false,
  filterDisplay: 'row',
  editMode: 'cell',
  rowGroupMode: '',
  groupRowsBy: 'team',
  expandableRowGroups: false,
  reorderableRows: false,
  stateStorage: '',
};

/** Un botón del racimo por grupo: su icono, sus knobs y, si los tiene, los interruptores del laboratorio. */
interface ControlGroupDef {
  readonly title: string;
  readonly icon: string;
  readonly names: readonly string[];
  readonly toggles?: 'selection' | 'columns' | 'filters' | 'edit' | 'rows' | 'data';
  /** «Columnas extra», el único control del laboratorio que es un número. */
  readonly extraColumns?: boolean;
  /** A dos columnas: en una sola no cabe en el alto de la ventana. */
  readonly wide?: boolean;
}

const CONTROL_GROUP_DEFS: readonly ControlGroupDef[] = [
  { title: 'General', icon: 'tune', wide: true, names: ['paginator', 'rows', 'showCurrentPageReport', 'paginatorPosition', 'first', 'stripedRows', 'showGridlines', 'size', 'loading', 'skeleton', 'skeletonRows'] },
  { title: 'Selección y orden', icon: 'checklist', toggles: 'selection', wide: true, names: ['selectionMode', 'selectionColumn', 'metaKeySelection', 'rowsFocusable', 'sortField', 'sortOrder', 'sortMode', 'multiSortMeta', 'removableSort', 'externalSort'] },
  { title: 'Scroll y tamaño', icon: 'swap_vert', names: ['scrollable', 'scrollHeight', 'stickyHeader', 'virtualScroll', 'tableMinWidth'] },
  { title: 'Columnas', icon: 'view_column', toggles: 'columns', extraColumns: true, names: ['resizableColumns', 'columnResizeMode', 'reorderableColumns'] },
  { title: 'Filtros', icon: 'filter_list', toggles: 'filters', names: ['filterDisplay'] },
  { title: 'Edición', icon: 'edit', toggles: 'edit', names: ['editMode'] },
  { title: 'Filas', icon: 'table_rows', toggles: 'rows', names: ['rowGroupMode', 'groupRowsBy', 'expandableRowGroups', 'reorderableRows'] },
  { title: 'Exportar y recordar', icon: 'download', toggles: 'data', names: ['stateStorage'] },
];

/** Máximo de columnas de relleno que añade «Columnas extra»: suficientes para forzar el scroll
 *  horizontal en un portátil normal sin que la tabla se vuelva absurda. */
const MAX_EXTRA_COLUMNS = 8;

/**
 * Laboratorio local: `sc-datatable` dentro del shell real (sidebar y cabecera de verdad, no una
 * maqueta), para ver cómo se comporta en un contexto de app de verdad antes de llevarlo a una
 * pantalla de producto. El botón flotante («Contexto de la app») simula el ENTORNO: tema, sidebar,
 * viewport, el mismo patrón que `lab/sidebar`. El panel fijo de la derecha trae los knobs
 * REALES de `sc-datatable`, agrupados igual que el Playground de sc-docs, para tocar uno a uno y
 * ver el efecto sobre la tabla ya puesta en su sitio.
 */
@Component({
  selector: 'sc-table-lab-page',
  imports: [
    ButtonModule,
    FormsModule,
    NgTemplateOutlet,
    PopoverModule,
    RatingModule,
    ScAvatarComponent,
    ScButtonComponent,
    ScColumnSelectorComponent,
    ScDatatableComponent,
    ScIconComponent,
    ScInputNumberComponent,
    ScInputTextComponent,
    ScMultiSelectComponent,
    ScSearchComponent,
    ScSelectButtonComponent,
    ScSelectComponent,
    ScTagComponent,
    ScToggleSwitchComponent,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './table-lab-page.component.html',
  styleUrl: './table-lab-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableLabPageComponent {
  protected readonly theme = inject(ThemeService);
  private readonly sidebarDemo = inject(SidebarDemoService);

  /**
   * Una copia por visita: los editores escriben en la fila y arrastrar cambia el orden, y la muestra compartida no debe
   * cambiar. Las filas fijas salen de `value` y van en `frozenValue`, como en primeng.dev/table «Frozen Rows».
   */
  protected readonly rows = signal<TableLabAgent[]>(TABLE_LAB_AGENTS.map((agent) => ({ ...agent })));
  protected readonly pinnedIds = signal<ReadonlySet<number>>(new Set());
  protected readonly tableValue = computed(() => this.rows().filter((agent) => !this.pinnedIds().has(agent.id)));
  protected readonly pinnedRows = computed(() => this.rows().filter((agent) => this.pinnedIds().has(agent.id)));

  /** «Detalle de fila», «Pie de grupo» y «Fijar filas»: plantillas y una columna, no props de la tabla. */
  protected readonly rowDetail = signal(false);
  protected readonly groupFooter = signal(false);
  protected readonly pinRows = signal(false);
  protected readonly pinTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('pinTpl');

  protected togglePin(agent: TableLabAgent): void {
    this.pinnedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(agent.id)) next.delete(agent.id);
      else next.add(agent.id);
      return next;
    });
  }

  /** Con filas agrupadas, la tabla sale ordenada por el campo del grupo: PrimeNG agrupa filas SEGUIDAS. */
  protected readonly sortFieldArg = computed(() => {
    const args = this.liveArgs();
    if (args['rowGroupMode']) return args['groupRowsBy'] as string;
    return (args['sortField'] as string) || undefined;
  });

  /** El título de un grupo: el valor legible del campo y cuántos agentes tiene. */
  protected groupTitle(agent: TableLabAgent): string {
    const field = this.liveArgs()['groupRowsBy'] as keyof TableLabAgent;
    const value = agent[field];
    return field === 'status' ? this.statusLabel(agent.status) : String(value);
  }

  protected groupAgents(agent: TableLabAgent): readonly TableLabAgent[] {
    const field = this.liveArgs()['groupRowsBy'] as keyof TableLabAgent;
    return this.tableValue().filter((other) => other[field] === agent[field]);
  }

  protected groupTickets(agent: TableLabAgent): number {
    return this.groupAgents(agent).reduce((sum, other) => sum + other.tickets, 0);
  }

  protected onRowExpand(event: TableRowExpandEvent): void {
    this.lastEvent.set(`rowExpand: ${this.eventAgentName(event.data)}`);
  }

  protected onRowCollapse(event: TableRowCollapseEvent): void {
    this.lastEvent.set(`rowCollapse: ${this.eventAgentName(event.data)}`);
  }

  /** La tabla no mueve `value`: avisa con el orden nuevo y aquí se aplica, con las fijas delante. */
  protected onRowReorder(event: ScDatatableRowReorderEvent<TableLabAgent>): void {
    this.rows.set([...this.pinnedRows(), ...event.rows]);
    this.lastEvent.set(`rowReorder: fila ${event.dragIndex + 1} a ${event.dropIndex + 1}`);
  }

  protected readonly statusTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('statusTpl');
  /** Contenido rico en celda: foto/avatar (`sc-avatar`) y estrellas (`p-rating`, ya con el tema del
   *  DS puesto en `sc-preset/rating.ts`, aunque el DS no tenga un wrapper propio todavía). */
  protected readonly avatarTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('avatarTpl');
  protected readonly ratingTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('ratingTpl');
  protected readonly countryTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('countryTpl');
  protected readonly extraTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('extraTpl');
  protected readonly pickTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('pickTpl');

  /** Columnas fijas (frozen): no es un prop de la tabla, es de la definición de columna, así que
   *  este toggle (en el grupo «Columnas») recalcula `columns()` en vez de tocar `liveArgs`. Misma
   *  tabla, sin montar una segunda para enseñarlo. */
  protected readonly freezeFirstColumn = signal(false);

  /** Columnas de relleno: para ver el scroll horizontal de verdad hace falta que la tabla no
   *  quepa en el ancho, con solo 6 columnas reales nunca se demuestra. Tampoco es un prop de la
   *  tabla, así que vive aquí junto a `freezeFirstColumn`. */
  protected readonly extraColumnsCount = signal(0);
  protected readonly maxExtraColumns = MAX_EXTRA_COLUMNS;

  /** «Filtros por columna» (primeng.dev/table «Filter»): cada columna lleva el filtro que le toca a su dato. */
  protected readonly columnFilters = signal(false);
  /** «Buscador global»: un campo encima de la tabla que busca en agente, equipo y país, y «Limpiar». */
  protected readonly globalSearch = signal(false);
  protected readonly globalFilterFields: readonly string[] = ['name', 'team', 'country'];
  protected readonly searchText = signal('');
  /** «Cabecera agrupada» (primeng.dev/table «Column Group»): dos grupos sobre las columnas. */
  protected readonly groupedHeader = signal(false);
  /** «Elegir columnas» (primeng.dev/table «Column Toggle»): `sc-column-selector` encima de la tabla. */
  protected readonly columnToggle = signal(false);
  protected readonly visibleColumns = signal<readonly string[] | undefined>(undefined);

  /** «Columnas editables» (primeng.dev/table «Cell Edit» y «Row Edit»): agente, equipo, estado y tickets se editan. */
  protected readonly editable = signal(false);
  protected readonly nameEditTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('nameEditTpl');
  protected readonly teamEditTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('teamEditTpl');
  protected readonly statusEditTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('statusEditTpl');
  protected readonly ticketsEditTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('ticketsEditTpl');
  private readonly editors = computed<Partial<Record<string, TemplateRef<ScColumnCellContext<TableLabAgent>>>>>(() =>
    this.editable()
      ? { name: this.nameEditTpl(), team: this.teamEditTpl(), status: this.statusEditTpl(), tickets: this.ticketsEditTpl() }
      : {},
  );

  protected readonly teamFilterTpl = viewChild<TemplateRef<ScColumnFilterContext>>('teamFilterTpl');
  protected readonly countryFilterTpl = viewChild<TemplateRef<ScColumnFilterContext>>('countryFilterTpl');
  protected readonly statusFilterTpl = viewChild<TemplateRef<ScColumnFilterContext>>('statusFilterTpl');
  protected readonly teamOptions = TABLE_LAB_TEAMS.map((team) => ({ label: team, value: team }));
  protected readonly countryOptions = TABLE_LAB_COUNTRIES.map((country) => ({ label: country, value: country }));
  protected readonly statusOptions = (['online', 'busy', 'offline'] as const).map((status) => ({ label: this.statusLabel(status), value: status }));

  private readonly filters = computed<Partial<Record<string, ScColumnFilter>>>(() =>
    this.columnFilters()
      ? {
          name: { placeholder: 'Agente', filterOn: 'input' },
          team: { matchMode: 'equals', showMenu: false, template: this.teamFilterTpl() },
          country: { matchMode: 'in', showMenu: false, template: this.countryFilterTpl() },
          status: { matchMode: 'equals', showMenu: false, template: this.statusFilterTpl() },
          // «Mayor o igual»: lo útil en una cifra («4 estrellas o más», «10 tickets o más»), sin menú ni flechas, que en
          // la fila no caben al lado del número.
          rating: { type: 'numeric', matchMode: 'gte', showMenu: false, showButtons: false, placeholder: '≥' },
          tickets: { type: 'numeric', matchMode: 'gte', showMenu: false, showButtons: false, placeholder: '≥' },
        }
      : {},
  );
  private readonly groups = computed<Partial<Record<string, string>>>(() =>
    this.groupedHeader()
      ? { name: 'Datos del agente', team: 'Datos del agente', country: 'Datos del agente', status: 'Actividad', rating: 'Actividad', tickets: 'Actividad' }
      : {},
  );

  protected readonly columns = computed<readonly ScColumnDef<TableLabAgent>[]>(() => {
    const filters = this.filters();
    const groups = this.groups();
    const editors = this.editors();
    const base: ScColumnDef<TableLabAgent>[] = [
    { field: 'id', header: '', headerAriaLabel: 'Avatar', cellTemplate: this.avatarTpl(), width: '3.5rem', skeleton: 'avatar', exportable: false },
    { field: 'name', header: 'Agente', sortable: true, frozen: this.freezeFirstColumn() || undefined, rowHeader: this.freezeFirstColumn(), width: '12rem' },
    { field: 'team', header: 'Equipo', sortable: true, width: '10rem' },
    { field: 'country', header: 'País', sortable: true, cellTemplate: this.countryTpl(), width: '8rem' },
    { field: 'status', header: 'Estado', sortable: true, cellTemplate: this.statusTpl(), width: '8rem', skeleton: 'tag' },
    { field: 'rating', header: 'Valoración', sortable: true, cellTemplate: this.ratingTpl(), width: '9rem' },
    { field: 'tickets', header: 'Tickets abiertos', sortable: true, width: '10rem' },
    ...Array.from({ length: this.extraColumnsCount() }, (_, i) => ({
      field: `extra-${i + 1}`,
      header: `Dato extra ${i + 1}`,
      cellTemplate: this.extraTpl(),
      width: '10rem',
      exportable: false,
    })),
    ...(this.pinRows()
      ? [{ field: 'pin', header: '', headerAriaLabel: 'Fijar', cellTemplate: this.pinTpl(), width: '4rem', stopRowClick: true, skeleton: 'action' as const, exportable: false }]
      : []),
    ...(this.columnPickButton()
      ? [{ field: 'pick', header: '', headerAriaLabel: 'Elegir', cellTemplate: this.pickTpl(), width: '4rem', stopRowClick: true, skeleton: 'action' as const, exportable: false }]
      : []),
    ];
    return base.map((col) => ({ ...col, filter: filters[col.field], group: groups[col.field], editTemplate: editors[col.field] }));
  });

  /** Las columnas que ofrece «Elegir columnas»: todas, con «Agente» fija porque nombra la fila. */
  protected readonly selectorColumns = computed(() =>
    this.columns().map((col) => ({ key: col.field, label: col.header || col.headerAriaLabel || col.field, locked: col.field === 'name' })),
  );

  protected onColumnToggleChange(on: boolean): void {
    this.columnToggle.set(on);
    // Apagado, vuelven todas: la tabla sin `visibleColumns` pinta las que declara.
    if (!on) this.visibleColumns.set(undefined);
  }

  /** «Reordenar columnas»: la tabla no mueve nada por su cuenta, avisa del orden nuevo y la pantalla lo aplica. */
  protected onColumnOrderChange(fields: readonly string[]): void {
    this.visibleColumns.set(fields);
    this.lastEvent.set(`columnOrderChange: ${fields.join(', ')}`);
  }

  protected onSearch(table: ScDatatableComponent<TableLabAgent>, text: string): void {
    this.searchText.set(text);
    table.filterGlobal(text, 'contains');
  }

  /** El «Clear» del ejemplo «Filter»: filtros, orden y página fuera, y el buscador vacío (ese texto es de la pantalla). */
  protected clearTable(table: ScDatatableComponent<TableLabAgent>): void {
    this.searchText.set('');
    table.clear();
  }

  /** «Botón Exportar» (primeng.dev/table «Export»): un botón encima de la tabla que descarga lo que se ve en CSV. */
  protected readonly exportButton = signal(false);
  /** «Solo las marcadas»: el mismo botón descarga solo las filas marcadas (`selectionOnly`). */
  protected readonly exportSelectionOnly = signal(false);

  /** En el CSV, el estado con su nombre y no con su clave. */
  protected readonly exportCell = ({ data, field }: { data: unknown; field: string }): unknown =>
    field === 'status' ? this.statusLabel(data as TableLabAgent['status']) : data;

  protected exportCsv(table: ScDatatableComponent<TableLabAgent>): void {
    table.exportCSV({ selectionOnly: this.exportSelectionOnly() });
    this.lastEvent.set(this.exportSelectionOnly() ? `exportCSV: ${this.selectedAgents().length} filas marcadas` : 'exportCSV');
  }

  /** «Recordar el estado» (primeng.dev/table «Stateful»): la clave solo existe con un sitio donde guardar. */
  protected readonly stateKeyArg = computed(() => (this.liveArgs()['stateStorage'] ? 'sc-lab-tabla' : undefined));
  /** «Salir y volver»: monta la tabla otra vez, como al volver a la pantalla, para ver qué repone. */
  private readonly remountCount = signal(0);

  protected leaveAndReturn(): void {
    this.remountCount.update((n) => n + 1);
    this.lastEvent.set('Tabla montada de nuevo');
  }

  protected onStateRestore(): void {
    this.lastEvent.set('stateRestore: estado repuesto');
  }

  // Los knobs reales de sc-datatable, igual que el Playground de sc-docs.
  protected readonly liveArgs = signal<Record<string, unknown>>({ ...DEFAULT_ARGS });
  protected readonly controlGroups: readonly (ControlGroupDef & { knobs: readonly ArgType[] })[] = CONTROL_GROUP_DEFS.map((g) => ({
    ...g,
    knobs: g.names.map((n) => ARG_TYPES.find((at) => at.name === n)).filter((at): at is ArgType => !!at),
  }));

  protected setArg(name: string, value: unknown): void {
    this.liveArgs.update((args) => ({ ...args, [name]: value }));
    // Una fila en `single`, un array en `multiple`: lo marcado en un modo no vale en el otro.
    if (name === 'selectionMode') this.selection.set(null);
  }

  /** La selección, en las dos direcciones (`[(selection)]`), para enseñar encima de la tabla qué hay marcado. */
  protected readonly selection = signal<TableLabAgent | readonly TableLabAgent[] | null>(null);
  protected readonly selectedAgents = computed<readonly TableLabAgent[]>(() => {
    const sel = this.selection();
    return sel === null ? [] : Array.isArray(sel) ? sel : [sel as TableLabAgent];
  });
  protected readonly selectedTickets = computed(() => this.selectedAgents().reduce((sum, a) => sum + a.tickets, 0));

  /** Se marca clicando la fila: es cuando funcionan el teclado de PrimeNG y Cmd/Ctrl. Mismo cálculo que la tabla. */
  protected readonly selectsByRow = computed(() => {
    const mode = this.liveArgs()['selectionMode'];
    const column = this.liveArgs()['selectionColumn'];
    if (mode === 'multiple') return column === 'none';
    return mode === 'single' && column !== 'radio';
  });

  /**
   * El último evento de la tabla, el ejemplo «Events» de primeng.dev. Allí sale en un toast; aquí, en la barra de
   * encima de la tabla: lo que hace el usuario se cuenta junto a lo que lo causó, y el toast queda para el sistema
   * (DD-191, lo vigila `audit:screen-hygiene`).
   */
  protected readonly lastEvent = signal<string | null>(null);

  private static readonly SELECT_TYPE: Readonly<Record<string, string>> = {
    row: 'fila',
    checkbox: 'casilla',
    radiobutton: 'radio',
  };

  protected onRowSelect(event: TableRowSelectEvent<TableLabAgent>): void {
    this.lastEvent.set(`rowSelect: ${this.eventAgentName(event.data)}, por ${TableLabPageComponent.SELECT_TYPE[event.type ?? ''] ?? event.type}`);
  }

  protected onRowUnselect(event: TableRowUnSelectEvent<TableLabAgent>): void {
    this.lastEvent.set(`rowUnselect: ${this.eventAgentName(event.data)}, por ${TableLabPageComponent.SELECT_TYPE[event.type ?? ''] ?? event.type}`);
  }

  private eventAgentName(data: TableLabAgent | TableLabAgent[] | undefined): string {
    return Array.isArray(data) ? `${data.length} filas` : (data?.name ?? '');
  }

  /**
   * «Alto del scroll» es el alto del scroll propio: p-table lo pone de tope a la tabla aunque no haya scroll propio, y
   * con «Scroll propio» apagado cortaba la página en la octava fila de diez.
   */
  protected readonly scrollHeightArg = computed(() => {
    const args = this.liveArgs();
    return args['scrollable'] || args['virtualScroll'] ? (args['scrollHeight'] as string) || undefined : undefined;
  });

  /** El knob «Orden inicial por varias» va en texto (`team,name`, el menos es descendente); la tabla pide el array. */
  protected readonly multiSortMetaArg = computed<SortMeta[] | undefined>(() => {
    const raw = this.liveArgs()['multiSortMeta'];
    if (typeof raw !== 'string' || !raw) return undefined;
    return raw.split(',').map((part) => (part.startsWith('-') ? { field: part.slice(1), order: -1 } : { field: part, order: 1 }));
  });

  protected onSortChange(event: ScDatatableSortEvent): void {
    const arrow = (order: number) => (order === -1 ? '↓' : '↑');
    if (event.multiSortMeta) {
      this.lastEvent.set(`sortChange: ${event.multiSortMeta.map((m) => `${m.field} ${arrow(m.order)}`).join(', ')}`);
    } else {
      this.lastEvent.set(event.field ? `sortChange: ${event.field} ${arrow(event.order)}` : 'sortChange: sin orden');
    }
  }

  /** Edición por celda: PrimeNG abre la celda, escribe en la fila y con Escape repone el valor de antes. */
  protected onEditInit(event: TableEditInitEvent): void {
    this.lastEvent.set(`editInit: ${event.field}, ${this.eventAgentName(event.data)}`);
  }

  protected onEditComplete(event: TableEditCompleteEvent): void {
    this.lastEvent.set(`editComplete: ${event.field} = ${this.fieldValue(event.data, event.field)}, ${this.eventAgentName(event.data)}`);
  }

  /** PrimeNG avisa ANTES de reponer el valor: se lee en el siguiente turno, ya repuesto. */
  protected onEditCancel(event: TableEditCancelEvent): void {
    queueMicrotask(() =>
      this.lastEvent.set(`editCancel: ${event.field} vuelve a ${this.fieldValue(event.data, event.field)}, ${this.eventAgentName(event.data)}`),
    );
  }

  /** Edición por fila: el lápiz guarda una copia, cancelar la repone y guardar la descarta, como el ejemplo «Row Edit». */
  private readonly rowCopies = new Map<number, TableLabAgent>();

  protected onRowEditInit({ row }: ScDatatableRowEditEvent<TableLabAgent>): void {
    this.rowCopies.set(row.id, { ...row });
    this.lastEvent.set(`rowEditInit: ${row.name}`);
  }

  protected onRowEditSave({ row }: ScDatatableRowEditEvent<TableLabAgent>): void {
    this.rowCopies.delete(row.id);
    this.lastEvent.set(`rowEditSave: ${row.name}, ${row.team}, ${this.statusLabel(row.status)}, ${row.tickets} tickets`);
  }

  protected onRowEditCancel({ row }: ScDatatableRowEditEvent<TableLabAgent>): void {
    const copy = this.rowCopies.get(row.id);
    if (copy) Object.assign(row, copy);
    this.rowCopies.delete(row.id);
    this.lastEvent.set(`rowEditCancel: ${row.name}`);
  }

  private fieldValue(data: unknown, field: string | undefined): string {
    const value = field && data && typeof data === 'object' ? (data as Record<string, unknown>)[field] : undefined;
    return value == null ? '' : String(value);
  }

  /** «Botón en columna»: el ejemplo «Column» de primeng.dev, un botón en la fila que la elige sin marcarla. */
  protected readonly columnPickButton = signal(false);

  protected pickAgent(agent: TableLabAgent): void {
    this.lastEvent.set(`Botón de la fila: ${agent.name}`);
  }

  /** Los interruptores del laboratorio que no son props de la tabla, por grupo: una lista y una plantilla. */
  protected readonly labToggles: Readonly<Record<'selection' | 'columns' | 'filters' | 'edit' | 'rows' | 'data', readonly LabToggle[]>> = {
    selection: [
      { label: 'Botón en columna', code: 'cellTemplate', ariaKey: 'lab.tabla.pick_label', value: this.columnPickButton, set: (on) => this.columnPickButton.set(on),
        hint: 'Añade al final un botón por fila que elige ese agente sin marcar la fila. Va en una plantilla de celda, no es un prop de la tabla.' },
    ],
    columns: [
      { label: 'Congelar «Agente»', code: 'frozen', ariaKey: 'lab.tabla.freeze_label', value: this.freezeFirstColumn, set: (on) => this.freezeFirstColumn.set(on),
        hint: 'La columna «Agente» se queda fija aunque la tabla se desplace de lado.' },
      { label: 'Cabecera agrupada', code: 'group', ariaKey: 'lab.tabla.grouped_label', value: this.groupedHeader, set: (on) => this.groupedHeader.set(on),
        hint: 'Una fila encima de los títulos agrupa las columnas: «Datos del agente» y «Actividad».' },
      { label: 'Elegir columnas', code: 'visibleColumns', ariaKey: 'lab.tabla.column_toggle_label', value: this.columnToggle, set: (on) => this.onColumnToggleChange(on),
        hint: 'Pone encima de la tabla el selector de columnas del DS: cuáles se ven y en qué orden.' },
    ],
    filters: [
      { label: 'Filtros por columna', code: 'filter', ariaKey: 'lab.tabla.column_filters_label', value: this.columnFilters, set: (on) => this.columnFilters.set(on),
        hint: 'Cada columna lleva su filtro: texto en «Agente», un desplegable en «Equipo» y «Estado», varios países a la vez, y números en «Valoración» y «Tickets».' },
      { label: 'Buscador global', code: 'filterGlobal()', ariaKey: 'lab.tabla.global_search_label', value: this.globalSearch, set: (on) => this.globalSearch.set(on),
        hint: 'Un buscador encima de la tabla que busca en agente, equipo y país a la vez, y «Limpiar», que quita filtros, orden y página.' },
    ],
    rows: [
      { label: 'Detalle de fila', code: 'expansionTemplate', ariaKey: 'lab.tabla.row_detail_label', value: this.rowDetail, set: (on) => this.rowDetail.set(on),
        hint: 'Una flecha al principio de cada fila despliega debajo su detalle. Con «Agrupar filas» en subheader no se usa: ahí la flecha pliega grupos.' },
      { label: 'Pie de grupo', code: 'groupFooterTemplate', ariaKey: 'lab.tabla.group_footer_label', value: this.groupFooter, set: (on) => this.groupFooter.set(on),
        hint: 'Con subheader: debajo de cada grupo, cuántos agentes tiene y sus tickets abiertos.' },
      { label: 'Fijar filas', code: 'frozenValue', ariaKey: 'lab.tabla.pin_rows_label', value: this.pinRows, set: (on) => this.pinRows.set(on),
        hint: 'Un botón por fila la fija arriba mientras el resto hace scroll. Se ve con «Scroll propio» activado.' },
    ],
    data: [
      { label: 'Botón Exportar', code: 'exportCSV()', ariaKey: 'lab.tabla.export_label', value: this.exportButton, set: (on) => this.exportButton.set(on),
        hint: 'Un botón encima de la tabla descarga en CSV las filas que se ven, filtradas y en su orden, con las columnas de datos.' },
      { label: 'Solo las marcadas', code: 'selectionOnly', ariaKey: 'lab.tabla.export_selection_label', value: this.exportSelectionOnly, set: (on) => this.exportSelectionOnly.set(on),
        hint: 'El botón Exportar descarga solo las filas marcadas.' },
    ],
    edit: [
      { label: 'Columnas editables', code: 'editTemplate', ariaKey: 'lab.tabla.editable_label', value: this.editable, set: (on) => this.editable.set(on),
        hint: 'Agente, equipo, estado y tickets llevan un control para editarlos: un campo de texto, dos desplegables y un número.' },
    ],
  };

  /** «first» no hace nada sin «paginator»: PrimeNG solo lo suma al índice de fila cuando hay
   *  páginas (`primeng-table.mjs`: `paginator() ? first() + rowIndex : rowIndex`). Deshabilitarlo
   *  evita que parezca roto al tocarlo con la paginación apagada. */
  protected isKnobDisabled(name: string): boolean {
    return name === 'first' && !this.asBool(this.liveArgs()['paginator']);
  }

  /** `pResizableColumn`/`pReorderableColumn` crean su tirador una sola vez, en `ngAfterViewInit`:
   *  activarlos más tarde con el interruptor no los hace aparecer. Remontamos la tabla cuando
   *  cambia cualquiera de los dos, para que el tirador se cree con el valor ya puesto. «Recordar el estado» también
   *  remonta: p-table solo repone lo guardado al montarse. */
  protected readonly tableRemountKey = computed(
    () =>
      `${this.liveArgs()['resizableColumns']}-${this.liveArgs()['reorderableColumns']}-${this.liveArgs()['reorderableRows']}-${this.liveArgs()['stateStorage']}-${this.remountCount()}`,
  );

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
    return at.control.kind === 'select' ? at.control.options.map((o) => ({ label: o === '' ? 'ninguno' : String(o), value: o })) : [];
  }

  // El CONTEXTO de la app: tema, sidebar, viewport. No son props de la tabla, son del shell.
  protected readonly sidebarExpanded = signal(false);
  protected readonly viewport = signal<Viewport>('desktop');

  protected readonly themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Claro', icon: 'light_mode' },
    { value: 'dark', label: 'Oscuro', icon: 'dark_mode' },
    { value: 'system', label: 'Sistema', icon: 'desktop_windows' },
  ];

  protected readonly viewportOptions: { value: Viewport; label: string }[] = [
    { value: 'desktop', label: 'Escritorio' },
    { value: 'tablet', label: 'Tablet' },
  ];

  /** `sc-datatable` y `p-treetable` son componentes DISTINTOS (el árbol no tiene wrapper del DS
   *  todavía): no hay una sola pantalla que «se convierta» de una a otra, así que el selector
   *  navega entre `/lab/tabla` y `/lab/arbol`, no cambia un prop. */
  private readonly router = inject(Router);
  protected readonly labOptions: { value: 'tabla' | 'arbol'; label: string }[] = [
    { value: 'tabla', label: 'Tabla' },
    { value: 'arbol', label: 'Árbol' },
  ];

  protected selectLab(lab: unknown): void {
    if (lab === 'tabla' || lab === 'arbol') void this.router.navigateByUrl(`/lab/${lab}`);
  }

  constructor() {
    inject(DestroyRef).onDestroy(() => this.sidebarDemo.forcedExpanded.set(false));
  }

  protected selectTheme(mode: unknown): void {
    if (mode === 'light' || mode === 'dark' || mode === 'system') this.theme.set(mode);
  }

  protected selectViewport(viewport: unknown): void {
    if (viewport === 'desktop' || viewport === 'tablet') this.viewport.set(viewport);
  }

  protected onSidebarExpandedChange(expanded: boolean): void {
    this.sidebarExpanded.set(expanded);
    this.sidebarDemo.forcedExpanded.set(expanded);
  }

  protected initialsOf(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected severityOf(status: TableLabAgent['status']): 'success' | 'warning' | 'secondary' {
    if (status === 'online') return 'success';
    if (status === 'busy') return 'warning';
    return 'secondary';
  }

  protected statusLabel(status: TableLabAgent['status']): string {
    return status === 'online' ? 'En línea' : status === 'busy' ? 'Ocupado' : 'Desconectado';
  }

  protected countryFlagUrl(country: TableLabAgent['country']): string {
    return `assets/flags/${country.toLowerCase()}.svg`;
  }

  /** `p-avatar` da prioridad a `label` sobre `image` SIEMPRE que los dos lleguen con valor (su
   *  plantilla es `@if (label()) {...} @else if (image()) {...}`, sin mirar si la imagen cargó).
   *  Por eso `sc-avatar` no basta con pasar los dos: hay que alternar a mano con `(imageError)`. */
  protected readonly failedAvatarIds = signal<ReadonlySet<number>>(new Set());

  protected onAvatarImageError(id: number): void {
    this.failedAvatarIds.update((ids) => new Set(ids).add(id));
  }

  protected extraCellLabel(col: ScColumnDef<TableLabAgent>, agent: TableLabAgent): string {
    return `${col.header}, fila ${agent.id}`;
  }
}
