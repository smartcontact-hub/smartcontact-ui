import { map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService, type MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { UndoStackService, XlsxExportService } from '@core/services';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { IllustratedAvatarComponent } from '@shared/components';
import {
  ScBulkActionBarComponent as BulkActionBarComponent,
  useBulkEntityI18n,
  BulkEditCommit,
  BulkEditFieldOption,
  ScBulkEditMenuComponent as BulkEditMenuComponent,
  type ScColumnCellContext,
  type ScColumnDef,
  ColumnDef,
  ScColumnSelectorComponent as ColumnSelectorComponent,
  ScDatatableComponent as DatatableComponent,
  type ScDatatableRowEvent,
  type ScDatatableRowKeyEvent,
  type ScRowStyleClassFn,
  type ScDatatableSortEvent,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ScGroupPopoverComponent as GroupPopoverComponent,
  ImpactBadge,
  ImpactItem,
  ScImpactPreviewDialogComponent as ImpactPreviewDialogComponent,
  ScInlineRenameCellComponent as InlineRenameCellComponent,
  ScSearchComponent as SearchComponent,
} from '@smartcontact-hub/components';
import {
  AGENT_TYPE_LABEL_KEYS,
  Agent,
  AgentChannel,
  AgentType,
  PRESENCE_LABEL_KEYS,
  PresenceStatus,
} from '../data/agents-data';
import { AgentBulkField, AgentsStore } from '../state/agents.store';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';
import { Channel } from '@features/admin/services/group-agent-links.types';

type SortField = 'name' | 'code' | 'extension' | 'type' | 'status';

interface PendingBulkEdit {
  readonly field: AgentBulkField;
  readonly fieldLabel: string;
  readonly value: unknown;
  readonly valueLabel: string;
}

/* v2 — schema bumped from a Set<string> to an ordered string[] when the
 * ColumnSelector gained drag-to-reorder + per-column defaultVisible.
 * Older `_v1` caches no longer parse and are silently ignored. */
const COLUMN_PREF_KEY = 'sc-agents-columns-v2';
const AGENT_TYPES: readonly AgentType[] = ['normal', 'cuscare', 'cuscare_carrier', 'admin_cuscare'];
const PRESENCE_STATES: readonly PresenceStatus[] = [
  'disponible',
  'no_disponible',
  'bano',
  'comida',
  'formacion',
];

@Component({
  selector: 'sc-agents-list-page',
  imports: [
    BulkActionBarComponent,
    BulkEditMenuComponent,
    ButtonComponent,
    ColumnSelectorComponent,
    DatatableComponent,
    DeleteEntityDialogComponent,
    EmptyStateComponent,
    IconComponent,
    IllustratedAvatarComponent,
    GroupPopoverComponent,
    ImpactPreviewDialogComponent,
    InlineRenameCellComponent,
    MenuModule,
    SearchComponent,
    TranslateModule,
  ],
  templateUrl: './agents-list-page.component.html',
  styleUrl: './agents-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentsListPageComponent {
  private readonly agentsStore = inject(AgentsStore);
  private readonly groupsStore = inject(GroupsStore);
  private readonly linksStore = inject(GroupAgentLinksStore);
  private readonly xlsx = inject(XlsxExportService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly undoStack = inject(UndoStackService);
  private readonly topBarSlot = inject(TopBarSlotService);
  private readonly destroyRef = inject(DestroyRef);

  /** CTA "Nuevo agente" proyectado a la TopBar (modelo "todo arriba" S59):
   * la banda de page-header desaparece; identidad → breadcrumb, acción → barra. */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    afterNextRender(() => {
      const tpl = this.topbarActions();
      if (tpl) this.topBarSlot.setActions(tpl);
    });
    this.destroyRef.onDestroy(() => this.topBarSlot.clearActions());
  }

  /** Derived: union of every active-link channel for the given agent. */
  protected channelsForAgent(agentId: number): readonly Channel[] {
    const set = new Set<Channel>();
    for (const link of this.linksStore.linksForAgent(agentId)) {
      if (!link.active) continue;
      for (const c of link.channels) set.add(c);
    }
    const order: readonly Channel[] = ['phone', 'chat', 'email'];
    return order.filter((c) => set.has(c));
  }

  /** Derived: group refs for the given agent (id, name, active flag). */
  protected groupsForAgent(
    agentId: number,
  ): readonly { id: number; name: string; active: boolean }[] {
    const byId = new Map(this.groupsStore.groups().map((g) => [g.id, g]));
    return this.linksStore
      .linksForAgent(agentId)
      .map((l) => {
        const g = byId.get(l.groupId);
        return g ? { id: g.id, name: g.name, active: l.active } : null;
      })
      .filter((g): g is { id: number; name: string; active: boolean } => g !== null);
  }

  protected readonly plusIcon = 'add';
  protected readonly searchIcon = 'search';
  protected readonly closeIcon = 'close';
  protected readonly downloadIcon = 'download';
  protected readonly moreIcon = 'more_vert';
  protected readonly phoneIcon = 'call';
  protected readonly chatIcon = 'chat_bubble';
  protected readonly emailIcon = 'mail';
  protected readonly emptyIcon = 'headphones';
  protected readonly pageIcon = 'headphones';

  protected readonly typeKeys = AGENT_TYPE_LABEL_KEYS;
  protected readonly presenceKeys = PRESENCE_LABEL_KEYS;
  protected readonly presenceStates = PRESENCE_STATES;
  protected readonly agents = this.agentsStore.agents;

  protected readonly searchQuery = signal('');
  protected readonly sortField = signal<SortField | null>(null);
  protected readonly sortDir = signal<'asc' | 'desc'>('asc');
  /**
   * Selección por id — la fuente de verdad de la página. De ella cuelgan la
   * barra masiva, la edición en lote, el borrado y el diálogo de impacto;
   * `sc-datatable` habla de FILAS, así que `selectedAgents` / `onSelectionChange`
   * traducen en los dos sentidos y nada más de la página cambia.
   *
   * `SelectionState` se fue con la migración: lo único que aportaba —`allSelected`
   * y `toggleAll` sobre la lista visible— lo sirven ahora `p-tableHeaderCheckbox`
   * y `p-tableCheckbox`, con la misma semántica (la casilla de cabecera marca lo
   * FILTRADO, no todo).
   */
  protected readonly selectedIds = signal<ReadonlySet<number>>(new Set());
  /** Fila a la que apunta el kebab compartido. Ver `menuItems`. */
  protected readonly menuTargetAgent = signal<Agent | null>(null);
  protected readonly deleteTarget = signal<readonly Agent[] | null>(null);
  protected readonly renamingId = signal<number | null>(null);
  protected readonly pendingBulkEdit = signal<PendingBulkEdit | null>(null);
  protected readonly columnPrefKey = COLUMN_PREF_KEY;
  /** Ordered list of currently-visible column keys. Drives both the
   *  column-selector menu and the table's data-driven `<thead>` /
   *  `<tbody>` render loops. */
  private readonly orderedColumns = signal<readonly string[]>([]);

  /**
   * Effective column order rendered by the table. Falls back to the
   * declared columnDefs (filtered by `defaultVisible`) when the
   * column-selector hasn't emitted yet — without this guard the table
   * would paint with an EMPTY visible list on first paint, es decir sin
   * ninguna columna de contenido.
   */
  protected readonly visibleColumnKeys = computed<readonly string[]>(() => {
    const ordered = this.orderedColumns();
    if (ordered.length > 0) return ordered;
    return this.columnDefs()
      .filter((c) => c.defaultVisible !== false)
      .map((c) => c.key);
  });

  protected readonly columnDefs = computed<readonly ColumnDef[]>(() => [
    {
      key: 'code',
      label: this.translate.instant('agents.table.code'),
      defaultVisible: false,
    },
    { key: 'name', label: this.translate.instant('agents.table.name'), locked: true },
    { key: 'extension', label: this.translate.instant('agents.table.extension') },
    { key: 'channels', label: this.translate.instant('agents.table.channels') },
    { key: 'type', label: this.translate.instant('agents.table.type') },
    { key: 'presence', label: this.translate.instant('agents.table.presence') },
    { key: 'status', label: this.translate.instant('agents.table.status') },
    { key: 'groups', label: this.translate.instant('agents.table.groups') },
  ]);

  /* ── La tabla, ahora `sc-datatable` ───────────────────────────────────
   * Las nueve celdas son composiciones propias de la página (avatar +
   * renombrado inline, chips de canal, selector de presencia, kebab…), así
   * que todas van por `cellTemplate`: el DS no conoce el tipo `Agent` ni
   * tiene por qué.
   *
   * `columns` es un `computed()` que LEE los `viewChild` a propósito. Esos
   * `TemplateRef` resuelven tarde, y una lista construida en el campo se
   * quedaría con `cellTemplate: undefined` para siempre — la tabla pintaría
   * `row[field]` en crudo. Al ser computed, se recalcula en cuanto resuelven.
   *
   * El `field` de cada columna es EL MISMO `key` que usa el `columnDefs` del
   * `sc-column-selector`: es lo que casa `[visibleColumns]` con el selector
   * (y lo que hay persistido en `sc-agents-columns-v2`).
   */
  private readonly codeTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('codeTpl');
  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('nameTpl');
  private readonly extensionTpl =
    viewChild<TemplateRef<ScColumnCellContext<Agent>>>('extensionTpl');
  private readonly channelsTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('channelsTpl');
  private readonly typeTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('typeTpl');
  private readonly presenceTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('presenceTpl');
  private readonly statusTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('statusTpl');
  private readonly groupsTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('groupsTpl');
  private readonly actionsTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('actionsTpl');

  /** Dependencia de IDIOMA para las cabeceras.
   *
   * `columns` es un `computed()` cuyas únicas dependencias eran los `viewChild`
   * de las plantillas de celda. Como los `header` se resuelven con
   * `translate.instant()` —no con el pipe `| translate`, que es impuro y sí
   * reaccionaba— el computed NO se re-evaluaba al cambiar de idioma y las
   * cabeceras se quedaban CONGELADAS en el idioma de carga.
   *
   * Lo destapó `audit:datatables` en su primera pasada, sobre 7 páginas. No lo
   * veía ningún gate: `i18n:check` solo compara claves y todo el e2e corre en
   * español. Mismo patrón que ya usaba `repo-list-page` para otra cosa. */
  /** Nombre accesible de las casillas de selección.
   *
   * Sin esto PrimeNG anuncia sus literales por defecto —`'Row Selected'`,
   * `'All items selected'`— que son inglés FIJO (no pasan por i18n) y no dicen
   * qué fila es. La tabla a mano sí las nombraba; la migración lo perdió en
   * silencio en todas. Ver `ScRowAriaLabelFn`. */
  protected readonly ariaFila = (row: { name: string }): string =>
    this.translate.instant('common.select_row', { name: row.name });
  protected readonly ariaTodo = this.translate.instant('common.select_all');

  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang),
    ),
    { initialValue: this.translate.currentLang },
  );

  protected readonly columns = computed<readonly ScColumnDef<Agent>[]>(() => [
    {
      field: 'code',
      header: this.translate.instant('agents.table.code'),
      sortable: true,
      cellTemplate: this.codeTpl(),
    },
    {
      field: 'name',
      header: this.translate.instant('agents.table.name'),
      sortable: true,
      cellTemplate: this.nameTpl(),
    },
    {
      field: 'extension',
      header: this.translate.instant('agents.table.extension'),
      sortable: true,
      cellTemplate: this.extensionTpl(),
    },
    {
      field: 'channels',
      header: this.translate.instant('agents.table.channels'),
      cellTemplate: this.channelsTpl(),
    },
    {
      // `field: 'type'` no existe en `Agent` (la propiedad es `agentType`), así
      // que el orden client-side de p-table sobre esta columna compara
      // undefined con undefined: es un no-op estable. Quien ordena de verdad es
      // `sorted()`, que sí sabe leer `agentType`. El `field` no se puede
      // renombrar: es la identidad de la columna para el selector y lo que hay
      // guardado en localStorage.
      field: 'type',
      header: this.translate.instant('agents.table.type'),
      sortable: true,
      cellTemplate: this.typeTpl(),
    },
    {
      field: 'presence',
      header: this.translate.instant('agents.table.presence'),
      cellTemplate: this.presenceTpl(),
    },
    {
      field: 'status',
      header: this.translate.instant('agents.table.status'),
      sortable: true,
      cellTemplate: this.statusTpl(),
    },
    {
      field: 'groups',
      header: this.translate.instant('agents.table.groups'),
      cellTemplate: this.groupsTpl(),
    },
    // Columna sin datos: `field` es solo su identidad, y la cabecera va vacía
    // igual que el `<th aria-hidden>` que sustituye.
    {
      field: 'actions', stopRowClick: true,
      header: '', headerAriaLabel: this.translate.instant('common.actions'),
      width: '48px',
      align: 'right',
      cellTemplate: this.actionsTpl(),
    },
  ]);

  /**
   * Lo que `sc-datatable` pinta: las columnas que manda el `sc-column-selector`
   * (visibilidad Y orden) más la de acciones, que no es configurable y va
   * siempre la última.
   */
  protected readonly tableVisibleColumns = computed<readonly string[]>(() => [
    ...this.visibleColumnKeys(),
    'actions',
  ]);

  protected readonly bulkEditFields = computed<readonly BulkEditFieldOption[]>(() => [
    {
      key: 'status',
      label: this.translate.instant('agents.table.status'),
      values: [
        { value: 'active', label: this.translate.instant('agents.status.active') },
        { value: 'inactive', label: this.translate.instant('agents.status.inactive') },
      ],
    },
    {
      key: 'presenceStatus',
      label: this.translate.instant('agents.table.presence'),
      values: PRESENCE_STATES.map((p) => ({
        value: p,
        label: this.translate.instant(this.presenceKeys[p]),
      })),
    },
    {
      key: 'agentType',
      label: this.translate.instant('agents.table.type'),
      values: AGENT_TYPES.map((t) => ({
        value: t,
        label: this.translate.instant(this.typeKeys[t]),
      })),
    },
    {
      key: 'recording',
      label: this.translate.instant('agents.permission.recording'),
      values: [
        { value: 'true', label: this.translate.instant('common.yes') },
        { value: 'false', label: this.translate.instant('common.no') },
      ],
    },
  ]);

  protected readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const all = this.agents();
    if (!q) return all;
    return all.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.includes(q) ||
        a.extension.includes(q) ||
        (a.email?.toLowerCase().includes(q) ?? false),
    );
  });

  protected readonly sorted = computed(() => {
    const list = [...this.filtered()];
    const field = this.sortField();
    const dir = this.sortDir();
    list.sort((a, b) => {
      if (!field) return 0;
      let cmp = 0;
      switch (field) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'es');
          break;
        case 'code':
          cmp = a.code.localeCompare(b.code);
          break;
        case 'extension':
          cmp = a.extension.localeCompare(b.extension);
          break;
        case 'type':
          cmp = a.agentType.localeCompare(b.agentType);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return dir === 'asc' ? cmp : -cmp;
    });
    return list;
  });

  /* Puente de selección: la fuente de verdad sigue siendo `selectedIds` —de
   * ella cuelgan la barra masiva, la edición en lote, el borrado y el export— y
   * `sc-datatable` habla de filas. Traducir en los dos sentidos aquí evita
   * reescribir media página por un cambio de tabla. */
  /* La fila abre la ficha, así que tiene que ANUNCIARLO. Al pintar el `<tr>`
   * el DS, `pSelectableRowDisabled` (modo multiple) le quita la clase de la
   * que PrimeNG saca el cursor, y la fila quedaba abriendo en silencio —
   * medido: `cursor: auto`. La clase la recoge la piel compartida. Mientras
   * se renombra en sitio no se marca: ahí el click es del input. */
  protected readonly rowClass = computed<ScRowStyleClassFn<Agent>>(() => {
    const renaming = this.renamingId();
    return (row) => (row.id === renaming ? undefined : 'table__row--clickable');
  });

  protected readonly selectedAgents = computed<readonly Agent[]>(() => {
    const ids = this.selectedIds();
    return this.sorted().filter((agent) => ids.has(agent.id));
  });

  protected onSelectionChange(selection: Agent | readonly Agent[] | null): void {
    const rows = Array.isArray(selection) ? selection : selection ? [selection as Agent] : [];
    this.selectedIds.set(new Set(rows.map((agent) => agent.id)));
  }

  protected readonly deleteItems = computed(() =>
    (this.deleteTarget() ?? []).map((a) => ({ id: a.id, name: a.name })),
  );

  protected readonly bulkEntity = useBulkEntityI18n({
    singular: 'common.bulk.entity.agent_singular',
    plural: 'common.bulk.entity.agent_plural',
  });

  protected readonly impactItems = computed<readonly ImpactItem[]>(() => {
    const ids = this.selectedIds();
    return this.agents()
      .filter((a) => ids.has(a.id))
      .map((a) => ({ id: a.id, name: a.name, hint: `(ext. ${a.extension || '—'})` }));
  });

  protected readonly impactBadge = computed<ImpactBadge | null>(() => {
    const op = this.pendingBulkEdit();
    if (!op) return null;
    return { fieldLabel: op.fieldLabel, newValueLabel: op.valueLabel };
  });

  protected channelIcon(channel: AgentChannel) {
    if (channel === 'phone') return this.phoneIcon;
    if (channel === 'chat') return this.chatIcon;
    return this.emailIcon;
  }

  /**
   * Clave i18n del tipo de agente. Es un método y no un indexado en plantilla
   * porque el contexto de `<ng-template let-agent>` es `any`, y `typeKeys[any]`
   * sobre un `Record<AgentType, string>` es un índice implícitamente `any` que
   * el AOT rechaza (TS7053). Con la fila dentro de un `@for` tipado no pasaba.
   */
  protected typeLabelKey(agent: Agent): string {
    return this.typeKeys[agent.agentType];
  }

  protected onOrderedColumnsChange(keys: readonly string[]): void {
    this.orderedColumns.set(keys);
  }

  /**
   * La cabecera de orden la pinta ahora el DS (`pSortableColumn` + icono, con
   * su `aria-sort` y su activación por teclado), así que `toggleSort` y
   * `getSortDir` desaparecen: aquí solo se recoge el estado que emite.
   *
   * `sorted()` sigue siendo quien ordena de verdad —es lo que lee el export y
   * lo que sabe que "type" se ordena por `agentType`—. p-table reordena
   * ADEMÁS el mismo array en sitio con un comparador idéntico
   * (`localeCompare`), así que las dos pasadas convergen en vez de pelearse.
   */
  protected onSortChange(event: ScDatatableSortEvent): void {
    this.sortField.set((event.field as SortField | undefined) ?? null);
    this.sortDir.set(event.order < 0 ? 'desc' : 'asc');
  }

  /* `toggleSelect` / `toggleSelectAll` / `allSelected` murieron con la
   * migración a `sc-datatable`: la casilla de fila y la de cabecera las sirven
   * `p-tableCheckbox` y `p-tableHeaderCheckbox`, con la misma semántica de
   * antes (la de cabecera marca lo FILTRADO, no todo). */

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  protected onCreateClick(): void {
    void this.router.navigateByUrl('/admin/agentes/crear');
  }

  /** Row-body click → enter edit. Ignored if user is renaming this row.
   *
   *  El DS ya separa los dos gestos: la celda de la casilla corta la
   *  propagación, así que marcar cinco filas no abre cinco fichas. Lo mismo
   *  hacen el kebab y el selector de presencia desde su plantilla. */
  protected onRowClick(agent: Agent): void {
    if (this.renamingId() === agent.id) return;
    void this.router.navigateByUrl(`/admin/agentes/editar/${agent.id}`);
  }

  /** Click derecho → el MISMO `<p-menu>` que el kebab (R3). El
   *  `preventDefault()` del menú nativo ya lo hace el DS. */
  /* WCAG 2.1.1: la fila abre la ficha con el ratón, así que tiene que abrirla
   * también con el teclado. Estas tres listas NUNCA lo tuvieron —ni antes ni
   * después de migrar; se comprobó en el árbol anterior: cero `tabindex`, cero
   * `keydown`, cero enlaces— o sea que la acción existía solo para quien usa
   * ratón. Enter abre; Espacio lo deja para la casilla, que es el reparto que
   * fijó la Ola 6 en transcripciones. */
  protected onRowKeydown(event: ScDatatableRowKeyEvent<Agent>): void {
    if (event.originalEvent.key !== 'Enter') return;
    event.originalEvent.preventDefault();
    this.onRowClick(event.row);
  }

  protected onRowContextMenu(
    event: ScDatatableRowEvent<Agent>,
    menu: { toggle: (e: Event) => void },
  ): void {
    this.setMenuTarget(event.row);
    menu.toggle(event.originalEvent);
  }

  /** Modelo del kebab compartido. Es un computed ESTABLE: solo cambia al
   *  apuntar a otra fila (o al variar el tamaño de la selección, que decide
   *  si "Duplicar" aplica). Con `[model]="build(agent)"` el array se recreaba
   *  en cada ciclo de CD, PrimeNG repintaba el menú y se perdía el primer
   *  clic (hacía falta doble). Mismo patrón que las tres hermanas de memory. */
  protected readonly menuItems = computed<MenuItem[]>(() => {
    const agent = this.menuTargetAgent();
    return agent ? this.buildMenuItems(agent) : [];
  });

  protected setMenuTarget(agent: Agent): void {
    this.menuTargetAgent.set(agent);
  }

  private buildMenuItems(agent: Agent): MenuItem[] {
    return [
      {
        label: this.translate.instant('common.edit'),
        icon: 'sc-icon-font sc-icon-font--edit',
        command: () => this.onRowEdit(agent),
      },
      {
        // Duplicar una fila suelta no tiene sentido con una selección
        // múltiple activa — se ocultaba ya en el panel HTML y en el menú
        // contextual anteriores, y esa regla sobrevive al cambio de motor.
        label: this.translate.instant('common.duplicate'),
        icon: 'sc-icon-font sc-icon-font--content_copy',
        visible: this.selectedIds().size <= 1,
        command: () => this.onRowDuplicate(agent),
      },
      { separator: true },
      {
        // Puntos suspensivos porque lleva a la puerta tecleada, no a un
        // borrado inmediato (C4 del plan): convención de menús de escritorio
        // — "…" significa "esto abre algo antes de hacerlo".
        label: this.translate.instant('common.delete_gate'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'rules-menu-item--danger',
        command: () => this.onRowDelete(agent),
      },
    ];
  }

  protected onRowEdit(agent: Agent): void {
    void this.router.navigateByUrl(`/admin/agentes/editar/${agent.id}`);
  }

  protected onRowDuplicate(agent: Agent): void {
    // Navega al form de creación con el source precargado en memoria.
    // El form-page detecta `?seedFromId` y precarga los campos copiables
    // (todos excepto los unique: name, email, extension, pin).
    // Si el usuario abandona sin guardar, no queda nada persistido — los
    // borradores amarillos en la lista se eliminaron en S47 (DD#XX).
    void this.router.navigate(['/admin/agentes/crear'], {
      queryParams: { seedFromId: agent.id },
    });
  }

  protected onRowDelete(agent: Agent): void {
    this.deleteTarget.set([agent]);
  }

  protected onRenameCommit(id: number, value: string): void {
    this.agentsStore.updateAgent(id, { name: value });
    this.renamingId.set(null);
    this.messages.add({
      severity: 'secondary',
      summary: this.translate.instant('agents.toasts.duplicated', { name: value }),
      life: TOAST_LIFE.info,
    });
  }

  /** Cancel the inline rename — also drops the just-created draft so the user
   * doesn't end up with a stray "Copia de …" they didn't want. */
  protected onRenameCancel(_id: number): void {
    this.renamingId.set(null);
  }

  protected onPresenceChange(agent: Agent, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as PresenceStatus;
    const previous = agent.presenceStatus ?? 'disponible';
    if (value === previous) return;
    this.agentsStore.updatePresence(agent.id, value);
    this.undoStack.push(
      this.translate.instant('common.presence_changed', {
        name: agent.name,
        status: this.translate.instant(this.presenceKeys[value]),
      }),
      this.translate.instant('common.presence_changed', {
        name: agent.name,
        status: this.translate.instant(this.presenceKeys[previous]),
      }),
      () => this.agentsStore.updatePresence(agent.id, previous),
    );
  }

  protected requestDeleteSelection(): void {
    const ids = this.selectedIds();
    const targets = this.agents().filter((a) => ids.has(a.id));
    if (targets.length > 0) this.deleteTarget.set(targets);
  }

  protected onBulkEditCommit(commit: BulkEditCommit): void {
    const field = commit.fieldKey as AgentBulkField;
    const value: unknown = field === 'recording' ? commit.value === 'true' : commit.value;
    this.pendingBulkEdit.set({
      field,
      fieldLabel: commit.fieldLabel,
      value,
      valueLabel: commit.valueLabel,
    });
  }

  protected onBulkPreviewConfirm(remainingIds: readonly number[]): void {
    const op = this.pendingBulkEdit();
    if (!op) return;
    const idSet = new Set(remainingIds);
    // Snapshot the affected agents before the bulk so undo can restore them.
    const snapshot = this.agents()
      .filter((a) => idSet.has(a.id))
      .map((a) => ({ ...a }));

    this.agentsStore.bulkUpdate(remainingIds, op.field, op.value);
    this.pendingBulkEdit.set(null);
    this.clearSelection();

    this.undoStack.push(
      this.translate.instant('common.bulk_updated', { count: remainingIds.length }),
      this.translate.instant('common.change_reverted'),
      () => {
        for (const prev of snapshot) {
          this.agentsStore.updateAgent(prev.id, prev);
        }
      },
    );
  }

  protected onBulkPreviewCancel(): void {
    this.pendingBulkEdit.set(null);
  }

  protected confirmDelete(remainingIds: readonly number[] | null): void {
    const target = this.deleteTarget();
    if (!target) return;

    let toasted: Agent[];
    if (remainingIds === null) {
      toasted = [...target];
    } else {
      const idSet = new Set(remainingIds);
      toasted = target.filter((a) => idSet.has(a.id));
    }
    const ids = toasted.map((a) => a.id);

    if (ids.length === 1) {
      this.agentsStore.deleteAgent(ids[0]!);
      this.linksStore.removeAgent(ids[0]!);
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('agents.toasts.deleted_single', {
          name: toasted[0]!.name,
        }),
        life: TOAST_LIFE.success,
      });
    } else {
      this.agentsStore.deleteAgents(ids);
      for (const id of ids) this.linksStore.removeAgent(id);
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('agents.toasts.deleted_bulk', { count: ids.length }),
        life: TOAST_LIFE.success,
      });
    }

    this.deleteTarget.set(null);
    this.clearSelection();
  }

  protected cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  /* El click derecho abre EL MISMO menú que el kebab (R3): un solo motor, un
   * solo modelo, un solo sitio donde añadir una acción. Antes había un panel
   * HTML por fila y, aparte, un menú contextual con sus propios handlers
   * duplicados — dos implementaciones que ya divergían. */

  protected onSearchKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (this.searchQuery()) {
      this.searchQuery.set('');
    } else {
      (event.target as HTMLInputElement).blur();
    }
  }

  protected onExport(): void {
    const headers = [
      this.translate.instant('agents.export.code'),
      this.translate.instant('agents.export.name'),
      this.translate.instant('agents.export.extension'),
      this.translate.instant('agents.export.type'),
      this.translate.instant('agents.export.email'),
      this.translate.instant('agents.export.status'),
      this.translate.instant('agents.export.groups'),
    ];
    const rows = this.sorted().map((a) => [
      a.code,
      a.name,
      a.extension,
      this.translate.instant(this.typeKeys[a.agentType]),
      a.email ?? '',
      this.translate.instant(`agents.status.${a.status}`),
      this.groupsForAgent(a.id)
        .map((g) => g.name)
        .join(', '),
    ]);
    this.xlsx.export({
      headers,
      rows,
      sheetName: this.translate.instant('agents.export.sheet'),
      filePrefix: 'agentes',
    });
  }
}
