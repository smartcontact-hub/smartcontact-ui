import { CdkDrag, CdkDropList, moveItemInArray, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  ElementRef,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  type OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { PopoverModule } from 'primeng/popover';
import { SortAltIcon } from 'primeng/icons/sortalt';
import { SortAmountDownIcon } from 'primeng/icons/sortamountdown';
import { SortAmountUpAltIcon } from 'primeng/icons/sortamountupalt';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import {
  ScButtonComponent,
  ScDatepickerComponent,
  ScInputTextComponent,
  ScMultiSelectComponent,
  ScSelectComponent,
  type ColumnDef,
  type ScColumnDef,
  type ScRowStyleClassFn,
  ScDatatableComponent,
  ScEmptyStateComponent,
  ScSearchComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { OptionsTextFilterComponent } from './options-text-filter.component';
import { type FilterContext, type FilterDef, type FilterTemplates, filterIsActive, filterMatches } from './list-filters';

/**
 * Lo que se recuerda de la tabla de cada lista al volver: qué columnas se ven, en qué orden (el de TODAS, también
 * las ocultas, para que una columna que se vuelve a enseñar salga donde estaba) y los anchos arrastrados, en rem.
 * Lo guarda la lista y no `stateKey` de `p-table`, que restaura además el orden de filas y la SELECCIÓN (medido en
 * `primeng-table.mjs`, `restoreState`): se volvería a una lista con filas marcadas.
 */
interface ColumnPrefs {
  readonly order: readonly string[];
  readonly visible: readonly string[];
  readonly widths: Readonly<Record<string, string>>;
}

/**
 * Lo guardado, contrastado con las columnas de hoy: fuera las que ya no existen, las nuevas al final (visibles
 * según su `defaultVisible`) y las fijas (`locked`) en su sitio y siempre visibles. Lee también el formato del
 * selector anterior (`sc-column-selector`: la lista de visibles en su orden), para no perder lo que cada uno tenía.
 */
function normalizePrefs(choices: readonly ColumnDef[], stored: unknown): ColumnPrefs {
  const keys = choices.map((c) => c.key);
  const known = (k: unknown): k is string => typeof k === 'string' && keys.includes(k);
  const raw = (stored ?? {}) as Partial<Record<keyof ColumnPrefs, unknown>>;
  const legacy = Array.isArray(stored) ? stored.filter(known) : null;
  const storedOrder = legacy ?? (Array.isArray(raw.order) ? raw.order.filter(known) : []);
  const storedVisible = legacy ?? (Array.isArray(raw.visible) ? raw.visible.filter(known) : null);
  const fresh = keys.filter((k) => !storedOrder.includes(k));

  const order = [...storedOrder, ...fresh].filter((k) => !choices.find((c) => c.key === k)?.locked);
  choices.forEach((c, i) => {
    if (c.locked) order.splice(i, 0, c.key);
  });

  const visibleSet = new Set(
    storedVisible
      ? [...storedVisible, ...fresh.filter((k) => choices.find((c) => c.key === k)?.defaultVisible !== false)]
      : choices.filter((c) => c.defaultVisible !== false).map((c) => c.key),
  );
  for (const c of choices) if (c.locked) visibleSet.add(c.key);

  const widths: Record<string, string> = {};
  if (raw.widths && typeof raw.widths === 'object')
    for (const [k, v] of Object.entries(raw.widths as Record<string, unknown>))
      if (known(k) && typeof v === 'string' && /^\d+(\.\d+)?rem$/.test(v)) widths[k] = v;

  return { order, visible: order.filter((k) => visibleSet.has(k)), widths };
}

/**
 * PANTALLA DE LISTA. Es la `sc-list-page` del Supervisor (la que monta la lista de Grupos), reducida a lo que
 * CusCare usa hoy: título, barra (columnas, buscador, acciones), tabla con scroll propio, selección y búsqueda sin
 * resultados. Sin menú de fila, sin importar ni descargar y sin barra de acciones en lote, y con los textos en
 * inglés. Se copia aquí, y no se importa, porque cada app solo resuelve su propio código.
 */
@Component({
  selector: 'app-list-page',
  imports: [
    CdkDrag,
    CdkDropList,
    CheckboxModule,
    FormsModule,
    NgTemplateOutlet,
    OptionsTextFilterComponent,
    PopoverModule,
    SortAltIcon,
    SortAmountDownIcon,
    SortAmountUpAltIcon,
    TableModule,
    ToolbarModule,
    ScButtonComponent,
    ScDatatableComponent,
    ScDatepickerComponent,
    ScInputTextComponent,
    ScMultiSelectComponent,
    ScSelectComponent,
    ScEmptyStateComponent,
    ScIconComponent,
    ScSearchComponent,
  ],
  templateUrl: './list-page.component.html',
  styleUrl: './list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPageComponent<T extends { readonly id: number | string }> implements OnInit {
  /**
   * El toolbar sin su caja: dentro de la sección blanca, un borde más era una caja más. Se hace con los tokens del
   * propio componente (`borderColor`, `padding`), no con CSS sobre PrimeNG. Sin relleno, los controles quedan
   * alineados con el borde de la tabla.
   */
  protected readonly toolbarTokens = { borderColor: 'transparent', padding: '0' };

  readonly heading = input.required<string>();
  readonly rows = input.required<readonly T[]>();
  readonly columns = input.required<readonly ScColumnDef<T>[]>();

  /** Opciones del selector de columnas. `key` = `field` de la columna. */
  readonly columnChoices = input<readonly ColumnDef[] | undefined>(undefined);
  readonly columnStorageKey = input<string | undefined>(undefined);

  /** Con texto, hay buscador; `searchFn` decide si una fila casa con la consulta (ya en minúsculas). */
  readonly searchPlaceholder = input<string | undefined>(undefined);
  readonly searchFn = input<(row: T, query: string) => boolean>(() => true);
  readonly query = model('');

  /** Ancho mínimo de la tabla en rem: por debajo, se desplaza de lado dentro de su caja en vez de cortar texto. */
  readonly tableMinWidth = input<string | undefined>(undefined);
  readonly tableTestId = input<string | undefined>(undefined);

  /** Nombre de la fila para lectores de pantalla («Select ticket 2050617»). */
  readonly rowLabel = input<(row: T) => string>((row) => String(row.id));
  readonly selectedIds = model<ReadonlySet<T['id']>>(new Set());

  /** Con un número, la tabla pagina de a tantas filas y hace scroll solo dentro de la página; sin él, lista virtual. */
  readonly pageSize = input<number | undefined>(undefined);
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50, 100]);
  protected readonly paginated = computed(() => this.pageSize() !== undefined);
  /** Índice de la primera fila de la página en curso. Una búsqueda nueva vuelve a la primera página. */
  protected readonly first = signal(0);

  /** El pie dice qué filas se ven: «1–100 of 3280 results» (0–0 si no hay). */
  protected readonly pageReport = computed(() => {
    const total = this.displayed().length;
    const size = this.pageSize() ?? total;
    const from = total === 0 ? 0 : this.first() + 1;
    return `${from}–${Math.min(this.first() + size, total)} of ${total} results`;
  });

  /** Con `exportable`, el icono de descarga; emite lo que se ve (filas en su orden y columnas visibles). */
  readonly exportable = input(false, { transform: booleanAttribute });
  readonly exportRequest = output<{ readonly rows: readonly T[]; readonly columns: readonly string[] }>();

  /** Filtros por columna (la fila bajo la cabecera) y su tipo. Sin definición para una columna, no hay filtro. */
  readonly filterDefs = input<Readonly<Record<string, FilterDef<T>>>>({});
  /** Las plantillas de los filtros `custom`, por columna. */
  readonly filterTemplates = input<FilterTemplates>({});
  /** Clases propias de una fila (p. ej. apagar las de los tickets que gestiona otro agente). */
  readonly rowClass = input<((row: T) => string | undefined) | undefined>(undefined);
  /** Si una fila se puede marcar. Las que no, no entran en la selección ni en «seleccionar todo». */
  readonly rowSelectable = input<(row: T) => boolean>(() => true);

  protected readonly rowStyleClass = computed<ScRowStyleClassFn<T> | undefined>(() => {
    const own = this.rowClass();
    return own ? (row) => own(row) : undefined;
  });

  /** Orden propio: devuelve el orden ascendente; la dirección la pone la lista. Sin él, compara `row[field]`. */
  readonly sortFn = input<((a: T, b: T, field: string) => number) | undefined>(undefined);

  protected readonly filters = signal<Readonly<Record<string, unknown>>>({});

  protected readonly activeFilterFields = computed(() => {
    const defs = this.filterDefs();
    const values = this.filters();
    return Object.keys(defs).filter((field) => filterIsActive(defs[field]!, values[field]));
  });
  protected readonly hasFilters = computed(() => this.activeFilterFields().length > 0);

  /**
   * Al abrir un desplegable con buscador (select o multiselect), el foco va al buscador, como en el resto de filtros de la
   * fila. Los componentes del DS no lo hacen por sí solos ni reenvían la opción de PrimeNG, así que se espera a que el
   * panel exista y se enfoca su buscador.
   */
  protected focusFilterSearch(): void {
    setTimeout(() => {
      document
        .querySelector<HTMLInputElement>('.p-select-overlay .p-select-filter, .p-multiselect-overlay .p-multiselect-filter')
        ?.focus();
    }, 150);
  }

  protected setFilter(field: string, value: unknown): void {
    this.filters.update((current) => ({ ...current, [field]: value }));
  }

  protected clearFilters(): void {
    this.filters.set({});
  }

  /** Lo que se le da a la plantilla de un filtro `custom`. */
  protected filterContext(field: string): FilterContext {
    return { field, value: this.filters()[field], set: (value) => this.setFilter(field, value) };
  }

  /** El valor que emitió cada filtro; la plantilla lo pasa con `$any` porque cada componente tipa su `value`. */
  protected filterValue(field: string): unknown {
    return this.filters()[field];
  }

  private readonly sortState = signal<{ readonly field: string; readonly order: 1 | -1 } | null>(null);

  /** Sin orden → ascendente → descendente → sin orden, como en producción. */
  protected toggleSort(field: string): void {
    const current = this.sortState();
    if (current?.field !== field) this.sortState.set({ field, order: 1 });
    else this.sortState.set(current.order === 1 ? { field, order: -1 } : null);
  }

  /** Qué icono pinta la cabecera, los tres de `p-sortIcon`: sin orden, ascendente o descendente. */
  protected sortOf(field: string): 'none' | 'asc' | 'desc' {
    const state = this.sortState();
    if (state?.field !== field) return 'none';
    return state.order === 1 ? 'asc' : 'desc';
  }

  protected ariaSort(field: string): 'ascending' | 'descending' | 'none' {
    const state = this.sortState();
    if (state?.field !== field) return 'none';
    return state.order === 1 ? 'ascending' : 'descending';
  }

  protected readonly displayed = computed<T[]>(() => {
    const defs = this.filterDefs();
    const values = this.filters();
    const active = this.activeFilterFields();
    const q = this.query().toLowerCase().trim();
    const matches = this.searchFn();
    /* COPIA a propósito: ni los datos de la pantalla ni el array de entrada se ordenan en el sitio. */
    let list = [...this.rows()].filter(
      (row) =>
        active.every((field) => filterMatches(defs[field]!, field, row, values[field])) && (!q || matches(row, q)),
    );
    const state = this.sortState();
    if (state) {
      const own = this.sortFn();
      const compare =
        own ??
        ((a: T, b: T, field: string) =>
          String((a as Record<string, unknown>)[field] ?? '').localeCompare(
            String((b as Record<string, unknown>)[field] ?? ''),
            undefined,
            { numeric: true },
          ));
      list = list.sort((a, b) => compare(a, b, state.field) * state.order);
    }
    return list;
  });

  /** Las columnas que se ven, en su orden: la cabecera y la fila de filtros las recorren. */
  protected readonly headerColumns = computed<readonly ScColumnDef<T>[]>(() => {
    const visible = this.visibleColumns();
    const all = this.allColumns();
    if (!visible) return all;
    return visible.map((field) => all.find((c) => c.field === field)).filter((c): c is ScColumnDef<T> => !!c);
  });

  protected readonly hasFilterRow = computed(() => Object.keys(this.filterDefs()).length > 0);

  protected readonly hasLeftFrozen = computed(() => this.headerColumns().some((c) => c.frozen && c.alignFrozen !== 'right'));

  /* ── «Seleccionar todo»: las filas de la página, no las 3280 que no se ven ── */
  private readonly pageRows = computed<readonly T[]>(() => {
    const size = this.pageSize();
    return size === undefined ? this.displayed() : this.displayed().slice(this.first(), this.first() + size);
  });
  protected readonly allOnPage = computed(() => {
    const ids = this.selectedIds();
    const rows = this.pageRows();
    const marcables = rows.filter((row) => this.rowSelectable()(row));
    return marcables.length > 0 && marcables.every((row) => ids.has(row.id));
  });
  protected readonly someOnPage = computed(() => !this.allOnPage() && this.pageRows().some((row) => this.selectedIds().has(row.id)));

  protected toggleAllOnPage(checked: boolean): void {
    const next = new Set(this.selectedIds());
    for (const row of this.pageRows().filter((r) => this.rowSelectable()(r))) {
      if (checked) next.add(row.id);
      else next.delete(row.id);
    }
    this.selectedIds.set(next);
  }

  protected readonly allColumns = computed<readonly ScColumnDef<T>[]>(() => {
    const prefs = this.columnPrefs();
    const locked = new Set((this.columnChoices() ?? []).filter((c) => c.locked).map((c) => c.key));
    /* Los anchos arrastrados mandan sobre los medidos; las columnas fijas no se arrastran a otro sitio. */
    return this.columns().map((c) => ({
      ...c,
      width: prefs?.widths[c.field] ?? c.width,
      reorderable: !locked.has(c.field),
    }));
  });

  /** Lo leído de `localStorage` al abrir (`undefined` hasta entonces); `columnPrefs` lo contrasta con las columnas. */
  private readonly storedPrefs = signal<unknown>(undefined);

  protected readonly columnPrefs = computed<ColumnPrefs | null>(() => {
    const choices = this.columnChoices();
    return choices ? normalizePrefs(choices, this.storedPrefs()) : null;
  });

  /** Las opciones del selector, en el orden de la tabla: la etiqueta, y fija la que no se puede quitar. */
  protected readonly columnOptions = computed(() => {
    const choices = this.columnChoices() ?? [];
    return (this.columnPrefs()?.order ?? []).map((key) => {
      const c = choices.find((x) => x.key === key)!;
      return { key, label: c.label, locked: !!c.locked };
    });
  });

  constructor() {
    effect(() => {
      this.query();
      this.filters();
      this.first.set(0);
    });
  }

  ngOnInit(): void {
    const key = this.columnStorageKey();
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) this.storedPrefs.set(JSON.parse(raw));
    } catch {
      /* Sin almacenamiento (ventana privada, bloqueado): la lista sale con sus columnas por defecto. */
    }
  }

  protected readonly columnsAriaLabel = computed(
    () => `Columns (${this.columnPrefs()?.visible.length ?? 0} of ${this.columnChoices()?.length ?? 0} visible)`,
  );

  private savePrefs(next: ColumnPrefs): void {
    this.storedPrefs.set(next);
    const key = this.columnStorageKey();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* Sin almacenamiento: el cambio vale mientras dure la página. */
    }
  }

  /* Una columna oculta no ocupa sitio: sin descontarla, esconder Email en Agentes dejaba 268 px de scroll lateral
   * (rama `comparar/fichas`, 2026-09-16). Hace falta desde que Agentes tiene columnas opcionales (2026-09-24). */
  protected readonly effectiveTableMinWidth = computed<string | undefined>(() => {
    const min = this.tableMinWidth();
    const visible = this.visibleColumns();
    if (!min?.endsWith('rem') || !visible) return min;
    const hidden = this.columns()
      .filter((c) => !visible.includes(c.field) && c.width?.endsWith('rem'))
      .reduce((sum, c) => sum + parseFloat(c.width!), 0);
    return `${parseFloat(min) - hidden}rem`;
  });

  protected readonly visibleColumns = computed<readonly string[] | undefined>(() => {
    const prefs = this.columnPrefs();
    if (!prefs) return undefined;
    return prefs.visible;
  });

  /** El globo: qué columnas se ven. El orden no lo toca (se ordena arrastrando en el mismo globo). */
  protected onVisibleChange(keys: readonly unknown[]): void {
    const prefs = this.columnPrefs();
    if (!prefs) return;
    const chosen = new Set(keys.filter((k): k is string => typeof k === 'string'));
    for (const c of this.columnChoices() ?? []) if (c.locked) chosen.add(c.key);
    this.savePrefs({ ...prefs, visible: prefs.order.filter((k) => chosen.has(k)) });
  }

  /** El globo de columnas, abierto: su botón lo dice (`aria-expanded`). */
  protected readonly columnsOpen = signal(false);

  private readonly document = inject(DOCUMENT);
  /** El icono de columnas: al cerrar el globo con el foco dentro, vuelve aquí. */
  private readonly columnsButton = viewChild('columnsButton', { read: ElementRef });
  /** Del título del globo cuelgan su nombre y los ids de sus casillas. */
  protected readonly columnsTitleId = `columnas-${Math.random().toString(36).slice(2, 8)}`;

  /** El ancho del globo: el paso del Kit más cercano a los 18rem del ejemplo (`w-72`). */
  protected readonly columnsPopoverStyle = { width: 'var(--sc-spacing-18)' };

  /** El contenido del globo sin relleno, como el ejemplo (`[pt]="{ content: 'p-0!' }"`): lo ponen su cabecera y su lista. */
  protected readonly columnsPopoverPt = { content: { style: { padding: '0' } } };

  /**
   * La columna en curso: la última enfocada (o pulsada) en la lista, la que mueven «Subir» y «Bajar» y la que lleva el
   * foco al volver a la lista. Ordenar sin arrastrar (WCAG 2.1.1 y 2.5.7, DD-162).
   */
  protected readonly currentColumn = signal<string | null>(null);

  /** Las columnas que se pueden enfocar: las que no son fijas (la fija va con su casilla apagada). */
  private readonly movableColumns = computed(() => this.columnOptions().filter((o) => !o.locked));

  /** La lista es una sola parada del tabulador: solo la columna en curso (o la primera movible) lleva `tabindex` 0. */
  protected columnTabindex(key: string): number {
    const active = this.currentColumn() ?? this.movableColumns()[0]?.key;
    return key === active ? 0 : -1;
  }

  protected columnInputId(key: string): string {
    return `${this.columnsTitleId}-${key}`;
  }

  /** Las flechas van de una columna a otra (y Inicio y Fin, a la primera y la última); Espacio la marca, el nativo. */
  protected onColumnsKeydown(event: KeyboardEvent): void {
    const keys = this.movableColumns().map((o) => o.key);
    if (!keys.length) return;
    const from = Math.max(0, keys.indexOf(this.currentColumn() ?? keys[0]!));
    const to =
      event.key === 'ArrowDown' ? Math.min(keys.length - 1, from + 1)
      : event.key === 'ArrowUp' ? Math.max(0, from - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? keys.length - 1
      : -1;
    if (to < 0) return;
    event.preventDefault();
    this.focusColumn(keys[to]!);
  }

  /** Pulsar una fila (fuera de su casilla) la deja en curso, para «Subir» y «Bajar» con el ratón. */
  protected onColumnRowClick(key: string): void {
    if (!this.columnOptions().find((o) => o.key === key)?.locked) this.currentColumn.set(key);
  }

  private focusColumn(key: string): void {
    this.currentColumn.set(key);
    this.document.getElementById(this.columnInputId(key))?.focus();
  }

  /**
   * Al abrir, el foco entra en la lista, en la columna en curso: el globo cuelga de `<body>` y, sin esto, con el teclado
   * no se llegaba (medido el 2026-10-05, DD-162). Se enfoca aquí y no con `focusOnShow`, que iría a «Restablecer».
   */
  protected onColumnsShow(): void {
    this.columnsOpen.set(true);
    const key = this.currentColumn() ?? this.movableColumns()[0]?.key;
    if (key) setTimeout(() => this.focusColumn(key));
  }

  /** «Restablecer»: el orden y las columnas de partida, como el `reset()` del ejemplo. Los anchos arrastrados se quedan. */
  protected resetColumns(): void {
    const prefs = this.columnPrefs();
    const choices = this.columnChoices();
    if (!prefs || !choices) return;
    this.savePrefs({ ...normalizePrefs(choices, undefined), widths: prefs.widths });
  }

  /** El globo se ha cerrado. Con el foco dentro (Escape, o el botón que lo tenía), el foco vuelve al icono; si se cerró
   *  pulsando fuera, el foco es de lo pulsado y no se toca. */
  protected onColumnsHide(): void {
    this.columnsOpen.set(false);
    const active = this.document.activeElement;
    if (!active || active === this.document.body) {
      (this.columnsButton()?.nativeElement as HTMLElement | undefined)?.querySelector('button')?.focus();
    }
  }

  /**
   * Se ha soltado una fila en el globo (DD-176, `cdkDropList` como el ejemplo). Las visibles se quedan las mismas; el orden es el de la lista. Las
   * fijas vuelven a su sitio aunque se suelten encima (`normalizePrefs`).
   */
  protected onColumnDrop(event: Pick<CdkDragDrop<unknown>, 'previousIndex' | 'currentIndex'>): void {
    this.reorderColumns(event.previousIndex, event.currentIndex);
  }

  /** Mueve una columna de un puesto a otro de la lista, arrastrando o con «Subir» y «Bajar». Las visibles son las mismas. */
  private reorderColumns(from: number, to: number): void {
    const prefs = this.columnPrefs();
    const choices = this.columnChoices();
    if (!prefs || !choices || from === to) return;
    const order = [...prefs.order];
    moveItemInArray(order, from, to);
    const visible = order.filter((k) => prefs.visible.includes(k));
    this.savePrefs(normalizePrefs(choices, { order, visible, widths: prefs.widths }));
  }

  /* ── Selección: la fuente de verdad son los ids ── */
  protected readonly selectedRows = computed<readonly T[]>(() => {
    const ids = this.selectedIds();
    return this.displayed().filter((row) => ids.has(row.id));
  });

  protected onSelectionChange(selection: T | readonly T[] | null): void {
    const rows = Array.isArray(selection) ? selection : selection ? [selection as T] : [];
    this.selectedIds.set(new Set(rows.filter((row) => this.rowSelectable()(row)).map((row) => row.id)));
  }

  protected onExport(): void {
    this.exportRequest.emit({
      rows: this.displayed(),
      columns: this.visibleColumns() ?? this.columns().map((c) => c.field),
    });
  }

  protected readonly rowAriaLabel = (row: T): string => `Select ${this.rowLabel()(row)}`;

  /** Escape borra lo tecleado; con el buscador vacío no hace nada. */
  protected onSearchKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.query()) {
      event.stopPropagation();
      this.query.set('');
    }
  }
}
