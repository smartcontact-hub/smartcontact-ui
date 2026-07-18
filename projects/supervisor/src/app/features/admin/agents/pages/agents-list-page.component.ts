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
import { MessageService } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { ClickOutsideDirective, SortableHeaderDirective } from '@core/directives';
import { UndoStackService, XlsxExportService } from '@core/services';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { SelectionState } from '@core/utils/selection-state';
import { clampToViewport } from '@core/utils/viewport';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { IllustratedAvatarComponent } from '@shared/components';
import {
  ScBulkActionBarComponent as BulkActionBarComponent,
  useBulkEntityI18n,
  BulkEditCommit,
  BulkEditFieldOption,
  ScBulkEditMenuComponent as BulkEditMenuComponent,
  ColumnDef,
  ScColumnSelectorComponent as ColumnSelectorComponent,
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

interface ContextMenuPos {
  readonly x: number;
  readonly y: number;
  readonly agentId: number;
}

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
    ClickOutsideDirective,
    ColumnSelectorComponent,
    DeleteEntityDialogComponent,
    EmptyStateComponent,
    IconComponent,
    IllustratedAvatarComponent,
    GroupPopoverComponent,
    ImpactPreviewDialogComponent,
    InlineRenameCellComponent,
    SearchComponent,
    SortableHeaderDirective,
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
  protected readonly editIcon = 'edit';
  protected readonly trashIcon = 'delete';
  protected readonly copyIcon = 'content_copy';
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
   * Row-selection state. Pages keep the existing `selectedIds` /
   * `toggleSelect` / `toggleSelectAll` / `clearSelection` API as thin
   * delegates so templates and tests don't need to change. The shared
   * `SelectionState` class lives in `@core/utils/selection-state`.
   */
  private readonly selection = new SelectionState<{ readonly id: number }>(() => this.sorted());
  protected readonly selectedIds = this.selection.ids;
  protected readonly contextMenu = signal<ContextMenuPos | null>(null);
  protected readonly openMenuId = signal<number | null>(null);
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
   * column-selector hasn't emitted yet — without this guard the
   * `<thead>` / `<tbody>` `@for` loops iterate over an empty array
   * on first paint and the table renders rows with only the leading
   * checkbox + trailing actions, no content cells.
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

  protected readonly allSelected = this.selection.allSelected;

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

  protected onOrderedColumnsChange(keys: readonly string[]): void {
    this.orderedColumns.set(keys);
  }

  protected toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  /** Current sort direction for `field`, or `null` if not the active column. */
  protected getSortDir(field: SortField): 'asc' | 'desc' | null {
    return this.sortField() === field ? this.sortDir() : null;
  }

  protected toggleSelect(id: number): void {
    this.selection.toggle(id);
  }

  protected toggleSelectAll(): void {
    this.selection.toggleAll();
  }

  protected clearSelection(): void {
    this.selection.clear();
  }

  protected onCreateClick(): void {
    void this.router.navigateByUrl('/admin/agentes/crear');
  }

  /** Row-body click → enter edit. Ignored if user is renaming this row. */
  protected onRowClick(agent: Agent): void {
    if (this.renamingId() === agent.id) return;
    void this.router.navigateByUrl(`/admin/agentes/editar/${agent.id}`);
  }

  protected onRowEdit(agent: Agent): void {
    this.openMenuId.set(null);
    void this.router.navigateByUrl(`/admin/agentes/editar/${agent.id}`);
  }

  protected onRowDuplicate(agent: Agent): void {
    this.openMenuId.set(null);
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
    this.openMenuId.set(null);
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

  protected onContextMenu(event: MouseEvent, agentId: number): void {
    event.preventDefault();
    const { x, y } = clampToViewport(event.clientX, event.clientY);
    this.contextMenu.set({ x, y, agentId });
  }

  protected closeContextMenu(): void {
    this.contextMenu.set(null);
  }

  protected toggleRowMenu(id: number): void {
    this.openMenuId.update((current) => (current === id ? null : id));
  }

  protected closeRowMenu(): void {
    this.openMenuId.set(null);
  }

  protected onContextEdit(): void {
    const ctx = this.contextMenu();
    if (!ctx) return;
    this.contextMenu.set(null);
    void this.router.navigateByUrl(`/admin/agentes/editar/${ctx.agentId}`);
  }

  protected onContextDuplicate(): void {
    const ctx = this.contextMenu();
    if (!ctx) return;
    const agent = this.agents().find((a) => a.id === ctx.agentId);
    this.contextMenu.set(null);
    if (agent) this.onRowDuplicate(agent);
  }

  protected onContextDelete(): void {
    const ctx = this.contextMenu();
    if (!ctx) return;
    const agent = this.agents().find((a) => a.id === ctx.agentId);
    if (agent) this.deleteTarget.set([agent]);
    this.contextMenu.set(null);
  }

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
