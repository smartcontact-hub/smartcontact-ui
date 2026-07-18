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

import { SortableHeaderDirective } from '@core/directives';
import { UndoStackService, XlsxExportService } from '@core/services';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { SelectionState } from '@core/utils/selection-state';
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
  ImpactBadge,
  ImpactItem,
  ScImpactPreviewDialogComponent as ImpactPreviewDialogComponent,
  ScInlineRenameCellComponent as InlineRenameCellComponent,
  ScSearchComponent as SearchComponent,
} from '@smartcontact-hub/components';
import {
  CHANNEL_LABEL_KEYS,
  CHAT_STRATEGIES,
  GROUP_PRIORITIES,
  Group,
  GroupChannel,
  PHONE_STRATEGIES,
  PRIORITY_LABEL_KEYS,
} from '../data/groups-data';
import { GroupBulkField, GroupsStore } from '../state/groups.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';

type SortField = 'name' | 'code' | 'priority' | 'agents' | 'strategy';

interface PendingBulkEdit {
  readonly field: GroupBulkField;
  readonly fieldLabel: string;
  readonly value: unknown;
  readonly valueLabel: string;
}

/* v2 — bumped when ColumnSelector schema changed (set → ordered array)
 * and when `code` started shipping hidden by default. */
const COLUMN_PREF_KEY = 'sc-groups-columns-v2';

