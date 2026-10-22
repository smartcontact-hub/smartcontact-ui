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
import { type MenuItem } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { ResultadoAccionService, XlsxExportService } from '@core/services';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectLangChange } from '@core/utils/lang-change';
import { CeldaVaciaComponent, ChannelIconComponent, type LabelColor, ListPageComponent, PresenceAvatarComponent } from '@shared/components';
import {
  type ScColumnCellContext,
  type ScColumnDef,
  ColumnDef,
  ScEmptyStateComponent as EmptyStateComponent,
  ScGroupPopoverComponent as GroupPopoverComponent,
  ScTagComponent as TagComponent,
} from '@smartcontact-hub/components';
import {
  AGENT_TYPE_LABEL_KEYS,
  Agent,
  EXTENSION_ICONS,
  ExtensionType,
  PRESENCE_LABEL_KEYS,
  PRESENCE_TAGS,
  PresenceStatus,
} from '../data/agents-data';
import { AgentsStore } from '../state/agents.store';
import { CHANNEL_FAMILIES, FAMILY_LABEL_KEYS, compareChannels } from '@features/admin/groups/data/groups-data';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { EquiposStore } from '@features/admin/repositories/state/equipos.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';
import { injectConfirmarBorrado } from '@features/admin/services/confirmar-borrado';
import { Channel } from '@features/admin/services/group-agent-links.types';
import { permittedFamilies } from '@features/admin/services/group-channels.core.mjs';
import { TooltipModule } from 'primeng/tooltip';

/* v2 — schema bumped from a Set<string> to an ordered string[] when the
 * ColumnSelector gained drag-to-reorder + per-column defaultVisible.
 * Older `_v1` caches no longer parse and are silently ignored. */
/* v5 (2026-09-24): columnas nuevas (Email, Teléfono, Grabación), fuera Activación, y el ID detrás del nombre.
 * Una lista guardada no las conoce. Salta la v4, que usó la rama `comparar/fichas` en el mismo origen local. */
const COLUMN_PREF_KEY = 'sc-agents-columns-v5';

