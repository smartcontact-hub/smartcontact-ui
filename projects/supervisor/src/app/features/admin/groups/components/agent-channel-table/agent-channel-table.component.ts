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
import { RouterLink } from '@angular/router';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScConfirmService,
  ScSelectButtonComponent as SelectButtonComponent,
  ScSearchComponent as SearchComponent,
  ScSelectComponent as SelectComponent,
  ScTagComponent as TagComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import {
  ScDatatableComponent as DatatableComponent,
  type ScColumnCellContext,
  type ScColumnDef,
} from '@smartcontact-hub/components';

import { PRESENCE_LABEL_KEYS, PRESENCE_TAGS, type PresenceStatus } from '@features/admin/agents/data/agents-data';

import { TooltipModule } from 'primeng/tooltip';
import { LlegaAlPieDirective } from '@core/directives';

import { IllustratedAvatarComponent, type LabelColor } from '@shared/components';
import { ScCheckboxComponent as CheckboxComponent } from '@smartcontact-hub/components';

import {
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
  readonly presenceStatus?: PresenceStatus;
  readonly allowedChannels?: readonly Channel[];
}

interface VisibleRow {
  readonly link: GroupAgentLink | null;
  readonly agent: AgentChannelTableAgent;
}

/**
 * El ancho de cada columna, en rem, en la tabla de la ficha y en la compacta del panel rápido, que suma estos mismos
 * para medirse (DD-131). Cada uno es lo más largo que lleva en los cuatro idiomas más el relleno de celda (14 a cada
 * lado en la ficha, 6 en el panel) y unos 6 px de margen. Medido el 2026-10-04 (DD-156):
 *   · Asignado y Habilitado: sus rótulos, «Asignado» (66 px) y «Habilitado» (70).
 *   · Agente: avatar (24), hueco (14) y nombre y email en dos líneas; el email más largo de la semilla mide 203 px y el
 *     nombre más largo, 137. En la ficha es un MÍNIMO: el nombre cabe siempre y la columna crece con el sitio que haya.
 *     En el panel, que mide lo que lleva, cabe el email entero.
 *   · Estado: su etiqueta más larga, «Post-conversando» o «Post-conversation», 123 px.
 *   · Canal: 6,5rem lo midió «Web Chat», que a 5,5 partía en dos líneas (2026-09-26); desde DD-147 la más larga es
 *     «Teléfono», que también cabe. En el panel, 5rem.
 */
export const COLUMN_REM = {
  regular: { assigned: 6.25, agent: 15, presence: 9.75, level: 9, channel: 6.5, enabled: 6.5 },
  compact: { assigned: 5.25, agent: 16.25, presence: 8.75, level: 9, channel: 5, enabled: 5.5 },
} as const;