@Component({
  selector: 'sc-groups-list-page',
  imports: [
    BulkActionBarComponent,
    BulkEditMenuComponent,
    ButtonComponent,
    ColumnSelectorComponent,
    DeleteEntityDialogComponent,
    EmptyStateComponent,
    IconComponent,
    IllustratedAvatarComponent,
    ImpactPreviewDialogComponent,
    InlineRenameCellComponent,
    MenuModule,
    SearchComponent,
    SortableHeaderDirective,
    TranslateModule,
  ],
  templateUrl: './groups-list-page.component.html',
  styleUrl: './groups-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupsListPageComponent {
  private readonly groupsStore = inject(GroupsStore);
  private readonly linksStore = inject(GroupAgentLinksStore);
  private readonly xlsx = inject(XlsxExportService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly undoStack = inject(UndoStackService);
  private readonly topBarSlot = inject(TopBarSlotService);
  private readonly destroyRef = inject(DestroyRef);

  /** CTA proyectado a la TopBar (modelo "todo arriba" S59): la banda de
   * page-header desaparece; identidad → breadcrumb, acción → barra. */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    afterNextRender(() => {
      const tpl = this.topbarActions();
      if (tpl) this.topBarSlot.setActions(tpl);
    });
    this.destroyRef.onDestroy(() => this.topBarSlot.clearActions());
  }

  /** Derived count of agents assigned to a group. */
  protected assignedCountForGroup(groupId: number): number {
    return this.linksStore.linksForGroup(groupId).length;
  }

  protected readonly plusIcon = 'add';
  protected readonly searchIcon = 'search';
  protected readonly closeIcon = 'close';
  protected readonly downloadIcon = 'download';
  protected readonly moreIcon = 'more_vert';
  protected readonly phoneIcon = 'call';
  protected readonly chatIcon = 'chat_bubble';
  protected readonly emailIcon = 'mail';
  protected readonly emptyIcon = 'group';
  protected readonly pageIcon = 'group';

  protected readonly priorityKeys = PRIORITY_LABEL_KEYS;
  protected readonly channelKeys = CHANNEL_LABEL_KEYS;
  protected readonly groups = this.groupsStore.groups;

  protected readonly searchQuery = signal('');
  protected readonly sortField = signal<SortField | null>(null);
  protected readonly sortDir = signal<'asc' | 'desc'>('asc');
  /** See `agents-list-page` for the rationale behind the delegate pattern. */
  private readonly selection = new SelectionState<{ readonly id: number }>(() => this.sorted());
  protected readonly selectedIds = this.selection.ids;
  /** Fila a la que apunta el kebab compartido. Ver `menuItems`. */
  protected readonly menuTargetGroup = signal<Group | null>(null);
  protected readonly deleteTarget = signal<readonly Group[] | null>(null);
  protected readonly renamingId = signal<number | null>(null);
  protected readonly pendingBulkEdit = signal<PendingBulkEdit | null>(null);
  protected readonly columnPrefKey = COLUMN_PREF_KEY;
  protected readonly visibleColumns = signal<ReadonlySet<string>>(new Set());

  protected readonly columnDefs = computed<readonly ColumnDef[]>(() => [
    {
      key: 'code',
      label: this.translate.instant('groups.table.code'),
      defaultVisible: false,
    },
    { key: 'name', label: this.translate.instant('groups.table.name'), locked: true },
    { key: 'phone', label: this.translate.instant('groups.table.phone') },
    { key: 'channels', label: this.translate.instant('groups.table.channels') },
    { key: 'priority', label: this.translate.instant('groups.table.priority') },
    { key: 'strategy', label: this.translate.instant('groups.table.strategy') },
    { key: 'agents', label: this.translate.instant('groups.table.agents') },
  ]);

  protected readonly bulkEditFields = computed<readonly BulkEditFieldOption[]>(() => [
    {
      key: 'priority',
      label: this.translate.instant('groups.table.priority'),
      values: GROUP_PRIORITIES.map((p) => ({
        value: p,
        label: this.translate.instant(this.priorityKeys[p]),
      })),
    },
    {
      key: 'strategy',
      label: this.translate.instant('groups.table.strategy'),
      values: [...PHONE_STRATEGIES, ...CHAT_STRATEGIES].map((s) => ({ value: s, label: s })),
    },
  ]);

  protected readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const all = this.groups();
    if (!q) return all;
    return all.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.code.includes(q) ||
        g.phone.includes(q) ||
        g.strategy.toLowerCase().includes(q),
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
        case 'priority':
          cmp = a.priority.localeCompare(b.priority);
          break;
        case 'agents':
          cmp = this.assignedCountForGroup(a.id) - this.assignedCountForGroup(b.id);
          break;
        case 'strategy':
          cmp = a.strategy.localeCompare(b.strategy);
          break;
      }
      return dir === 'asc' ? cmp : -cmp;
    });
    return list;
  });

  protected readonly allSelected = this.selection.allSelected;

  protected readonly deleteItems = computed(() =>
    (this.deleteTarget() ?? []).map((g) => ({ id: g.id, name: g.name })),
  );

  protected readonly bulkEntity = useBulkEntityI18n({
    singular: 'common.bulk.entity.group_singular',
    plural: 'common.bulk.entity.group_plural',
  });

  protected readonly impactItems = computed<readonly ImpactItem[]>(() => {
    const ids = this.selectedIds();
    return this.groups()
      .filter((g) => ids.has(g.id))
      .map((g) => ({
        id: g.id,
        name: g.name,
        hint: `(${this.assignedCountForGroup(g.id)} agentes)`,
      }));
  });

  protected readonly impactBadge = computed<ImpactBadge | null>(() => {
    const op = this.pendingBulkEdit();
    if (!op) return null;
    return { fieldLabel: op.fieldLabel, newValueLabel: op.valueLabel };
  });

  protected channelIcon(channel: GroupChannel) {
    if (channel === 'phone') return this.phoneIcon;
    if (channel === 'chat') return this.chatIcon;
    return this.emailIcon;
  }

  protected priorityTone(priority: string): 'muted' | 'info' | 'warning' | 'danger' {
    switch (priority) {
      case 'Media':
        return 'info';
      case 'Alta':
        return 'warning';
      case 'Máxima':
        return 'danger';
      default:
        return 'muted';
    }
  }

  protected isColVisible(key: string): boolean {
    const set = this.visibleColumns();
    /* Before column-selector emits its first visibilityChange the set is
     * empty. Falling back to `true` here would render every column on
     * first paint, including those declared `defaultVisible: false` —
     * which is why "código" appeared toggled on entry. Mirror the
     * column-selector's own default rule so the table matches. */
    if (set.size === 0) {
      const col = this.columnDefs().find((c) => c.key === key);
      return !!col && col.defaultVisible !== false;
    }
    return set.has(key);
  }

  protected onColumnsChange(set: ReadonlySet<string>): void {
    this.visibleColumns.set(set);
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
    void this.router.navigateByUrl('/admin/grupos/crear');
  }

  protected onRowClick(group: Group): void {
    if (this.renamingId() === group.id) return;
    void this.router.navigateByUrl(`/admin/grupos/editar/${group.id}`);
  }

  /** Modelo del kebab compartido. Es un computed ESTABLE: solo cambia al
   *  apuntar a otra fila. Con `[model]="build(group)"` el array se recreaba en
   *  cada ciclo de CD, PrimeNG repintaba el menú y se perdía el primer clic
   *  (hacía falta doble). Mismo patrón que las tres hermanas de memory. */
  protected readonly menuItems = computed<MenuItem[]>(() => {
    const group = this.menuTargetGroup();
    return group ? this.buildMenuItems(group) : [];
  });

  protected setMenuTarget(group: Group): void {
    this.menuTargetGroup.set(group);
  }

  private buildMenuItems(group: Group): MenuItem[] {
    return [
      {
        label: this.translate.instant('common.edit'),
        icon: 'sc-icon-font sc-icon-font--edit',
        command: () => this.onRowEdit(group),
      },
      {
        label: this.translate.instant('common.duplicate'),
        icon: 'sc-icon-font sc-icon-font--content_copy',
        // Con una selección múltiple viva, duplicar UNA fila es ambiguo: el
        // gesto que el usuario tiene en la cabeza es el masivo. Control
        // deliberado que ya existía en las dos listas con bulk-edit (esta y
        // agentes); el cambio de motor de menú no es motivo para retirarlo.
        visible: this.selectedIds().size <= 1,
        command: () => this.onRowDuplicate(group),
      },
      { separator: true },
      {
        // Puntos suspensivos porque lleva a la puerta tecleada, no a un
        // borrado inmediato (C4 del plan): convención de menús de escritorio
        // — "…" significa "esto abre algo antes de hacerlo".
        label: this.translate.instant('common.delete_gate'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'rules-menu-item--danger',
        command: () => this.onRowDelete(group),
      },
    ];
  }

  protected onRowEdit(group: Group): void {
    void this.router.navigateByUrl(`/admin/grupos/editar/${group.id}`);
  }

  protected onRowDuplicate(group: Group): void {
    // Navega al form de creación con el source precargado vía queryParam.
    // El form-page detecta `?seedFromId` y precarga los campos copiables
    // excepto el name (único). Si abandona sin guardar, no queda nada
    // persistido (S47 cleanup).
    void this.router.navigate(['/admin/grupos/crear'], {
      queryParams: { seedFromId: group.id },
    });
  }

  protected onRowDelete(group: Group): void {
    this.deleteTarget.set([group]);
  }

  protected onRenameCommit(id: number, value: string): void {
    this.groupsStore.updateGroup(id, { name: value });
    this.renamingId.set(null);
    this.messages.add({
      severity: 'secondary',
      summary: this.translate.instant('groups.toasts.duplicated', { name: value }),
      life: TOAST_LIFE.info,
    });
  }

  protected onRenameCancel(_id: number): void {
    this.renamingId.set(null);
  }

  protected requestDeleteSelection(): void {
    const ids = this.selectedIds();
    const targets = this.groups().filter((g) => ids.has(g.id));
    if (targets.length > 0) this.deleteTarget.set(targets);
  }

  protected onBulkEditCommit(commit: BulkEditCommit): void {
    this.pendingBulkEdit.set({
      field: commit.fieldKey as GroupBulkField,
      fieldLabel: commit.fieldLabel,
      value: commit.value,
      valueLabel: commit.valueLabel,
    });
  }

  protected onBulkPreviewConfirm(remainingIds: readonly number[]): void {
    const op = this.pendingBulkEdit();
    if (!op) return;
    const idSet = new Set(remainingIds);
    const snapshot = this.groups()
      .filter((g) => idSet.has(g.id))
      .map((g) => ({ ...g }));

    this.groupsStore.bulkUpdate(remainingIds, op.field, op.value);
    this.pendingBulkEdit.set(null);
    this.clearSelection();

    this.undoStack.push(
      this.translate.instant('common.bulk_updated', { count: remainingIds.length }),
      this.translate.instant('common.change_reverted'),
      () => {
        for (const prev of snapshot) {
          this.groupsStore.updateGroup(prev.id, prev);
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

    let toasted: Group[];
    if (remainingIds === null) {
      toasted = [...target];
    } else {
      const idSet = new Set(remainingIds);
      toasted = target.filter((g) => idSet.has(g.id));
    }
    const ids = toasted.map((g) => g.id);

    if (ids.length === 1) {
      this.groupsStore.deleteGroup(ids[0]!);
      this.linksStore.removeGroup(ids[0]!);
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('groups.toasts.deleted_single', {
          name: toasted[0]!.name,
        }),
        life: TOAST_LIFE.success,
      });
    } else {
      this.groupsStore.deleteGroups(ids);
      for (const id of ids) this.linksStore.removeGroup(id);
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('groups.toasts.deleted_bulk', { count: ids.length }),
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
      this.translate.instant('groups.export.code'),
      this.translate.instant('groups.export.name'),
      this.translate.instant('groups.export.phone'),
      this.translate.instant('groups.export.priority'),
      this.translate.instant('groups.export.strategy'),
      this.translate.instant('groups.export.channels'),
      this.translate.instant('groups.export.agent_count'),
    ];
    const rows = this.sorted().map((g) => [
      g.code,
      g.name,
      g.phone,
      this.translate.instant(this.priorityKeys[g.priority]),
      g.strategy,
      g.channels.map((c) => this.translate.instant(this.channelKeys[c])).join(', '),
      this.assignedCountForGroup(g.id),
    ]);
    this.xlsx.export({
      headers,
      rows,
      sheetName: this.translate.instant('groups.export.sheet'),
      filePrefix: 'grupos',
    });
  }
}
