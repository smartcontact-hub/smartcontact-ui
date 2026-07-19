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
import { SelectionState } from '@core/utils/selection-state';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { IllustratedAvatarComponent } from '@shared/components';
import {
  ScBulkActionBarComponent as BulkActionBarComponent,
  useBulkEntityI18n,
  BulkEditCommit,
  BulkEditFieldOption,
  ScBulkEditMenuComponent as BulkEditMenuComponent,
  type ScColumnCellContext,
  ColumnDef,
  type ScColumnDef,
  ScColumnSelectorComponent as ColumnSelectorComponent,
  ScDatatableComponent as DatatableComponent,
  type ScDatatableRowEvent,
  type ScDatatableRowKeyEvent,
  type ScDatatableSortEvent,
  type ScRowStyleClassFn,
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
  GroupPriority,
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
    DatatableComponent,
    DeleteEntityDialogComponent,
    EmptyStateComponent,
    IconComponent,
    IllustratedAvatarComponent,
    ImpactPreviewDialogComponent,
    InlineRenameCellComponent,
    MenuModule,
    SearchComponent,
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

  /* ── La tabla, ahora `sc-datatable` (B4) ──────────────────────────────
   * Todas las celdas son composiciones propias de la página (avatar + nombre
   * o `sc-inline-rename-cell`, chips de canal, `sc-label` de prioridad,
   * kebab), así que van por `cellTemplate`: el DS no conoce el tipo `Group`
   * ni tiene por qué.
   *
   * `columns` es un `computed()` que LEE los `viewChild` a propósito. Esos
   * `TemplateRef` resuelven tarde, y una lista construida en el campo se
   * quedaría con `cellTemplate: undefined` para siempre — la tabla pintaría
   * `row[field]` en crudo. Al ser computed, se recalcula en cuanto resuelven.
   */
  private readonly codeTpl = viewChild<TemplateRef<ScColumnCellContext<Group>>>('codeTpl');
  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<Group>>>('nameTpl');
  private readonly phoneTpl = viewChild<TemplateRef<ScColumnCellContext<Group>>>('phoneTpl');
  private readonly channelsTpl = viewChild<TemplateRef<ScColumnCellContext<Group>>>('channelsTpl');
  private readonly priorityTpl = viewChild<TemplateRef<ScColumnCellContext<Group>>>('priorityTpl');
  private readonly strategyTpl = viewChild<TemplateRef<ScColumnCellContext<Group>>>('strategyTpl');
  private readonly agentsTpl = viewChild<TemplateRef<ScColumnCellContext<Group>>>('agentsTpl');
  private readonly actionsTpl = viewChild<TemplateRef<ScColumnCellContext<Group>>>('actionsTpl');

  /** `sortable` en las MISMAS cinco que llevaban `scSortable`: el gesto sigue
   *  siendo idéntico, solo cambia quién pinta la flecha. Anchos y alineación
   *  replican `.table__th-num` (96px) y `.table__th-actions` (48px). */
  protected readonly columns = computed<readonly ScColumnDef<Group>[]>(() => [
    {
      field: 'code',
      header: this.translate.instant('groups.table.code'),
      sortable: true,
      cellTemplate: this.codeTpl(),
    },
    {
      field: 'name',
      header: this.translate.instant('groups.table.name'),
      sortable: true,
      cellTemplate: this.nameTpl(),
    },
    {
      field: 'phone',
      header: this.translate.instant('groups.table.phone'),
      cellTemplate: this.phoneTpl(),
    },
    {
      field: 'channels',
      header: this.translate.instant('groups.table.channels'),
      cellTemplate: this.channelsTpl(),
    },
    {
      field: 'priority',
      header: this.translate.instant('groups.table.priority'),
      sortable: true,
      cellTemplate: this.priorityTpl(),
    },
    {
      field: 'strategy',
      header: this.translate.instant('groups.table.strategy'),
      sortable: true,
      cellTemplate: this.strategyTpl(),
    },
    {
      field: 'agents',
      header: this.translate.instant('groups.table.agents'),
      sortable: true,
      width: '96px',
      align: 'right',
      cellTemplate: this.agentsTpl(),
    },
    // Columna sin datos: `field` es solo su identidad para `[visibleColumns]`,
    // y la cabecera va vacía igual que el `<th aria-hidden>` que sustituye.
    { field: 'actions', stopRowClick: true, header: '', headerAriaLabel: this.translate.instant('common.actions'), width: '48px', align: 'right', cellTemplate: this.actionsTpl() },
  ]);

  /**
   * Campos visibles EN ORDEN DE PINTADO, que es el formato de
   * `[visibleColumns]`. Se deriva del mecanismo que ya existía
   * (`sc-column-selector` → `(visibilityChange)` → Set → `isColVisible`) en
   * vez de saltar a `(orderedVisibleChange)`: el orden de pintado sigue siendo
   * el DECLARADO, igual que cuando la plantilla escribía los `<th>` a mano.
   * Con el array del selector, activar «código» lo mandaría al final (el
   * selector lo hace `push`) en vez de dejarlo el primero — un cambio de
   * comportamiento que esta migración no tiene por qué traer.
   *
   * `actions` no está en el selector (no se puede ocultar): se añade siempre
   * al final, como el `<th aria-hidden>` de antes.
   */
  protected readonly visibleFields = computed<readonly string[]>(() => [
    ...this.columnDefs()
      .filter((col) => this.isColVisible(col.key))
      .map((col) => col.key),
    'actions',
  ]);

  /* Puente de selección: la fuente de verdad sigue siendo `selectedIds` —de
   * ella cuelgan la barra masiva, el bulk-edit, el borrado y el export— y
   * `sc-datatable` habla de filas. Traducir en los dos sentidos aquí evita
   * reescribir media página por un cambio de tabla. */
  protected readonly selectedGroups = computed<readonly Group[]>(() => {
    const ids = this.selectedIds();
    return this.sorted().filter((group) => ids.has(group.id));
  });

  protected onSelectionChange(selection: Group | readonly Group[] | null): void {
    const rows = Array.isArray(selection) ? selection : selection ? [selection as Group] : [];
    this.selectedIds.set(new Set(rows.map((group) => group.id)));
  }

  /**
   * `table__row--clickable` sobrevive a la migración: la fila abre el detalle
   * y el cursor tiene que decirlo, salvo mientras se renombra en línea.
   *
   * Es un `computed` que DEVUELVE la función —y no una función que lee la
   * señal— para respetar el contrato de `rowStyleClass`: se resuelve en cada
   * render, así que debe ser pura respecto a la fila. Al colgar `renamingId`
   * del computed, la identidad del input cambia cuando cambia el renombrado y
   * el DS repinta; la función en sí no lee señales.
   */
  protected readonly rowClass = computed<ScRowStyleClassFn<Group>>(() => {
    const renaming = this.renamingId();
    return (row) => (row.id === renaming ? undefined : 'table__row--clickable');
  });

  /* El orden lo sigue resolviendo ESTA página, no p-table: dos de los cinco
   * criterios no son `row[field]` —`agents` es un contador DERIVADO de
   * `linksStore` y `name` compara con locale 'es'— y el wrapper del DS no
   * expone `customSort`. El DS aporta la cabecera y el gesto; `sorted()`
   * aporta la comparación. Ver `onSortChange`. */
  protected readonly tableSortField = computed<string | undefined>(() => this.sortField() ?? undefined);
  protected readonly tableSortOrder = computed<number>(() => (this.sortDir() === 'asc' ? 1 : -1));

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

  /* El contexto de un `<ng-template>` de celda es `any`, así que indexar
   * `Record<GroupChannel, string>` desde la plantilla —como hacía el `@for`,
   * donde la fila venía tipada— ya no compila en AOT. Se resuelve aquí, que
   * es donde los tipos existen; `channelIcon` ya seguía este patrón. */
  protected channelLabelKey(channel: GroupChannel): string {
    return this.channelKeys[channel];
  }

  protected priorityLabelKey(priority: GroupPriority): string {
    return this.priorityKeys[priority];
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

  /**
   * El gesto de ordenar lo lee el DS (`pSortableColumn`) y esta página lo
   * ESPEJA: p-table ya resolvió el toggle asc↔desc en el evento, así que aquí
   * solo se asigna —volver a togglear lo desharía.
   *
   * Sustituye a `toggleSort` / `getSortDir`, que servían al `<th scSortable>`
   * que ya no existe.
   */
  protected onSortChange(event: ScDatatableSortEvent): void {
    this.sortField.set((event.field as SortField | undefined) ?? null);
    this.sortDir.set(event.order === -1 ? 'desc' : 'asc');
  }

  /* `toggleSelect` / `toggleSelectAll` / `allSelected` murieron con la
   * migración a `sc-datatable`: la casilla de fila y la de cabecera las
   * sirven `p-tableCheckbox` y `p-tableHeaderCheckbox`, con la misma
   * semántica de antes (la de cabecera marca lo FILTRADO, no todo). */

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

  /** Click derecho → el MISMO `<p-menu>` que el kebab (R3). El DS ya canceló
   *  el menú nativo del navegador. */
  /* WCAG 2.1.1: la fila abre la ficha con el ratón, así que tiene que abrirla
   * también con el teclado. Estas tres listas NUNCA lo tuvieron —ni antes ni
   * después de migrar; se comprobó en el árbol anterior: cero `tabindex`, cero
   * `keydown`, cero enlaces— o sea que la acción existía solo para quien usa
   * ratón. Enter abre; Espacio lo deja para la casilla, que es el reparto que
   * fijó la Ola 6 en transcripciones. */
  protected onRowKeydown(event: ScDatatableRowKeyEvent<Group>): void {
    if (event.originalEvent.key !== 'Enter') return;
    event.originalEvent.preventDefault();
    this.onRowClick(event.row);
  }

  protected onRowContextMenu(
    event: ScDatatableRowEvent<Group>,
    menu: { toggle: (e: Event) => void },
  ): void {
    this.setMenuTarget(event.row);
    menu.toggle(event.originalEvent);
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