/** Lo que suman las columnas con `families` canales y `levels` niveles: el mínimo de la tabla y el ancho del panel. */
export function columnsRem(rem: (typeof COLUMN_REM)[keyof typeof COLUMN_REM], families: number, levels: number): number {
  return rem.assigned + rem.agent + rem.presence + levels * rem.level + families * rem.channel + rem.enabled;
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
    CheckboxComponent,
    DatatableComponent,
    IllustratedAvatarComponent,
    SearchComponent,
    RouterLink,
    ScIconComponent,
    SelectComponent,
    TagComponent,
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
  private readonly presenceTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('presenceTpl');
  private readonly channelTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('channelTpl');
  private readonly levelTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('levelTpl');
  private readonly activeTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('activeTpl');
  private readonly assignedTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('assignedTpl');

  protected readonly columns = computed<readonly ScColumnDef<VisibleRow>[]>(
    () => {
      this.currentLang();
      const rem = COLUMN_REM[this.compact() ? 'compact' : 'regular'];
      return [
        {
          field: 'assigned',
          header: this.translate.instant('groups.form.assigned.assignment'),
          width: `${rem.assigned}rem`,
          align: 'center',
          cellTemplate: this.assignedTpl(),
          stopRowClick: true,
        },
        {
          field: 'agent',
          header: this.translate.instant('groups.form.assigned.col_agent'),
          cellTemplate: this.agentTpl(),
        },
        /* El estado de la persona, en su columna y con la palabra del listado de agentes: alineado de una fila a otra
         * y sin quitarle sitio al email (DD-156). */
        {
          field: 'presence',
          header: this.translate.instant('agents.table.presence'),
          width: `${rem.presence}rem`,
          cellTemplate: this.presenceTpl(),
        },
        /* Con la estrategia Niveles, el nivel de cada agente va en su fila: donde ya se decide quién atiende qué. */
        ...this.levelFamilies().map((family) => ({
          field: `level-${family}`,
          header: this.translate.instant('groups.form.assigned.col_level', { channel: this.translate.instant(FAMILY_LABEL_KEYS[family]) }),
          width: `${rem.level}rem`,
          cellTemplate: this.levelTpl(),
          stopRowClick: true,
        })),
        ...this.families().map((ch) => ({
          field: ch,
          header: this.translate.instant(FAMILY_LABEL_KEYS[ch]),
          width: `${rem.channel}rem`,
          align: 'center' as const,
          cellTemplate: this.channelTpl(),
          stopRowClick: true,
        })),
        {
          field: 'active',
          header: this.translate.instant('groups.form.assigned.col_active'),
          width: `${rem.enabled}rem`,
          align: 'center',
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
  readonly levelFamilies = input<readonly ('phone' | 'chat')[]>([]);
  readonly compact = input(false);

  /** Reserva el nombre antes de sumar niveles y canales: la tabla desplaza dentro de su caja,
   * sin colapsar la identidad del agente cuando el rail estrecha la ficha. */
  protected readonly tableMinWidth = computed(() =>
    `${columnsRem(COLUMN_REM[this.compact() ? 'compact' : 'regular'], this.families().length, this.levelFamilies().length)}rem`);

  readonly linksChange = output<readonly GroupAgentLink[]>();

  protected readonly query = signal('');
  protected readonly filter = linkedSignal(() => this.groupId() === 0 ? 'all' : 'assigned');
  /** La página abierta (`[(first)]`): vuelve a la primera al buscar o al cambiar el filtro. Sin esto, desde la tercera
   *  página un resultado corto dejaba la tabla en blanco (el paginador de PrimeNG solo retrocede una). */
  protected readonly first = linkedSignal(() => {
    this.query();
    this.filter();
    return 0;
  });
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
  protected readonly visibleRows = computed<readonly VisibleRow[]>(() => {
    const links = new Map(this.links().map(link => [link.agentId, link]));
    return this.filteredAgents().map(agent => {
      const link = links.get(agent.id);
      return { agent, link: link ? clampLinksToChannels([link], this.groupChannels(), () => agent.allowedChannels)[0] : null };
    });
  });
  protected readonly zeroChannelCount = computed(() => this.links().filter(link => link.channels.length === 0).length);

  protected compatible(agent: AgentChannelTableAgent): boolean {
    return permittedFamilies(this.groupChannels(), agent.allowedChannels).length > 0;
  }

  protected headerState(field: string): 'all' | 'some' | 'none' {
    const rows = this.visibleRows().filter(row => field === 'assigned'
      ? !!row.link || this.compatible(row.agent)
      : !!row.link && this.allowed(row.agent, field));
    const checked = rows.filter(row => field === 'assigned' ? !!row.link : this.hasChannel(row.link, field)).length;
    return checked === 0 ? 'none' : checked === rows.length ? 'all' : 'some';
  }

  protected headerDisabled(field: string): boolean {
    return this.pending() || this.bulkTargets(field).length === 0;
  }

  private bulkTargets(field: string): readonly VisibleRow[] {
    const remove = this.headerState(field) === 'all';
    return this.visibleRows().filter(row => field === 'assigned'
      ? remove ? !!row.link : !row.link && this.compatible(row.agent)
      : !!row.link && this.allowed(row.agent, field) && (remove
        ? this.hasChannel(row.link, field) && !this.isLastChannel(row.link, field)
        : !this.hasChannel(row.link, field)));
  }

  protected async toggleHeader(field: string): Promise<void> {
    if (this.pending()) return;
    const rows = this.bulkTargets(field);
    if (!rows.length) return;
    const remove = this.headerState(field) === 'all';
    const action = this.translate.instant(`groups.form.assigned.${field === 'assigned' ? remove ? 'bulk_remove' : 'bulk_add' : remove ? 'bulk_channel_remove' : 'bulk_channel_add'}`,
      { channel: field === 'assigned' ? '' : this.translate.instant(FAMILY_LABEL_KEYS[field as Channel]) });
    this.pending.set(true);
    try {
      if (rows.length >= 2 && !await this.confirm.request({
        title: this.translate.instant('groups.form.assigned.bulk_title'),
        body: this.translate.instant('groups.form.assigned.bulk_body', { action, count: rows.length }),
        acceptLabel: this.translate.instant('groups.form.assigned.bulk_confirm'),
        rejectLabel: this.translate.instant('common.cancel'),
      })) return;
      const ids = new Set(rows.map(row => row.agent.id));
      if (field === 'assigned') {
        this.linksChange.emit(remove ? this.links().filter(link => !ids.has(link.agentId)) : [
          ...this.links(), ...rows.map(row => this.newLink(row.agent)),
        ]);
      } else {
        this.linksChange.emit(this.links().map(link => ids.has(link.agentId)
          ? toggleLinkChannel(link, field as Channel, { minOne: true }) : link));
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

  protected presenceLabelColor(presence: PresenceStatus): LabelColor | null {
    const tag = PRESENCE_TAGS[presence];
    return 'labelColor' in tag ? tag.labelColor : null;
  }

  protected presenceSeverity(presence: PresenceStatus): 'warn' | 'secondary' {
    const tag = PRESENCE_TAGS[presence];
    return 'severity' in tag ? tag.severity : 'secondary';
  }

  protected presenceLabelKey(presence: PresenceStatus): string {
    return PRESENCE_LABEL_KEYS[presence];
  }

  protected toggleActive(agentId: number, active: boolean): void {
    this.linksChange.emit(this.links().map(link => link.agentId === agentId ? { ...link, active } : link));
  }

  protected readonly levelOptions = LEVEL_OPTIONS;
  protected readonly familyLabelKeys = FAMILY_LABEL_KEYS;

  protected setLevel(agentId: number, field: string, value: unknown): void {
    if (typeof value !== 'number' || !LEVEL_OPTIONS.includes(value)) return;
    const family = this.levelFamily(field);
    this.linksChange.emit(this.links().map((l) => (l.agentId === agentId ? { ...l, levels: { ...l.levels, [family]: value } } : l)));
  }

  protected levelFamily(field: string): 'phone' | 'chat' {
    return field === 'level-chat' ? 'chat' : 'phone';
  }

  // -- helpers -------------------------------------------------------

  /** Keep a stable channel order so toggling does not visually reshuffle. */
}
