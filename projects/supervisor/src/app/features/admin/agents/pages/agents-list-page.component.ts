import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { injectLangChange } from '@core/utils/lang-change';
import { IllustratedAvatarComponent, ListPageComponent } from '@shared/components';
import {
  useBulkEntityI18n,
  BulkEditCommit,
  BulkEditFieldOption,
  ScBulkEditMenuComponent as BulkEditMenuComponent,
  type ScColumnCellContext,
  type ScColumnDef,
  ColumnDef,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ScGroupPopoverComponent as GroupPopoverComponent,
  ImpactBadge,
  ImpactItem,
  ScImpactPreviewDialogComponent as ImpactPreviewDialogComponent,
  ScInlineRenameCellComponent as InlineRenameCellComponent,
  ScTagComponent as TagComponent,
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
    BulkEditMenuComponent,
    ButtonComponent,
    TagComponent,
    DeleteEntityDialogComponent,
    EmptyStateComponent,
    IconComponent,
    IllustratedAvatarComponent,
    GroupPopoverComponent,
    ImpactPreviewDialogComponent,
    InlineRenameCellComponent,
    ListPageComponent,
    MenuModule,
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
  private readonly lang = injectLangChange();
  private readonly router = inject(Router);
  private readonly undoStack = inject(UndoStackService);

  /** CTA "Nuevo agente" proyectado a la TopBar (modelo "todo arriba" S59):
   * la banda de page-header desaparece; identidad → breadcrumb, acción → barra. */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
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
  protected readonly chevronDownIcon = 'expand_more';
  protected readonly checkIcon = 'check';
  protected readonly phoneIcon = 'call';
  protected readonly chatIcon = 'chat_bubble';
  protected readonly emailIcon = 'mail';
  protected readonly emptyIcon = 'headphones';

  protected readonly typeKeys = AGENT_TYPE_LABEL_KEYS;
  protected readonly presenceKeys = PRESENCE_LABEL_KEYS;
  protected readonly presenceStates = PRESENCE_STATES;
  protected readonly agents = this.agentsStore.agents;

  /** Selección: la lista la marca; de ella cuelgan la edición en lote, el borrado y el diálogo de impacto. */
  protected readonly selectedIds = signal<ReadonlySet<Agent['id']>>(new Set());
  /** Agente cuya lista de estados está abierta (el menú es uno solo para toda la tabla). */
  protected readonly presenceMenuAgent = signal<Agent | null>(null);
  protected readonly presenceMenuItems = computed<MenuItem[]>(() => {
    this.lang(); // textos al día al cambiar de idioma (ver `injectLangChange`)
    return this.presenceStates.map((p) => ({
      id: p,
      label: this.translate.instant(this.presenceKeys[p]),
      command: () => {
        const agent = this.presenceMenuAgent();
        if (agent) this.onPresenceChange(agent, p);
      },
    }));
  });
  protected readonly deleteTarget = signal<readonly Agent[] | null>(null);
  protected readonly renamingId = signal<number | null>(null);
  protected readonly pendingBulkEdit = signal<PendingBulkEdit | null>(null);
  protected readonly columnPrefKey = COLUMN_PREF_KEY;
  protected readonly columnDefs = computed<readonly ColumnDef[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    return [
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
    ];
  });

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

  protected readonly columns = computed<readonly ScColumnDef<Agent>[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    return [
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
        /* Anchos MEDIDOS del dato más largo de cada columna corta en los cuatro idiomas (2026-09-14):
         * el nombre se come el resto y la tabla lleva `tableMinWidth`, así que por debajo se
         * desplaza en vez de cortar. Antes el nombre iba a 252 y «CusCare Carrier» se cortaba. */
        width: '8rem',
      },
      {
        field: 'channels',
        header: this.translate.instant('agents.table.channels'),
        cellTemplate: this.channelsTpl(),
        width: '6.5rem',
      },
      {
        // `field: 'type'` no existe en `Agent` (la propiedad es `agentType`), así
        // que el orden client-side de p-table sobre esta columna compara
        // undefined con undefined: es un no-op estable. Quien ordena de verdad es
        // `compareAgents`, que sí sabe leer `agentType`. El `field` no se puede
        // renombrar: es la identidad de la columna para el selector y lo que hay
        // guardado en localStorage.
        field: 'type',
        header: this.translate.instant('agents.table.type'),
        sortable: true,
        cellTemplate: this.typeTpl(),
        width: '9rem',
      },
      {
        field: 'presence',
        header: this.translate.instant('agents.table.presence'),
        cellTemplate: this.presenceTpl(),
        width: '10.5rem',
      },
      {
        field: 'status',
        header: this.translate.instant('agents.table.status'),
        sortable: true,
        cellTemplate: this.statusTpl(),
        width: '7.5rem',
      },
      {
        field: 'groups',
        header: this.translate.instant('agents.table.groups'),
        cellTemplate: this.groupsTpl(),
        width: '5.5rem',
      },
    ];
  });

  protected readonly bulkEditFields = computed<readonly BulkEditFieldOption[]>(() => {
    this.lang(); // textos al día al cambiar de idioma (ver `injectLangChange`)
    return [
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
    ];
  });

  /** Qué filas casan con la búsqueda (la consulta llega ya en minúsculas). */
  protected readonly matchesSearch = (a: Agent, q: string): boolean =>
    a.name.toLowerCase().includes(q) ||
    a.code.includes(q) ||
    a.extension.includes(q) ||
    (a.email?.toLowerCase().includes(q) ?? false);

  /* El orden lo resuelve ESTA página y no la tabla: `type` se ordena por `agentType` (no hay `row.type`) y `name`
   * compara con locale 'es'. Devuelve el orden ascendente; la dirección la pone la lista. */
  protected readonly compareAgents = (a: Agent, b: Agent, field: string): number => {
    switch (field) {
      case 'name':
        return a.name.localeCompare(b.name, 'es');
      case 'code':
        return a.code.localeCompare(b.code);
      case 'extension':
        return a.extension.localeCompare(b.extension);
      case 'type':
        return a.agentType.localeCompare(b.agentType);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  };

  /** Mientras se renombra una fila, abrirla no hace nada (y no enseña el cursor de mano). */
  protected readonly isOpenable = (agent: Agent): boolean => this.renamingId() !== agent.id;

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

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  protected onCreateClick(): void {
    void this.router.navigateByUrl('/admin/agentes/crear');
  }

  protected onRowOpen(agent: Agent): void {
    void this.router.navigateByUrl(`/admin/agentes/editar/${agent.id}`);
  }

  /** Menú de cada fila: el mismo con «⋮» y con clic derecho (lo abre la lista). */
  protected readonly rowMenu = (agent: Agent): MenuItem[] => this.buildMenuItems(agent);

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
        styleClass: 'sc-menu-item--danger',
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

  protected presenceLabelKey(presence: PresenceStatus): string {
    return this.presenceKeys[presence];
  }

  protected openPresenceMenu(agent: Agent, menu: { toggle: (event: Event) => void }, event: Event): void {
    event.stopPropagation();
    this.presenceMenuAgent.set(agent);
    menu.toggle(event);
  }

  protected onPresenceChange(agent: Agent, value: PresenceStatus): void {
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

  protected onExport(visibleRows: readonly Agent[]): void {
    const headers = [
      this.translate.instant('agents.export.code'),
      this.translate.instant('agents.export.name'),
      this.translate.instant('agents.export.extension'),
      this.translate.instant('agents.export.type'),
      this.translate.instant('agents.export.email'),
      this.translate.instant('agents.export.status'),
      this.translate.instant('agents.export.groups'),
    ];
    const rows = visibleRows.map((a) => [
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
