import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  linkedSignal,
  untracked,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScConfirmService,
  ScEmptyStateComponent as EmptyStateComponent,
  ScSelectButtonComponent as SelectButtonComponent,
  ScSelectComponent as SelectComponent,
  ScSearchComponent as SearchComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import {
  ScDatatableComponent as DatatableComponent,
  type ScColumnCellContext,
  type ScColumnDef,
  type ScColumnHeaderContext,
  type ScDatatableSortEvent,
} from '@smartcontact-hub/components';

import { TooltipModule } from 'primeng/tooltip';
import { LlegaAlPieDirective } from '@core/directives';

import { PresenceAvatarComponent, ScLinkButtonComponent } from '@shared/components';
import { ScCheckboxComponent as CheckboxComponent } from '@smartcontact-hub/components';

import {
  ChannelFamily,
  FAMILY_LABEL_KEYS,
  GroupChannel,
  LEVEL_OPTIONS,
} from '@features/admin/groups/data/groups-data';
import {
  Channel,
  GroupAgentLink,
} from '@features/admin/services/group-agent-links.types';
import { clampLinksToChannels, familiesOf, isLastChannel, newLinkFor, permittedFamilies, toggleLinkChannel } from '@features/admin/services/group-channels.core.mjs';

/** Lightweight agent reference accepted by the table. */
export interface AgentChannelTableAgent {
  readonly id: number;
  readonly name: string;
  readonly photo?: string;
  readonly email?: string;
  readonly allowedChannels?: readonly Channel[];
  /** «Activación por grupo»: se habilita él mismo desde su puesto, y su Habilitado no se toca aquí (SISMAC-4058). */
  readonly selfActivate?: boolean;
}

interface VisibleRow {
  readonly link: GroupAgentLink | null;
  readonly agent: AgentChannelTableAgent;
}

/**
 * El ancho de cada columna, en rem, en la tabla de la ficha y en la del panel rápido, que suma estos mismos para medirse
 * (DD-131). Las dos van en la densidad compacta nativa (`sm`, DD-176): 6 de relleno a cada lado. La cabecera es una
 * fila de texto, y Asignado, cada canal y Habilitado llevan su casilla de «todos» delante del rótulo (DD-181). Cada
 * ancho es lo más largo que lleva en los cuatro idiomas, más el relleno y unos 4 px de margen. Medido el 2026-10-05 con
 * la letra de la cabecera (600, 14 px); la casilla, 15,75, y su hueco, 7:
 *   · Asignado: casilla, hueco y «Atribuído» (65): 100.
 *   · Cada canal, casilla, hueco y su rótulo: «Téléphone» (72), «Chat» (32) y «Email» (37): 112, 72 y 76.
 *   · Habilitado: casilla, hueco y «Habilitado» (69): 108. Llevaba 9,5 rem por el candado de «Activación por grupo» al
 *     lado del interruptor; sin él (revisión del 2026-10-14), lo medido.
 *   · Agente: avatar (24), hueco y nombre y email en dos líneas. En la ficha es un MÍNIMO: la columna crece con el
 *     sitio que haya, y un email más largo que su sitio se corta con «…» y el `title` (DD-124). Con 11,625 cabe el
 *     nombre más largo de la semilla («Denzel Washington», 131), y a 1440 la tabla cabe en su caja (735) con uno o dos
 *     canales; con tres desplaza 59 px (DD-181). En el panel, que mide lo que lleva, cabe el email más largo de la
 *     semilla (203 px).
 */
const CHANNEL_REM: Readonly<Record<ChannelFamily, number>> = { phone: 7, chat: 4.5, email: 4.75 };

export const COLUMN_REM = {
  regular: { assigned: 3.5, agent: 14, level: 9, channel: CHANNEL_REM, enabled: 6.75 },
  compact: { assigned: 3.5, agent: 16.25, level: 9, channel: CHANNEL_REM, enabled: 6.75 },
} as const;

