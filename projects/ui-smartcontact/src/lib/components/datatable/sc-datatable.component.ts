import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  TemplateRef,
  contentChild,
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
  ScRowAriaLabelFn,
  ScRowStyleClassFn,
} from '../../core/types/datatable.types';
import { ScComponentSize } from '../../core/types/theme-component.types';

/**
 * Piel de la tabla. `list` es la GRAMÁTICA DE TABLA-LISTA de administración
 * (cabecera silenciosa sin fondo, fila alta, hairline `border-default`,
 * `table-layout: fixed`). La publica el TEMA —`sc-preset/css.ts`—, así que
 * viaja con él: un consumidor nuevo pide `variant="list"` y le sale la misma
 * tabla sin copiar una línea de CSS.
 *
 * Es opt-in a propósito: `default` deja la tabla del preset tal cual, que es lo
 * que quiere una tabla que NO es una lista de administración (la de llamadas
 * del Comunicador, por ejemplo).
 */
export type ScDatatableVariant = 'default' | 'list';

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
  host: {
    '[class.sc-datatable--list]': "variant() === 'list'",
    // `scrollHeight="flex"`: con lista virtual la tabla LLENA el alto (la lista virtual lo necesita);
    // sin ella, se AJUSTA a sus filas y solo hace scroll si no caben (DD-95).
    '[class.sc-datatable--fill]': 'pVirtualScroll()',
    // Con scroll propio: el tema estiliza su barra sin preguntar a `p-table` por `.p-datatable-scrollable`.
    '[class.sc-datatable--scroll]': 'scrollable()',
    '[class.sc-datatable--fit]': "scrollable() && scrollHeight() === 'flex' && !pVirtualScroll()",
    // Sin la clase si también es `scrollable`: ahí la cabecera ya la fija PrimeNG
    // dentro de la tabla, y el tema no tiene que preguntar a `p-table` por ello.
    '[class.sc-datatable--sticky-header]': 'stickyHeader() && !scrollable()',
  },
})
export class ScDatatableComponent<T = unknown> {
  /** Las filas a pintar. */
  readonly value = input<readonly T[]>([]);
  /**
   * Definición de las columnas: qué campo muestra cada una, cómo se titula y cómo se ordena. Es el
   * modelo que usan las 16 tablas de hoy.
   */
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
  /** Sentido de la ordenación inicial: `1` ascendente, `-1` descendente. */
  readonly sortOrder = input<number>(1);

  readonly size = input<ScComponentSize>('md');

  /**
   * Piel de la tabla (`default` | `list`). Ver `ScDatatableVariant`: `list`
   * enciende la clase de host `sc-datatable--list`, que es el gancho que el
   * TEMA usa para pintar la gramática de tabla-lista.
   */
  readonly variant = input<ScDatatableVariant>('default');
  readonly scrollable = input(false, { transform: booleanAttribute });
  readonly scrollHeight = input<string | undefined>(undefined);
  /**
   * Lista virtual: con `scrollable`, solo se pintan las filas que se ven, así que la tabla carga
   * igual con 50 filas que con 5.000 (medido el 2026-09-14: 0,27 s y 26 MB contra 3 min 36 s y
   * 1,37 GB pintándolas todas). Sin `scrollable` no hace nada.
   *
   * Pide filas del MISMO alto: el alto lo mide la tabla en su primera fila (la pinta sola un
   * instante), sin número a mano. Una lista con filas que se despliegan o texto que parte en dos
   * líneas no debe activarla. Y el buscador del navegador (Ctrl+F) solo encuentra las filas que
   * se ven: la pantalla necesita su propio buscador.
   */
  readonly virtualScroll = input(false, { transform: booleanAttribute });
  /**
   * Ancho de columna ajustable arrastrando el borde de su cabecera: el nativo de `p-table`
   * (`resizableColumns` + `pResizableColumn`, primeng.dev/table «Column Resize»), tal cual
   * (DD-113). La casilla de selección no se ajusta.
   */
  readonly resizableColumns = input(false, { transform: booleanAttribute });
  /**
   * `fit` (el de PrimeNG por defecto): la tabla no cambia de ancho, lo que gana una columna lo
   * pierde la de al lado. `expand`: la tabla crece con la columna.
   */
  readonly columnResizeMode = input<'fit' | 'expand'>('fit');
  /**
   * Orden de columnas arrastrando su cabecera: el nativo de `p-table` (`reorderableColumns` +
   * `pReorderableColumn`, primeng.dev/table «Reorder»), tal cual (DD-113). La casilla de selección
   * no se mueve, ni las columnas con `reorderable: false`. La tabla NO reordena sola: avisa con
   * `(columnOrderChange)` y el consumidor decide y lo devuelve por `columns`/`visibleColumns`.
   */
  readonly reorderableColumns = input(false, { transform: booleanAttribute });
  /**
   * Ancho mínimo de la tabla (p. ej. `'66rem'`). Con `scrollable`, por debajo de ese ancho la tabla
   * se desplaza de lado dentro de su contenedor en lugar de estrechar columnas y recortar texto
   * (2026-09-14). Va por `tableStyle` de `p-table`, no por una regla de la app sobre `.p-*`, para
   * que viaje con el componente.
   */
  readonly tableMinWidth = input<string | undefined>(undefined);
  protected readonly pTableStyle = computed(() => {
    const min = this.tableMinWidth();
    return min ? { 'min-width': min } : undefined;
  });

