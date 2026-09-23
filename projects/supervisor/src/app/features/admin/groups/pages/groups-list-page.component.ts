import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService, type MenuItem } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { UndoStackService, XlsxExportService } from '@core/services';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { injectLangChange } from '@core/utils/lang-change';
import { ChannelIconComponent, ListPageComponent } from '@shared/components';
import { AgentsStore } from '@features/admin/agents/state/agents.store';
import {
  useBulkEntityI18n,
  BulkEditCommit,
  BulkEditFieldOption,
  type BulkEditMatch,
  ScBulkEditMenuComponent as BulkEditMenuComponent,
  type ScColumnCellContext,
  ColumnDef,
  type ScColumnDef,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ImpactBadge,
  ImpactItem,
  ScImpactPreviewDialogComponent as ImpactPreviewDialogComponent,
  ScInlineRenameCellComponent as InlineRenameCellComponent,
  ScTagComponent as TagComponent,
  ScGroupPopoverComponent as GroupPopoverComponent,
} from '@smartcontact-hub/components';
import {
  CHANNEL_LABEL_KEYS,
  CHAT_STRATEGIES,
  GROUP_PRIORITIES,
  Group,
  GroupChannel,
  GroupPriority,
  PHONE_STRATEGIES,
  UNAVAILABLE_STRATEGIES,
  PRIORITY_LABEL_KEYS,
  duplicateGroupDraft,
  newGroupDraft,
} from '../data/groups-data';
import { GroupBulkField, GroupsStore } from '../state/groups.store';
import { GroupDefaultsStore } from '../state/group-defaults.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';
import {
  GroupCreateDialogComponent,
  type GroupCreateSubmission,
} from '../components/group-create-dialog/group-create-dialog.component';

interface PendingBulkEdit {
  readonly field: GroupBulkField;
  readonly fieldLabel: string;
  readonly value: unknown;
  readonly valueLabel: string;
}

/* v2 — bumped when ColumnSelector schema changed (set → ordered array)
 * and when `code` started shipping hidden by default. */
/* v3 (2026-09-16): columna nueva (Servicios). Una lista guardada no la conoce y no saldría nunca. */
const COLUMN_PREF_KEY = 'sc-groups-columns-v3';

