import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MultiSelectModule } from 'primeng/multiselect';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';

import { TICKETS_ALL, TICKETS_TOTAL, TicketRow } from '../../data/seed';
import { BulkActionsComponent } from './bulk-actions.component';
import { ColumnManagerComponent, ManagedColumn } from './column-manager.component';
import { NewTicketModalComponent } from './new-ticket-modal.component';

/**
 * Tipo de filtro por columna. **Medido uno a uno en la app real** inspeccionando
 * qué componente vive dentro de cada celda de la fila de filtros — no deducido
 * del tipo de dato:
 *
 *   popover     → ID · Assigned to · Products · Refund   (botón "Filter")
 *   multiselect → Status · Group                          (MÚLTIPLE)
 *   select      → Channel · Country · Priority · Sub-status · GDPR
 *   input       → Source · Email · Created · Updated · Description · Carrier ·
 *                 MO Error Content
 *
 * Son CUATRO tipos, no dos. El placeholder de select/multiselect es "—".
 */
type FilterKind = 'popover' | 'multiselect' | 'select' | 'input' | 'none';

interface Col {
  readonly key: keyof TicketRow;
  readonly header: string;
  readonly width: string;
  readonly filter: FilterKind;
  /** Solo SIETE de las 18 ordenan, como en el original (ver `allCols`). */
  readonly sortable?: true;
}

/** Sentido de ordenación; `null` = sin ordenar (el tercer estado del ciclo). */
type SortDir = 'asc' | 'desc';

/**
 * Vista Tickets — la tabla principal de CusCare.
 *
 * Se construye sobre `p-table` de PrimeNG A PROPÓSITO: la tabla del sitio real ES
 * un p-table (clases `p-datatable-*` medidas en vivo), así que el DOM sale
 * idéntico. Los filtros usan los MISMOS componentes que el original
 * (`p-multiSelect`, `p-select`, `p-popover`) y **filtran de verdad** — no son
 * adornos: se ven el placeholder, el modo múltiple y el contador de resultados.
 */