  /**
   * Cabecera fija al scroll de la PÁGINA: se queda arriba mientras se desplaza
   * el antepasado que hace scroll (en el Supervisor, `main.app-shell__content`).
   * Para una tabla que hace scroll DENTRO de sí misma usa `scrollable` +
   * `scrollHeight`, que ya fija la cabecera; si llegan las dos, manda `scrollable`.
   *
   * La publica el TEMA (`sc-preset/css.ts`, `stickyHeaderCss`), porque los nodos
   * que toca los pinta `p-table`. Dos condiciones, medidas el 2026-09-13:
   *   - El contenedor de `p-table` deja de hacer scroll, así que una tabla más
   *     ancha que su caja desborda hacia la página en vez de desplazarse dentro.
   *   - Ningún antepasado entre la tabla y el que hace scroll puede tener
   *     `overflow` distinto de `visible` o `clip`: `hidden` o `auto` crean su
   *     propio contenedor de scroll y la cabecera se fija a ESE, que no se mueve.
   */
  readonly stickyHeader = input(false, { transform: booleanAttribute });
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

  /** Nombre accesible de la casilla de cada fila. Ver `ScRowAriaLabelFn`: sin
   *  esto PrimeNG anuncia `'Row Selected'` en inglés y sin identidad de fila. */
  readonly rowSelectionAriaLabel = input<ScRowAriaLabelFn<T> | undefined>(undefined);

  /** Nombre accesible de la casilla de CABECERA (seleccionar todo). */
  readonly selectAllAriaLabel = input<string | undefined>(undefined);

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


