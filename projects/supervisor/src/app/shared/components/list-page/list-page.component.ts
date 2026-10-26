import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  type OnInit,
  output,
  signal,
  type TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { moveItemInArray } from '@angular/cdk/drag-drop';

import {
  type BulkActionEntityLabels,
  ScBulkActionBarComponent,
  ScButtonComponent,
  type ColumnDef,
  type ScColumnCellContext,
  type ScColumnDef,
  ScDatatableComponent,
  ScEmptyStateComponent,
  type ScDatatableRowEvent,
  type ScDatatableRowKeyEvent,
  type ScDatatableSortEvent,
  type ScRowStyleClassFn,
  ScSearchComponent,
} from '@smartcontact-hub/components';
import { LlegaAlPieDirective } from '@core/directives';
import { CargaSimuladaService, ResultadoAccionService, UndoStackService } from '@core/services';
import { escapeSearch } from '@core/utils/escape-search';
import { injectLangChange } from '@core/utils/lang-change';

import { type ColumnPrefs, normalizePrefs } from '../column-toggle/column-prefs';
import { ColumnToggleComponent } from '../column-toggle/column-toggle.component';
import { TooltipModule } from 'primeng/tooltip';

/** Id de columna reservado para la del menú de fila; ninguna pantalla puede usarlo. */
const ACTIONS_FIELD = '__actions';
/** El ancho máximo de la columna que crece (la del nombre) en una tabla ancha. */
const NOMBRE_TOPE = '24rem';
/**
 * Lo que nunca baja la columna del nombre cuando crece (DD-193): el nombre más ancho de Agentes pide 204 px y el de las
 * demás listas de Administración, menos de 215 (medido a 1440 el 2026-10-11). Por debajo, la tabla se desplaza de lado
 * con el nombre fijo, en vez de comérselo: a 1024 Nombre medía 32 px en Agentes.
 */
const NOMBRE_MINIMO = '15rem';
/**
 * Los topes del ancho de partida de una columna compacta (una cifra, una fecha, un estado: las que traen ancho), medido
 * sobre su contenido (revisión de producto del 2026-10-15). Las que crecen (el nombre, una descripción) se reparten el
 * sitio como siempre, y la descripción corta con «…» lo que no cabe.
 */
const ANCHO_MINIMO = 3.5;
const ANCHO_TOPE = 20;
/**
 * La versión de lo medido que se guarda: lo guardado con otra se vuelve a medir. 2 (2026-10-22): se mide con las fuentes
 * cargadas; lo de antes pudo medirse sin la de iconos y salir más ancho (Agentes, a 1440, se desplazaba 12 px de lado).
 */
const VERSION_MEDIDOS = 2;

let listRowMenuIdCounter = 0;

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
 *   - el menú de cada fila (`rowMenu`, con «⋮» o solo con clic derecho: `rowMenuColumn`) y, si actúa sobre varias, el de
 *     la selección (`selectionMenu`, con el clic derecho sobre una marcada), qué pasa al abrir una
 *     (`rowOpenable` → `(rowOpen)`), sus clases propias (`rowClass`) y las de su tabla (`tableClass`);
 *   - la selección (`selectable`, `[(selectedIds)]`, `bulkEntity`, y lo que dicen sus casillas: `selectRowKey`,
 *     `selectAllKey`) y sus acciones en lote (`[scListBulkActions]`);
 *   - el vacío (`[scListEmpty]`, y `empty` si lo decide sobre algo más que las filas), la búsqueda sin
 *     resultados (`noResultsKey` o `[scListNoResults]`) y lo que vaya entre el título y la barra
 *     (`[scListBeforeToolbar]`: pestañas, avisos).
 * Los diálogos (borrar, edición en lote), los paneles y las acciones de verdad siguen en la pantalla.
 *
 * El gesto de fila es el de Conversaciones, la última en montarla (2026-10-05): la fila abre, la casilla selecciona
 * (Mayúsculas, el tramo), Intro abre y Espacio selecciona, y Mayús+clic en la fila no abre nada.
 */
