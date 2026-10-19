import { ChangeDetectionStrategy, Component, computed, inject, signal, type TemplateRef, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { type MenuItem } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { ResultadoAccionService, XlsxExportService } from '@core/services';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectLangChange } from '@core/utils/lang-change';
import { CeldaVaciaComponent, ChannelIconComponent, ListPageComponent } from '@shared/components';
import { AgentsStore } from '@features/admin/agents/state/agents.store';
import {
  type ScColumnCellContext,
  ColumnDef,
  type ScColumnDef,
  ScEmptyStateComponent as EmptyStateComponent,
  ScInlineRenameCellComponent as InlineRenameCellComponent,
  ScTagComponent as TagComponent,
  ScGroupPopoverComponent as GroupPopoverComponent,
} from '@smartcontact-hub/components';
import {
  CHANNEL_LABEL_KEYS,
  GROUP_CHANNELS,
  Group,
  GroupChannel,
  GroupPriority,
  PRIORITY_LABEL_KEYS,
  chatStrategyOf,
  compareChannels,
  duplicateGroupDraft,
  type GroupIdentityDraft,
  phoneStrategyOf,
  priorityRank,
  OUTBOUND_NUMBERS,
} from '../data/groups-data';
import { GroupsStore } from '../state/groups.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';
import { GroupDuplicateDialogComponent } from '../components/group-duplicate-dialog/group-duplicate-dialog.component';
import { GroupAgentsPanelComponent } from '../components/group-agents-panel/group-agents-panel.component';
import { injectConfirmarBorrado } from '@features/admin/services/confirmar-borrado';
import { TooltipModule } from 'primeng/tooltip';

/* v2 — bumped when ColumnSelector schema changed (set → ordered array)
 * and when `code` started shipping hidden by default. */
/* v3 (2026-09-16): columna nueva (Servicios). Una lista guardada no la conoce y no saldría nunca. */
/* v4 (2026-09-24): el ID pasa detrás del nombre. Una lista guardada lo seguiría poniendo el primero.
 * La columna «Estrategia de chat» (2026-09-26) no pide versión: es opcional, y el selector solo añade a lo
 * guardado las columnas nuevas que salen por defecto. */
const COLUMN_PREF_KEY = 'sc-groups-columns-v4';