  /* ════════════════════════════════════════════════════════════════════════
   * LAS 38 RANURAS DE PLANTILLA DE p-table, REENVIADAS
   * ════════════════════════════════════════════════════════════════════════
   *
   * PARA QUÉ. Para que un ejemplo de primeng.dev se pueda PEGAR dentro de un
   * `<sc-datatable>` y funcione, ya tokenizado, sin salirse del DS.
   *
   * POR QUÉ HAY QUE REENVIARLAS UNA A UNA, y no basta con dejar hueco: medido
   * el 2026-09-11 con una sonda (control positivo incluido) — una plantilla
   * `#header` que el consumidor declara NO atraviesa un `<ng-content/>` hasta
   * p-table. Sus queries son `contentChild('header')` y solo ven SU propio
   * contenido; lo que proyectamos no cuenta. Lo que SÍ funciona es esto:
   * capturamos la plantilla del consumidor aquí y la volvemos a emitir dentro
   * de una ranura declarada en NUESTRA vista, con su contexto.
   *
   * POR QUÉ CADA UNA VA DENTRO DE UN `@if` en la plantilla: declarar la ranura
   * siempre haría que p-table pintara el elemento aunque nadie la use (un
   * `<tfoot>` vacío, por ejemplo). Con el `@if` solo existe si el consumidor la
   * trae — también medido, con su control.
   *
   * LAS CUATRO QUE YA IMPLEMENTA EL COMPONENTE (`caption`, `header`, `body`,
   * `emptymessage`) no se declaran dos veces: dentro de su ranura, la del
   * consumidor GANA y si no la hay se pinta el modelo de column-defs. */
  protected readonly userBody = contentChild<TemplateRef<unknown>>('body');
  protected readonly userLoadingbody = contentChild<TemplateRef<unknown>>('loadingbody');
  protected readonly userExpandedrow = contentChild<TemplateRef<unknown>>('expandedrow');
  protected readonly userGroupheader = contentChild<TemplateRef<unknown>>('groupheader');
  protected readonly userGroupfooter = contentChild<TemplateRef<unknown>>('groupfooter');
  protected readonly userFrozenbody = contentChild<TemplateRef<unknown>>('frozenbody');
  protected readonly userFrozenexpandedrow = contentChild<TemplateRef<unknown>>('frozenexpandedrow');
  protected readonly userHeader = contentChild<TemplateRef<unknown>>('header');
  protected readonly userHeadergrouped = contentChild<TemplateRef<unknown>>('headergrouped');
  protected readonly userFooter = contentChild<TemplateRef<unknown>>('footer');
  protected readonly userFootergrouped = contentChild<TemplateRef<unknown>>('footergrouped');
  protected readonly userColgroup = contentChild<TemplateRef<unknown>>('colgroup');
  protected readonly userFrozenheader = contentChild<TemplateRef<unknown>>('frozenheader');
  protected readonly userFrozenfooter = contentChild<TemplateRef<unknown>>('frozenfooter');
  protected readonly userFrozencolgroup = contentChild<TemplateRef<unknown>>('frozencolgroup');
  protected readonly userEmptymessage = contentChild<TemplateRef<unknown>>('emptymessage');
  protected readonly userSorticon = contentChild<TemplateRef<unknown>>('sorticon');
  protected readonly userCheckboxicon = contentChild<TemplateRef<unknown>>('checkboxicon');
  protected readonly userHeadercheckboxicon = contentChild<TemplateRef<unknown>>('headercheckboxicon');
  protected readonly userFiltericon = contentChild<TemplateRef<unknown>>('filtericon');
  protected readonly userLoadingicon = contentChild<TemplateRef<unknown>>('loadingicon');
  protected readonly userFilter = contentChild<TemplateRef<unknown>>('filter');
  protected readonly userInput = contentChild<TemplateRef<unknown>>('input');
  protected readonly userOutput = contentChild<TemplateRef<unknown>>('output');
  protected readonly userPaginatordropdownitem = contentChild<TemplateRef<unknown>>('paginatordropdownitem');
  protected readonly userPaginatorfirstpagelinkicon = contentChild<TemplateRef<unknown>>('paginatorfirstpagelinkicon');
  protected readonly userPaginatorlastpagelinkicon = contentChild<TemplateRef<unknown>>('paginatorlastpagelinkicon');
  protected readonly userPaginatornextpagelinkicon = contentChild<TemplateRef<unknown>>('paginatornextpagelinkicon');
  protected readonly userPaginatorpreviouspagelinkicon = contentChild<TemplateRef<unknown>>('paginatorpreviouspagelinkicon');
  protected readonly userPaginatordropdownicon = contentChild<TemplateRef<unknown>>('paginatordropdownicon');
  protected readonly userReorderindicatordownicon = contentChild<TemplateRef<unknown>>('reorderindicatordownicon');
  protected readonly userReorderindicatorupicon = contentChild<TemplateRef<unknown>>('reorderindicatorupicon');
  protected readonly userAddruleicon = contentChild<TemplateRef<unknown>>('addruleicon');
  protected readonly userRemoveruleicon = contentChild<TemplateRef<unknown>>('removeruleicon');
  protected readonly userCaption = contentChild<TemplateRef<unknown>>('caption');
  protected readonly userSummary = contentChild<TemplateRef<unknown>>('summary');
  protected readonly userPaginatorleft = contentChild<TemplateRef<unknown>>('paginatorleft');
  protected readonly userPaginatorright = contentChild<TemplateRef<unknown>>('paginatorright');

  /** El usuario ha cambiado la ordenación. */
  readonly sortChange = output<ScDatatableSortEvent>();
  /** El usuario ha cambiado de página. */
  readonly page = output<TablePageEvent>();
  /**
   * La tabla pide datos al servidor. Solo se emite en modo `lazy`, y es donde el consumidor
   * engancha su consulta.
   */
  readonly lazyLoad = output<TableLazyLoadEvent>();
  /** Han cambiado los filtros de la tabla. */
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

  /**
   * Se ha arrastrado una columna a otro sitio: los `field` visibles en su orden nuevo (sin la
   * casilla). Solo con `reorderableColumns`.
   */
  readonly columnOrderChange = output<readonly string[]>();