@Component({
  selector: 'sc-list-page',
  imports: [
    TooltipModule,
    ColumnToggleComponent,
    LlegaAlPieDirective,
    MenuModule,
    ScBulkActionBarComponent,
    ScButtonComponent,
    ScDatatableComponent,
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
  private readonly document = inject(DOCUMENT);

  readonly heading = input.required<string>();
  readonly rows = input.required<readonly T[]>();
  /**
   * Si no hay NADA que listar (se pinta `[scListEmpty]` en vez de la tabla). Por defecto, sin filas. Una pantalla
   * que parte sus datos (p. ej. por pestañas) lo decide sobre el total: una pestaña vacía es una búsqueda sin
   * resultados, no una pantalla vacía.
   */
  readonly empty = input<boolean | undefined>(undefined);
  protected readonly isEmpty = computed(() => this.empty() ?? this.rows().length === 0);
  /**
   * La primera vez que se abre esta lista en la pestaña, sus filas «tardan» lo que tardaría el servidor y la tabla pinta
   * su esqueleto (`CargaSimuladaService`). La clave es la ruta: cada pantalla espera una vez.
   */
  protected readonly cargando = inject(CargaSimuladaService).primeraVez(
    inject(ActivatedRoute).snapshot.pathFromRoot.flatMap((r) => r.url.map((s) => s.path)).join('/'),
  );
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
  /**
   * Si también importa: «Importar» va en el menú «Acciones», junto a «Exportar». Lo que se importa y cómo lo decide la
   * pantalla, con `(importRequest)`; la plantilla vacía se descarga dentro de su diálogo (`sc-import-dialog`), no en el
   * menú (revisión de producto del 2026-10-15).
   */
  readonly importable = input(false, { transform: booleanAttribute });

  /** Menú de una fila: el mismo con «⋮» y con clic derecho. Sin él, no hay columna de acciones. Si una fila no tiene
   *  acciones (el menú sale vacío), el clic derecho no abre nada: un menú vacío es peor que ninguno. */
  readonly rowMenu = input<((row: T) => MenuItem[]) | undefined>(undefined);
  /** Con `false`, el menú de fila se abre solo con clic derecho, sin la columna «⋮» (Conversaciones: cada acción tiene
   *  otra puerta visible). */
  readonly rowMenuColumn = input(true, { transform: booleanAttribute });
  /**
   * El menú de la SELECCIÓN: con dos filas marcadas o más, el clic derecho sobre una de ellas abre este en vez del de la
   * fila, con las filas marcadas. Sobre una fila sin marcar, y con «⋮», el de la fila. Sin él, el clic derecho es
   * siempre de la fila. Grupos lo usa para eliminar varios a la vez (SISMAC-4056).
   */
  readonly selectionMenu = input<((rows: readonly T[]) => MenuItem[]) | undefined>(undefined);
  /** Si el «⋮» de una fila marcada abre también el menú de la selección (DD-227). Con `false`, el «⋮» es siempre de su fila (Equipos). */
  readonly selectionMenuFromRow = input(true, { transform: booleanAttribute });

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

  /** Claves i18n de los nombres de las casillas: la de una fila recibe `{{name}}` (de `rowLabel`) e `{{id}}`. */
  readonly selectRowKey = input('common.select_row');
  readonly selectAllKey = input('common.select_all');

  readonly tableTestId = input<string | undefined>(undefined);
  /** Clases de la tabla, para la piel propia de una pantalla (p. ej. `memory-conversations`). */
  readonly tableClass = input('');
  /**
   * Ancho mínimo de la tabla (p. ej. `'65rem'`), la suma de lo que mide el dato de cada columna.
   * Por debajo, la tabla se desplaza de lado DENTRO de su caja en vez de recortar texto con
   * puntos suspensivos (DD-102: una lista nunca corta texto). Sin él, la tabla se ajusta al
   * ancho disponible como hasta ahora. Cuenta TODAS las columnas con `width` en rem: las que están
   * ocultas en el selector se descuentan solas. Si el nombre crece, nunca deja menos de `NOMBRE_MINIMO` para él
   * (`effectiveTableMinWidth`, DD-193).
   */
  readonly tableMinWidth = input<string | undefined>(undefined);

  readonly rowOpen = output<T>();
  readonly exportRequest = output<readonly T[]>();
  readonly importRequest = output<void>();

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
    /* En una tabla ancha, la columna que crece (la que no trae ancho, la del nombre) se queda en su tope y el sobrante
     * va al final de la fila, a la columna del «⋮» (revisión del 2026-10-09). Sin tope, a 1920 Nombre medía 737 px y
     * había un salto enorme hasta el dato siguiente. Solo con menú de fila: es la columna que puede crecer sin que se
     * note. */
    const tope = this.conTopeDeNombre();
    const nombre = this.campoNombre();
    const cols = this.columns().map((c) => ({
      ...c,
      width: prefs?.widths[c.field] ?? this.anchosDePartida()[c.field] ?? c.width ?? (tope ? NOMBRE_TOPE : undefined),
      reorderable: !locked.has(c.field),
      frozen: c.frozen ?? c.field === nombre,
      rowHeader: c.rowHeader ?? c.field === nombre,
    }));
    if (!this.rowMenu() || !this.rowMenuColumn()) return cols;
    this.lang(); // el nombre accesible de la columna de acciones, al día al cambiar de idioma
    return [
      ...cols,
      {
        field: ACTIONS_FIELD,
        stopRowClick: true,
        skeleton: 'action',
        header: '',
        headerAriaLabel: this.translate.instant('common.actions'),
        /* Relleno de celda + botón de 28 + relleno: el «⋮» queda centrado. Con `3` (42) tocaba el borde derecho. Con
         * el nombre en su tope, esta columna se lleva el sobrante (`auto`) y el «⋮» sigue pegado a la derecha. */
        width: tope ? 'auto' : 'var(--sc-spacing-4)',
        align: 'right',
        reorderable: false,
        frozen: true,
        alignFrozen: 'right',
        cellTemplate: this.actionsTpl(),
      },
    ];
  });

  /**
   * La columna que nombra la fila (la «row header» de Primer): la fija del selector de columnas o, si no lo hay, la
   * primera cuando crece (Nombre, Título, Regla). Se queda fija a la izquierda al desplazar la tabla de lado: lo que dice
   * de qué fila es cada dato no se va nunca (DD-193), y su celda es la cabecera de la fila para un lector de pantalla
   * (DD-194). Una primera columna con ancho propio no nombra la fila (el Estado de Conversaciones), y no se fija nada.
   */
  private readonly campoNombre = computed<string | undefined>(() => {
    const fija = (this.columnChoices() ?? []).find((c) => c.locked)?.key;
    const primera = this.columns()[0];
    return fija ?? (primera && !primera.width ? primera.field : undefined);
  });

  /* ── Anchos de partida: cada columna, a lo que mide su contenido (revisión de producto del 2026-10-15) ───────────── */

  private readonly injector = inject(Injector);
  /**
   * Lo que mide cada columna compacta al abrir la lista con sus filas, en rem y entre sus topes: la primera vez, sin
   * anchos arrastrados, se ajusta a su contenido. Se mide una vez (y otra si cambia el idioma, que cambia las
   * cabeceras): buscar, filtrar o desplazarse no lo recalcula. Lo arrastrado a mano manda y se recuerda; «Restablecer»
   * vuelve a medir. Solo en las listas que eligen columnas, que son las que se ensanchan a mano.
   *
   * Y SE RECUERDA, como lo arrastrado: medido al llegar los datos, el esqueleto de carga salía con los anchos de la
   * plantilla y las columnas se movían al llegar las filas (`esqueleto-carga.spec.ts`). Guardado, desde la segunda vez
   * el esqueleto sale ya con lo medido; solo la primera apertura de cada lista se reajusta (decisión de producto del
   * 2026-10-15).
   */
  protected readonly anchosDePartida = signal<Readonly<Record<string, string>>>({});
  private idiomaMedido: string | null = null;

  /** Dónde se guarda lo medido: junto a las preferencias de columnas, con el idioma en que se midió. */
  private readonly claveMedidos = computed(() => {
    const key = this.columnStorageKey();
    return key ? `${key}:medidos` : null;
  });

  private leerMedidos(): void {
    const clave = this.claveMedidos();
    if (!clave) return;
    try {
      const guardado: unknown = JSON.parse(localStorage.getItem(clave) ?? 'null');
      if (!guardado || typeof guardado !== 'object') return;
      const { version, idioma, anchos } = guardado as { version?: unknown; idioma?: unknown; anchos?: unknown };
      if (version !== VERSION_MEDIDOS || idioma !== untracked(this.lang) || !anchos || typeof anchos !== 'object') return;
      const validos = Object.entries(anchos).filter(([, v]) => typeof v === 'string' && /^\d+(\.\d+)?rem$/.test(v));
      this.idiomaMedido = idioma;
      this.anchosDePartida.set(Object.fromEntries(validos));
    } catch {
      /* Sin almacenamiento o con algo que no es lo nuestro: se mide al tener filas. */
    }
  }

  private guardarMedidos(): void {
    const clave = this.claveMedidos();
    if (!clave) return;
    try {
      const anchos = this.anchosDePartida();
      if (Object.keys(anchos).length)
        localStorage.setItem(clave, JSON.stringify({ version: VERSION_MEDIDOS, idioma: this.idiomaMedido, anchos }));
      else localStorage.removeItem(clave);
    } catch {
      /* Sin almacenamiento: lo medido vale mientras dure la página. */
    }
  }

  private readonly medirAlTenerFilas = effect(() => {
    if (!this.columnChoices() || this.cargando() || this.displayed().length === 0) return;
    const idioma = this.lang();
    const visibles = this.visibleColumns() ?? [];
    untracked(() => {
      if (idioma !== this.idiomaMedido) {
        this.idiomaMedido = idioma;
        this.anchosDePartida.set({});
      }
      const nombre = this.campoNombre();
      const medidos = this.anchosDePartida();
      const compactas = new Set(this.columns().filter((c) => c.width).map((c) => c.field));
      const faltan = visibles.filter((f) => compactas.has(f) && f !== nombre && !medidos[f]);
      if (faltan.length) afterNextRender(() => this.medirColumnas(faltan), { injector: this.injector });
    });
  });

  /**
   * Mide lo que pide cada columna: un instante con la tabla en su ancho natural (`table-layout: auto`, sin anchos y sin
   * partir líneas), lo que mide su cabecera, y vuelta atrás en el mismo fotograma, sin que se vea.
   */
  private medirColumnas(fields: readonly string[], intentos = 30): void {
    const tabla = this.tarjeta()?.nativeElement.querySelector('table');
    if (!tabla?.isConnected) return;
    /* Con las fuentes cargadas. Sin la de iconos (3,9 MB, la última en llegar), `sc-icon` ocupa lo que el nombre del glifo
     * en letras: `font-display: block` lo esconde, pero ocupa. Medido así en el despliegue (2026-10-22), Agentes guardaba
     * Extensión a 128 px en vez de 116 y Grabación a 155 en vez de 119, y a 1440 se desplazaba 12 px de lado. */
    if (this.document.fonts?.status === 'loading') {
      void this.document.fonts.ready.then(() => this.medirColumnas(fields, intentos));
      return;
    }
    /* La lista virtual pinta sus filas un fotograma después de recibirlas: medida antes, una columna medía lo de las dos
     * primeras filas (Email de Agentes cortaba la tercera). Se espera a tener a la vista las que caben, o todas. */
    const pintadas = tabla.querySelectorAll('tbody > tr:not(.p-datatable-emptymessage)').length;
    if (pintadas < Math.min(this.displayed().length, 10) && intentos > 0) {
      requestAnimationFrame(() => this.medirColumnas(fields, intentos - 1));
      return;
    }
    const rem = parseFloat(getComputedStyle(this.document.documentElement).fontSize) || 16;
    const marca = 'data-sc-midiendo';
    const estilo = this.document.createElement('style');
    estilo.textContent =
      `table[${marca}]{table-layout:auto!important;width:max-content!important;min-width:0!important}` +
      `table[${marca}] :is(th,td){width:auto!important;min-width:0!important;max-width:none!important;white-space:nowrap!important}`;
    this.document.head.append(estilo);
    tabla.setAttribute(marca, '');
    const medidas: Record<string, string> = {};
    for (const field of fields) {
      const th = tabla.querySelector(`thead th[data-field="${CSS.escape(field)}"]`);
      if (!th) continue;
      // Al píxel de arriba y 2 de holgura: con la tabla fija, una columna justa redondeaba hacia abajo y la flecha de
      // orden se salía 1 px de su cabecera (Teléfono, Servicios y Agentes de Grupos).
      const px = Math.ceil(th.getBoundingClientRect().width) + 2;
      const ancho = Math.min(Math.max(px / rem, ANCHO_MINIMO), ANCHO_TOPE);
      medidas[field] = `${+ancho.toFixed(3)}rem`;
    }
    tabla.removeAttribute(marca);
    estilo.remove();
    this.anchosDePartida.update((a) => ({ ...a, ...medidas }));
    this.guardarMedidos();
  }

  /** El ancho de la tarjeta de la tabla, medido al cambiar (la ventana, el menú lateral o la selección). */
  private readonly anchoTarjeta = signal(0);
  private readonly tarjeta = viewChild<ElementRef<HTMLElement>>('tarjeta');
  private readonly medirTarjeta = effect((onCleanup) => {
    const el = this.tarjeta()?.nativeElement;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(([e]) => this.anchoTarjeta.set(Math.round(e.contentRect.width)));
    observador.observe(el);
    onCleanup(() => observador.disconnect());
  });

  /**
   * ¿Le sobraría al nombre más que su tope? Lo que suman las columnas con ancho a la vista, la casilla de selección y el
   * «⋮», más el tope del nombre, contra lo que mide la tarjeta. Solo si hay una sola columna sin ancho y menú de fila.
   */
  protected readonly conTopeDeNombre = computed(() => {
    if (!this.rowMenu() || !this.rowMenuColumn()) return false;
    const { fijas, crecen, extras, rem } = this.medidaColumnas();
    if (crecen !== 1) return false;
    return this.anchoTarjeta() > fijas + extras + parseFloat(NOMBRE_TOPE) * rem;
  });

  /**
   * Las columnas a la vista, en px: lo que suman las que traen ancho (también el arrastrado), cuántas crecen (sin ancho),
   * si una de ellas es la del nombre, y lo que ocupan la casilla de selección (2,5rem) y el «⋮» (3,5rem).
   */
  private readonly medidaColumnas = computed(() => {
    const visibles = this.visibleColumns();
    const prefs = this.columnPrefs();
    const cols = this.columns().filter((c) => c.field !== ACTIONS_FIELD && (!visibles || visibles.includes(c.field)));
    const rem = parseFloat(getComputedStyle(this.document.documentElement).fontSize) || 16;
    const nombre = this.campoNombre();
    let fijas = 0;
    let crecen = 0;
    let nombreCrece = false;
    for (const c of cols) {
      const w = prefs?.widths[c.field] ?? this.anchosDePartida()[c.field] ?? c.width;
      if (!w) {
        crecen++;
        if (c.field === nombre) nombreCrece = true;
      } else fijas += w.endsWith('rem') ? parseFloat(w) * rem : w.endsWith('px') ? parseFloat(w) : 0;
    }
    const menu = this.rowMenu() && this.rowMenuColumn();
    const extras = ((this.selectable() ? 2.5 : 0) + (menu ? 3.5 : 0)) * rem;
    return { fijas, crecen, nombreCrece, extras, rem };
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
    this.leerMedidos();
    try {
      const raw = localStorage.getItem(key);
      if (raw) this.storedPrefs.set(JSON.parse(raw));
    } catch {
      /* Sin almacenamiento (ventana privada, bloqueado): la lista sale con sus columnas por defecto. */
    }
  }

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
   * (rama `comparar/fichas`, 2026-09-16). Hace falta desde que Agentes tiene columnas opcionales (2026-09-24).
   * Y EL NOMBRE NO BAJA DE `NOMBRE_MINIMO` (DD-193): el mínimo de la página se escribe a mano y se desfasa (Agentes ganó
   * Equipos, 11rem, sin subirlo, y a 1024 a Nombre le quedaban 32 px). Si el nombre crece, el mínimo es al menos lo que
   * suman las columnas con ancho, la casilla, el «⋮» y `NOMBRE_MINIMO` por cada columna que crece: el sobrante se reparte
   * a partes iguales, y con Nombre y Email creciendo (Usuarios) a Nombre le tocaba la mitad. */
  protected readonly effectiveTableMinWidth = computed<string | undefined>(() => {
    const min = this.tableMinWidth();
    const visible = this.visibleColumns();
    let manual = min;
    if (min?.endsWith('rem') && visible) {
      const hidden = this.columns()
        .filter((c) => !visible.includes(c.field) && c.width?.endsWith('rem'))
        .reduce((sum, c) => sum + parseFloat(c.width!), 0);
      manual = `${parseFloat(min) - hidden}rem`;
    }
    const { fijas, crecen, nombreCrece, extras, rem } = this.medidaColumnas();
    if (!nombreCrece) return manual;
    /* Con los anchos medidos al abrir, el mínimo escrito a mano (la suma de los anchos de la plantilla) ya no dice lo que
     * mide la fila: manda lo medido. */
    const medido = Object.keys(this.anchosDePartida()).length > 0;
    const manualPx = medido ? 0 : manual?.endsWith('rem') ? parseFloat(manual) * rem : manual?.endsWith('px') ? parseFloat(manual) : 0;
    return `${Math.ceil(Math.max(manualPx, fijas + extras + crecen * parseFloat(NOMBRE_MINIMO) * rem))}px`;
  });

  protected readonly visibleColumns = computed<readonly string[] | undefined>(() => {
    const prefs = this.columnPrefs();
    if (!prefs) return undefined;
    return this.rowMenu() && this.rowMenuColumn() ? [...prefs.visible, ACTIONS_FIELD] : prefs.visible;
  });

  /** El globo de columnas (`sc-column-toggle`): qué columnas se ven. El orden no lo toca (se ordena arrastrando en el
   *  mismo globo). Las fijas se quedan aunque lleguen sin marcar. */
  protected onVisibleChange(keys: readonly string[]): void {
    const prefs = this.columnPrefs();
    if (!prefs) return;
    const chosen = new Set(keys);
    for (const c of this.columnChoices() ?? []) if (c.locked) chosen.add(c.key);
    this.savePrefs({ ...prefs, visible: prefs.order.filter((k) => chosen.has(k)) });
  }

  /** «Restablecer»: el orden, las columnas y los anchos de partida, como el `reset()` del ejemplo. Los anchos arrastrados
   *  se olvidan y lo medido se vuelve a medir con las filas de ahora (revisión de producto del 2026-10-15). */
  protected resetColumns(): void {
    const choices = this.columnChoices();
    if (!choices) return;
    this.anchosDePartida.set({});
    this.guardarMedidos();
    this.savePrefs(normalizePrefs(choices, undefined));
  }

  /** Mueve una columna de un puesto a otro de la lista, arrastrando o con Alt+↑/↓. Las visibles son las mismas; las fijas
   *  vuelven a su sitio aunque se suelten encima (`normalizePrefs`). */
  protected reorderColumns(from: number, to: number): void {
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
    const partida = this.anchosDePartida();
    const measured = new Set(this.columns().filter((c) => c.width || partida[c.field]).map((c) => c.field));
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

  /* Mayús+clic en la fila no abre: quien encadena selecciones con Mayúsculas no espera que se le abra una ficha encima.
   * El tramo de verdad sale de la casilla (lo gobierna `sc-datatable`). Medido el 2026-10-05: en Usuarios abría. */
  protected onRowClick(event: ScDatatableRowEvent<T>): void {
    if (event.originalEvent.shiftKey) return;
    if (this.isOpenable(event.row)) this.rowOpen.emit(event.row);
  }

  /* WCAG 2.1.1: si la fila se abre con el ratón, se abre con el teclado. Intro abre y Espacio selecciona, la
   * convención de las listas de escritorio (hasta el 2026-10-05, Espacio no hacía nada fuera de Conversaciones). Solo
   * con el foco en la FILA: un control de dentro (enlace del nombre, menú de estado, «⋮») ya tiene su acción, y su
   * tecla sube hasta el `<tr>`. */
  protected onRowKeydown(event: ScDatatableRowKeyEvent<T>): void {
    const native = event.originalEvent;
    if ((native.target as HTMLElement | null)?.tagName !== 'TR') return;
    if (native.key === ' ' && this.selectable()) {
      native.preventDefault();
      const next = new Set(this.selectedIds());
      if (!next.delete(event.row.id)) next.add(event.row.id);
      this.selectedIds.set(next);
      return;
    }
    if (native.key !== 'Enter' || !this.isOpenable(event.row)) return;
    native.preventDefault();
    this.rowOpen.emit(event.row);
  }

  /* ── Menú de fila: UNO para toda la tabla, el mismo con «⋮» y con clic derecho ─────────────── */
  private readonly menuTarget = signal<T | null>(null);
  /** Las filas del menú de la selección, mientras el menú abierto es ese (`selectionMenu`). */
  private readonly menuSelection = signal<readonly T[] | null>(null);
  protected readonly rowMenuOpen = signal(false);
  protected readonly rowMenuId = `sc-list-row-menu-${++listRowMenuIdCounter}`;
  /** Si el menú de fila es el de esta fila (uno solo para toda la tabla). */
  protected esLaDelMenu(row: T): boolean {
    return this.menuTarget() === row;
  }

  /** Estable: solo cambia al apuntar a otra fila (recrearlo en cada ciclo perdía el primer clic) o de idioma. */
  protected readonly menuItems = computed<MenuItem[]>(() => {
    this.lang();
    const seleccion = this.menuSelection();
    const deSeleccion = this.selectionMenu();
    if (seleccion && deSeleccion) return deSeleccion(seleccion);
    const row = this.menuTarget();
    const build = this.rowMenu();
    return row && build ? build(row) : [];
  });

  protected openRowMenu(row: T, menu: { toggle: (event: Event) => void }, event: Event): void {
    event.stopPropagation();
    // Como el clic derecho: con la fila entre varias marcadas, el menú es el de la selección (si la lista lo tiene).
    const marcadas = this.selectedRows();
    const deLaSeleccion = this.selectionMenuFromRow() && !!this.selectionMenu() && marcadas.length >= 2 && marcadas.includes(row);
    this.menuSelection.set(deLaSeleccion ? marcadas : null);
    this.menuTarget.set(row);
    menu.toggle(event);
  }

  protected onRowContextMenu(event: ScDatatableRowEvent<T>, menu: { toggle: (event: Event) => void }): void {
    if (!this.rowMenu() && !this.selectionMenu()) return;
    const marcadas = this.selectedRows();
    const deLaSeleccion = !!this.selectionMenu() && marcadas.length >= 2 && marcadas.includes(event.row);
    this.menuSelection.set(deLaSeleccion ? marcadas : null);
    this.menuTarget.set(deLaSeleccion ? null : event.row);
    if (this.menuItems().length) menu.toggle(event.originalEvent);
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

  /* ─── El resultado de la acción en lote: un toast, y en su barra con «Deshacer» (DD-196, DD-211 §5) ─────────── */

  private readonly deshacer = inject(UndoStackService);
  private readonly resultadoAccion = inject(ResultadoAccionService);

  /** Lo que la barra de lote cuenta tras aplicar un cambio: el texto y, mientras se pueda, el id de su «Deshacer». */
  protected readonly resultadoLote = signal<{ readonly texto: string; readonly deshacerId: string | null } | null>(null);

  /**
   * ¿HAY BARRA DE LOTE A LA VISTA? Solo entonces la tarjeta le deja su sitio (`.table-card--seleccion`). Una lista con
   * casillas pero sin `bulkEntity` (Grupos y Agentes, DD-215: eligen para exportar, sin edición en lote) no monta barra,
   * y reservarle el sitio acortaba la tabla 77 px al marcar una fila y dejaba un hueco en blanco bajo ella (medido a
   * 1840×700–900). La misma condición que `@if` de la barra en la plantilla.
   */
  protected readonly barraVisible = computed(
    () => this.selectable() && !!this.bulkEntity() && (this.selectedIds().size > 0 || !!this.resultadoLote()),
  );

  /**
   * La página aplicó un cambio en lote a `cuantos` filas: lo dice un toast, como toda acción (DD-211 §5), y la barra se
   * queda donde estaba y lo cuenta con «Deshacer» hasta que se cierra, se vuelve a seleccionar o se sale de la página:
   * el toast se va solo y el deshacer tiene que seguir a mano (DD-196). `deshacer` devuelve las filas a como estaban.
   */
  contarLote(cuantos: number, deshacer: () => void): void {
    this.cerrarResultadoLote();
    const entidad = this.bulkEntity();
    const nombre = entidad ? (cuantos === 1 ? entidad.singular : entidad.plural) : '';
    const texto = this.translate.instant('common.bulk_applied', { count: cuantos, entity: nombre }).trim();
    const revertido = this.translate.instant('common.change_reverted');
    const deshacerId = this.deshacer.registrar(revertido, deshacer, () => {
      this.resultadoLote.set({ texto: revertido, deshacerId: null });
      this.resultadoAccion.contar(revertido);
    });
    this.resultadoLote.set({ texto, deshacerId });
    this.resultadoAccion.contar(texto);
  }

  protected deshacerLote(): void {
    const id = this.resultadoLote()?.deshacerId;
    if (id) this.deshacer.runById(id);
  }

  protected cerrarResultadoLote(): void {
    const id = this.resultadoLote()?.deshacerId;
    if (id) this.deshacer.olvidar(id);
    this.resultadoLote.set(null);
  }

  /** La «×» de la barra: con filas marcadas, desmarca; sin ellas, cierra el resultado. */
  protected onBarraLoteClear(): void {
    if (this.selectedIds().size > 0) this.clearSelection();
    else this.cerrarResultadoLote();
  }

  /** Volver a seleccionar es la siguiente acción: el resultado anterior ya no vale. */
  private readonly nuevaSeleccion = effect(() => {
    if (this.selectedIds().size > 0 && this.resultadoLote()) this.cerrarResultadoLote();
  });

  private readonly alSalir = inject(DestroyRef).onDestroy(() => this.cerrarResultadoLote());

  protected readonly rowAriaLabel = (row: T): string =>
    this.translate.instant(this.selectRowKey(), { name: this.rowLabel()(row), id: row.id });
  protected readonly selectAllAriaLabel = computed(() => {
    this.lang();
    return this.translate.instant(this.selectAllKey());
  });

  protected onSearchKey(event: KeyboardEvent): void {
    escapeSearch(event, this.query(), () => this.query.set(''));
  }

  /** El menú de importar y descargar, abierto: su botón lo dice (`aria-expanded`, en el `<button>` real). */
  protected readonly fileMenuOpen = signal(false);

  /** El ancho del panel «Acciones»: el paso del Kit más cercano al de la propuesta de producto. */
  protected readonly fileMenuStyle = { width: 'var(--sc-spacing-25)' };

  /**
   * El menú «Acciones»: una fila por cosa que se puede hacer, con su icono, y sin nombrar las filas: la página ya dice
   * de qué es la lista (revisión de producto del 2026-10-15). «Exportar» cuenta la selección si la hay
   * («Exportar selección (3)»), y se apaga sin filas (su `title` dice por qué).
   */
  protected readonly fileMenuItems = computed<MenuItem[]>(() => {
    this.lang();
    const t = (key: string, params?: Record<string, string | number>) =>
      this.translate.instant(`labels.data_menu.${key}`, params);
    const seleccion = this.selectedRows().length;
    const sinFilas = this.displayed().length === 0;
    const filas: MenuItem[] = [];
    if (this.importable()) {
      filas.push({
        label: t('import_title'),
        icon: 'sc-icon-font sc-icon-font--upload',
        command: () => this.importRequest.emit(),
      });
    }
    if (this.exportable()) {
      filas.push({
        label: seleccion > 0 ? t('export_selection', { count: seleccion }) : t('export_title'),
        icon: 'sc-icon-font sc-icon-font--download',
        disabled: sinFilas,
        title: sinFilas ? t('export_empty') : undefined,
        command: () => this.onExport(),
      });
    }
    return filas;
  });

  /** Descarga la selección si la hay y, si no, lo que se ve. */
  protected onExport(): void {
    const seleccion = this.selectedRows();
    this.exportRequest.emit(seleccion.length > 0 ? seleccion : this.displayed());
  }
}
