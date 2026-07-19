import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import type { FilterMetadata } from 'primeng/api';
import {
  Table,
  TableModule,
  type TableFilterEvent,
  type TableLazyLoadEvent,
  type TablePageEvent,
} from 'primeng/table';

import {
  ScColumnDef,
  ScDatatableRowEvent,
  ScDatatableRowKeyEvent,
  ScRowStyleClassFn,
} from '../../core/types/datatable.types';
import { ScComponentSize } from '../../core/types/theme-component.types';

/** Mapa de filtros de p-table (por campo + `global`). */
export type ScDatatableFilters = Record<string, FilterMetadata | FilterMetadata[]>;

/** Payload de `sortChange` (orden single client-side). */
export interface ScDatatableSortEvent {
  readonly field: string | undefined;
  readonly order: number;
}

/**
 * Tabla de datos sobre PrimeNG `<p-table>`. El theming lo resuelve el preset
 * `datatable.ts` (ya tokenizado a `--sc-scale-*`); el wrapper aporta solo la
 * superficie de API data-driven (column-defs + template de celda por columna) y
 * la proyección de slots.
 *
 * MVP no-lazy (lote 8-2): `value`/`columns`/`sortable`/`paginator`/`selección`.
 * El orden y la paginación los resuelve p-table client-side; lazy/filter llegan
 * en 8-3 como output `(lazyLoad)`.
 *
 * Slots de proyección:
 *   - `[scTableCaption]` → cabecera de la tabla (toolbar: search, column-selector…).
 *   - `[scTableEmpty]`   → fila sin-datos (envuelve `sc-empty-state`).
 * Celdas custom: `ScColumnDef.cellTemplate` (contexto `{ $implicit: row, rowIndex }`).
 *
 * B4 añade las 4 capacidades que las tablas del supervisor traían a mano y que
 * eran justo lo que impedía migrarlas:
 *   - `[rowStyleClass]`     → clases por fila (seleccionada, clicable, leída…).
 *   - `(rowClick)`          → la fila abre; la casilla de selección no.
 *   - `(rowContextMenu)`    → click derecho, para el `<p-menu>` compartido.
 *   - `[visibleColumns]`    → visibilidad y ORDEN, cableable a `sc-column-selector`.
 */