  /**
   * Se ha cambiado el ancho de una columna: el ancho en píxeles de cada columna visible, por su
   * `field`, medido al soltar. Solo con `resizableColumns`; sirve para recordarlo.
   */
  readonly columnWidthsChange = output<Readonly<Record<string, number>>>();

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
   * PrimeNG YA sabe hacer rangos, pero su ancla la fija **solo** su camino de
   * click-de-fila (`handleRowClick`), y en el modelo canónico de la Ola 6 el
   * click de fila NO selecciona: abre. Su `toggleRowWithCheckbox` —el camino de
   * la casilla— ni mira `shiftKey` ni el ancla. Así que por la casilla no hay
   * rango: hay que ponerlo.
   *
   * POR QUÉ NO EN EL CLICK DE LA CELDA (como estaba, y no funcionaba en
   * navegador — lo destapó Playwright, no el test unitario que llamaba al método
   * a pelo): la casilla de PrimeNG togglea en su evento `change`, que se dispara
   * como acción por defecto DESPUÉS del `click`. Un handler de rango en el
   * `click` corre ANTES del toggle, fija la selección… y acto seguido el toggle
   * de p-table emite su propio `selectionChange` sobre su estado interno aún sin
   * sincronizar y la PISA. Medido: shift+click de la 2ª a la 5ª dejaba [2,5], no
   * [2,3,4,5].
   *
   * CÓMO SÍ: el `shiftKey` se captura en `mousedown` (que sí llega a la celda y
   * conserva el modificador), y el rango se aplica en `onSelectionChange`, que
   * corre DESPUÉS del toggle de p-table y sobre su array ya togglado —sin
   * lecturas rancias ni pisotones—. Es también el sitio natural: p-table nos
   * está entregando la selección nueva; solo la ampliamos al rango.
   *
   * SEMÁNTICA: el rango SUMA, no reemplaza (arrastrar sobre filas ya marcadas no
   * las desmarca) y el ancla SE MUEVE con shift. Copiado de `conversation-table`
   * —la tabla que trae este gesto a mano— para que su migración no cambie nada
   * bajo los pies del usuario.
   *
   * LÍMITE MEDIDO de p-table: la SELECCIÓN queda correcta (el modelo y lo que
   * emitimos llevan el rango entero; la barra masiva cuenta bien), pero p-table
   * solo re-pinta su clase `.p-datatable-row-selected` en las filas que togló
   * ÉL — las que añade el rango por el input no se re-resaltan hasta el
   * siguiente ciclo que las toque. Si una tabla quiere el TINTE visual del
   * rango al instante, que lo pinte desde `[rowStyleClass]` leyendo su propia
   * fuente de selección (que es lo que hace `conversation-table`), no desde la
   * clase de p-table.
   */
  private anclaRango: number | null = null;
  /** `shiftKey` del último `mousedown` sobre una casilla (no lo lleva el
   *  `change` que togglea). Se consume en el siguiente `onSelectionChange`. */
  private shiftAlPulsar = false;
  /** Fila del último `mousedown` sobre una casilla; `null` fuera de ese gesto,
   *  para que un cambio ajeno (la casilla de cabecera) no herede un rango. */
  private indicePendiente: number | null = null;

  /** La selección actual, siempre como array (el modelo admite T | T[] | null). */
  private selectionComoArray(sel: T | readonly T[] | null = this.selection()): readonly T[] {
    if (sel === null || sel === undefined) return [];
    return Array.isArray(sel) ? (sel as readonly T[]) : [sel as T];
  }

  /** Identidad de fila: por `dataKey` si lo hay, por referencia si no. */
  private idDe(row: T): unknown {
    const clave = this.dataKey();
    return clave ? (row as Record<string, unknown>)[clave] : row;
  }

  /**
   * `mousedown` sobre la celda de la casilla. Solo cuenta si empieza SOBRE la
   * casilla: un `mousedown` en el hueco de la celda no va a togglear nada, y
   * dejar ahí un shift pendiente contaminaría el siguiente cambio (p. ej. el de
   * la casilla de cabecera).
   *
   * El ancla es `.sc-datatable__check-box` —una clase NUESTRA, puesta en la
   * plantilla— y no el nombre del elemento que renderiza PrimeNG.
   *
   * ⚠️ **Por qué, medido el 2026-08-25 en la migración a v22.** Antes esto era
   * `closest('p-tablecheckbox')`. En la migración la plantilla pasó a escribir
   * `<p-table-checkbox>` (kebab), así que el tag RENDERIZADO cambió, `closest`
   * pasó a devolver `null` siempre, el guard cortaba en su primera línea y la
   * selección por rango con Mayús quedó MUERTA sin lanzar un solo error.
   *
   * Y el detalle que lo vuelve instructivo: PrimeNG NO nos rompió. Declara
   * `selector: "p-table-checkbox, p-tablecheckbox"` —acepta los dos nombres a
   * propósito, para que una subida no rompa a nadie—. Lo que rompió fue que
   * NUESTRO JavaScript dependía en secreto del tag que NUESTRA plantilla
   * escribe, y esos dos ficheros no se leen juntos nunca.
   *
   * De ahí el gancho propio: la plantilla y el guard comparten ahora un
   * contrato que sí es nuestro, y `audit:primeng-coupling` vigila que no
   * vuelvan a desincronizarse.
   */
  protected onCheckMousedown(event: MouseEvent, index: number): void {
    if (this.selectionMode() !== 'multiple') return;
    if (!(event.target as HTMLElement | null)?.closest('.sc-datatable__check-box')) return;
    this.shiftAlPulsar = event.shiftKey;
    this.indicePendiente = index;
  }

