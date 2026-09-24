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
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { UndoStackService, XlsxExportService } from '@core/services';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { injectLangChange } from '@core/utils/lang-change';
import { ChannelIconComponent, IllustratedAvatarComponent, ListPageComponent, type LabelColor } from '@shared/components';
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
  AGENT_TYPES,
  Agent,
  ExtensionType,
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
/* v5 (2026-09-24): columnas nuevas (Email, Teléfono, Grabación), fuera Activación, y el ID detrás del nombre.
 * Una lista guardada no las conoce. Salta la v4, que usó la rama `comparar/fichas` en el mismo origen local. */
const COLUMN_PREF_KEY = 'sc-agents-columns-v5';

/** El glifo de cada tipo de extensión: la llamada va por un teléfono o por la web. */
const EXTENSION_ICONS: Readonly<Record<ExtensionType, string>> = {
  phone: 'smartphone',
  webrtc: 'language',
};

/** Cómo se pinta la etiqueta de un estado: un color de etiqueta, o una severidad nativa de `p-tag`. */
type PresenceTag = { readonly labelColor: LabelColor } | { readonly severity: 'warn' | 'secondary' };

/**
 * La etiqueta de cada estado, la MISMA que en Contact Center › Servicio, donde se configuran:
 * Disponible verde; No disponible rojo, y en rojo también sus motivos (Baño, Comida, Formación), porque son maneras de
 * no estar disponible; Administrativo, la etiqueta nativa de aviso (`warn`), que en oscuro sigue amarilla (el ámbar
 * salía marrón). Los dos que allí no salen, porque no se eligen: Post-conversando en azul y Desconectado con la
 * etiqueta «Draft» de PrimeNG (`secondary`).
 */
const PRESENCE_TAGS: Readonly<Record<PresenceStatus, PresenceTag>> = {
  disponible: { labelColor: 'green' },
  no_disponible: { labelColor: 'red' },
  bano: { labelColor: 'red' },
  comida: { labelColor: 'red' },
  formacion: { labelColor: 'red' },
  administrativo: { severity: 'warn' },
  post_conversando: { labelColor: 'blue' },
  desconectado: { severity: 'secondary' },
};

