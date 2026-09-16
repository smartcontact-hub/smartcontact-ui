import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

import {
  type BulkActionEntityLabels,
  ScBulkActionBarComponent,
  ScButtonComponent,
  type ColumnDef,
  ScColumnSelectorComponent,
  type ScColumnCellContext,
  type ScColumnDef,
  ScDatatableComponent,
  ScDividerComponent,
  ScEmptyStateComponent,
  type ScDatatableRowEvent,
  type ScDatatableRowKeyEvent,
  type ScDatatableSortEvent,
  type ScRowStyleClassFn,
  ScSearchComponent,
} from '@smartcontact-hub/components';
import { injectLangChange } from '@core/utils/lang-change';

/** Id de columna reservado para la del menú de fila; ninguna pantalla puede usarlo. */
const ACTIONS_FIELD = '__actions';

/**
 * PANTALLA DE LISTA (`<sc-list-page>`, DD-97, 2026-09-14).
 *
 * Una lista de administración es siempre lo mismo: título, barra (selector de columnas, buscador,
 * exportar), tabla con scroll propio, selección con barra de acciones en lote, y menú de fila que se
 * abre con «⋮» o con clic derecho. Hasta hoy cada pantalla lo montaba entero (seis copias casi
 * iguales, 300-800 líneas cada una) y un cambio de comportamiento había que repetirlo en todas. La montan
 * Usuarios, Agentes, Grupos, Etiquetas, Plantillas, los nueve repositorios, Reglas y Categorías.
 *
 * Aquí vive lo común. La pantalla pone solo lo suyo:
 *   - los datos (`rows`, ya en el orden por defecto) y las columnas con sus celdas (`columns`, con
 *     `cellTemplate`); `sortFn` si ordena por algo que no es un campo tal cual;
 *   - si busca (`searchPlaceholder` + `searchFn`, y `[(query)]` si necesita lo tecleado), si elige columnas
 *     (`columnChoices` + `columnStorageKey`) y si exporta (`exportable` → `(exportRequest)` con las filas
 *     SELECCIONADAS en el orden visible; sin selección el botón se apaga);
 *   - el menú de cada fila (`rowMenu`), qué pasa al abrir una (`rowOpenable` → `(rowOpen)`) y sus clases
 *     propias (`rowClass`);
 *   - la selección (`selectable`, `[(selectedIds)]`, `bulkEntity`) y sus acciones en lote
 *     (`[scListBulkActions]`);
 *   - el vacío (`[scListEmpty]`, y `empty` si lo decide sobre algo más que las filas), la búsqueda sin
 *     resultados (`noResultsKey` o `[scListNoResults]`) y lo que vaya entre el título y la barra
 *     (`[scListBeforeToolbar]`: pestañas, avisos).
 * Los diálogos (borrar, edición en lote), los paneles y las acciones de verdad siguen en la pantalla.
 */