  /**
   * p-table emite la selección nueva tras togglear una casilla. Si el gesto
   * empezó con Mayús sobre una casilla y hay ancla, la ampliamos al RANGO
   * [ancla … fila]; si no, se pasa tal cual. En ambos casos el ancla se mueve a
   * la fila tocada y el gesto pendiente se consume.
   */
  protected onSelectionChange(nueva: T | readonly T[] | null): void {
    const idx = this.indicePendiente;
    const ancla = this.anclaRango;

    if (this.selectionMode() === 'multiple' && this.shiftAlPulsar && ancla !== null && idx !== null) {
      const [ini, fin] = ancla <= idx ? [ancla, idx] : [idx, ancla];
      const conRango = [...this.selectionComoArray(nueva)];
      const vistos = new Set(conRango.map((r) => this.idDe(r)));
      for (const fila of this.value().slice(ini, fin + 1)) {
        const id = this.idDe(fila);
        if (!vistos.has(id)) {
          vistos.add(id);
          conRango.push(fila);
        }
      }
      this.selection.set(conRango);
    } else {
      this.selection.set(nueva);
    }

    if (idx !== null) this.anclaRango = idx;
    this.shiftAlPulsar = false;
    this.indicePendiente = null;
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

  /** Alto medido de una fila (px) para la lista virtual; 0 hasta medirlo. */
  private readonly rowHeight = signal(0);
  /* Por debajo de este número de filas la lista virtual no compensa: pintarlas todas es rápido
   * (60 filas, 0,35 s; 500, 2,5 s; medido el 2026-09-14) y así la tabla puede ajustarse a sus filas
   * en vez de llenar el alto. Es un umbral de rendimiento, no una medida de diseño. */
  private static readonly VIRTUAL_MIN_ROWS = 100;
  private readonly virtualWanted = computed(
    () => this.virtualScroll() && this.scrollable() && this.value().length > ScDatatableComponent.VIRTUAL_MIN_ROWS,
  );
  protected readonly pVirtualScroll = computed(() => this.virtualWanted() && this.rowHeight() > 0);
  protected readonly pVirtualScrollItemSize = computed(() => this.rowHeight() || undefined);
  /** Sin lista virtual, `flex` no pasa a PrimeNG: su modo flexible estira la tabla aunque tenga 3 filas. */
  protected readonly pScrollHeight = computed(() =>
    this.scrollHeight() === 'flex' && !this.pVirtualScroll() ? undefined : this.scrollHeight(),
  );
  /** Mientras no se ha medido la fila, se pinta solo la primera: medir no cuesta pintar 5.000. */
  protected readonly pValue = computed(() => {
    const rows = this.value();
    return this.virtualWanted() && !this.rowHeight() ? rows.slice(0, 1) : rows;
  });

  private readonly hostEl = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

  constructor() {
    /* Con scroll propio, la barra de scroll empieza DEBAJO de la cabecera de columnas: el tema
     * coloca la pista con `--sc-datatable-thead-height`. Se mide porque el alto de la cabecera
     * cambia con la talla y con el texto de las columnas. */
    const destroyRef = inject(DestroyRef);
    let observedThead: HTMLElement | null = null;
    let ro: ResizeObserver | null = null;
    destroyRef.onDestroy(() => ro?.disconnect());
    /* PrimeNG vuelve a pintar la cabecera al entrar o salir la lista virtual: se re-observa la que haya.
     * El observador se crea solo con scroll propio y si el entorno lo tiene (las pruebas unitarias no). */
    afterRenderEffect(() => {
      this.pVirtualScroll();
      if (!this.scrollable() || typeof ResizeObserver === 'undefined') return;
      const thead = this.hostEl.querySelector<HTMLElement>('thead');
      if (!thead || thead === observedThead) return;
      ro ??= new ResizeObserver(() => {
        if (observedThead?.isConnected) {
          this.hostEl.style.setProperty('--sc-datatable-thead-height', `${observedThead.offsetHeight}px`);
        }
      });
      ro.disconnect();
      observedThead = thead;
      ro.observe(thead, { box: 'border-box' });
    });
    afterRenderEffect(() => {
      if (!this.virtualWanted() || this.rowHeight() || !this.value().length) return;
      const row = this.hostEl.querySelector<HTMLElement>('tbody > tr:has(> td:not([colspan]))');
      if (row?.offsetHeight) this.rowHeight.set(row.offsetHeight);
    });
  }

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
    /* El menú sale DONDE SE HACE CLIC (DD-96, el patrón habitual en SaaS). Las pantallas abren su
     * `<p-menu>` compartido con `menu.toggle(event.originalEvent)`, y `p-menu` se coloca junto a
     * `event.currentTarget`, que era la fila entera: salía pegado a su borde izquierdo. Aquí se relanza el
     * gesto desde un punto de 0 px en el puntero, así que `currentTarget` es ese punto y el menú (el mismo,
     * con sus recolocaciones si no cabe) abre ahí, en todas las tablas y sin tocar ninguna pantalla. */
    /* Un segundo clic derecho con el menú abierto lo MUEVE al nuevo punto, no lo cierra: primero se cierra
     * lo que haya abierto, como haría un clic fuera, y se abre en el SIGUIENTE turno. Seguido no vale
     * (medido): `p-menu` no se recoloca hasta terminar de cerrarse y reabría en el sitio viejo. */
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    setTimeout(() => this.openAtPointer(event, row, index));
  }

