import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, viewChild, type TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ScAvatarComponent,
  ScDatatableComponent,
  ScInputNumberComponent,
  ScInputTextComponent,
  ScSelectButtonComponent,
  ScSelectComponent,
  ScTagComponent,
  ScToggleSwitchComponent,
  type ScColumnCellContext,
  type ScColumnDef,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { RatingModule } from 'primeng/rating';
import { TooltipModule } from 'primeng/tooltip';

import { SidebarDemoService } from '../../core/services/sidebar-demo.service';
import { ThemeService, type ThemeMode } from '../../core/services/theme.service';
import { TABLE_LAB_AGENTS, type TableLabAgent } from './table-lab-page.data';

type Viewport = 'desktop' | 'tablet';

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
 * Los 21 knobs del Playground de DataTable en sc-docs (`datatable-demo.component.ts`), tal cual:
 * misma lista, mismas etiquetas. Es el contrato real de `sc-datatable`, no una versión reducida.
 */
const ARG_TYPES: readonly ArgType[] = [
  { name: 'paginator', label: 'Paginación', control: { kind: 'boolean' }, description: 'Divide la tabla en páginas en vez de enseñarla entera de golpe.' },
  { name: 'rows', label: 'Filas por página', control: { kind: 'number', min: 1, max: 20, step: 1 }, description: 'Cuántas filas entran en cada página.' },
  { name: 'first', label: 'Primera fila visible', control: { kind: 'number', min: 0, max: 149, step: 1 }, description: 'Desde qué fila empieza a verse la página abierta. Solo hace algo con «Paginación» activada: sin páginas, se ven todas las filas igual.' },
  { name: 'stripedRows', label: 'Filas alternas (cebra)', control: { kind: 'boolean' }, description: 'Pinta las filas pares de otro color, para seguir la fila con la vista.' },
  { name: 'showGridlines', label: 'Líneas de rejilla', control: { kind: 'boolean' }, description: 'Dibuja líneas entre todas las celdas, como una cuadrícula.' },
  { name: 'size', label: 'Tamaño', control: { kind: 'select', options: ['sm', 'md', 'lg'] }, description: 'Qué tan compacta o espaciosa se ve cada fila.' },
  { name: 'loading', label: 'Cargando', control: { kind: 'boolean' }, description: 'Muestra el aviso de «cargando» encima de la tabla.' },
  { name: 'skeleton', label: 'Esqueleto de carga', control: { kind: 'boolean' }, description: 'En vez del aviso de carga, pinta la forma de las filas mientras llegan los datos de verdad.' },
  { name: 'skeletonRows', label: 'Filas del esqueleto', control: { kind: 'number', min: 1, max: 20, step: 1 }, description: 'Cuántas filas de mentira pinta ese esqueleto de carga.' },
  { name: 'selectionMode', label: 'Modo de selección', control: { kind: 'select', options: ['single', 'multiple'] }, description: 'Si se puede marcar una sola fila, o varias a la vez.' },
  { name: 'sortField', label: 'Ordenar por columna', control: { kind: 'text' }, description: 'Por qué columna sale ordenada la tabla nada más entrar.' },
  { name: 'sortOrder', label: 'Sentido del orden', control: { kind: 'select', options: [1, -1] }, description: '1 ascendente, -1 descendente.' },
  { name: 'externalSort', label: 'Orden gestionado fuera', control: { kind: 'boolean' }, description: 'La tabla avisa de qué columna se pulsó para ordenar, pero no mueve las filas ella sola: lo hace quien la usa.' },
  { name: 'rowsFocusable', label: 'Filas navegables con teclado', control: { kind: 'boolean' }, description: 'Se puede recorrer fila a fila con el tabulador del teclado.' },
  { name: 'scrollable', label: 'Scroll propio', control: { kind: 'boolean' }, description: 'La cabecera se queda fija arriba y el resto de la tabla hace scroll por su cuenta.' },
  { name: 'scrollHeight', label: 'Alto del scroll', control: { kind: 'text' }, description: 'Cuánto alto tiene ese scroll propio (p. ej. 240px).' },
  { name: 'stickyHeader', label: 'Cabecera fija', control: { kind: 'boolean' }, description: 'La cabecera se queda fija al bajar por toda la página, no solo dentro de la tabla.' },
  { name: 'virtualScroll', label: 'Lista virtual', control: { kind: 'boolean' }, description: 'Solo pinta las filas que se ven en cada momento, para que tablas enormes no vayan lentas.' },
  { name: 'tableMinWidth', label: 'Ancho mínimo', control: { kind: 'text' }, description: 'Ancho mínimo de la tabla: si no cabe, se desplaza de lado en vez de apretar el texto.' },
  { name: 'resizableColumns', label: 'Redimensionar columnas', control: { kind: 'boolean' }, description: 'Se puede arrastrar el borde de una columna para hacerla más ancha o más estrecha.' },
  { name: 'columnResizeMode', label: 'Modo de redimensión', control: { kind: 'select', options: ['fit', 'expand'] }, description: '«fit»: la tabla no cambia de ancho. «expand»: crece con la columna.' },
  { name: 'reorderableColumns', label: 'Reordenar columnas', control: { kind: 'boolean' }, description: 'Se puede arrastrar una columna entera para cambiarla de sitio.' },
];