@Component({
  selector: 'sc-groups-list-page',
  imports: [
    TooltipModule,
    CeldaVaciaComponent,
    ButtonComponent,
    ChannelIconComponent,
    TagComponent,
    EmptyStateComponent,
    GroupPopoverComponent,
    GroupDuplicateDialogComponent,
    GroupAgentsPanelComponent,
    IconComponent,
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
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly router = inject(Router);
  private readonly confirmarBorrado = injectConfirmarBorrado('groups.entity_singular');

  /** CTA proyectado a la TopBar (modelo "todo arriba" S59): la banda de
   * page-header desaparece; identidad → breadcrumb, acción → barra. */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
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

  protected readonly renamingId = signal<number | null>(null);
  protected readonly columnPrefKey = COLUMN_PREF_KEY;

  protected readonly columnDefs = computed<readonly ColumnDef[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    return [
      { key: 'name', label: this.translate.instant('groups.table.name'), locked: true },
      // Detrás del nombre y opcional, como en Agentes.
      { key: 'code', label: this.translate.instant('groups.table.code'), defaultVisible: false },
      { key: 'phone', label: this.translate.instant('groups.table.phone') },
      { key: 'channels', label: this.translate.instant('groups.table.channels') },
      { key: 'priority', label: this.translate.instant('groups.table.priority') },
      // Una columna por familia de canales, como la ficha: cada una se ordena y se exporta sola.
      // La de chat, opcional: con las dos a la vez la tabla no cabe a 1440 sin recortar (medido el 2026-09-26).
      { key: 'strategy', label: this.translate.instant('groups.table.strategy_phone') },
      { key: 'chatStrategy', label: this.translate.instant('groups.table.strategy_chat'), defaultVisible: false },
      { key: 'services', label: this.translate.instant('groups.table.services') },
      // Su cifra abre el panel rápido de agentes (DD-159). No va fija: se oculta y se mueve como las demás (2026-10-19).
      { key: 'agents', label: this.translate.instant('groups.table.agents') },
    ];
  });

  /**
   * Qué filas casan con la búsqueda (la consulta llega ya en minúsculas): cualquier campo de texto de la tabla, con
   * la prioridad en el idioma de la pantalla (2026-09-24). Los canales son iconos, y los servicios y agentes
   * solo salen al pasar el ratón: casaría una fila sin que se viera por qué. Por lo mismo, el teléfono y cada
   * estrategia cuentan solo si el grupo tiene ese canal: si no, su celda dice «—».
   */
  protected readonly matchesSearch = (g: Group, q: string): boolean =>
    [
      g.name,
      g.code,
      this.hasPhone(g) ? g.phone : null,
      phoneStrategyOf(g),
      chatStrategyOf(g),
      this.translate.instant(this.priorityKeys[g.priority]),
    ].some((value) => value?.toLowerCase().includes(q) ?? false);

  /* El orden lo resuelve ESTA página y no la tabla: `agents` es un contador DERIVADO de `linksStore` (no hay
   * `row.agents`) y `name` compara con locale 'es'. Devuelve el orden ascendente; la dirección la pone la lista. */
  protected readonly compareGroups = (a: Group, b: Group, field: string): number => {
    switch (field) {
      case 'name':
        return a.name.localeCompare(b.name, 'es');
      case 'code':
        return a.code.localeCompare(b.code);
      case 'priority':
        return priorityRank(a.priority) - priorityRank(b.priority);
      case 'agents':
        return this.assignedCountForGroup(a.id) - this.assignedCountForGroup(b.id);
      case 'strategy':
        return (phoneStrategyOf(a) ?? '').localeCompare(phoneStrategyOf(b) ?? '', 'es');
      case 'chatStrategy':
        return (chatStrategyOf(a) ?? '').localeCompare(chatStrategyOf(b) ?? '', 'es');
      case 'phone':
        return (this.hasPhone(a) ? a.phone : '').localeCompare(this.hasPhone(b) ? b.phone : '', 'es', { numeric: true });
      case 'channels':
        return compareChannels(a.channels, b.channels, GROUP_CHANNELS);
      case 'services':
        return (a.services?.length ?? 0) - (b.services?.length ?? 0);
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
  private readonly chatStrategyTpl = viewChild<TemplateRef<ScColumnCellContext<Group>>>('chatStrategyTpl');
  private readonly servicesTpl = viewChild<TemplateRef<ScColumnCellContext<Group>>>('servicesTpl');
  private readonly agentsTpl = viewChild<TemplateRef<ScColumnCellContext<Group>>>('agentsTpl');

  /** Todas se ordenan (antes, solo las cinco que llevaban `scSortable`). La columna del menú de fila la añade la lista. */
  protected readonly columns = computed<readonly ScColumnDef<Group>[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    return [
      {
        field: 'name',
        header: this.translate.instant('groups.table.name'),
        sortable: true,
        cellTemplate: this.nameTpl(),
      },
      {
        field: 'code',
        header: this.translate.instant('groups.table.code'),
        sortable: true,
        cellTemplate: this.codeTpl(),
        /* Sin ancho se repartía el sobrante con el nombre y salía desproporcionada (medido a 1440, 2026-09-24). */
        width: '6rem',
      },
      {
        field: 'phone',
        header: this.translate.instant('groups.table.phone'),
        sortable: true,
        cellTemplate: this.phoneTpl(),
        /* Anchos MEDIDOS del dato más largo de cada columna corta (2026-09-14); el nombre se come el
         * resto y la tabla lleva `tableMinWidth`: por debajo se desplaza en vez de cortar. Desde que se ordena
         * (2026-10-06), lo que manda es la cabecera con su flecha: «Téléphone», 118 px, y unos 4 de margen. */
        width: '7.625rem',
      },
      {
        field: 'channels',
        header: this.translate.instant('groups.table.channels'),
        sortable: true,
        cellTemplate: this.channelsTpl(),
        /* Cuatro glifos de 16 px con su hueco (teléfono, chat, WhatsApp, email). */
        width: '7.75rem',
      },
      {
        field: 'priority',
        skeleton: 'tag',
        header: this.translate.instant('groups.table.priority'),
        sortable: true,
        cellTemplate: this.priorityTpl(),
        /* La cabecera con su flecha: «Prioridade», 117 px (medido a 1440, 2026-10-06; con 7rem se salía 5). */
        width: '7.625rem',
      },
      {
        field: 'strategy',
        skeleton: 'tag',
        header: this.translate.instant('groups.table.strategy_phone'),
        sortable: true,
        cellTemplate: this.strategyTpl(),
        /* Medido a 1440 (2026-10-01): la etiqueta más ancha del catálogo, «Menos conversaciones atendidas»
         * (DD-141), pide 201 px más los 28 de la celda. La cabecera con su flecha pedía 198 (2026-09-26). */
        width: '15rem',
      },
      {
        field: 'chatStrategy',
        skeleton: 'tag',
        header: this.translate.instant('groups.table.strategy_chat'),
        sortable: true,
        cellTemplate: this.chatStrategyTpl(),
        /* La etiqueta más ancha, «Menos conversaciones atendidas», la misma que en teléfono desde que Chat dejó
         * «activas» (DD-185): 15rem, como ella (medido a 1440, 2026-10-07). */
        width: '15rem',
      },
      {
        field: 'services',
        header: this.translate.instant('groups.table.services'),
        sortable: true,
        cellTemplate: this.servicesTpl(),
        /* La cabecera con su flecha: «Servicios», 111 px (medido a 1440, 2026-10-06). */
        width: '7.25rem',
      },
      {
        field: 'agents',
        header: this.translate.instant('groups.table.agents'),
        sortable: true,
        /* 7rem: con 96 px la cabecera y su flecha de orden partían en dos líneas. El mismo desplegable que «Grupos» en
         * la lista de agentes: al pasar, quiénes son. Y al pulsar, el panel rápido para asignarlos (DD-159): la cifra
         * y la acción eran dos columnas para lo mismo. Asignar es lo que más se hace con un grupo una vez creado
         * (visión de producto de grupos, 2026-09-25). `stopRowClick`: pulsarla no abre la ficha. */
        cellTemplate: this.agentsTpl(),
        width: '7rem',
        stopRowClick: true,
      },
    ];
  });

  /** Mientras se renombra una fila, abrirla no hace nada (y no enseña el cursor de mano). */
  protected readonly isOpenable = (group: Group): boolean => this.renamingId() !== group.id;

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

  protected hasPhone(group: Group): boolean {
    return group.channels.includes('phone');
  }

  protected phoneStrategy(group: Group): string | null {
    return phoneStrategyOf(group);
  }

  protected chatStrategy(group: Group): string | null {
    return chatStrategyOf(group);
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

  /** El grupo cuyo panel rápido de agentes está abierto. */
  protected readonly agentsPanelGroup = signal<Group | null>(null);

  protected openAgentsPanel(group: Group): void {
    this.agentsPanelGroup.set(group);
  }

  protected closeAgentsPanel(): void {
    this.agentsPanelGroup.set(null);
  }

  /** El diálogo de duplicar: `duplicateSource` es el original (el alta es la ficha, DD-121 §11). */
  protected readonly duplicateOpen = signal(false);
  protected readonly duplicateSource = signal<Group | null>(null);
  protected readonly groupNames = computed(() => this.groups().map((g) => g.name));
  /** Los números que ya usan los grupos: el desplegable del teléfono asociado, igual que en la ficha. */
  /** Los números asignados a la cuenta: el duplicado elige uno de ellos (DD-142). */
  protected readonly outboundNumbers = OUTBOUND_NUMBERS;
  protected readonly suggestedCopyName = computed(() => {
    this.lang();
    const source = this.duplicateSource();
    return source ? this.translate.instant('groups.create_dialog.copy_name', { name: source.name }) : '';
  });

  /** El alta es la propia ficha en modo alta (DD-121 §11). */
  protected onCreateClick(): void {
    void this.router.navigateByUrl('/admin/grupos/crear');
  }

  protected onDuplicateCancel(): void {
    this.duplicateOpen.set(false);
  }

  /**
   * Crea el duplicado y abre su ficha: se lleva todo lo del original, agentes incluidos, con el nombre y
   * el teléfono que se hayan puesto en el diálogo.
   */
  protected onDuplicateConfirm(submission: GroupIdentityDraft): void {
    const source = this.duplicateSource();
    if (!source) return;
    const created = this.groupsStore.addGroup(duplicateGroupDraft(source, submission));
    this.linksStore.replaceLinksForGroup(
      created.id,
      this.linksStore.linksForGroup(source.id).map((l) => ({ ...l, groupId: created.id })),
    );
    this.duplicateOpen.set(false);
    const creado = this.translate.instant('groups.toasts.created', { name: created.name });
    // El toast, ya en la ficha a la que se llega (DD-211 §5).
    void this.router.navigateByUrl(`/admin/grupos/editar/${created.id}`).then(() => this.resultado.contar(creado));
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
        command: () => this.onRowDuplicate(group),
      },
      { separator: true },
      {
        // Sin puntos suspensivos: lleva a una confirmación simple, no a la puerta tecleada (DD-215).
        label: this.translate.instant('common.delete'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'sc-menu-item--danger',
        command: () => this.onRowDelete(group),
      },
    ];
  }

  protected onRowEdit(group: Group): void {
    void this.router.navigateByUrl(`/admin/grupos/editar/${group.id}`);
  }

  /** Duplicar: el diálogo corto con el nombre propuesto; el resto se copia del original. */
  protected onRowDuplicate(group: Group): void {
    this.duplicateSource.set(group);
    this.duplicateOpen.set(true);
  }

  /** Borrar: la confirmación simple del DS (DD-215); al aceptar, fuera el grupo y sus enlaces, y el toast. */
  protected async onRowDelete(group: Group): Promise<void> {
    if (!(await this.confirmarBorrado(group.name))) return;
    this.groupsStore.deleteGroup(group.id);
    this.linksStore.removeGroup(group.id);
    this.resultado.contar(this.translate.instant('groups.toasts.deleted_single', { name: group.name }));
  }

  protected onRenameCommit(id: number, value: string): void {
    this.groupsStore.updateGroup(id, { name: value });
    this.renamingId.set(null);
    // El resultado, en un toast (DD-211 §5).
    this.resultado.contar(this.translate.instant('groups.toasts.duplicated', { name: value }));
  }

  protected onRenameCancel(_id: number): void {
    this.renamingId.set(null);
  }

  protected onExport(visibleRows: readonly Group[]): void {
    const headers = [
      this.translate.instant('groups.export.code'),
      this.translate.instant('groups.export.name'),
      this.translate.instant('groups.export.phone'),
      this.translate.instant('groups.export.priority'),
      this.translate.instant('groups.export.strategy_phone'),
      this.translate.instant('groups.export.strategy_chat'),
      this.translate.instant('groups.export.channels'),
      this.translate.instant('groups.export.services'),
      this.translate.instant('groups.export.agent_count'),
    ];
    const rows = visibleRows.map((g) => [
      g.code,
      g.name,
      this.hasPhone(g) ? g.phone : '',
      this.translate.instant(this.priorityKeys[g.priority]),
      phoneStrategyOf(g) ?? '',
      chatStrategyOf(g) ?? '',
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