@Component({
  selector: 'sc-agents-list-page',
  imports: [
    BulkEditMenuComponent,
    ButtonComponent,
    TagComponent,
    DeleteEntityDialogComponent,
    EmptyStateComponent,
    IconComponent,
    ChannelIconComponent,
    IllustratedAvatarComponent,
    GroupPopoverComponent,
    ImpactPreviewDialogComponent,
    InlineRenameCellComponent,
    ListPageComponent,
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
    const order: readonly Channel[] = ['phone', 'chat', 'whatsapp', 'email'];
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
  protected readonly emptyIcon = 'headphones';
  protected readonly recordingIcon = 'radio_button_checked';

  protected readonly typeKeys = AGENT_TYPE_LABEL_KEYS;
  protected readonly presenceKeys = PRESENCE_LABEL_KEYS;
  protected readonly agents = this.agentsStore.agents;

  /** Selección: la lista la marca; de ella cuelgan la edición en lote, el borrado y el diálogo de impacto. */
  protected readonly selectedIds = signal<ReadonlySet<Agent['id']>>(new Set());
  protected readonly deleteTarget = signal<readonly Agent[] | null>(null);
  protected readonly renamingId = signal<number | null>(null);
  protected readonly pendingBulkEdit = signal<PendingBulkEdit | null>(null);
  protected readonly columnPrefKey = COLUMN_PREF_KEY;
  protected readonly columnDefs = computed<readonly ColumnDef[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    /* Lo que sale de inicio es lo que usa todo el mundo. Opcionales: el ID, que solo usa
     * posventa en sus incidencias; el teléfono, que no todos tienen; y el tipo, que solo existe en CusCare. */
    return [
      { key: 'name', label: this.translate.instant('agents.table.name'), locked: true },
      { key: 'code', label: this.translate.instant('agents.table.code'), defaultVisible: false },
      { key: 'extension', label: this.translate.instant('agents.table.extension') },
      { key: 'email', label: this.translate.instant('agents.table.email') },
      { key: 'phone', label: this.translate.instant('agents.table.phone'), defaultVisible: false },
      { key: 'channels', label: this.translate.instant('agents.table.channels') },
      { key: 'type', label: this.translate.instant('agents.table.type'), defaultVisible: false },
      { key: 'presence', label: this.translate.instant('agents.table.presence') },
      { key: 'recording', label: this.translate.instant('agents.table.recording') },
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
   * (y lo que hay persistido en `sc-agents-columns-v5`).
   */
  private readonly codeTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('codeTpl');
  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('nameTpl');
  private readonly extensionTpl =
    viewChild<TemplateRef<ScColumnCellContext<Agent>>>('extensionTpl');
  private readonly emailTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('emailTpl');
  private readonly phoneTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('phoneTpl');
  private readonly channelsTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('channelsTpl');
  private readonly typeTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('typeTpl');
  private readonly presenceTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('presenceTpl');
  private readonly recordingTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('recordingTpl');
  private readonly groupsTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('groupsTpl');

  protected readonly columns = computed<readonly ScColumnDef<Agent>[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    /* Anchos MEDIDOS del dato más largo de cada columna corta en los cuatro idiomas: el nombre se come el
     * resto y la tabla lleva `tableMinWidth`, así que por debajo se desplaza en vez de cortar. Todas llevan
     * ancho en rem, también las opcionales: `sc-list-page` descuenta las ocultas del ancho mínimo. */
    return [
      {
        field: 'name',
        header: this.translate.instant('agents.table.name'),
        sortable: true,
        cellTemplate: this.nameTpl(),
      },
      {
        // Detrás del nombre y opcional: es un código que solo usa posventa. Antes iba el primero.
        field: 'code',
        header: this.translate.instant('agents.table.code'),
        sortable: true,
        cellTemplate: this.codeTpl(),
        width: '6rem',
      },
      {
        field: 'extension',
        header: this.translate.instant('agents.table.extension'),
        sortable: true,
        cellTemplate: this.extensionTpl(),
        width: '7.5rem',
      },
      {
        field: 'email',
        header: this.translate.instant('agents.table.email'),
        sortable: true,
        cellTemplate: this.emailTpl(),
        width: '16.75rem',
      },
      {
        field: 'phone',
        header: this.translate.instant('agents.table.phone'),
        sortable: true,
        cellTemplate: this.phoneTpl(),
        width: '8rem',
      },
      {
        field: 'channels',
        header: this.translate.instant('agents.table.channels'),
        cellTemplate: this.channelsTpl(),
        /* Cuatro glifos de 16 px con su hueco (teléfono, chat, WhatsApp, email). */
        width: '7.75rem',
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
        /* «Post-conversando» (122) + punto (7) + hueco (7) = 136 px de dato; con 10rem quedaban 132 (2026-09-24). */
        width: '10.25rem',
      },
      {
        field: 'recording',
        header: this.translate.instant('agents.table.recording'),
        sortable: true,
        cellTemplate: this.recordingTpl(),
        /* La cabecera en francés, «Enregistrement», con su flecha de orden. */
        width: '9.5rem',
      },
      {
        field: 'groups',
        header: this.translate.instant('agents.table.groups'),
        cellTemplate: this.groupsTpl(),
        width: '5.5rem',
      },
    ];
  });

  /* Sin «Activación» (ya no existe) ni «Estado» (no se cambia desde la lista). */
  protected readonly bulkEditFields = computed<readonly BulkEditFieldOption[]>(() => {
    this.lang(); // textos al día al cambiar de idioma (ver `injectLangChange`)
    return [
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

  /**
   * Qué filas casan con la búsqueda (la consulta llega ya en minúsculas): cualquier campo de texto de la tabla, se
   * vea o no su columna, con los rótulos en el idioma de la pantalla (2026-09-24). Los iconos (canales, tipo de
   * extensión) y lo que solo sale al pasar el ratón
   * (los grupos) no cuentan: casaría una fila sin que se viera por qué.
   */
  protected readonly matchesSearch = (a: Agent, q: string): boolean =>
    [
      a.name,
      a.code,
      a.extension,
      a.email,
      a.phone,
      this.translate.instant(this.typeKeys[a.agentType]),
      a.presenceStatus ? this.translate.instant(this.presenceKeys[a.presenceStatus]) : undefined,
    ].some((value) => value?.toLowerCase().includes(q) ?? false);

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
      case 'email':
        return (a.email ?? '').localeCompare(b.email ?? '');
      case 'phone':
        return (a.phone ?? '').localeCompare(b.phone ?? '');
      case 'type':
        return a.agentType.localeCompare(b.agentType);
      case 'recording':
        return Number(a.permissions.recording) - Number(b.permissions.recording);
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

  protected presenceLabelColor(presence: PresenceStatus): LabelColor | null {
    const tag = PRESENCE_TAGS[presence];
    return 'labelColor' in tag ? tag.labelColor : null;
  }

  protected presenceSeverity(presence: PresenceStatus): 'warn' | 'secondary' {
    const tag = PRESENCE_TAGS[presence];
    return 'severity' in tag ? tag.severity : 'secondary';
  }

  protected extensionIcon(type: ExtensionType): string {
    return EXTENSION_ICONS[type];
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

  /** Exporta TODOS los campos de la tabla, se vean o no: el fichero es para trabajar con él, no una foto. */
  protected onExport(visibleRows: readonly Agent[]): void {
    const t = (key: string): string => this.translate.instant(key);
    const headers = [
      t('agents.export.code'),
      t('agents.export.name'),
      t('agents.export.extension'),
      t('agents.export.extension_type'),
      t('agents.export.email'),
      t('agents.export.phone'),
      t('agents.export.type'),
      t('agents.export.status'),
      t('agents.export.recording'),
      t('agents.export.groups'),
    ];
    const rows = visibleRows.map((a) => [
      a.code,
      a.name,
      a.extension,
      t(`agents.ext_kind.${a.extensionType}`),
      a.email ?? '',
      a.phone ?? '',
      t(this.typeKeys[a.agentType]),
      a.presenceStatus ? t(this.presenceKeys[a.presenceStatus]) : '',
      t(a.permissions.recording ? 'common.yes' : 'common.no'),
      this.groupsForAgent(a.id)
        .map((g) => g.name)
        .join(', '),
    ]);
    this.xlsx.export({
      headers,
      rows,
      sheetName: t('agents.export.sheet'),
      filePrefix: 'agentes',
    });
  }
}