@Component({
  selector: 'sc-groups-list-page',
  imports: [
    BulkEditMenuComponent,
    ButtonComponent,
    ChannelIconComponent,
    TagComponent,
    DeleteEntityDialogComponent,
    EmptyStateComponent,
    GroupPopoverComponent,
    GroupCreateDialogComponent,
    IconComponent,
    ImpactPreviewDialogComponent,
    InlineRenameCellComponent,
    ListPageComponent,
    TranslateModule,
  ],
  templateUrl: './groups-list-page.component.html',
  styleUrl: './groups-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupsListPageComponent {
  private readonly groupsStore = inject(GroupsStore);
  private readonly linksStore = inject(GroupAgentLinksStore);
  private readonly agentsStore = inject(AgentsStore);
  private readonly xlsx = inject(XlsxExportService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly undoStack = inject(UndoStackService);
  private readonly defaultsStore = inject(GroupDefaultsStore);

  /** CTA proyectado a la TopBar (modelo "todo arriba" S59): la banda de
   * page-header desaparece; identidad → breadcrumb, acción → barra. */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
    // `/admin/grupos/crear` (la paleta de comandos, un enlace guardado) llega aquí con `?crear`: el
    // alta es un diálogo sobre la lista, no una página. Se abre y se limpia la dirección SIN navegar:
    // una segunda navegación cortaba la transición de la primera («Transition was skipped», medido).
    if (this.route.snapshot.queryParamMap.has('crear')) {
      this.createOpen.set(true);
      this.location.replaceState('/admin/grupos');
    }
  }

  /** Derived count of agents assigned to a group. */
  protected assignedCountForGroup(groupId: number): number {
    return this.linksStore.linksForGroup(groupId).length;
  }

  /** Los agentes de un grupo, para el MISMO desplegable que abre «Grupos» en la lista de agentes. */
  protected agentsForGroup(groupId: number): readonly { id: number; name: string; active: boolean }[] {
    const byId = new Map(this.agentsStore.agents().map((a) => [a.id, a]));
    return this.linksStore
      .linksForGroup(groupId)
      .map((l) => {
        const a = byId.get(l.agentId);
        return a ? { id: a.id, name: a.name, active: l.active } : null;
      })
      .filter((a): a is { id: number; name: string; active: boolean } => a !== null);
  }

  /** Un teléfono de demo por servicio, sacado del del grupo: el desplegable enseña solo números. */
  protected servicesForGroup(group: Group): readonly { id: number; name: string; active: boolean }[] {
    const base = Number(group.phone) + group.id * 10;
    return (group.services ?? []).map((_, i) => ({ id: i, name: String(base + i + 1), active: true }));
  }

  protected readonly plusIcon = 'add';
  protected readonly emptyIcon = 'group';

  protected readonly priorityKeys = PRIORITY_LABEL_KEYS;
  protected readonly channelKeys = CHANNEL_LABEL_KEYS;
  protected readonly groups = this.groupsStore.groups;

  /** Selección: la lista la marca; de ella cuelgan la edición en lote, el borrado y el diálogo de impacto. */
  protected readonly selectedIds = signal<ReadonlySet<Group['id']>>(new Set());
  protected readonly deleteTarget = signal<readonly Group[] | null>(null);
  protected readonly renamingId = signal<number | null>(null);
  protected readonly pendingBulkEdit = signal<PendingBulkEdit | null>(null);
  protected readonly columnPrefKey = COLUMN_PREF_KEY;

  protected readonly columnDefs = computed<readonly ColumnDef[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    return [
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
      { key: 'services', label: this.translate.instant('groups.table.services') },
      { key: 'agents', label: this.translate.instant('groups.table.agents') },
    ];
  });

  protected readonly bulkEditFields = computed<readonly BulkEditFieldOption[]>(() => {
    this.lang(); // textos al día al cambiar de idioma (ver `injectLangChange`)
    return [
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
        // Skills no se puede elegir todavía (SISMAC-1975): tampoco en bloque.
        values: [...PHONE_STRATEGIES.filter((s) => !UNAVAILABLE_STRATEGIES.has(s)), ...CHAT_STRATEGIES].map((s) => ({ value: s, label: s })),
      },
    ];
  });

  /** Qué filas casan con la búsqueda (la consulta llega ya en minúsculas). */
  protected readonly matchesSearch = (g: Group, q: string): boolean =>
    g.name.toLowerCase().includes(q) ||
    g.code.includes(q) ||
    g.phone.includes(q) ||
    g.strategy.toLowerCase().includes(q);

  /* El orden lo resuelve ESTA página y no la tabla: `agents` es un contador DERIVADO de `linksStore` (no hay
   * `row.agents`) y `name` compara con locale 'es'. Devuelve el orden ascendente; la dirección la pone la lista. */
  protected readonly compareGroups = (a: Group, b: Group, field: string): number => {
    switch (field) {
      case 'name':
        return a.name.localeCompare(b.name, 'es');
      case 'code':
        return a.code.localeCompare(b.code);
      case 'priority':
        return a.priority.localeCompare(b.priority);
      case 'agents':
        return this.assignedCountForGroup(a.id) - this.assignedCountForGroup(b.id);
      case 'strategy':
        return a.strategy.localeCompare(b.strategy);
      default:
        return 0;
    }
  };

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
  private readonly servicesTpl = viewChild<TemplateRef<ScColumnCellContext<Group>>>('servicesTpl');
  private readonly agentsTpl = viewChild<TemplateRef<ScColumnCellContext<Group>>>('agentsTpl');

  /** `sortable` en las MISMAS cinco que llevaban `scSortable`. La columna del menú de fila la añade la lista. */
  protected readonly columns = computed<readonly ScColumnDef<Group>[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    return [
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
        /* Anchos MEDIDOS del dato más largo de cada columna corta (2026-09-14); el nombre se come el
         * resto y la tabla lleva `tableMinWidth`: por debajo se desplaza en vez de cortar. */
        width: '7rem',
      },
      {
        field: 'channels',
        header: this.translate.instant('groups.table.channels'),
        cellTemplate: this.channelsTpl(),
        /* Cuatro glifos de 16 px con su hueco (teléfono, chat, WhatsApp, email). */
        width: '7.75rem',
      },
      {
        field: 'priority',
        header: this.translate.instant('groups.table.priority'),
        sortable: true,
        cellTemplate: this.priorityTpl(),
        width: '7rem',
      },
      {
        field: 'strategy',
        header: this.translate.instant('groups.table.strategy'),
        sortable: true,
        cellTemplate: this.strategyTpl(),
        width: '9.5rem',
      },
      {
        field: 'services',
        header: this.translate.instant('groups.table.services'),
        cellTemplate: this.servicesTpl(),
        width: '6.5rem',
      },
      {
        field: 'agents',
        header: this.translate.instant('groups.table.agents'),
        sortable: true,
        /* 7rem: con 96 px la cabecera y su flecha de orden partían en dos líneas. A la izquierda y
         * con el mismo desplegable que «Grupos» en la lista de agentes (2026-09-14): es la misma
         * relación vista desde el otro lado. */
        cellTemplate: this.agentsTpl(),
        width: '7rem',
      },
    ];
  });

  /** Mientras se renombra una fila, abrirla no hace nada (y no enseña el cursor de mano). */
  protected readonly isOpenable = (group: Group): boolean => this.renamingId() !== group.id;

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

  /** Severidad del `sc-tag` de prioridad (DD-76): el vocabulario del DS, no tonos propios. */
  protected priorityTone(priority: string): 'secondary' | 'info' | 'warning' | 'danger' {
    switch (priority) {
      case 'Media':
        return 'info';
      case 'Alta':
        return 'warning';
      case 'Máxima':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  protected onDefaultsClick(): void {
    void this.router.navigateByUrl('/admin/grupos/valores-por-defecto');
  }

  /** El alta y el duplicado comparten diálogo; `duplicateSource` dice cuál de los dos es. */
  protected readonly createOpen = signal(false);
  protected readonly duplicateSource = signal<Group | null>(null);
  protected readonly groupNames = computed(() => this.groups().map((g) => g.name));
  protected readonly suggestedCopyName = computed(() => {
    this.lang();
    const source = this.duplicateSource();
    return source ? this.translate.instant('groups.create_dialog.copy_name', { name: source.name }) : '';
  });

  protected onCreateClick(): void {
    this.duplicateSource.set(null);
    this.createOpen.set(true);
  }

  protected onCreateCancel(): void {
    this.createOpen.set(false);
  }

  /**
   * Crea el grupo y abre su ficha en «Canales y agentes», que es lo siguiente que se hace con un
   * grupo nuevo: asignarle gente. Un duplicado se lleva además los agentes del original, con los
   * canales recortados a los que se hayan marcado en el alta.
   */
  protected onCreateConfirm(submission: GroupCreateSubmission): void {
    const source = this.duplicateSource();
    const draft = source
      ? duplicateGroupDraft(source, submission.name, submission.channels)
      : newGroupDraft(this.defaultsStore.defaults(), submission.name, submission.channels);
    const created = this.groupsStore.addGroup(draft);
    if (source) {
      const allowed = new Set(submission.channels);
      this.linksStore.replaceLinksForGroup(
        created.id,
        this.linksStore.linksForGroup(source.id).map((l) => ({
          ...l,
          groupId: created.id,
          channels: l.channels.filter((c) => allowed.has(c)),
        })),
      );
    }
    this.createOpen.set(false);
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('groups.toasts.created', { name: created.name }),
      life: TOAST_LIFE.success,
    });
    void this.router.navigateByUrl(`/admin/grupos/editar/${created.id}`);
  }

  protected onRowOpen(group: Group): void {
    void this.router.navigateByUrl(`/admin/grupos/editar/${group.id}`);
  }

  /** Menú de cada fila: el mismo con «⋮» y con clic derecho (lo abre la lista). */
  protected readonly rowMenu = (group: Group): MenuItem[] => this.buildMenuItems(group);

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
        styleClass: 'sc-menu-item--danger',
        command: () => this.onRowDelete(group),
      },
    ];
  }

  protected onRowEdit(group: Group): void {
    void this.router.navigateByUrl(`/admin/grupos/editar/${group.id}`);
  }

  /** Duplicar es el alta con punto de partida: mismo diálogo, con el nombre propuesto y sus canales. */
  protected onRowDuplicate(group: Group): void {
    this.duplicateSource.set(group);
    this.createOpen.set(true);
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

  /** «de Baja»: la selección pasa a ser todos los grupos que están en Baja. */
  protected onBulkMatch(match: BulkEditMatch): void {
    const key = match.fieldKey as 'priority' | 'strategy';
    const ids = this.groups()
      .filter((g) => g[key] === match.value)
      .map((g) => g.id);
    this.selectedIds.set(new Set(ids));
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

  protected onExport(visibleRows: readonly Group[]): void {
    const headers = [
      this.translate.instant('groups.export.code'),
      this.translate.instant('groups.export.name'),
      this.translate.instant('groups.export.phone'),
      this.translate.instant('groups.export.priority'),
      this.translate.instant('groups.export.strategy'),
      this.translate.instant('groups.export.channels'),
      this.translate.instant('groups.export.services'),
      this.translate.instant('groups.export.agent_count'),
    ];
    const rows = visibleRows.map((g) => [
      g.code,
      g.name,
      g.phone,
      this.translate.instant(this.priorityKeys[g.priority]),
      g.strategy,
      g.channels.map((c) => this.translate.instant(this.channelKeys[c])).join(', '),
      (g.services ?? []).join(', '),
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