const DEFAULT_ARGS: Record<string, unknown> = {
  paginator: true,
  rows: 10,
  first: 0,
  stripedRows: true,
  showGridlines: false,
  size: 'md',
  loading: false,
  skeleton: false,
  skeletonRows: 8,
  selectionMode: 'multiple',
  sortField: '',
  sortOrder: 1,
  externalSort: false,
  rowsFocusable: false,
  scrollable: false,
  scrollHeight: '420px',
  stickyHeader: false,
  virtualScroll: false,
  tableMinWidth: '',
  resizableColumns: false,
  columnResizeMode: 'fit',
  reorderableColumns: false,
};

const CONTROL_GROUP_DEFS: readonly { title: string; open: boolean; names: readonly string[] }[] = [
  { title: 'General', open: true, names: ['paginator', 'rows', 'first', 'stripedRows', 'showGridlines', 'size', 'loading', 'skeleton', 'skeletonRows'] },
  { title: 'Selección y orden', open: false, names: ['selectionMode', 'sortField', 'sortOrder', 'externalSort', 'rowsFocusable'] },
  { title: 'Scroll y tamaño', open: false, names: ['scrollable', 'scrollHeight', 'stickyHeader', 'virtualScroll', 'tableMinWidth'] },
  { title: 'Columnas', open: false, names: ['resizableColumns', 'columnResizeMode', 'reorderableColumns'] },
];

/** Máximo de columnas de relleno que añade «Columnas extra»: suficientes para forzar el scroll
 *  horizontal en un portátil normal sin que la tabla se vuelva absurda. */
const MAX_EXTRA_COLUMNS = 8;

/**
 * Laboratorio local: `sc-datatable` dentro del shell real (sidebar y cabecera de verdad, no una
 * maqueta), para ver cómo se comporta en un contexto de app de verdad antes de llevarlo a una
 * pantalla de producto. El botón flotante («Contexto de la app») simula el ENTORNO: tema, sidebar,
 * viewport, el mismo patrón que `lab/sidebar`. El panel fijo de la derecha trae los 21 knobs
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
    ScDatatableComponent,
    ScIconComponent,
    ScInputNumberComponent,
    ScInputTextComponent,
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

  protected readonly agents: readonly TableLabAgent[] = TABLE_LAB_AGENTS;

  protected readonly statusTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('statusTpl');
  /** Contenido rico en celda: foto/avatar (`sc-avatar`) y estrellas (`p-rating`, ya con el tema del
   *  DS puesto en `sc-preset/rating.ts`, aunque el DS no tenga un wrapper propio todavía). */
  protected readonly avatarTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('avatarTpl');
  protected readonly ratingTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('ratingTpl');
  protected readonly countryTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('countryTpl');
  protected readonly extraTpl = viewChild<TemplateRef<ScColumnCellContext<TableLabAgent>>>('extraTpl');

  /** Columnas fijas (frozen): no es un prop de la tabla, es de la definición de columna, así que
   *  este toggle (en el grupo «Columnas») recalcula `columns()` en vez de tocar `liveArgs`. Misma
   *  tabla, sin montar una segunda para enseñarlo. */
  protected readonly freezeFirstColumn = signal(false);

  /** Columnas de relleno: para ver el scroll horizontal de verdad hace falta que la tabla no
   *  quepa en el ancho, con solo 6 columnas reales nunca se demuestra. Tampoco es un prop de la
   *  tabla, así que vive aquí junto a `freezeFirstColumn`. */
  protected readonly extraColumnsCount = signal(0);
  protected readonly maxExtraColumns = MAX_EXTRA_COLUMNS;

  protected readonly columns = computed<readonly ScColumnDef<TableLabAgent>[]>(() => [
    { field: 'id', header: '', headerAriaLabel: 'Avatar', cellTemplate: this.avatarTpl(), width: '3.5rem', skeleton: 'avatar' },
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
    })),
  ]);

  // Los 21 knobs reales de sc-datatable, igual que el Playground de sc-docs.
  protected readonly liveArgs = signal<Record<string, unknown>>({ ...DEFAULT_ARGS });
  protected readonly controlGroups: readonly { title: string; open: boolean; knobs: readonly ArgType[] }[] =
    CONTROL_GROUP_DEFS.map((g) => ({
      title: g.title,
      open: g.open,
      knobs: g.names.map((n) => ARG_TYPES.find((at) => at.name === n)).filter((at): at is ArgType => !!at),
    }));

  protected setArg(name: string, value: unknown): void {
    this.liveArgs.update((args) => ({ ...args, [name]: value }));
  }

  /** «first» no hace nada sin «paginator»: PrimeNG solo lo suma al índice de fila cuando hay
   *  páginas (`primeng-table.mjs`: `paginator() ? first() + rowIndex : rowIndex`). Deshabilitarlo
   *  evita que parezca roto al tocarlo con la paginación apagada. */
  protected isKnobDisabled(name: string): boolean {
    return name === 'first' && !this.asBool(this.liveArgs()['paginator']);
  }

  /** `pResizableColumn`/`pReorderableColumn` crean su tirador una sola vez, en `ngAfterViewInit`:
   *  activarlos más tarde con el interruptor no los hace aparecer. Remontamos la tabla cuando
   *  cambia cualquiera de los dos, para que el tirador se cree con el valor ya puesto. */
  protected readonly tableRemountKey = computed(
    () => `${this.liveArgs()['resizableColumns']}-${this.liveArgs()['reorderableColumns']}`,
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
    return at.control.kind === 'select' ? at.control.options.map((o) => ({ label: String(o), value: o })) : [];
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