@Component({
  selector: 'app-tickets-page',
  standalone: true,
  imports: [
    TableModule,
    MultiSelectModule,
    SelectModule,
    PopoverModule,
    FormsModule,
    RouterLink,
    NewTicketModalComponent,
    ColumnManagerComponent,
    BulkActionsComponent,
  ],
  templateUrl: './tickets-page.component.html',
  styleUrl: './tickets-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketsPageComponent {
  private readonly all: TicketRow[] = [...TICKETS_ALL];
  protected readonly total = TICKETS_TOTAL;

  /* ── Paginación + carga ─────────────────────────────────────────────────
   * El original NO cambia de página al instante: tapa el cuerpo de la tabla con
   * un overlay blanco translúcido, un spinner azul y "Loading data..." (medido:
   * `.table-body-loading-overlay` rgba(255,255,255,.72), spinner 23.36px con
   * borde 2.5px #0d6efd girando en 0.75s). Se replica ese retardo a propósito:
   * sin él, la transición del original no se ve. */
  protected readonly page = signal(1);
  protected readonly rowsPerPage = signal(10);
  protected readonly loading = signal(false);
  private loadTimer?: ReturnType<typeof setTimeout>;

  /** Páginas que pinta el paginador (las que existen con los datos del mock). */
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.rowsPerPage())),
  );

  /**
   * Los botones del paginador, con sus puntos suspensivos.
   *
   * La ventana **sigue a la página actual**; antes se pintaba siempre `1 2 3 4 5`
   * y no se movía nunca, así que al ir a la 5 el botón activo quedaba en el
   * borde y no había forma de avanzar salvo con las flechas.
   *
   * Regla MEDIDA en la app real navegando por sus 328 páginas (y confirmada con
   * 11 páginas al subir el tamaño de página, para descartar que dependiera del
   * total):
   *
   *   pág ≤ 4          → `1 2 3 4 5 … 328`
   *   pág ≥ última-3   → `1 … 324 325 326 327 328`
   *   en medio         → `1 … 4 5 6 … 328`   (pág 5 de 328, y pág 5 de 11)
   *
   * El caso de MENOS de 6 páginas no se pudo observar (su tabla nunca baja de
   * 11 y no hay tamaño de página que lo consiga). Con la fórmula tal cual, un
   * total de 6 pintaría `1 … 2 3 4 5 6`: unos puntos suspensivos entre dos
   * números consecutivos. Eso se suprime a propósito —única desviación de la
   * fórmula, y anotada— porque el seed de la réplica sí tiene 6 páginas y la
   * alternativa es enseñar algo que parece un fallo.
   */
  protected readonly pageItems = computed<(number | 'gap')[]>(() => {
    const last = this.pageCount();
    const cur = this.page();
    if (last <= 5) return Array.from({ length: last }, (_, i) => i + 1);

    const nums =
      cur <= 4
        ? [1, 2, 3, 4, 5]
        : cur >= last - 3
          ? [last - 4, last - 3, last - 2, last - 1]
          : [cur - 1, cur, cur + 1];

    const out: (number | 'gap')[] = [];
    if (nums[0] !== 1) out.push(1);
    for (const n of nums) {
      const prev = out.at(-1);
      if (typeof prev === 'number' && n > prev + 1) out.push('gap');
      out.push(n);
    }
    const prev = out.at(-1);
    if (typeof prev === 'number' && last > prev + 1) out.push('gap');
    if (prev !== last) out.push(last);
    return out;
  });

  protected goToPage(p: number): void {
    if (p < 1 || p > this.pageCount() || p === this.page()) return;
    clearTimeout(this.loadTimer);
    this.loading.set(true);
    // 380ms: suficiente para que la transición se PERCIBA, como en el original.
    this.loadTimer = setTimeout(() => {
      this.page.set(p);
      this.loading.set(false);
    }, 380);
  }

  /**
   * Catálogo COMPLETO: las 18 columnas con su ancho MEDIDO y su tipo de filtro
   * REAL. Lo que la tabla pinta es `cols`, que aplica orden y visibilidad.
   *
   * `sortable` en SIETE, las mismas del original y ni una más — leídas de su
   * bundle (`sortable: true` aparece 7 veces, 0 con `false`): id · status ·
   * userassign (aquí `assignedTo`) · group · createdAt (`created`) · updatedAt
   * (`updated`) · priority. Que las otras once NO ordenen es parte de la
   * réplica, no un descuido.
   */
  private readonly allCols: readonly Col[] = [
    { key: 'id', header: 'ID', width: '80px', filter: 'popover', sortable: true },
    { key: 'status', header: 'Status', width: '120px', filter: 'multiselect', sortable: true },
    { key: 'assignedTo', header: 'Assigned to', width: '186px', filter: 'popover', sortable: true },
    { key: 'group', header: 'Group', width: '130px', filter: 'multiselect', sortable: true },
    { key: 'channel', header: 'Channel', width: '110px', filter: 'select' },
    { key: 'source', header: 'Source', width: '140px', filter: 'input' },
    { key: 'email', header: 'Email', width: '167px', filter: 'input' },
    { key: 'country', header: 'Country', width: '101px', filter: 'select' },
    { key: 'products', header: 'Products', width: '348px', filter: 'popover' },
    { key: 'created', header: 'Created', width: '167px', filter: 'input', sortable: true },
    { key: 'updated', header: 'Updated', width: '167px', filter: 'input', sortable: true },
    { key: 'description', header: 'Description', width: '250px', filter: 'input' },
    { key: 'priority', header: 'Priority', width: '110px', filter: 'select', sortable: true },
    { key: 'subStatus', header: 'Sub-status', width: '130px', filter: 'select' },
    { key: 'refund', header: 'Refund', width: '130px', filter: 'popover' },
    { key: 'gdpr', header: 'GDPR', width: '155px', filter: 'select' },
    { key: 'carrier', header: 'Carrier', width: '150px', filter: 'input' },
    { key: 'moErrorContent', header: 'MO Error Content', width: '167px', filter: 'input' },
  ];

  /**
   * Las filas marcadas, en objeto (no sólo su id): el modal de confirmación de
   * las acciones en bloque LISTA los tickets afectados en una tabla. Se busca en
   * `all`, no en la página visible, porque la selección sobrevive al paginar.
   */
  protected readonly selectedRows = computed<TicketRow[]>(() => {
    const sel = this.selectedIds();
    return sel.size ? this.all.filter((r) => sel.has(r.id)) : [];
  });

  /* ── Selección de filas ─────────────────────────────────────────────────
   * Medido en la real y NO replicado hasta ahora: la selección cambia la barra.
   *   · sin filas marcadas → las 4 acciones en bloque están DESHABILITADAS
   *   · con filas marcadas → se habilitan, y aparecen "Clear selection" y
   *     "Download (N)" con el contador
   *   · la fila marcada se pinta de #eef1f6 (clase `row-selected` en el original)
   * Los botones de acción tenían el estilo mal: son 12px/500 con borde #dadfe6
   * y 32px de alto, no 11.68/400. */
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());

  protected readonly selectedCount = computed(() => this.selectedIds().size);
  protected readonly hasSelection = computed(() => this.selectedCount() > 0);

  /**
   * Filas de la página que SE PUEDEN seleccionar. Las bloqueadas por otro
   * agente quedan fuera: en su celda hay un candado, no una casilla, así que
   * marcarlas desde la cabecera dejaba un contador que no cuadraba con lo que
   * se ve (lo cazó el e2e: "Seleccionar todo" decía 10 y había 9 casillas).
   */
  private readonly selectableRows = computed(() => this.rows().filter((r) => !r.locked));

  /** Todas las filas seleccionables de la página, marcadas. */
  protected readonly allVisibleSelected = computed(() => {
    const rows = this.selectableRows();
    if (!rows.length) return false;
    const sel = this.selectedIds();
    return rows.every((r) => sel.has(r.id));
  });

  protected isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  protected toggleRow(id: string): void {
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** El checkbox de cabecera actúa sobre la página visible, no sobre las 60. */
  protected toggleAllVisible(): void {
    const rows = this.selectableRows();
    const allIn = this.allVisibleSelected();
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      for (const r of rows) {
        if (allIn) next.delete(r.id);
        else next.add(r.id);
      }
      return next;
    });
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  /* ── Columnas: visibilidad y ORDEN ("Manage columns") ────────────────────
   * El orden se guarda como lista de rótulos, no reordenando `allCols`: así el
   * catálogo original queda intacto y "Reset to default" es volver a null. */
  private readonly hiddenColumns = signal<ReadonlySet<string>>(new Set());
  private readonly columnOrder = signal<readonly string[] | null>(null);
  protected readonly columnsOpen = signal(false);

  /** El catálogo en el orden vigente (el del usuario, o el de origen). */
  private readonly orderedCols = computed<Col[]>(() => {
    const order = this.columnOrder();
    if (!order) return [...this.allCols];
    const byHeader = new Map(this.allCols.map((c) => [c.header, c]));
    const out = order.map((h) => byHeader.get(h)).filter((c): c is Col => !!c);
    // Cinturón: si algún rótulo se cayera del orden guardado, se re-añade al
    // final en vez de desaparecer de la tabla en silencio.
    for (const c of this.allCols) if (!out.includes(c)) out.push(c);
    return out;
  });

  /** Lo que consume el panel: rótulo + si está visible, ya en orden. */
  protected readonly managedColumns = computed<ManagedColumn[]>(() =>
    this.orderedCols().map((c) => ({
      header: c.header,
      visible: !this.hiddenColumns().has(c.header),
    })),
  );

  /** Las columnas que la tabla pinta de verdad. */
  protected readonly cols = computed(() =>
    this.orderedCols().filter((c) => !this.hiddenColumns().has(c.header)),
  );

  protected reorderColumns(headers: string[]): void {
    this.columnOrder.set(headers);
  }

  protected toggleColumn(header: string): void {
    this.hiddenColumns.update((prev) => {
      const next = new Set(prev);
      if (next.has(header)) next.delete(header);
      else next.add(header);
      return next;
    });
  }

  /** "Reset to default": devuelve visibilidad Y orden. */
  protected resetColumns(): void {
    this.hiddenColumns.set(new Set());
    this.columnOrder.set(null);
  }

  /* ── Popover de filtro ──────────────────────────────────────────────────
   * Los tres modos del original. "All" es el que viene puesto. */
  protected readonly popModes = ['All', 'New', 'Update'] as const;
  protected readonly mode = signal<Record<string, string | undefined>>({});

  protected setMode(key: string, m: string): void {
    this.mode.update((prev) => ({ ...prev, [key]: m }));
  }

  /* ── Modal de nuevo ticket ──────────────────────────────────────────────
   * En la real, "+ New ticket" NO abre un formulario: abre un selector de grupo.
   *
   * Y pulsar "Save" ahí **crea un ticket de verdad** — por eso no se pulsó al
   * extraer. Confirmado cuando lo hizo Rafa: la app saltó a
   * `…/tickets/ticket/2051827/pre-ticket` con el ticket ya existiendo. Lo que
   * sale NO es un formulario: es la pantalla de detalle en vacío con el modal
   * "Search customer" encima. */
  protected readonly newTicketOpen = signal(false);
  protected readonly chosenGroup = signal<string | null>(null);
  private readonly router = inject(Router);

  protected onGroupChosen(group: string): void {
    this.chosenGroup.set(group);
    this.newTicketOpen.set(false);
    // El id lo asigna el backend en la real; aquí basta uno sintético.
    void this.router.navigate(['/private/cuscare/tickets/ticket', 'new', 'pre-ticket']);
  }

  /* ── Estado de los filtros ──────────────────────────────────────────────
   * Un mapa por columna. Los múltiples guardan array; el resto, string. */
  protected readonly multi = signal<Record<string, string[] | undefined>>({});
  protected readonly single = signal<Record<string, string | null | undefined>>({});
  protected readonly text = signal<Record<string, string | undefined>>({});

  /** Opciones derivadas de los datos: así nunca ofrecen algo que no existe. */
  private optionsOf(key: keyof TicketRow): { label: string; value: string }[] {
    const seen = new Set<string>();
    for (const r of this.all) {
      const v = r[key];
      if (typeof v === 'string' && v) seen.add(v);
    }
    return [...seen].sort().map((v) => ({ label: v, value: v }));
  }

  protected readonly optionsByCol = computed(() => {
    const out: Record<string, { label: string; value: string }[]> = {};
    for (const c of this.allCols) {
      if (c.filter === 'multiselect' || c.filter === 'select') out[c.key] = this.optionsOf(c.key);
    }
    return out;
  });

  /** Filas tras aplicar TODOS los filtros activos (sin paginar). */
  private readonly filtered = computed<TicketRow[]>(() => {
    const m = this.multi();
    const s = this.single();
    const t = this.text();
    return this.all.filter((row) => {
      for (const [key, vals] of Object.entries(m)) {
        if (vals?.length && !vals.includes(String(row[key as keyof TicketRow]))) return false;
      }
      for (const [key, val] of Object.entries(s)) {
        if (val && String(row[key as keyof TicketRow]) !== val) return false;
      }
      for (const [key, val] of Object.entries(t)) {
        if (!val) continue;
        const cell = row[key as keyof TicketRow];
        const hay = Array.isArray(cell) ? cell.join(' ') : String(cell ?? '');
        if (!hay.toLowerCase().includes(val.toLowerCase())) return false;
      }
      return true;
    });
  });

  /* ── Ordenación por cabecera ─────────────────────────────────────────────
   * El original ordena en SERVIDOR (su tabla emite `sortChanged` y el padre
   * repite la consulta con `_order`). Aquí los 3280 registros están en memoria,
   * así que la ordenación se hace ENTRE `filtered()` y `rows()`: el orden no
   * cambia cuántas filas hay, así que ni `pageCount` ni el contador se enteran.
   *
   * NO se usa `pSortableColumn` de PrimeNG: `<p-table [value]="rows()">` recibe
   * solo las 10 filas de la página, así que su orden nativo ordenaría la página
   * visible en vez de las 3280 — parecería funcionar y estaría mal.
   *
   * El ciclo es el del original (`cycleColumnSort`): none → asc → desc → none,
   * una sola columna ordenada a la vez, y vuelta a la página 1. */
  protected readonly sortKey = signal<keyof TicketRow | null>(null);
  protected readonly sortDir = signal<SortDir>('asc');

  protected cycleSort(col: Col): void {
    if (!col.sortable) return;
    if (this.sortKey() !== col.key) {
      this.sortKey.set(col.key);
      this.sortDir.set('asc');
    } else if (this.sortDir() === 'asc') {
      this.sortDir.set('desc');
    } else {
      this.sortKey.set(null); // tercer estado: se deshace la ordenación
    }
    this.page.set(1);
  }

  /** `aria-sort` de la cabecera: lo que anuncia un lector de pantalla. */
  protected ariaSort(col: Col): 'ascending' | 'descending' | 'none' | null {
    if (!col.sortable) return null;
    if (this.sortKey() !== col.key) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  /**
   * Valor por el que se compara cada columna. Sin esto, tres de las siete
   * ordenarían mal aunque «pareciera» que ordenan:
   *   · `id` es texto pero numera: «10» va después de «9», no antes.
   *   · las fechas son `dd-MM-yyyy HH:mm`; alfabéticamente, todos los días 11
   *     quedan juntos sin importar el mes.
   *   · `priority` tiene un orden propio (Low < Medium < High), no el del
   *     alfabeto, que lo dejaría High < Low < Medium.
   */
  private sortValue(row: TicketRow, key: keyof TicketRow): number | string {
    const raw = row[key];
    if (key === 'id') return Number(raw);
    if (key === 'created' || key === 'updated') {
      const m = /^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2})$/.exec(String(raw));
      return m ? Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]) : 0;
    }
    if (key === 'priority') {
      const rank: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
      return rank[String(raw)] ?? 0;
    }
    return Array.isArray(raw) ? raw.join(' ') : String(raw ?? '');
  }

  /** Filtradas y, si hay columna elegida, ordenadas. */
  private readonly sorted = computed<TicketRow[]>(() => {
    const key = this.sortKey();
    const base = this.filtered();
    if (!key) return base;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    // Copia: `filtered()` puede devolver el array de origen y `sort` ordena in place.
    return [...base].sort((a, b) => {
      const va = this.sortValue(a, key);
      const vb = this.sortValue(b, key);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  });

  /** La página actual de las filas filtradas: lo que se pinta. */
  protected readonly rows = computed<TicketRow[]>(() => {
    const start = (this.page() - 1) * this.rowsPerPage();
    return this.sorted().slice(start, start + this.rowsPerPage());
  });

  /** Índices que muestra el pie ("11–20 of 60"). */
  protected readonly range = computed(() => {
    const n = this.filtered().length;
    if (!n) return { from: 0, to: 0, of: 0 };
    const from = (this.page() - 1) * this.rowsPerPage() + 1;
    return { from, to: Math.min(from + this.rowsPerPage() - 1, n), of: n };
  });

  /** ¿Hay algún filtro puesto? (habilita "Delete filters"). */
  protected readonly hasFilters = computed(
    () =>
      Object.values(this.multi()).some((v) => v?.length) ||
      Object.values(this.single()).some(Boolean) ||
      Object.values(this.text()).some(Boolean),
  );

  /* Al cambiar cualquier filtro se vuelve a la página 1: si no, se puede quedar
     mirando una página que ya no existe en el resultado filtrado. */
  protected setMulti(key: string, value: string[]): void {
    this.multi.update((m) => ({ ...m, [key]: value }));
    this.page.set(1);
  }

  protected setSingle(key: string, value: string | null): void {
    this.single.update((s) => ({ ...s, [key]: value }));
    this.page.set(1);
  }

  protected setText(key: string, value: string): void {
    this.text.update((t) => ({ ...t, [key]: value }));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.multi.set({});
    this.single.set({});
    this.text.set({});
    this.page.set(1);
  }

  protected value(row: TicketRow, key: keyof TicketRow): string {
    const v = row[key];
    return Array.isArray(v) ? v.join(', ') : String(v ?? '');
  }
}
