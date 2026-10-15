import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, type Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ScButtonComponent,
  ScInputNumberComponent,
  ScInputTextComponent,
  ScMultiSelectComponent,
  ScSearchComponent,
  ScSelectButtonComponent,
  ScSelectComponent,
  ScSkeletonComponent,
  ScTagComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { MenuItem, SortMeta, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ContextMenuModule } from 'primeng/contextmenu';
import { PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import {
  TreeTable,
  TreeTableModule,
  type TreeTableEditEvent,
  type TreeTableLazyLoadEvent,
  type TreeTableNodeCollapseEvent,
  type TreeTableNodeExpandEvent,
  type TreeTableNodeSelectEvent,
  type TreeTableNodeUnSelectEvent,
  type TreeTableSortEvent,
  type TreeTableColumnReorderEvent,
} from 'primeng/treetable';

import { injectLangChange } from '@core/utils/lang-change';
import { SidebarDemoService } from '../../core/services/sidebar-demo.service';
import { ThemeService, type ThemeMode } from '../../core/services/theme.service';
import {
  LAZY_TEAM_COUNT,
  lazyAgents,
  lazyTeams,
  sumTeams,
  treeTableLabTeams,
  type TreeTableAgentRow,
} from './treetable-lab-page.data';

type Viewport = 'desktop' | 'tablet';

/** Tipo de control (knob), mismo patrón que `table-lab-page.component.ts`. */
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

/** Un interruptor del laboratorio que no es un prop del árbol (una plantilla, una columna, un modo de datos). */
interface LabToggle {
  readonly label: string;
  readonly hint: string;
  /** Lo que mueve en código, debajo de la etiqueta. */
  readonly code: string;
  readonly ariaKey: string;
  readonly value: Signal<boolean>;
  readonly set: (on: boolean) => void;
}

type ToggleGroup = 'general' | 'selection' | 'scroll' | 'columns' | 'filters' | 'edit' | 'data';

/**
 * Knobs reales de `p-treetable` (primeng.dev/treetable): no hay wrapper del DS todavía
 * (`docs/AUDIT-PRIMENG-CATALOGO.md` lo tenía en «sin caso» hasta este laboratorio), así que es el
 * nativo tal cual, tema puesto desde `sc-preset/treetable.ts`.
 */
const ARG_TYPES: readonly ArgType[] = [
  { name: 'paginator', label: 'Paginación', control: { kind: 'boolean' }, description: 'Divide el árbol en páginas en vez de enseñarlo entero de golpe.' },
  { name: 'rows', label: 'Filas por página', control: { kind: 'number', min: 1, max: 20, step: 1 }, description: 'Cuántos equipos entran en cada página: sus agentes van con ellos.' },
  { name: 'rowsPerPageOptions', label: 'Elegir filas por página', control: { kind: 'boolean' }, description: 'Junto a las páginas, un desplegable para elegir 2, 4 u 8 equipos por página.' },
  { name: 'showCurrentPageReport', label: 'Texto de la página', control: { kind: 'boolean' }, description: 'Junto a las páginas, qué equipos se ven de cuántos: «1 a 2 de 4».' },
  { name: 'paginatorPosition', label: 'Dónde va el paginador', control: { kind: 'select', options: ['bottom', 'top', 'both'] }, description: 'bottom: debajo del árbol. top: encima. both: en los dos sitios.' },
  { name: 'showGridlines', label: 'Líneas de rejilla', control: { kind: 'boolean' }, description: 'Dibuja líneas entre todas las celdas, como una cuadrícula.' },
  { name: 'size', label: 'Tamaño', control: { kind: 'select', options: ['sm', 'md', 'lg'] }, description: 'Qué tan compacta o espaciosa se ve cada fila (las clases p-treetable-sm y p-treetable-lg).' },
  { name: 'loading', label: 'Cargando', control: { kind: 'boolean' }, description: 'Muestra el aviso de «cargando» encima del árbol.' },
  { name: 'rowHover', label: 'Resaltar fila al pasar', control: { kind: 'boolean' }, description: 'La fila cambia de color al pasar el ratón por encima, aunque no se pueda seleccionar.' },
  { name: 'selectionMode', label: 'Modo de selección', control: { kind: 'select', options: ['', 'single', 'multiple', 'checkbox'] }, description: 'single: un clic marca una fila. multiple: varias. checkbox: una casilla por fila, y marcar un equipo marca a todos sus agentes.' },
  { name: 'metaKeySelection', label: 'Cmd/Ctrl para añadir', control: { kind: 'boolean' }, description: 'Con single o multiple: un clic sustituye lo marcado y Cmd/Ctrl+clic añade o quita.' },
  { name: 'sortField', label: 'Ordenar por columna', control: { kind: 'select', options: ['', 'name', 'status', 'tickets', 'closed'] }, description: 'Por qué columna sale ordenado el árbol nada más entrar. Cada nivel se ordena por separado: los equipos entre sí y los agentes dentro de su equipo.' },
  { name: 'sortOrder', label: 'Sentido del orden', control: { kind: 'select', options: [1, -1] }, description: '1 ascendente, -1 descendente.' },
  { name: 'sortMode', label: 'Ordenar por varias', control: { kind: 'select', options: ['single', 'multiple'] }, description: 'multiple: un clic ordena por esa columna sola; Cmd/Ctrl+clic la añade detrás de las que ya había.' },
  { name: 'scrollable', label: 'Scroll propio', control: { kind: 'boolean' }, description: 'La cabecera se queda fija arriba y el resto del árbol hace scroll por su cuenta.' },
  { name: 'scrollHeight', label: 'Alto del scroll', control: { kind: 'text' }, description: 'Cuánto alto tiene ese scroll propio (p. ej. 320px).' },
  { name: 'resizableColumns', label: 'Redimensionar columnas', control: { kind: 'boolean' }, description: 'Se puede arrastrar el borde de una columna para hacerla más ancha o más estrecha.' },
  { name: 'columnResizeMode', label: 'Modo de redimensión', control: { kind: 'select', options: ['fit', 'expand'] }, description: 'fit: el árbol no cambia de ancho. expand: crece con la columna.' },
  { name: 'reorderableColumns', label: 'Reordenar columnas', control: { kind: 'boolean' }, description: 'Se puede arrastrar una columna entera para cambiarla de sitio.' },
  { name: 'filterMode', label: 'Cómo filtra', control: { kind: 'select', options: ['lenient', 'strict'] }, description: 'lenient: si un equipo casa, salen todos sus agentes. strict: se miran también los agentes, y solo salen los que casan.' },
];

const DEFAULT_ARGS: Record<string, unknown> = {
  paginator: false,
  rows: 2,
  rowsPerPageOptions: false,
  showCurrentPageReport: false,
  paginatorPosition: 'bottom',
  showGridlines: false,
  size: 'md',
  loading: false,
  rowHover: true,
  selectionMode: 'checkbox',
  metaKeySelection: false,
  sortField: '',
  sortOrder: 1,
  sortMode: 'single',
  scrollable: false,
  scrollHeight: '320px',
  resizableColumns: false,
  columnResizeMode: 'fit',
  reorderableColumns: false,
  filterMode: 'lenient',
};

/** Un botón del racimo por grupo, como `/lab/tabla`: su icono, sus knobs y sus interruptores. */
interface ControlGroupDef {
  readonly title: string;
  readonly icon: string;
  readonly names: readonly string[];
  readonly toggles: ToggleGroup;
  /** A dos columnas: en una sola no cabe en el alto de la ventana. */
  readonly wide?: boolean;
}

const CONTROL_GROUP_DEFS: readonly ControlGroupDef[] = [
  { title: 'General', icon: 'tune', wide: true, toggles: 'general', names: ['paginator', 'rows', 'rowsPerPageOptions', 'showCurrentPageReport', 'paginatorPosition', 'showGridlines', 'size', 'loading', 'rowHover'] },
  { title: 'Selección y orden', icon: 'checklist', wide: true, toggles: 'selection', names: ['selectionMode', 'metaKeySelection', 'sortField', 'sortOrder', 'sortMode'] },
  { title: 'Scroll y tamaño', icon: 'swap_vert', toggles: 'scroll', names: ['scrollable', 'scrollHeight'] },
  { title: 'Columnas', icon: 'view_column', toggles: 'columns', names: ['resizableColumns', 'columnResizeMode', 'reorderableColumns'] },
  { title: 'Filtros', icon: 'filter_list', toggles: 'filters', names: ['filterMode'] },
  { title: 'Edición', icon: 'edit', toggles: 'edit', names: [] },
  { title: 'Datos', icon: 'database', toggles: 'data', names: [] },
];

type ColumnField = 'name' | 'role' | 'status' | 'tickets' | 'closed' | 'actions';

interface TreeTableColumn {
  readonly field: ColumnField;
  readonly header: string;
  /** Con «Cabecera agrupada»: la celda que comparte con las de al lado y su título corto debajo. */
  readonly group?: string;
  readonly groupHeader?: string;
  readonly numeric?: boolean;
  /** Ancho con «Columnas anchas» o «Congelar»: el `colgroup` de primeng.dev «Horizontal» y «Frozen Columns». */
  readonly width: string;
}

const COLUMNS: readonly TreeTableColumn[] = [
  { field: 'name', header: 'Nombre', width: '16rem' },
  { field: 'role', header: 'Tipo', width: '10rem' },
  { field: 'status', header: 'Estado', width: '12rem' },
  { field: 'tickets', header: 'Tickets abiertos', group: 'Tickets', groupHeader: 'Abiertos', numeric: true, width: '12rem' },
  { field: 'closed', header: 'Cerrados hoy', group: 'Tickets', groupHeader: 'Cerrados hoy', numeric: true, width: '12rem' },
];

/** «Título, acciones y pie» (primeng.dev/treetable «Template»): la última columna lleva botones, no datos. */
const ACTIONS_COLUMN: TreeTableColumn = { field: 'actions', header: 'Acciones', width: '8rem' };

/** Una celda de la primera fila de la cabecera agrupada: una columna sin grupo, que ocupa las dos filas, o un grupo. */
type HeaderCell = { readonly kind: 'column'; readonly col: TreeTableColumn } | { readonly kind: 'group'; readonly label: string; readonly span: number };

/** Una celda del pie con totales: la etiqueta (sobre las columnas de texto del principio) o una columna. */
type FooterCell = { readonly kind: 'label'; readonly span: number } | { readonly kind: 'column'; readonly col: TreeTableColumn };

@Component({
  selector: 'sc-treetable-lab-page',
  imports: [
    ButtonModule,
    ContextMenuModule,
    FormsModule,
    NgTemplateOutlet,
    PopoverModule,
    ScButtonComponent,
    ScIconComponent,
    ScInputNumberComponent,
    ScInputTextComponent,
    ScMultiSelectComponent,
    ScSearchComponent,
    ScSelectButtonComponent,
    ScSelectComponent,
    ScSkeletonComponent,
    ScTagComponent,
    ScToggleSwitchComponent,
    TooltipModule,
    TranslateModule,
    TreeTableModule,
  ],
  templateUrl: './treetable-lab-page.component.html',
  styleUrl: './treetable-lab-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreetableLabPageComponent {
  protected readonly theme = inject(ThemeService);
  private readonly sidebarDemo = inject(SidebarDemoService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  /** Una copia por visita: editar escribe en la fila, y la muestra compartida no debe cambiar. */
  protected readonly nodes = signal<TreeNode<TreeTableAgentRow>[]>(treeTableLabTeams());
  protected readonly collapsedKeys = signal<Record<string, boolean>>({});
  /** Casillas: un mapa de claves (`selectionKeys`). Filas con single o multiple: los nodos (`selection`), como los ejemplos. */
  protected readonly selectionKeys = signal<Record<string, unknown>>({});
  protected readonly selection = signal<TreeNode<TreeTableAgentRow> | TreeNode<TreeTableAgentRow>[] | null>(null);
  /** p-treetable avisa de cada casilla con el MISMO mapa, cambiado por dentro: la señal no se entera sin este contador. */
  protected readonly selectionKeysTick = signal(0);

  protected readonly liveArgs = signal<Record<string, unknown>>({ ...DEFAULT_ARGS });
  protected readonly controlGroups: readonly (ControlGroupDef & { knobs: readonly ArgType[] })[] = CONTROL_GROUP_DEFS.map((g) => ({
    ...g,
    knobs: g.names.map((n) => ARG_TYPES.find((at) => at.name === n)).filter((at): at is ArgType => !!at),
  }));

  protected setArg(name: string, value: unknown): void {
    this.liveArgs.update((args) => ({ ...args, [name]: value }));
    // Lo marcado en un modo no vale en otro: single guarda un nodo, multiple una lista y checkbox un mapa de claves.
    if (name === 'selectionMode') this.clearSelection();
  }

  /**
   * El último evento del árbol, como el ejemplo «Events» de primeng.dev: allí sale en un toast; aquí, en la barra de
   * encima, junto a lo que lo causó (el toast queda para el sistema, DD-191).
   */
  protected readonly lastEvent = signal<string | null>(null);

  // ─── Interruptores del laboratorio ───────────────────────────────────────────
  protected readonly paginatorTemplate = signal(false);
  protected readonly removableSort = signal(false);
  protected readonly contextMenu = signal(false);
  protected readonly wideColumns = signal(false);
  protected readonly frozenName = signal(false);
  protected readonly flexScroll = signal(false);
  protected readonly groupedHeader = signal(false);
  protected readonly columnToggle = signal(false);
  protected readonly conditionalStyle = signal(false);
  protected readonly columnFilters = signal(false);
  protected readonly globalSearch = signal(false);
  protected readonly editable = signal(false);
  protected readonly lazy = signal(false);
  protected readonly skeleton = signal(false);
  protected readonly templateParts = signal(false);

  protected readonly labToggles: Readonly<Record<ToggleGroup, readonly LabToggle[]>> = {
    general: [
      { label: 'Botones junto al paginador', code: '#paginatorleft', ariaKey: 'lab.arbol.paginator_tpl_label', value: this.paginatorTemplate, set: (on) => this.paginatorTemplate.set(on),
        hint: 'A los lados de las páginas, un botón para recargar y otro para descargar (primeng.dev «Paginator Template»). Se ve con «Paginación».' },
    ],
    selection: [
      { label: 'Quitar el orden', code: 'customSort', ariaKey: 'lab.arbol.removable_sort_label', value: this.removableSort, set: (on) => this.removableSort.set(on),
        hint: 'El tercer clic en la misma columna quita el orden y el árbol vuelve al de partida. El árbol no lo trae: se hace con customSort, como en primeng.dev. Con orden por una columna.' },
      { label: 'Menú contextual', code: 'contextMenu', ariaKey: 'lab.arbol.context_menu_label', value: this.contextMenu, set: (on) => this.contextMenu.set(on),
        hint: 'Clic derecho en una fila: «Ver» y «Desplegar o plegar».' },
    ],
    scroll: [
      { label: 'Columnas anchas', code: 'colgroup', ariaKey: 'lab.arbol.wide_columns_label', value: this.wideColumns, set: (on) => this.wideColumns.set(on),
        hint: 'Cada columna más ancha de lo que cabe: el árbol se desplaza de lado (primeng.dev «Horizontal»).' },
      { label: 'Congelar «Nombre»', code: 'frozenColumns', ariaKey: 'lab.arbol.freeze_label', value: this.frozenName, set: (on) => this.frozenName.set(on),
        hint: 'La columna «Nombre» se queda fija al desplazar de lado. Con «Columnas anchas» se nota. La cabecera agrupada no se pinta con ella.' },
      { label: 'Scroll flexible', code: 'scrollHeight="flex"', ariaKey: 'lab.arbol.flex_scroll_label', value: this.flexScroll, set: (on) => this.flexScroll.set(on),
        hint: 'El árbol va en un recuadro con su esquina para estirarlo: el scroll ocupa lo que le deja, crezca o encoja.' },
    ],
    columns: [
      { label: 'Cabecera agrupada y totales', code: 'rowspan, colspan', ariaKey: 'lab.arbol.grouped_label', value: this.groupedHeader, set: (on) => this.groupedHeader.set(on),
        hint: '«Tickets» encima de «Abiertos» y «Cerrados hoy», y un pie con los totales (primeng.dev «Column Group»).' },
      { label: 'Elegir columnas', code: '[columns]', ariaKey: 'lab.arbol.column_toggle_label', value: this.columnToggle, set: (on) => this.onColumnToggleChange(on),
        hint: 'Encima del árbol, un desplegable para elegir qué columnas se ven. «Nombre» se queda siempre: lleva la flecha.' },
      { label: 'Estilo condicional', code: '[ngClass]', ariaKey: 'lab.arbol.conditional_label', value: this.conditionalStyle, set: (on) => this.conditionalStyle.set(on),
        hint: 'Los agentes desconectados, con la fila en gris; los que llevan 15 tickets abiertos o más, en rojo.' },
    ],
    filters: [
      { label: 'Filtros por columna', code: 'tt.filter()', ariaKey: 'lab.arbol.column_filters_label', value: this.columnFilters, set: (on) => this.onColumnFiltersChange(on),
        hint: 'Una fila bajo la cabecera con un filtro por columna: texto en «Nombre», un desplegable en «Tipo» y «Estado», y «como mínimo» en los números.' },
      { label: 'Buscador global', code: 'tt.filterGlobal()', ariaKey: 'lab.arbol.global_search_label', value: this.globalSearch, set: (on) => this.onGlobalSearchChange(on),
        hint: 'Un buscador encima del árbol que busca por nombre, de equipo o de agente.' },
    ],
    edit: [
      { label: 'Celdas editables', code: 'ttEditableColumn', ariaKey: 'lab.arbol.editable_label', value: this.editable, set: (on) => this.editable.set(on),
        hint: 'En los agentes, «Estado», «Tickets abiertos» y «Cerrados hoy» se editan pulsando la celda; el equipo suma lo nuevo. Intro o clic fuera lo deja; Escape, también.' },
    ],
    data: [
      { label: 'Carga perezosa', code: 'lazy', ariaKey: 'lab.arbol.lazy_label', value: this.lazy, set: (on) => this.lazy.set(on),
        hint: 'Un centro con 32 equipos que llegan de diez en diez, como de un servidor; los agentes de cada uno, al desplegarlo (primeng.dev «Lazy Load»).' },
      { label: 'Esqueleto de carga', code: '#body', ariaKey: 'lab.arbol.skeleton_label', value: this.skeleton, set: (on) => this.skeleton.set(on),
        hint: 'Mientras llegan los datos, la forma de las filas con sc-skeleton (primeng.dev «Loading Skeleton»).' },
      { label: 'Título, acciones y pie', code: '#caption, #summary', ariaKey: 'lab.arbol.template_label', value: this.templateParts, set: (on) => this.templateParts.set(on),
        hint: 'Un título encima, una columna con botones de ver y editar, y un pie con «Recargar» (primeng.dev «Template»).' },
    ],
  };

  // ─── Columnas ───────────────────────────────────────────────────────────────
  /** El orden tras arrastrar (`reorderableColumns`): p-treetable lo mueve en el array que recibe y avisa. */
  private readonly columnOrder = signal<readonly ColumnField[]>(COLUMNS.map((col) => col.field));
  /** «Elegir columnas»: las que se ven, menos «Nombre», que va siempre. */
  protected readonly pickedFields = signal<ColumnField[]>(COLUMNS.filter((col) => col.field !== 'name').map((col) => col.field));
  protected readonly pickableColumns = COLUMNS.filter((col) => col.field !== 'name');

  private readonly visibleColumns = computed<TreeTableColumn[]>(() => {
    const order = this.columnOrder();
    const picked = this.pickedFields();
    const columns = [...COLUMNS]
      .sort((a, b) => order.indexOf(a.field) - order.indexOf(b.field))
      .filter((col) => col.field === 'name' || !this.columnToggle() || picked.includes(col.field));
    return this.templateParts() ? [...columns, ACTIONS_COLUMN] : columns;
  });

  /** Con «Congelar «Nombre»» (primeng.dev «Frozen Columns»), «Nombre» va en `frozenColumns` y el resto en `columns`. */
  protected readonly mainColumns = computed(() =>
    this.frozenName() ? this.visibleColumns().filter((col) => col.field !== 'name') : this.visibleColumns(),
  );
  protected readonly frozenColumns = computed(() => (this.frozenName() ? this.visibleColumns().filter((col) => col.field === 'name') : undefined));

  protected readonly grouped = computed(() => this.groupedHeader() && !this.frozenName());

  /** La primera fila de la cabecera agrupada: las columnas SEGUIDAS del mismo grupo comparten una celda. */
  protected headerCells(cols: readonly TreeTableColumn[]): HeaderCell[] {
    const cells: HeaderCell[] = [];
    for (const col of cols) {
      const last = cells[cells.length - 1];
      if (!col.group) cells.push({ kind: 'column', col });
      else if (last?.kind === 'group' && last.label === col.group) cells[cells.length - 1] = { ...last, span: last.span + 1 };
      else cells.push({ kind: 'group', label: col.group, span: 1 });
    }
    return cells;
  }

  /** El pie con totales: «Total» sobre las columnas de texto del principio y la suma bajo cada número. */
  protected footerCells(cols: readonly TreeTableColumn[]): FooterCell[] {
    const firstNumber = cols.findIndex((col) => col.numeric);
    const span = firstNumber < 0 ? cols.length : firstNumber;
    return [...(span ? [{ kind: 'label' as const, span }] : []), ...cols.slice(span).map((col) => ({ kind: 'column' as const, col }))];
  }

  protected total(field: ColumnField): number {
    return this.nodes().reduce((sum, team) => sum + Number(team.data?.[field as keyof TreeTableAgentRow] ?? 0), 0);
  }

  protected onColumnReorder(event: TreeTableColumnReorderEvent): void {
    const moved = (event.columns as TreeTableColumn[]).map((col) => col.field);
    const rest = this.columnOrder().filter((field) => !moved.includes(field));
    this.columnOrder.set(this.frozenName() ? ['name', ...moved, ...rest.filter((f) => f !== 'name')] : [...moved, ...rest]);
    this.lastEvent.set(`onColReorder: ${moved.join(', ')}`);
  }

  protected onColumnToggleChange(on: boolean): void {
    this.columnToggle.set(on);
    if (!on) this.pickedFields.set(this.pickableColumns.map((col) => col.field));
  }

  // ─── Filtros ────────────────────────────────────────────────────────────────
  protected readonly roleOptions = [
    { label: 'Equipo', value: 'Equipo' },
    { label: 'Agente', value: 'Agente' },
  ];
  protected readonly statusOptions = (['online', 'busy', 'offline'] as const).map((status) => ({ label: this.statusLabel(status), value: status }));
  protected readonly searchText = signal('');

  /** Apagar un filtro lo quita: el árbol vuelve a enseñarlo todo. */
  protected onColumnFiltersChange(on: boolean): void {
    this.columnFilters.set(on);
    if (!on) this.resetKey.update((n) => n + 1);
  }

  protected onGlobalSearchChange(on: boolean): void {
    this.globalSearch.set(on);
    this.searchText.set('');
    if (!on) this.resetKey.update((n) => n + 1);
  }

  protected onSearch(tt: TreeTable, text: string): void {
    this.searchText.set(text);
    tt.filterGlobal(text, 'contains');
  }

  // ─── Selección, orden y menú ────────────────────────────────────────────────
  /** Con single y multiple la fila se marca al pulsarla; con checkbox, también (como el ejemplo «Checkbox»). */
  protected readonly selectable = computed(() => !!this.liveArgs()['selectionMode']);

  protected readonly markedCount = computed(() => {
    if (this.liveArgs()['selectionMode'] === 'checkbox') {
      this.selectionKeysTick();
      return Object.values(this.selectionKeys()).filter((value) => (value as { checked?: boolean } | null)?.checked === true).length;
    }
    const selection = this.selection();
    return Array.isArray(selection) ? selection.length : selection ? 1 : 0;
  });

  private clearSelection(): void {
    this.selectionKeys.set({});
    this.selection.set(null);
  }

  protected onNodeSelect(event: TreeTableNodeSelectEvent): void {
    this.lastEvent.set(`onNodeSelect: ${this.nodeName(event.node)}`);
  }

  protected onNodeUnselect(event: TreeTableNodeUnSelectEvent): void {
    this.lastEvent.set(`onNodeUnselect: ${this.nodeName(event.node)}`);
  }

  protected onSort(event: TreeTableSortEvent): void {
    const arrow = (order?: number) => (order === -1 ? '↓' : '↑');
    const metas = event.multisortmeta as SortMeta[] | undefined;
    // Al quitar el orden, `tt.reset()` deja el aviso sin columna: manda el de «Quitar el orden».
    if (!metas && !event.field) return;
    this.lastEvent.set(metas ? `onSort: ${metas.map((m) => `${m.field} ${arrow(m.order)}`).join(', ')}` : `onSort: ${event.field} ${arrow(event.order)}`);
  }

  /**
   * «Quitar el orden» (primeng.dev/treetable «Removable Sort»): con `customSort` el árbol avisa y el orden lo pone la
   * pantalla. Asc, desc y, al tercer clic, el de partida. p-treetable avisa una vez por nivel en cada clic: los equipos
   * (`tt.value`) y luego los agentes de cada equipo. El ciclo avanza solo con el aviso de los equipos; si avanzara con
   * todos, como el ejemplo, un clic lo recorrería entero.
   */
  private sortState: { field: string; step: 'asc' | 'desc' } | null = null;
  private readonly initialOrder = new Map<string, readonly string[]>();

  protected onCustomSort(event: TreeTableSortEvent, tt: TreeTable): void {
    const nodes = (event.data ?? []) as TreeNode<TreeTableAgentRow>[];
    if (nodes === tt.value) {
      const field = event.field ?? '';
      const step = this.sortState?.field === field ? (this.sortState.step === 'asc' ? 'desc' : null) : 'asc';
      if (!step) {
        this.sortState = null;
        this.restoreInitialOrder();
        tt.reset();
        this.lastEvent.set('sortFunction: sin orden');
        return;
      }
      if (!this.initialOrder.size) this.rememberInitialOrder();
      this.sortState = { field, step };
    }
    if (!this.sortState) return;
    const order = this.sortState.step === 'asc' ? 1 : -1;
    const field = this.sortState.field as keyof TreeTableAgentRow;
    nodes.sort((a, b) => order * compare(a.data?.[field], b.data?.[field]));
  }

  private rememberInitialOrder(): void {
    this.initialOrder.set('', this.nodes().map((team) => team.key!));
    for (const team of this.nodes()) this.initialOrder.set(team.key!, (team.children ?? []).map((agent) => agent.key!));
  }

  private restoreInitialOrder(): void {
    const byKey = (nodes: TreeNode<TreeTableAgentRow>[], keys: readonly string[] | undefined) =>
      keys ? [...nodes].sort((a, b) => keys.indexOf(a.key!) - keys.indexOf(b.key!)) : nodes;
    const teams = byKey(this.nodes(), this.initialOrder.get(''));
    for (const team of teams) team.children = byKey(team.children ?? [], this.initialOrder.get(team.key!));
    this.nodes.set(teams);
  }

  protected readonly contextNode = signal<TreeNode<TreeTableAgentRow> | null>(null);
  protected readonly contextItems = computed<MenuItem[]>(() => {
    this.lang(); // el menú, en el idioma de la app (ver `injectLangChange`)
    return [
      {
        label: this.translate.instant('lab.arbol.context_view'),
        icon: 'sc-icon-font sc-icon-font--visibility',
        command: () => this.lastEvent.set(`Ver: ${this.nodeName(this.contextNode())}`),
      },
      {
        label: this.translate.instant('lab.arbol.context_toggle'),
        icon: 'sc-icon-font sc-icon-font--unfold_more',
        command: () => this.toggleNode(this.contextNode()),
      },
    ];
  });

  private toggleNode(node: TreeNode<TreeTableAgentRow> | null): void {
    if (!node?.key || !node.children?.length) return;
    const key = node.key;
    this.collapsedKeys.update((keys) => ({ ...keys, [key]: !keys[key] }));
    this.lastEvent.set(`${this.collapsedKeys()[key] ? 'Plegar' : 'Desplegar'}: ${this.nodeName(node)}`);
  }

  protected onNodeExpand(event: TreeTableNodeExpandEvent): void {
    this.lastEvent.set(`onNodeExpand: ${this.nodeName(event.node)}`);
    if (this.lazy()) this.loadAgents(event.node as TreeNode<TreeTableAgentRow>);
  }

  protected onNodeCollapse(event: TreeTableNodeCollapseEvent): void {
    this.lastEvent.set(`onNodeCollapse: ${this.nodeName(event.node)}`);
  }

  /** La fila de filtros: `tt.filter` pide texto, y vacío quita el filtro de esa columna. */
  protected filterColumn(tt: TreeTable, value: unknown, field: ColumnField, matchMode: string): void {
    tt.filter(value === null || value === undefined ? '' : String(value), field, matchMode);
  }

  // ─── Edición ────────────────────────────────────────────────────────────────
  private readonly editableFields: readonly ColumnField[] = ['status', 'tickets', 'closed'];

  /** Se editan los agentes: la fila del equipo es la suma de los suyos. «Nombre» lleva la flecha, como el ejemplo. */
  protected isEditable(row: TreeTableAgentRow, field: ColumnField): boolean {
    return this.editable() && row.role === 'Agente' && this.editableFields.includes(field);
  }

  protected onEditComplete(event: TreeTableEditEvent): void {
    sumTeams(this.nodes());
    // El tipo de PrimeNG dice `string`, pero `ttEditableColumn` emite la fila entera.
    const agent = event.data as unknown as TreeTableAgentRow | undefined;
    this.lastEvent.set(`onEditComplete: ${event.field} = ${agent?.[event.field as keyof TreeTableAgentRow] ?? ''}, ${agent?.name ?? ''}`);
  }

  // ─── Datos: carga perezosa, esqueleto y plantillas ──────────────────────────
  protected readonly lazyTotal = LAZY_TEAM_COUNT;
  protected readonly lazyNodes = signal<TreeNode<TreeTableAgentRow>[]>([]);
  protected readonly lazyLoading = signal(false);

  /** p-treetable pide una página: llega un rato después, como de un servidor. */
  protected onLazyLoad(event: TreeTableLazyLoadEvent): void {
    this.lazyLoading.set(true);
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    setTimeout(() => {
      this.lazyNodes.set(lazyTeams(first, rows));
      this.lazyLoading.set(false);
      this.lastEvent.set(`onLazyLoad: equipos ${first + 1} a ${Math.min(first + rows, LAZY_TEAM_COUNT)}`);
    }, 600);
  }

  private loadAgents(team: TreeNode<TreeTableAgentRow>): void {
    if (team.children?.length || !team.key) return;
    this.lazyLoading.set(true);
    setTimeout(() => {
      team.children = lazyAgents(team.key!);
      this.lazyNodes.set([...this.lazyNodes()]);
      this.lazyLoading.set(false);
    }, 300);
  }

  /** «Esqueleto de carga»: filas de mentira con la forma de las de verdad, como primeng.dev «Loading Skeleton». */
  protected readonly skeletonNodes: TreeNode<TreeTableAgentRow>[] = Array.from({ length: 6 }, (_, i) => ({
    key: `skeleton-${i}`,
    data: { key: `skeleton-${i}`, name: '', role: 'Agente', tickets: 0, closed: 0 },
  }));

  protected readonly tableValue = computed(() => (this.skeleton() ? this.skeletonNodes : this.lazy() ? this.lazyNodes() : this.nodes()));

  protected reload(): void {
    this.nodes.set(treeTableLabTeams());
    this.initialOrder.clear();
    this.sortState = null;
    this.clearSelection();
    this.resetKey.update((n) => n + 1);
    this.lastEvent.set('Recargado');
  }

  // ─── Montaje ─────────────────────────────────────────────────────────────────
  /** Quitar filtros y empezar de cero: monta el árbol otra vez. */
  private readonly resetKey = signal(0);

  /**
   * `ttResizableColumn`/`ttReorderableColumn` crean su tirador una sola vez (mismo límite medido en
   * `table-lab-page.component.ts`), p-treetable solo lee `frozenColumns` y `collapsedKeys` controlado al montarse, la
   * carga perezosa pide su primera página al nacer, las filas de una página solo se recortan al cambiar datos, orden,
   * filtro o página (no al encender «Paginación» ni al cambiar «Filas por página»), y lo marcado en un modo de selección
   * rompe el siguiente (de single a multiple, `_selection.filter is not a function`): cualquiera de ellos remonta el árbol.
   */
  protected readonly tableRemountKey = computed(() =>
    [
      this.liveArgs()['resizableColumns'],
      this.liveArgs()['reorderableColumns'],
      this.liveArgs()['selectionMode'],
      this.paginatorArg(),
      this.rowsArg(),
      this.frozenName(),
      this.lazy(),
      this.flexScroll(),
      this.resetKey(),
    ].join('-'),
  );

  /** «Columnas anchas», «Congelar» y «Scroll flexible» piden scroll propio: el ejemplo de cada uno lo lleva. */
  protected readonly scrollableArg = computed(
    () => !!this.liveArgs()['scrollable'] || this.wideColumns() || this.frozenName() || this.flexScroll(),
  );

  /** El alto del scroll solo viaja con «Scroll propio»: con «Scroll flexible» es `flex`. */
  protected readonly scrollHeightArg = computed(() => {
    if (this.flexScroll()) return 'flex';
    return this.liveArgs()['scrollable'] ? (this.liveArgs()['scrollHeight'] as string) || undefined : undefined;
  });

  /** El `colgroup` de primeng.dev: con scroll propio hace falta para redimensionar, y lleva el ancho de cada columna. */
  protected readonly sizedColumns = computed(() => this.wideColumns() || this.frozenName());

  protected colWidth(col: TreeTableColumn): string | null {
    if (!this.sizedColumns()) return null;
    return this.wideColumns() ? '24rem' : col.width;
  }

  protected readonly paginatorArg = computed(() => !!this.liveArgs()['paginator'] || this.lazy());
  protected readonly rowsArg = computed(() => (this.lazy() ? 10 : (this.liveArgs()['rows'] as number)));

  // ─── Utilidades del laboratorio ─────────────────────────────────────────────
  protected asStr(v: unknown): string {
    return typeof v === 'string' ? v : v == null ? '' : String(v);
  }
  protected asNum(v: unknown): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  protected asBool(v: unknown): boolean {
    return !!v;
  }
  protected selectOptions(at: ArgType): readonly { label: string; value: string | number }[] {
    return at.control.kind === 'select' ? at.control.options.map((o) => ({ label: o === '' ? 'ninguno' : String(o), value: o })) : [];
  }

  protected expandAll(): void {
    this.collapsedKeys.set({});
  }

  protected collapseAll(): void {
    const keys: Record<string, boolean> = {};
    for (const node of this.nodes()) {
      if (node.key) keys[node.key] = true;
    }
    this.collapsedKeys.set(keys);
  }

  private nodeName(node: TreeNode | null | undefined): string {
    return (node?.data as TreeTableAgentRow | undefined)?.name ?? '';
  }

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

  /** Mismo selector que `table-lab-page.component.ts`: navega entre `/lab/tabla` y `/lab/arbol`,
   *  no cambia un prop, son componentes distintos. */
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

  protected roleSeverity(role: TreeTableAgentRow['role']): 'info' | 'secondary' {
    return role === 'Equipo' ? 'info' : 'secondary';
  }

  protected statusSeverity(status: TreeTableAgentRow['status']): 'success' | 'warning' | 'secondary' {
    if (status === 'online') return 'success';
    if (status === 'busy') return 'warning';
    return 'secondary';
  }

  protected statusLabel(status: TreeTableAgentRow['status']): string {
    if (status === 'online') return 'En línea';
    if (status === 'busy') return 'Ocupado';
    return 'Desconectado';
  }
}

/** El comparador del ejemplo «Removable Sort»: vacíos delante, textos por idioma y el resto por valor. */
function compare(a: unknown, b: unknown): number {
  if (a == null && b != null) return -1;
  if (a != null && b == null) return 1;
  if (a == null && b == null) return 0;
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  return (a as number) < (b as number) ? -1 : (a as number) > (b as number) ? 1 : 0;
}