/** Lo que suman las columnas con esos canales y `levels` niveles: el mínimo de la tabla y el ancho del panel. */
export function columnsRem(
  rem: (typeof COLUMN_REM)[keyof typeof COLUMN_REM],
  families: readonly ChannelFamily[],
  levels: number,
): number {
  const channels = families.reduce((sum, family) => sum + rem.channel[family], 0);
  return rem.assigned + rem.agent + levels * rem.level + channels + rem.enabled;
}

/** La asignación se edita en la misma lista que sus canales (DD-151).
 * El filtro conserva sus filas hasta que cambia la búsqueda o la vista, para que
 * marcar o desmarcar no desplace el control bajo el puntero. El padre persiste los enlaces.
 */
@Component({
  selector: 'sc-agent-channel-table',
  standalone: true,
  imports: [
    LlegaAlPieDirective,
    SelectButtonComponent,
    SelectComponent,
    CheckboxComponent,
    DatatableComponent,
    EmptyStateComponent,
    PresenceAvatarComponent,
    SearchComponent,
    ScLinkButtonComponent,
    ToggleSwitchComponent,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './agent-channel-table.component.html',
  styleUrl: './agent-channel-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.agent-channel-table--compact]': 'compact()' },
})
export class AgentChannelTableComponent {
  private readonly translate = inject(TranslateService);
  private readonly confirm = inject(ScConfirmService);
  /* El idioma como DEPENDENCIA del computed. `translate.instant()` es una
   * llamada, no una señal: sin esto las cabeceras se calculan una vez y se
   * quedan congeladas al cambiar de idioma (el pipe `| translate` que había
   * antes sí reaccionaba). Lo vigila `audit:datatables` §6. */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang)
    ),
    { initialValue: this.translate.currentLang }
  );

  private readonly agentTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('agentTpl');
  private readonly channelTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('channelTpl');
  private readonly levelTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('levelTpl');
  private readonly activeTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('activeTpl');
  private readonly assignedTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('assignedTpl');
  /** La cabecera de las columnas con casilla de «todos», dentro del `th` del DS. */
  private readonly headerCheckTpl =
    viewChild<TemplateRef<ScColumnHeaderContext<VisibleRow>>>('headerCheckTpl');

  protected readonly columns = computed<readonly ScColumnDef<VisibleRow>[]>(
    () => {
      this.currentLang();
      const rem = COLUMN_REM[this.compact() ? 'compact' : 'regular'];
      const check = this.headerCheckTpl();
      /* Cada cabecera se llama como su rótulo (`headerAriaLabel`): las que llevan la casilla de «todos» dentro, también. */
      const assigned = this.translate.instant('groups.form.assigned.assignment');
      const agent = this.translate.instant('groups.form.assigned.col_agent');
      const active = this.translate.instant('groups.form.assigned.col_active');
      return [
        {
          field: 'assigned',
          header: assigned,
          headerAriaLabel: assigned,
          headerTemplate: check,
          width: `${rem.assigned}rem`,
          align: 'center' as const,
          cellTemplate: this.assignedTpl(),
          stopRowClick: true,
        },
        {
          field: 'agent',
          header: agent,
          headerAriaLabel: agent,
          // Por nombre, A→Z y Z→A (SISMAC-4058): el orden lo pone `visibleRows`.
          sortable: true,
          rowHeader: true,
          cellTemplate: this.agentTpl(),
        },
        /* Sin el estado de la persona (SISMAC-4058; antes, en la burbuja de su avatar, DD-185): el email gana el sitio. */
        /* Cada canal y, con la estrategia Niveles, su nivel justo detrás: Teléfono, Nivel Teléfono, Chat, Nivel Chat…
           (DD-211 §4). El nivel va en la fila de cada agente: donde ya se decide quién atiende qué. */
        ...this.families().flatMap((ch): ScColumnDef<VisibleRow>[] => {
          const canal = this.translate.instant(FAMILY_LABEL_KEYS[ch]);
          const nivel = this.translate.instant('groups.form.assigned.col_level', { channel: canal });
          return [
            {
              field: ch,
              header: canal,
              headerAriaLabel: canal,
              headerTemplate: check,
              width: `${rem.channel[ch]}rem`,
              align: 'center' as const,
              cellTemplate: this.channelTpl(),
              stopRowClick: true,
            },
            ...(this.levelFamilies().includes(ch)
              ? [
                  {
                    field: `level-${ch}`,
                    header: nivel,
                    headerAriaLabel: nivel,
                    width: `${rem.level}rem`,
                    cellTemplate: this.levelTpl(),
                    stopRowClick: true,
                  },
                ]
              : []),
          ];
        }),
        {
          field: 'active',
          header: active,
          headerAriaLabel: active,
          headerTemplate: check,
          width: `${rem.enabled}rem`,
          align: 'center' as const,
          cellTemplate: this.activeTpl(),
          stopRowClick: true,
        },
      ];
    }
  );

  readonly groupChannels = input.required<readonly GroupChannel[]>();
  /** Las familias que ofrece el grupo: una columna por cada una (DD-147). */
  protected readonly families = computed(() => familiesOf(this.groupChannels()));
  readonly links = input.required<readonly GroupAgentLink[]>();
  readonly availableAgents =
    input.required<readonly AgentChannelTableAgent[]>();
  readonly groupId = input.required<number>();
  /** Una columna identificada por cada familia con estrategia Niveles. */
  readonly levelFamilies = input<readonly ('phone' | 'chat' | 'email')[]>([]);
  readonly compact = input(false);

  /** Reserva el nombre antes de sumar niveles y canales: la tabla desplaza dentro de su caja,
   * sin colapsar la identidad del agente cuando el rail estrecha la ficha. */
  protected readonly tableMinWidth = computed(() =>
    `${columnsRem(COLUMN_REM[this.compact() ? 'compact' : 'regular'], this.families(), this.levelFamilies().length)}rem`);

  readonly linksChange = output<readonly GroupAgentLink[]>();

  protected readonly query = signal('');
  protected readonly filter = linkedSignal(() => this.groupId() === 0 ? 'all' : 'assigned');
  protected readonly filterOptions = computed(() => {
    this.currentLang();
    return ['all', 'assigned', 'unassigned'].map(value => ({ value, label: this.translate.instant(`groups.form.assigned.filter_${value}`) }));
  });
  protected readonly announcement = signal('');
  protected readonly pending = signal(false);
  private readonly agentById = computed(() => new Map(this.availableAgents().map(agent => [agent.id, agent])));

  private readonly filteredAgents = computed(() => {
    const filter = this.filter();
    const query = this.query().trim().toLowerCase();
    const agents = this.availableAgents();
    const assigned = new Set(untracked(this.links).map(link => link.agentId));
    return agents.filter(agent =>
      (filter === 'all' || (filter === 'assigned') === assigned.has(agent.id)) &&
      (!query || `${agent.name} ${agent.email ?? ''}`.toLowerCase().includes(query)));
  });

  /** El orden por nombre: `1`, A→Z; `-1`, Z→A; `null`, el de la lista de agentes. */
  protected readonly orden = signal<1 | -1 | null>(null);

  /* Solo si CAMBIA: la tabla vuelve a avisar del orden cada vez que recibe filas nuevas (lo mismo en `sc-list-page`). */
  protected onSortChange(event: ScDatatableSortEvent): void {
    const orden = event.field === 'agent' && (event.order === 1 || event.order === -1) ? event.order : null;
    if (orden !== this.orden()) this.orden.set(orden);
  }

  /* Ordenar no hace bailar al marcar: el orden depende solo del nombre, y el filtro conserva sus filas (`untracked`). */
  protected readonly visibleRows = computed<readonly VisibleRow[]>(() => {
    const links = new Map(this.links().map(link => [link.agentId, link]));
    const orden = this.orden();
    const agents = orden
      ? [...this.filteredAgents()].sort((a, b) => a.name.localeCompare(b.name, 'es') * orden)
      : this.filteredAgents();
    return agents.map(agent => {
      const link = links.get(agent.id);
      return { agent, link: link ? clampLinksToChannels([link], this.groupChannels(), () => agent.allowedChannels)[0] : null };
    });
  });
  /**
   * Se puede asignar si atiende algún canal del grupo. En un grupo sin canales (DD-217) se pertenece sin canal: todos.
   * Sin los avisos amarillos de «Sin canales» (DD-217): en un grupo con canales, el último no se quita aquí
   * (`isLastChannel`), y quien se queda sin ninguno porque el grupo los quitó sale al guardar, con su confirmación.
   */
  protected compatible(agent: AgentChannelTableAgent): boolean {
    return this.groupChannels().length === 0 || permittedFamilies(this.groupChannels(), agent.allowedChannels).length > 0;
  }

  /** Las columnas con casilla de «todos» en la cabecera: Asignado, cada canal y Habilitado (DD-180). */
  protected hasHeaderCheckbox(field: string): boolean {
    return field === 'assigned' || field === 'active' || this.families().includes(field as ChannelFamily);
  }

  /**
   * Las filas a la vista que la casilla de «todos» de una columna cuenta: en Asignado, las que se pueden asignar (o ya
   * lo están); en un canal, las asignadas que tienen permiso para él; en Habilitado, las asignadas que no se habilitan
   * solas («Activación por grupo»).
   */
  private headerRows(field: string): readonly VisibleRow[] {
    return this.visibleRows().filter((row) =>
      field === 'assigned' ? !!row.link || this.compatible(row.agent)
        : field === 'active' ? !!row.link && !row.agent.selfActivate
          : !!row.link && this.allowed(row.agent, field));
  }

  private isOn(row: VisibleRow, field: string): boolean {
    return field === 'assigned' ? !!row.link : field === 'active' ? !!row.link?.active : this.hasChannel(row.link, field);
  }

  protected headerState(field: string): 'all' | 'some' | 'none' {
    const rows = this.headerRows(field);
    const on = rows.filter((row) => this.isOn(row, field)).length;
    return on === 0 ? 'none' : on === rows.length ? 'all' : 'some';
  }

  /**
   * Sin `pending()`: la pregunta sale en un globo pegado a esta casilla, y al cerrarlo el foco vuelve a ella; deshabilitada
   * mientras pregunta, no lo aceptaría y se iría al `body`. La segunda pulsación la corta `toggleHeader`.
   */
  protected headerDisabled(field: string): boolean {
    return this.bulkTargets(field).length === 0;
  }

  /** Con toda la columna marcada, las que desmarca; si no, las que marca. Un canal nunca se lleva el último de una fila. */
  private bulkTargets(field: string): readonly VisibleRow[] {
    const remove = this.headerState(field) === 'all';
    return this.headerRows(field).filter((row) => {
      if (field === 'assigned') return remove ? !!row.link : !row.link;
      if (remove) return this.isOn(row, field) && (field === 'active' || !this.isLastChannel(row.link, field));
      return !this.isOn(row, field);
    });
  }

  /**
   * La pregunta y su botón: la pregunta dice qué pasa y a cuántos, y el botón repite el verbo («¿Quitar 5 agentes del
   * grupo?» · «Quitar»), como al eliminar (SISMAC-4058). El globo solo pinta el cuerpo: la pregunta va en los dos.
   */
  private bulkCopy(field: string, remove: boolean, count: number): { readonly ask: string; readonly verb: string } {
    const t = (key: string, params?: Record<string, unknown>) => this.translate.instant(`groups.form.assigned.${key}`, params);
    if (field === 'assigned')
      return remove ? { ask: t('bulk_ask.remove', { count }), verb: t('bulk_verb.remove') } : { ask: t('bulk_ask.add', { count }), verb: t('bulk_verb.assign') };
    if (field === 'active')
      return remove ? { ask: t('bulk_ask.disable', { count }), verb: t('bulk_verb.disable') } : { ask: t('bulk_ask.enable', { count }), verb: t('bulk_verb.enable') };
    const channel = this.translate.instant(FAMILY_LABEL_KEYS[field as ChannelFamily]);
    return remove
      ? { ask: t('bulk_ask.channel_remove', { count, channel }), verb: t('bulk_verb.remove') }
      : { ask: t('bulk_ask.channel_add', { count, channel }), verb: t('bulk_verb.activate') };
  }

  /** Cambia la columna entera en las filas a la vista; con dos o más, confirma antes (DD-151). */
  protected async toggleHeader(field: string, celda?: HTMLElement): Promise<void> {
    if (this.pending()) return;
    const rows = this.bulkTargets(field);
    if (!rows.length) return;
    const remove = this.headerState(field) === 'all';
    this.pending.set(true);
    try {
      const copy = this.bulkCopy(field, remove, rows.length);
      if (rows.length >= 2 && !await this.confirm.request({
        title: copy.ask,
        target: celda?.querySelector('input') ?? celda,
        body: copy.ask,
        acceptLabel: copy.verb,
        rejectLabel: this.translate.instant('common.cancel'),
      })) return;
      const ids = new Set(rows.map((row) => row.agent.id));
      if (field === 'assigned') {
        this.linksChange.emit(remove ? this.links().filter((link) => !ids.has(link.agentId)) : [
          ...this.links(), ...rows.map((row) => this.newLink(row.agent)),
        ]);
      } else if (field === 'active') {
        this.linksChange.emit(this.links().map((link) => (ids.has(link.agentId) ? { ...link, active: !remove } : link)));
      } else {
        const agents = this.agentById();
        this.linksChange.emit(this.links().map((link) => ids.has(link.agentId)
          ? toggleLinkChannel(clampLinksToChannels([link], this.groupChannels(), () => agents.get(link.agentId)?.allowedChannels)[0], field as Channel, { minOne: true })
          : link));
      }
      this.announcement.set(this.translate.instant('groups.form.assigned.bulk_done', { count: rows.length }));
    } finally {
      this.pending.set(false);
    }
  }

  private newLink(agent: AgentChannelTableAgent): GroupAgentLink {
    return newLinkFor({ agentId: agent.id, groupId: this.groupId(), groupChannels: [...this.groupChannels()], allowedChannels: agent.allowedChannels });
  }

  protected toggleAssignment(row: VisibleRow): void {
    if (this.pending()) return;
    if (row.link) this.linksChange.emit(this.links().filter(link => link.agentId !== row.agent.id));
    else if (this.compatible(row.agent)) this.linksChange.emit([...this.links(), this.newLink(row.agent)]);
  }

  protected allowed(agent: AgentChannelTableAgent, channel: string): boolean {
    return permittedFamilies(this.groupChannels(), agent.allowedChannels).includes(channel as Channel);
  }

  protected hasChannel(link: GroupAgentLink | null, channel: string): boolean {
    return link?.channels.includes(channel as Channel) ?? false;
  }

  /** El único canal que le queda: su casilla no se desmarca aquí; desmarcar Asignado quita el enlace. */
  protected isLastChannel(link: GroupAgentLink | null, channel: string): boolean {
    return !!link && isLastChannel(link, channel);
  }

  // -- mutations -----------------------------------------------------

  protected toggleChannel(agentId: number, field: string): void {
    const channel = field as Channel;
    const agent = this.agentById().get(agentId);
    if (!agent || !this.allowed(agent, channel)) return;
    this.linksChange.emit(
      this.links().map((l) => (l.agentId === agentId ? toggleLinkChannel(clampLinksToChannels([l], this.groupChannels(), () => agent.allowedChannels)[0], channel, { minOne: true }) : l)),
    );
  }

  protected toggleActive(agentId: number, active: boolean): void {
    this.linksChange.emit(this.links().map(link => link.agentId === agentId ? { ...link, active } : link));
  }

  protected readonly familyLabelKeys = FAMILY_LABEL_KEYS;
  /** Del 1 al 10, en el desplegable de cada «Nivel {canal}». */
  protected readonly levelOptions = LEVEL_OPTIONS.map((value) => ({ label: String(value), value }));

  protected setLevel(agentId: number, field: string, value: unknown): void {
    if (typeof value !== 'number' || !LEVEL_OPTIONS.includes(value)) return;
    const family = this.levelFamily(field);
    this.linksChange.emit(this.links().map((l) => (l.agentId === agentId ? { ...l, levels: { ...l.levels, [family]: value } } : l)));
  }

  protected levelFamily(field: string): 'phone' | 'chat' | 'email' {
    return field === 'level-chat' ? 'chat' : field === 'level-email' ? 'email' : 'phone';
  }

  // -- helpers -------------------------------------------------------

  /** Keep a stable channel order so toggling does not visually reshuffle. */
}
