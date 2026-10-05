import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  model,
  type OnInit,
  output,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { FormsModule } from '@angular/forms';
import { moveItemInArray, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { Listbox, ListboxModule } from 'primeng/listbox';
import type { ListBoxPassThrough } from 'primeng/types/listbox';
import { PopoverModule } from 'primeng/popover';

import {
  type BulkActionEntityLabels,
  ScBulkActionBarComponent,
  ScButtonComponent,
  type ColumnDef,
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
 *     (`columnChoices` + `columnStorageKey`) y si exporta (`exportable` → `(exportRequest)` con las filas en
 *     el orden visible);
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
    FormsModule,
    ListboxModule,
    MenuModule,
    PopoverModule,
    ScBulkActionBarComponent,
    ScButtonComponent,
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
export class ListPageComponent<T extends { readonly id: number | string }> implements OnInit {
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
   * puntos suspensivos (DD-102: una lista nunca corta texto). Sin él, la tabla se ajusta al
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

  /* Con orden propio, la tabla solo PINTA el indicador: el gesto lo resuelve p-table y la lista lo espeja.
   * Que no reordene encima lo dice `externalSort` en la plantilla: sin él, p-table volvía a ordenar por el
   * valor crudo del campo y la prioridad salía alfabética (medido en Grupos, 2026-09-26). */
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
    const prefs = this.columnPrefs();
    const locked = new Set((this.columnChoices() ?? []).filter((c) => c.locked).map((c) => c.key));
    /* Los anchos arrastrados mandan sobre los medidos; las columnas fijas no se arrastran a otro sitio. */
    const cols = this.columns().map((c) => ({
      ...c,
      width: prefs?.widths[c.field] ?? c.width,
      reorderable: !locked.has(c.field),
    }));
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
        reorderable: false,
        frozen: true,
        alignFrozen: 'right',
        cellTemplate: this.actionsTpl(),
      },
    ];
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

  protected readonly columnsAriaLabel = computed(() => {
    this.lang();
    return this.translate.instant('common.columns_visible', {
      visible: this.columnPrefs()?.visible.length ?? 0,
      total: this.columnChoices()?.length ?? 0,
    });
  });

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
    return this.rowMenu() ? [...prefs.visible, ACTIONS_FIELD] : prefs.visible;
  });

  /** El globo: qué columnas se ven. El orden no lo toca (se ordena arrastrando en el mismo globo). */
  protected onVisibleChange(keys: readonly unknown[]): void {
    const prefs = this.columnPrefs();
    if (!prefs) return;
    const chosen = new Set(keys.filter((k): k is string => typeof k === 'string'));
    for (const c of this.columnChoices() ?? []) if (c.locked) chosen.add(c.key);
    this.savePrefs({ ...prefs, visible: prefs.order.filter((k) => chosen.has(k)) });
  }

  /** La lista del globo, sin su borde ni su sombra: la caja ya la pone el globo (`dt` de la instancia). */
  protected readonly columnsListDt = { root: { borderColor: 'transparent', shadow: 'none' } };

  /** El globo de columnas, abierto: su botón lo dice (`aria-expanded`). */
  protected readonly columnsOpen = signal(false);

  private readonly document = inject(DOCUMENT);
  /** El icono de columnas: al cerrar el globo con el foco dentro, vuelve aquí. */
  private readonly columnsButton = viewChild('columnsButton', { read: ElementRef });
  /** La lista del globo: su foco nativo dice qué columna mueven «Subir» y «Bajar». */
  private readonly columnsList = viewChild(Listbox);

  /**
   * Al abrir el globo, el foco entra en la lista: `p-popover` enfoca lo que lleve `autofocus` (`focusOnShow`), y aquí lo
   * lleva el `<ul role="listbox">`. Sin él, con el teclado no se llegaba: el globo cuelga de `<body>` y Tab seguía por la
   * página (medido el 2026-10-05, DD-162).
   */
  protected readonly columnsListPt: ListBoxPassThrough = { list: { autofocus: true } };

  /**
   * La última columna enfocada en la lista, la que mueven «Subir» y «Bajar»: ordenar sin arrastrar (WCAG 2.1.1 y 2.5.7).
   * El Listbox olvida su foco al salir de él (lo pone a -1), y los botones están fuera, así que se recuerda aquí. El
   * teclado de la lista es el nativo: las flechas enfocan sin elegir.
   */
  protected readonly currentColumn = signal<string | null>(null);
  private readonly followListFocus = effect(() => {
    const index = this.columnsList()?.focusedOptionIndex() ?? -1;
    const key = index >= 0 ? this.columnOptions()[index]?.key : undefined;
    if (key) this.currentColumn.set(key);
  });

  /**
   * La opción enfocada se anuncia: `aria-activedescendant` en la lista. PrimeNG 22.1 lo calcula con
   * `computed(() => this.focused ? this.focusedOptionId() : undefined)`, y `focused` no es una señal: el primer cálculo,
   * sin foco, no lee `focusedOptionId()` y el atributo se queda vacío para siempre. Medido el 2026-10-05: las flechas
   * movían el foco y el lector no oía nada. Se escribe aquí, desde su señal; la plantilla de PrimeNG no lo vuelve a tocar.
   */
  private readonly announceFocusedOption = effect(() => {
    const list = this.columnsList();
    const id = list?.focusedOptionId() ?? null;
    const ul = (list?.el.nativeElement as HTMLElement | undefined)?.querySelector('[role="listbox"]');
    if (!ul) return;
    if (id) ul.setAttribute('aria-activedescendant', id);
    else ul.removeAttribute('aria-activedescendant');
  });

  /** Si la columna en curso sube o baja: sin salir de la lista ni pasar por encima de una fija. `null` si es fija o no hay. */
  protected readonly columnMove = computed(() => {
    const options = this.columnOptions();
    const index = options.findIndex((o) => o.key === this.currentColumn());
    const current = options[index];
    if (!current || current.locked) return null;
    return {
      label: current.label,
      up: index > 0 && !options[index - 1]!.locked,
      down: index < options.length - 1 && !options[index + 1]!.locked,
    };
  });

  /** Lo que dice el lector tras mover: la columna y su puesto («Email, 3 de 10»). */
  protected readonly columnsAnnouncement = signal('');

  protected moveColumn(delta: -1 | 1): void {
    const options = this.columnOptions();
    const from = options.findIndex((o) => o.key === this.currentColumn());
    const move = this.columnMove();
    if (from < 0 || !move || !(delta < 0 ? move.up : move.down)) return;
    this.reorderColumns(from, from + delta);
    this.columnsAnnouncement.set(
      this.translate.instant('common.columns_position', { column: move.label, position: from + delta + 1, total: options.length }),
    );
  }

  /**
   * Tab desde la lista: PrimeNG la rodea de dos elementos invisibles que llevan el foco a su buscador, y sin buscador el
   * de detrás no tiene a dónde llevarlo; el foco se queda en él, sin verse (medido el 2026-10-05). Si se queda ahí, sigue
   * al primer botón de mover. Las flechas, Espacio e Inicio/Fin de la lista son los nativos.
   */
  protected onColumnsListFocusIn(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;
    const invisible = event.target as HTMLElement;
    const fromList = host.contains(event.relatedTarget as Node | null);
    if (invisible !== host.lastElementChild || !fromList) return;
    setTimeout(() => {
      if (this.document.activeElement !== invisible) return;
      host.parentElement?.querySelector<HTMLButtonElement>('.page__columns-move button:not(:disabled)')?.focus();
    });
  }

  /** El globo se ha cerrado. Con el foco dentro (Escape, o el botón que lo tenía), el foco vuelve al icono; si se cerró
   *  pulsando fuera, el foco es de lo pulsado y no se toca. */
  protected onColumnsHide(): void {
    this.columnsOpen.set(false);
    this.columnsAnnouncement.set('');
    const active = this.document.activeElement;
    if (!active || active === this.document.body) {
      (this.columnsButton()?.nativeElement as HTMLElement | undefined)?.querySelector('button')?.focus();
    }
  }

  /**
   * Las opciones del globo, en una copia propia: el Listbox nativo reordena la suya al soltar, y aquí se guarda el
   * orden nuevo en las preferencias, de donde vuelve a salir esta copia.
   */
  protected readonly columnOrderDraft = computed(() => [...this.columnOptions()]);

  /**
   * Se ha soltado una columna en el globo (DD-162). Las visibles se quedan las mismas; el orden es el de la lista. Las
   * fijas vuelven a su sitio aunque se suelten encima (`normalizePrefs`).
   */
  protected onColumnDrop(event: CdkDragDrop<string[]>): void {
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

  /** Se ha soltado el borde de una columna: se recuerdan, en rem, los anchos de las que ya tenían uno medido. */
  protected onColumnWidthsChange(widthsPx: Readonly<Record<string, number>>): void {
    const prefs = this.columnPrefs();
    if (!prefs) return;
    const base = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const measured = new Set(this.columns().filter((c) => c.width).map((c) => c.field));
    const widths: Record<string, string> = { ...prefs.widths };
    for (const [field, px] of Object.entries(widthsPx))
      if (measured.has(field) && px > 0) widths[field] = `${+(px / base).toFixed(3)}rem`;
    this.savePrefs({ ...prefs, widths });
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

  protected onExport(): void {
    this.exportRequest.emit(this.displayed());
  }
}