  private openAtPointer(event: MouseEvent, row: T, index: number): void {
    const anchor = this.pointerAnchor(event.clientX, event.clientY);
    const atPointer = new MouseEvent('contextmenu', {
      clientX: event.clientX,
      clientY: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY,
      button: event.button,
      buttons: event.buttons,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    });
    anchor.addEventListener('contextmenu', () => this.rowContextMenu.emit({ row, index, originalEvent: atPointer }), {
      once: true,
    });
    anchor.dispatchEvent(atPointer);
  }

  private pointerAnchorEl: HTMLElement | null = null;
  private readonly anchorDestroyRef = inject(DestroyRef);

  private pointerAnchor(x: number, y: number): HTMLElement {
    if (!this.pointerAnchorEl) {
      const el = document.createElement('span');
      el.setAttribute('aria-hidden', 'true');
      el.style.position = 'fixed';
      el.style.width = '0';
      el.style.height = '0';
      el.style.pointerEvents = 'none';
      document.body.appendChild(el);
      this.anchorDestroyRef.onDestroy(() => el.remove());
      this.pointerAnchorEl = el;
    }
    this.pointerAnchorEl.style.left = `${x}px`;
    this.pointerAnchorEl.style.top = `${y}px`;
    return this.pointerAnchorEl;
  }

  /**
   * `p-table` da los índices DENTRO del grupo de cabeceras con `pReorderableColumn`, que son todas
   * las de datos en el orden en que se pintan (la casilla no lleva la directiva). Sin `[columns]`
   * no reordena nada por su cuenta: aquí se traduce a `field` y se avisa.
   */
  protected onColReorder(event: { dragIndex?: number; dropIndex?: number }): void {
    const fields = this.visibleCols().map((c) => c.field);
    const from = event.dragIndex ?? -1;
    const to = event.dropIndex ?? -1;
    if (from < 0 || to < 0 || from >= fields.length || to >= fields.length || from === to) return;
    const [moved] = fields.splice(from, 1);
    fields.splice(to, 0, moved!);
    this.columnOrderChange.emit(fields);
  }

  /** Al soltar el borde: el ancho que ha quedado en cada cabecera de datos, por su `field`. */
  protected onColResize(): void {
    const widths: Record<string, number> = {};
    for (const th of Array.from(this.hostEl.querySelectorAll<HTMLElement>('thead th[data-field]'))) {
      widths[th.dataset['field']!] = Math.round(th.getBoundingClientRect().width);
    }
    this.columnWidthsChange.emit(widths);
  }

  protected onSortEvent(event: { field?: string; order?: number }): void {
    this.sortChange.emit({ field: event.field, order: event.order ?? 1 });
  }
}