@Component({
  selector: 'sc-datatable',
  imports: [TableModule, NgClass, NgTemplateOutlet],
  templateUrl: './sc-datatable.component.html',
  styleUrl: './sc-datatable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScDatatableComponent<T = unknown> {
  readonly value = input<readonly T[]>([]);
  readonly columns = input<readonly ScColumnDef<T>[]>([]);
  readonly dataKey = input<string | undefined>(undefined);

  /**
   * Columnas visibles, por `field` y **en orden de pintado**. Es el formato que
   * emite `sc-column-selector` en `(orderedVisibleChange)` (su `key` = nuestro
   * `field`), así que cablear las dos es pasar el array tal cual.
   *
   * Sin informar, se pintan todas las de `columns()` en su orden declarado. Un
   * `field` del array que no exista en `columns()` se ignora.
   */
  readonly visibleColumns = input<readonly string[] | undefined>(undefined);

  readonly paginator = input(false, { transform: booleanAttribute });
  readonly rows = input<number | undefined>(undefined);
  readonly rowsPerPageOptions = input<number[] | undefined>(undefined);

  /** `'single'` (click en la fila) · `'multiple'` (checkboxes) · `null` (sin selección). */
  readonly selectionMode = input<'single' | 'multiple' | null>(null);
  /** Selección two-way: la fila (single) o el array de filas (multiple). */
  readonly selection = model<T | readonly T[] | null>(null);

  /** Orden inicial (client-side; p-table reordena `value`). */
  readonly sortField = input<string | undefined>(undefined);
  readonly sortOrder = input<number>(1);

  readonly size = input<ScComponentSize>('md');
  readonly scrollable = input(false, { transform: booleanAttribute });
  readonly scrollHeight = input<string | undefined>(undefined);
  readonly stripedRows = input(false, { transform: booleanAttribute });
  readonly showGridlines = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Clases extra por fila — el equivalente a los `[class.table__row--x]` que
   * cada tabla del supervisor escribe a mano. Se aplica con `ngClass`, que
   * convive con las clases que p-table pone por su cuenta (`p-highlight` al
   * seleccionar) en vez de pisarlas como haría un `[class]` a pelo.
   */
  readonly rowStyleClass = input<ScRowStyleClassFn<T> | undefined>(undefined);

  /**
   * Hace las filas alcanzables con el tabulador (`tabindex="0"`).
   *
   * Si consumes `(rowClick)`, esto NO es opcional: una fila que abre algo al
   * clicar y no se puede enfocar es un fallo de WCAG 2.1.1 — la acción existe
   * solo para quien usa ratón. Va como input y no automático porque el
   * componente no puede saber si alguien escucha el output, y meter 50 paradas
   * de tabulador en una tabla que no las necesita también es un defecto.
   *
   * Emparéjalo con `(rowKeydown)` para decidir qué hace cada tecla.
   */
  readonly rowsFocusable = input(false, { transform: booleanAttribute });

  /**
   * Modo lazy (server-driven): p-table deja de ordenar/paginar/filtrar en cliente
   * y emite `(lazyLoad)` con los metadatos (page/sort/filter). El consumidor
   * busca los datos y actualiza `value` + `totalRecords`.
   */
  readonly lazy = input(false, { transform: booleanAttribute });
  /** Total de registros del lado servidor (paginador en modo lazy). */
  readonly totalRecords = input<number | undefined>(undefined);
  /** Mapa de filtros (controlado por el consumidor; en lazy viaja en el evento). */
  readonly filters = input<ScDatatableFilters | undefined>(undefined);
  /** Campos sobre los que aplica el filtro `global`. */
  readonly globalFilterFields = input<readonly string[] | undefined>(undefined);

  readonly sortChange = output<ScDatatableSortEvent>();
  readonly page = output<TablePageEvent>();
  readonly lazyLoad = output<TableLazyLoadEvent>();
  readonly filterChange = output<TableFilterEvent>();

  /**
   * Click en la fila. **No se emite desde la celda de selección**: esa celda
   * corta la propagación, porque el reparto canónico es «la fila abre, la
   * casilla selecciona» y si el click de la casilla también abriera, marcar
   * cinco filas abriría cinco veces el detalle.
   */
  readonly rowClick = output<ScDatatableRowEvent<T>>();

  /**
   * Click derecho en la fila, con el menú nativo ya cancelado.
   *
   * Emite un evento en vez de montar un `<p-contextmenu>` dentro: la app tiene
   * UN `<p-menu popup>` por tabla que sirven a la vez el kebab y el click
   * derecho (Ola 2 mató justo el segundo motor de menú). Un menú propio del DS
   * volvería a poner dos modelos donde ahora hay uno.
   */
  readonly rowContextMenu = output<ScDatatableRowEvent<T>>();

  /**
   * Tecla pulsada sobre la fila. El DS **no interpreta ninguna**: el reparto
   * canónico (Enter abre · Espacio selecciona) es del consumidor, porque solo
   * él sabe qué significa "abrir" en su tabla. El DS solo garantiza que el
   * evento llega — que es lo que no se podía hacer antes.
   */
  readonly rowKeydown = output<ScDatatableRowKeyEvent<T>>();

  /** Mapea sm/md/lg a la prop `size` de p-table (md = sin atributo → padding base del preset). */
  protected readonly pSize = computed<'small' | 'large' | undefined>(() => {
    const s = this.size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });

  /**
   * Las columnas que se pintan de verdad: `columns()` filtrada y REORDENADA por
   * `visibleColumns()`. El orden lo manda el array de visibles, no el declarado,
   * porque `sc-column-selector` deja arrastrar para reordenar y esa es la única
   * forma de que la tabla obedezca al arrastre.
   */
  protected readonly visibleCols = computed<readonly ScColumnDef<T>[]>(() => {
    const declared = this.columns();
    const visible = this.visibleColumns();
    if (!visible) return declared;
    const byField = new Map(declared.map((col) => [col.field, col] as const));
    return visible
      .map((field) => byField.get(field))
      .filter((col): col is ScColumnDef<T> => col !== undefined);
  });

  /**
   * En `multiple`, `pSelectableRow` de PrimeNG selecciona al clicar la fila —
   * y eso choca con el modelo canónico que fijó la Ola 6: **la fila abre, la
   * casilla selecciona**. Con los dos activos, un click hacía las dos cosas.
   *
   * En `single` no se desactiva: ahí seleccionar ES clicar la fila, que es lo
   * que ese modo significa en p-table.
   */
  protected readonly rowSelectDisabled = computed<boolean>(() => {
    const mode = this.selectionMode();
    return !mode || mode === 'multiple';
  });

  /**
   * SELECCIÓN DE RANGO CON ANCLA (shift+click sobre la casilla).
   *
   * PrimeNG YA sabe hacer rangos (`table.mjs`, `isMultipleSelectionMode() &&
   * shiftKey && anchorRowIndex != null`), pero su ancla la fija **solo** su
   * camino de click-de-fila. Y en el modelo canónico de la Ola 6 el click de
   * fila NO selecciona: abre. Así que su ancla se queda en `null` para siempre
   * y su rango no se dispara nunca, por mucho que se reactive `pSelectableRow`.
   *
   * La alternativa era pilotar su campo interno inyectando la `Table`. Se
   * descartó: añade otro agarre a internos de PrimeNG, que es la fragilidad
   * más grande que tiene hoy este repo. Treinta líneas propias salen más
   * baratas que un acoplamiento más.
   *
   * El ancla es la última fila cuya casilla se tocó SIN shift, y con shift no
   * se mueve.
   *
   * AVISO honesto: hoy esa decisión **no es observable**. El rango se UNE a lo
   * ya seleccionado, y como la fila del ancla siempre está dentro, mover el
   * ancla o no produce exactamente el mismo conjunto. Lo descubrió una prueba
   * de mutación: al hacer que el ancla SÍ se moviera, los 17 tests siguieron
   * en verde. Se deja fijo porque es lo correcto el día que shift+click
   * REEMPLACE el rango en vez de sumarlo (Finder, Gmail), que es cuando
   * reencuadrar empieza a significar algo — pero no se afirma un beneficio
   * que hoy no se puede medir. Ver la nota en el spec.
   */
  private anclaRango: number | null = null;

  /** La selección actual, siempre como array (el modelo admite T | T[] | null). */
  private selectionComoArray(): readonly T[] {
    const sel = this.selection();
    if (sel === null || sel === undefined) return [];
    return Array.isArray(sel) ? (sel as readonly T[]) : [sel as T];
  }

  /** Identidad de fila: por `dataKey` si lo hay, por referencia si no. */
  private idDe(row: T): unknown {
    const clave = this.dataKey();
    return clave ? (row as Record<string, unknown>)[clave] : row;
  }

  /**
   * Click en la CELDA de la casilla.
   *
   * `stopPropagation` siempre: sin él, marcar cinco filas abriría cinco veces
   * el detalle. El rango se resuelve DESPUÉS de que `p-tableCheckbox` haya
   * hecho lo suyo —este handler burbujea, así que llega el segundo— y por eso
   * no hay que interceptarlo ni cancelarlo: basta con reponer el rango entero
   * encima. Si la fila clicada estaba marcada, la casilla la desmarca y esta
   * unión la vuelve a poner, que es lo que se espera de un shift+click.
   */
  protected onCheckCellClick(event: MouseEvent, index: number): void {
    event.stopPropagation();
    if (this.selectionMode() !== 'multiple') return;

    const ancla = this.anclaRango;
    if (event.shiftKey && ancla !== null) {
      const [ini, fin] = ancla <= index ? [ancla, index] : [index, ancla];
      const enRango = this.value().slice(ini, fin + 1);
      const vistos = new Set(this.selectionComoArray().map((r) => this.idDe(r)));
      const union = [...this.selectionComoArray()];
      for (const fila of enRango) {
        const id = this.idDe(fila);
        if (!vistos.has(id)) {
          vistos.add(id);
          union.push(fila);
        }
      }
      this.selection.set(union);
      return; // el ancla NO se mueve: permite reencuadrar desde el mismo origen
    }

    this.anclaRango = index;
  }

  /** colspan de la fila vacía: columnas VISIBLES + la de checkbox si aplica. */
  protected readonly colspan = computed<number>(
    () => this.visibleCols().length + (this.selectionMode() === 'multiple' ? 1 : 0),
  );

  /** Filtros para p-table: referencia estable `{}` cuando el consumidor no informa. */
  protected readonly pFilters = computed<ScDatatableFilters>(() => this.filters() ?? {});

  /** totalRecords efectivo: el del servidor (lazy) o el largo del array (cliente). */
  protected readonly pTotalRecords = computed<number>(() => this.totalRecords() ?? this.value().length);

  private readonly table = viewChild.required(Table);

  /**
   * Filtra por el término global (imperativo — p-table no reacciona a cambios del
   * input `[filters]`, que es solo estado inicial). En cliente re-filtra `value`
   * por `globalFilterFields`; en lazy dispara `(lazyLoad)` con el filtro en el
   * evento. El consumidor lo cablea desde su input de búsqueda.
   */
  filterGlobal(value: string, matchMode = 'contains'): void {
    this.table().filterGlobal(value, matchMode);
  }

  /** Lee `row[field]` sin indexar `unknown` directo en plantilla. */
  protected cellValue(row: T, field: string): unknown {
    return (row as Record<string, unknown>)[field];
  }

  /** Clases de la fila; `ngClass` acepta `undefined` sin quejarse. */
  protected rowClass(row: T, index: number): string | undefined {
    return this.rowStyleClass()?.(row, index);
  }

  protected onRowClick(event: MouseEvent, row: T, index: number): void {
    this.rowClick.emit({ row, index, originalEvent: event });
  }

  protected onRowKeydown(event: KeyboardEvent, row: T, index: number): void {
    this.rowKeydown.emit({ row, index, originalEvent: event });
  }

  protected onRowContextMenu(event: MouseEvent, row: T, index: number): void {
    // El menú nativo del navegador tapa el nuestro y no ofrece ninguna de las
    // acciones de la fila: cancelarlo es la única lectura útil del gesto.
    event.preventDefault();
    this.rowContextMenu.emit({ row, index, originalEvent: event });
  }

  protected onSortEvent(event: { field?: string; order?: number }): void {
    this.sortChange.emit({ field: event.field, order: event.order ?? 1 });
  }
}