@Component({
  selector: 'sc-agents-list-page',
  imports: [
    TooltipModule,
    CeldaVaciaComponent,
    ButtonComponent,
    TagComponent,
    EmptyStateComponent,
    IconComponent,
    ChannelIconComponent,
    PresenceAvatarComponent,
    GroupPopoverComponent,
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
  private readonly equipos = inject(EquiposStore);
  private readonly linksStore = inject(GroupAgentLinksStore);
  private readonly xlsx = inject(XlsxExportService);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly router = inject(Router);
  private readonly confirmarBorrado = injectConfirmarBorrado('agents.delete_dialog.title');

  /** CTA "Nuevo agente" proyectado a la TopBar (modelo "todo arriba" S59):
   * la banda de page-header desaparece; identidad → breadcrumb, acción → barra. */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  /**
   * Por dónde atiende: la unión de las familias de sus enlaces activos (Teléfono, Chat y Email, DD-147), cada una
   * RECORTADA a las que su grupo ofrece hoy, que es como las lee la ficha del grupo (DD-121). Un enlace puede
   * guardar una que su grupo ya no tiene (se la quitaron al grupo, datos de antes) y la lista la pintaba: en el
   * seed, un Email que el agente 18 no atiende en ningún grupo (medido el 2026-09-26).
   */
  protected channelsForAgent(agentId: number): readonly Channel[] {
    const offeredBy = new Map(this.groupsStore.groups().map((g) => [g.id, new Set<Channel>(permittedFamilies(g.channels, this.agentsStore.getAgent(agentId)?.allowedChannels))]));
    const set = new Set<Channel>();
    for (const link of this.linksStore.linksForAgent(agentId)) {
      const offered = offeredBy.get(link.groupId);
      if (!link.active || !offered) continue;
      for (const c of link.channels) if (offered.has(c)) set.add(c);
    }
    return CHANNEL_FAMILIES.filter((c) => set.has(c));
  }

  /** El nombre de una familia, el mismo que en la tabla de agentes del grupo («Chat»: Web Chat y WhatsApp). */
  protected channelLabelKey(channel: Channel): string {
    return FAMILY_LABEL_KEYS[channel];
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

  /** Filas marcadas: la lista las pinta y exportar las usa; sin barra de lote (DD-215). */
  protected readonly selectedIds = signal<ReadonlySet<number>>(new Set());
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
      { key: 'presence', label: this.translate.instant('agents.table.presence'), defaultVisible: false },
      { key: 'recording', label: this.translate.instant('agents.table.recording') },
      { key: 'groups', label: this.translate.instant('agents.table.groups') },
      // Las marcas para filtrar (revisión de agentes del 2026-10-09): en Voice, la columna con la que filtran.
      { key: 'teams', label: this.translate.instant('repositories.equipos.title') },
    ];
  });

  /** Los equipos de cada uno, por su nombre (Repositorios › Equipos). */
  private readonly teamNames = computed(() => new Map(this.equipos.items().map((g) => [g.id, g.name])));

  protected teamsOf(agent: Agent): string {
    const names = this.teamNames();
    return (agent.teams ?? []).flatMap((id) => names.get(id) ?? []).join(', ');
  }

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
  private readonly teamsTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('teamsTpl');

  protected readonly columns = computed<readonly ScColumnDef<Agent>[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    /* Anchos MEDIDOS del dato más largo de cada columna corta en los cuatro idiomas. El nombre crece hasta 24rem y, en
     * una tabla más ancha, el sobrante va a la columna del «⋮» (DD-187 §7, en `sc-list-page`); la tabla lleva
     * `tableMinWidth`, así que por debajo se desplaza en vez de cortar. Todas llevan
     * ancho en rem, también las opcionales: `sc-list-page` descuenta las ocultas del ancho mínimo. */
    return [
      {
        field: 'name',
        skeleton: 'avatar',
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
        sortable: true,
        cellTemplate: this.channelsTpl(),
        /* Tres familias: 48 px de glifos + 21 de huecos + 28 de relleno de celda (DD-147). Desde que se ordena
         * (2026-10-06) manda la cabecera con su flecha: «Channels», 111 px (medido a 1440). */
        width: '7.25rem',
      },
      {
        // `field: 'type'` no existe en `Agent` (la propiedad es `agentType`), así
        // que el orden client-side de p-table sobre esta columna compara
        // undefined con undefined: es un no-op estable. Quien ordena de verdad es
        // `compareAgents`, que sí sabe leer `agentType`. El `field` no se puede
        // renombrar: es la identidad de la columna para el selector y lo que hay
        // guardado en localStorage.
        field: 'type',
        skeleton: 'tag',
        header: this.translate.instant('agents.table.type'),
        sortable: true,
        cellTemplate: this.typeTpl(),
        width: '9rem',
      },
      {
        field: 'presence',
        skeleton: 'tag',
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
        /* La cabecera en francés, «Enregistrement», con su flecha de orden. Con 9,5rem le sobraban 1,5 px en macOS y en el CI
         * se salía 1 (las letras pintan más anchas en Linux): 4 px de margen, como las demás (2026-10-06). */
        width: '9.75rem',
      },
      {
        field: 'groups',
        header: this.translate.instant('agents.table.groups'),
        sortable: true,
        cellTemplate: this.groupsTpl(),
        /* La cabecera con su flecha: «Groupes», 105 px (medido a 1440, 2026-10-06). */
        width: '6.875rem',
      },
      {
        field: 'teams',
        header: this.translate.instant('repositories.equipos.title'),
        sortable: true,
        cellTemplate: this.teamsTpl(),
        /* «Groupes d'agents» con su flecha; los nombres largos se cortan con «…» y su `title`. */
        width: '11rem',
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
      this.teamsOf(a),
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
      case 'channels':
        return compareChannels(this.channelsForAgent(a.id), this.channelsForAgent(b.id), CHANNEL_FAMILIES);
      case 'groups':
        return this.groupsForAgent(a.id).length - this.groupsForAgent(b.id).length;
      case 'teams':
        return this.teamsOf(a).localeCompare(this.teamsOf(b), 'es');
      default:
        return 0;
    }
  };


  /**
   * Clave i18n del tipo de agente. Es un método y no un indexado en plantilla
   * porque el contexto de `<ng-template let-agent>` es `any`, y `typeKeys[any]`
   * sobre un `Record<AgentType, string>` es un índice implícitamente `any` que
   * el AOT rechaza (TS7053). Con la fila dentro de un `@for` tipado no pasaba.
   */
  protected typeLabelKey(agent: Agent): string {
    return this.typeKeys[agent.agentType];
  }

  protected onCreateClick(): void {
    void this.router.navigateByUrl('/admin/agentes/crear');
  }

  /** Abrir la ficha, con la fila o con «Editar», entra por General, la primera de su índice (DD-213). Hasta
   *  entonces entraba por Grupos asignados (DD-122). */
  protected onRowOpen(agent: Agent): void {
    void this.router.navigate(['/admin/agentes/editar', agent.id]);
  }

  /** La cifra de grupos lleva a donde se cambian, «Grupos asignados» de su ficha (DD-159, DD-213). */
  protected openGroups(agent: Agent): void {
    void this.router.navigate(['/admin/agentes/editar', agent.id], { queryParams: { seccion: 'grupos' } });
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
        label: this.translate.instant('common.duplicate'),
        icon: 'sc-icon-font sc-icon-font--content_copy',
        command: () => this.onRowDuplicate(agent),
      },
      { separator: true },
      {
        // Sin puntos suspensivos: lleva a una confirmación simple, no a la puerta tecleada (DD-215).
        label: this.translate.instant('common.delete'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'sc-menu-item--danger',
        command: () => this.onRowDelete(agent),
      },
    ];
  }

  protected onRowEdit(agent: Agent): void {
    this.onRowOpen(agent);
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

  /** Borrar: la confirmación simple del DS (DD-215); al aceptar, fuera el agente y sus enlaces, y el toast. */
  protected async onRowDelete(agent: Agent): Promise<void> {
    if (!(await this.confirmarBorrado(agent.name))) return;
    this.agentsStore.deleteAgent(agent.id);
    this.linksStore.removeAgent(agent.id);
    this.resultado.contar(this.translate.instant('agents.toasts.deleted_single', { name: agent.name }));
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
      t('repositories.equipos.title'),
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
      this.teamsOf(a),
    ]);
    this.xlsx.export({
      headers,
      rows,
      sheetName: t('agents.export.sheet'),
      filePrefix: 'agentes',
    });
  }
}