@Component({
  selector: 'sc-list-page',
  imports: [
    MenuModule,
    ScBulkActionBarComponent,
    ScButtonComponent,
    ScColumnSelectorComponent,
    ScDatatableComponent,
    ScDividerComponent,
    ScEmptyStateComponent,
    ScSearchComponent,
    TranslateModule,
  ],
  templateUrl: './list-page.component.html',
  styleUrl: './list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPageComponent<T extends { readonly id: number | string }> {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  readonly heading = input.required<string>();
  readonly rows = input.required<readonly T[]>();
  /**
   * Si no hay NADA que listar (se pinta `[scListEmpty]` en vez de la tabla). Por defecto, sin filas. Una pantalla
   * que parte sus datos (p. ej. por pestañas) lo decide sobre el total: una pestaña vacía es una búsqueda sin
   * resultados, no una pantalla vacía.
   */
  readonly empty = input<boolean | undefined>(undefined);
  protected readonly isEmpty = computed(() => this.empty() ?? this.rows().length === 0);
  readonly columns = input.required<readonly ScColumnDef<T>[]>();

  /** Opciones del selector de columnas (sin él, no hay selector). `key` = `field` de la columna. */
  readonly columnChoices = input<readonly ColumnDef[] | undefined>(undefined);
  readonly columnStorageKey = input<string | undefined>(undefined);

  /** Con texto, hay buscador; `searchFn` decide si una fila casa con la consulta (ya en minúsculas). */
  readonly searchPlaceholder = input<string | undefined>(undefined);
  readonly searchFn = input<(row: T, query: string) => boolean>(() => true);
  /**
   * Clave i18n del cuerpo del vacío cuando la búsqueda no deja ninguna fila. Recibe `{{query}}` (lo tecleado) y
   * lo que pase `noResultsParams`. Una pantalla con dos casos distintos proyecta `[scListNoResults]`.
   */
  readonly noResultsKey = input('');
  readonly noResultsParams = input<Record<string, unknown>>({});
  protected readonly noResultsParamsWithQuery = computed(() => ({ ...this.noResultsParams(), query: this.query() }));
  /** Lo tecleado en el buscador. Enlázalo (`[(query)]`) solo si la pantalla lo necesita, p. ej. para citarlo en el vacío. */
  readonly query = model('');

  /**
   * Orden propio. Sin él ordena la tabla (`row[field]`). Con él ordena la lista con la regla de la pantalla,
   * para criterios que no son un campo tal cual: un contador derivado, un nombre con acentos en español.
   * Devuelve el orden ascendente; la dirección la pone la lista.
   */
  readonly sortFn = input<((a: T, b: T, field: string) => number) | undefined>(undefined);

  readonly exportable = input(false, { transform: booleanAttribute });

  /** Menú de una fila: el mismo con «⋮» y con clic derecho. Sin él, no hay columna de acciones. */
  readonly rowMenu = input<((row: T) => MenuItem[]) | undefined>(undefined);

  /** Si la fila se abre con clic y con Enter (puede depender de la fila: p. ej. mientras se renombra). */
  readonly rowOpenable = input<boolean | ((row: T) => boolean), boolean | '' | ((row: T) => boolean)>(false, {
    transform: (value) => (value === '' ? true : value),
  });
  /** Clases propias de una fila (p. ej. atenuar las inactivas); se suman a las de la lista. */
  readonly rowClass = input<((row: T) => string | undefined) | undefined>(undefined);

  readonly selectable = input(false, { transform: booleanAttribute });
  readonly bulkEntity = input<BulkActionEntityLabels | undefined>(undefined);
  /** Nombre de la fila para lectores de pantalla («Seleccionar Ana López»). */
  readonly rowLabel = input<(row: T) => string>((row) => String((row as { name?: unknown }).name ?? row.id));
  readonly selectedIds = model<ReadonlySet<T['id']>>(new Set());

  readonly tableTestId = input<string | undefined>(undefined);
  /**
   * Ancho mínimo de la tabla (p. ej. `'65rem'`), la suma de lo que mide el dato de cada columna.
   * Por debajo, la tabla se desplaza de lado DENTRO de su caja en vez de recortar texto con
   * puntos suspensivos (2026-09-14, Rafa: «que nunca corte»). Sin él, la tabla se ajusta al
   * ancho disponible como hasta ahora. Cuenta TODAS las columnas con `width` en rem: las que están
   * ocultas en el selector se descuentan solas.
   */
  readonly tableMinWidth = input<string | undefined>(undefined);

  readonly rowOpen = output<T>();
  readonly exportRequest = output<readonly T[]>();

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const rows = this.rows();
    if (!q) return rows;
    const matches = this.searchFn();
    return rows.filter((row) => matches(row, q));
  });

  private readonly sortState = signal<{ readonly field: string; readonly order: 1 | -1 } | null>(null);

  /* COPIA a propósito: p-table ordena en el sitio el array que recibe, y sin copia ordenaría los datos de
   * la pantalla. Es la misma copia que ve la persona, así que exportar sale en el orden visible. */
  protected readonly displayed = computed<T[]>(() => {
    const list = [...this.filtered()];
    const compare = this.sortFn();
    const state = this.sortState();
    if (compare && state) list.sort((a, b) => compare(a, b, state.field) * state.order);
    return list;
  });

  /* Con orden propio, la tabla solo PINTA el indicador: el gesto lo resuelve p-table y la lista lo espeja. */
  protected readonly tableSortField = computed(() => (this.sortFn() ? this.sortState()?.field : undefined));
  protected readonly tableSortOrder = computed(() => this.sortState()?.order ?? 1);

  /* Solo si CAMBIA: p-table vuelve a emitir el orden cada vez que recibe filas nuevas, y `displayed` da filas
   * nuevas en cada cambio de estado. Guardar el mismo orden como objeto nuevo era un bucle que colgaba la
   * pestaña al primer clic en una cabecera (medido en Agentes y Grupos). */
  protected onSortChange(event: ScDatatableSortEvent): void {
    if (!this.sortFn()) return;
    const order = event.order === -1 ? -1 : 1;
    const current = this.sortState();
    if (current && current.field === event.field && current.order === order) return;
    this.sortState.set(event.field ? { field: event.field, order } : null);
  }

  private readonly actionsTpl = viewChild<TemplateRef<ScColumnCellContext<T>>>('actionsTpl');

  protected readonly allColumns = computed<readonly ScColumnDef<T>[]>(() => {
    const cols = this.columns();
    if (!this.rowMenu()) return cols;
    this.lang(); // el nombre accesible de la columna de acciones, al día al cambiar de idioma
    return [
      ...cols,
      {
        field: ACTIONS_FIELD,
        stopRowClick: true,
        header: '',
        headerAriaLabel: this.translate.instant('common.actions'),
        /* Relleno de celda + botón de 28 + relleno: el «⋮» queda centrado. Con `3` (42) tocaba el borde derecho. */
        width: 'var(--sc-spacing-4)',
        align: 'right',
        cellTemplate: this.actionsTpl(),
      },
    ];
  });

  /** Columnas elegidas en el selector, en su orden; vacío hasta que el selector hidrata. */
  private readonly chosenColumns = signal<readonly string[]>([]);

  /* Una columna oculta no ocupa sitio: sin descontarla, esconder Email en Agentes dejaba 268 px de scroll lateral. */
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
    const choices = this.columnChoices();
    if (!choices) return undefined;
    const chosen = this.chosenColumns();
    const base = chosen.length > 0 ? chosen : choices.filter((c) => c.defaultVisible !== false).map((c) => c.key);
    return this.rowMenu() ? [...base, ACTIONS_FIELD] : base;
  });

  protected onColumnsChange(ordered: readonly string[]): void {
    this.chosenColumns.set(ordered);
  }

  private isOpenable(row: T): boolean {
    const openable = this.rowOpenable();
    return typeof openable === 'function' ? openable(row) : openable;
  }

  /** Solo las filas que se abren entran en el orden de tabulación: una fila que no hace nada con Enter no debe recibir foco. */
  protected readonly rowsFocusable = computed(() => this.rowOpenable() !== false);

  /* `computed` que DEVUELVE la función: la tabla repinta las clases cuando cambia su identidad, y así cambia al
   * cambiar `rowOpenable` o `rowClass` (p. ej. al empezar a renombrar una fila). */
  protected readonly rowStyleClass = computed<ScRowStyleClassFn<T>>(() => {
    const openable = this.rowOpenable();
    const own = this.rowClass();
    return (row) => {
      const clickable = (typeof openable === 'function' ? openable(row) : openable) ? 'sc-row--clickable' : '';
      return [clickable, own?.(row) ?? ''].filter(Boolean).join(' ') || undefined;
    };
  });

  protected onRowClick(event: ScDatatableRowEvent<T>): void {
    if (this.isOpenable(event.row)) this.rowOpen.emit(event.row);
  }

  /* WCAG 2.1.1: si la fila se abre con el ratón, se abre con el teclado. Enter abre; Espacio se queda para
   * la casilla. Solo con el foco en la FILA: un control de dentro (enlace del nombre, menú de estado, «⋮») ya
   * tiene su acción, y su Enter sube hasta el `<tr>`. */
  protected onRowKeydown(event: ScDatatableRowKeyEvent<T>): void {
    const native = event.originalEvent;
    if (native.key !== 'Enter' || (native.target as HTMLElement | null)?.tagName !== 'TR') return;
    if (!this.isOpenable(event.row)) return;
    event.originalEvent.preventDefault();
    this.rowOpen.emit(event.row);
  }

  /* ── Menú de fila: UNO para toda la tabla, el mismo con «⋮» y con clic derecho ─────────────── */
  private readonly menuTarget = signal<T | null>(null);

  /** Estable: solo cambia al apuntar a otra fila (recrearlo en cada ciclo perdía el primer clic). */
  protected readonly menuItems = computed<MenuItem[]>(() => {
    const row = this.menuTarget();
    const build = this.rowMenu();
    return row && build ? build(row) : [];
  });

  protected openRowMenu(row: T, menu: { toggle: (event: Event) => void }, event: Event): void {
    event.stopPropagation();
    this.menuTarget.set(row);
    menu.toggle(event);
  }

  protected onRowContextMenu(event: ScDatatableRowEvent<T>, menu: { toggle: (event: Event) => void }): void {
    if (!this.rowMenu()) return;
    this.menuTarget.set(event.row);
    menu.toggle(event.originalEvent);
  }

  /* ── Selección: la fuente de verdad son los ids (de ellos cuelgan la barra en lote y los diálogos) ── */
  protected readonly selectedRows = computed<readonly T[]>(() => {
    const ids = this.selectedIds();
    return this.displayed().filter((row) => ids.has(row.id));
  });

  protected onSelectionChange(selection: T | readonly T[] | null): void {
    const rows = Array.isArray(selection) ? selection : selection ? [selection as T] : [];
    this.selectedIds.set(new Set(rows.map((row) => row.id)));
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  protected readonly rowAriaLabel = (row: T): string =>
    this.translate.instant('common.select_row', { name: this.rowLabel()(row) });
  protected readonly selectAllAriaLabel = computed(() => {
    this.lang();
    return this.translate.instant('common.select_all');
  });

  /* Escape vacía la búsqueda; con la búsqueda vacía, suelta el foco. */
  protected onSearchKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (this.query()) this.query.set('');
    else (event.target as HTMLInputElement).blur();
  }

  /* Exporta SOLO lo seleccionado; sin selección el botón se apaga y su rótulo dice por qué. */
  protected readonly exportLabel = computed(() => {
    this.lang();
    const count = this.selectedRows().length;
    if (count === 0) return this.translate.instant('labels.export_needs_selection');
    return this.translate.instant(count === 1 ? 'labels.export_selected_one' : 'labels.export_selected', { count });
  });

  protected onExport(): void {
    const rows = this.selectedRows();
    if (rows.length > 0) this.exportRequest.emit(rows);
  }
}
