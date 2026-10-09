import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';

import {
  ScCheckboxComponent as CheckboxComponent,
  ScConfirmService,
  ScRadioButtonComponent as RadioButtonComponent,
  ScSearchComponent as SearchComponent,
  ScSelectButtonComponent as SelectButtonComponent,
  ScButtonComponent as ButtonComponent,
  ScTagComponent as TagComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import {
  ScDatatableComponent as DatatableComponent,
  type ScColumnCellContext,
  type ScColumnDef,
} from '@smartcontact-hub/components';
import { LlegaAlPieDirective } from '@core/directives';

import {
  CHANNEL_FAMILIES,
  type ChannelFamily,
  FAMILY_LABEL_KEYS,
  GroupChannel,
} from '@features/admin/groups/data/groups-data';
import { Channel, GroupAgentLink } from '@features/admin/services/group-agent-links.types';
import {
  clampLinksToChannels,
  familiesOf,
  isLastChannel,
  newLinkFor,
  permittedFamilies,
  toggleLinkChannel,
} from '@features/admin/services/group-channels.core.mjs';

/** Lightweight group reference accepted by this table. */
export interface AgentGroupAssignmentRef {
  readonly id: number;
  readonly name: string;
  readonly channels: readonly GroupChannel[];
}

interface VisibleRow {
  readonly link: GroupAgentLink | null;
  readonly group: AgentGroupAssignmentRef;
}

/**
 * Los anchos, en rem, como los de la tabla de agentes del grupo (`COLUMN_REM` de `agent-channel-table`), de la que esta
 * es la gemela: la misma densidad compacta y las mismas casillas de «todos» en la cabecera. Salientes, su rótulo más
 * largo («Sortantes»/«Outbound», 70 px) con el relleno: 6,5.
 */
const REM = { assigned: 3.5, group: 12, channel: { phone: 7, chat: 4.5, email: 4.75 }, outbound: 6.5, enabled: 9.5 } as const;

/**
 * Los grupos de un agente, dentro de su ficha: LA MISMA TABLA que los agentes de un grupo (revisión de agentes del
 * 2026-10-09), con las filas al revés. Todos los grupos, con el filtro Todos · Asignados · Sin asignar y el buscador; se
 * asigna marcando Asignado (DD-151), cada canal en su columna con su casilla de «todos» (DD-181) y Habilitado.
 *
 *   [Asignados ▾] [ Buscar grupo…                 ]
 *   ☑  Grupo           ☑ Teléfono  ☑ Chat  ☑ Email   Salientes   ☑ Habilitado
 *   ☑  Soporte L1         ☑          ☑       —           ◉           ●━○
 *
 * Y una columna que solo tiene este lado: **Salientes**, el grupo por el que salen sus llamadas. Uno, de los asignados
 * con Teléfono marcado.
 *
 * Con «Activación por grupo» encendido el agente se habilita él mismo en cada grupo (Configuración): Habilitado se ve,
 * pero no se toca aquí. Lo mismo en la tabla del grupo.
 *
 * No persiste nada: el formulario tiene el `links` canónico y lo guarda en `GroupAgentLinksStore`.
 */
@Component({
  selector: 'sc-group-assignment-table',
  standalone: true,
  imports: [
    ButtonComponent,
    CheckboxComponent,
    TagComponent,
    DatatableComponent,
    LlegaAlPieDirective,
    RadioButtonComponent,
    SearchComponent,
    SelectButtonComponent,
    ToggleSwitchComponent,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './group-assignment-table.component.html',
  styleUrl: './group-assignment-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupAssignmentTableComponent {
  private readonly translate = inject(TranslateService);
  private readonly confirm = inject(ScConfirmService);
  /* El idioma como DEPENDENCIA del computed de las columnas (`audit:datatables` §6). */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang),
    ),
    { initialValue: this.translate.currentLang },
  );

  private readonly assignedTpl = viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('assignedTpl');
  private readonly groupTpl = viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('groupTpl');
  private readonly channelTpl = viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('channelTpl');
  private readonly outboundTpl = viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('outboundTpl');
  private readonly activeTpl = viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('activeTpl');

  protected readonly columns = computed<readonly ScColumnDef<VisibleRow>[]>(() => {
    this.currentLang();
    return [
      {
        field: 'assigned',
        header: this.translate.instant('groups.form.assigned.assignment'),
        width: `${REM.assigned}rem`,
        align: 'center' as const,
        cellTemplate: this.assignedTpl(),
        stopRowClick: true,
      },
      {
        field: 'group',
        header: this.translate.instant('agents.form.assigned.col_group'),
        cellTemplate: this.groupTpl(),
      },
      ...CHANNEL_FAMILIES.map((ch) => ({
        field: ch,
        header: this.translate.instant(FAMILY_LABEL_KEYS[ch]),
        width: `${REM.channel[ch]}rem`,
        align: 'center' as const,
        cellTemplate: this.channelTpl(),
        stopRowClick: true,
      })),
      {
        field: 'outbound',
        header: this.translate.instant('agents.form.assigned.col_outbound'),
        width: `${REM.outbound}rem`,
        align: 'center' as const,
        cellTemplate: this.outboundTpl(),
        stopRowClick: true,
      },
      {
        field: 'active',
        header: this.translate.instant('agents.form.assigned.col_active'),
        width: `${REM.enabled}rem`,
        align: 'center' as const,
        cellTemplate: this.activeTpl(),
        stopRowClick: true,
      },
    ];
  });

  /** Lo que suman las columnas: el mínimo de la tabla, que desplaza por dentro antes que cortar el nombre. */
  protected readonly tableMinWidth = `${
    REM.assigned + REM.group + CHANNEL_FAMILIES.reduce((s, f) => s + REM.channel[f], 0) + REM.outbound + REM.enabled
  }rem`;

  readonly links = input.required<readonly GroupAgentLink[]>();
  readonly availableGroups = input.required<readonly AgentGroupAssignmentRef[]>();
  readonly agentId = input.required<number>();
  readonly allowedChannels = input<readonly Channel[]>(CHANNEL_FAMILIES);
  /** El grupo de sus llamadas salientes. */
  readonly outboundGroupId = input<number | null>(null);
  /** «Activación por grupo»: Habilitado lo cambia el agente, no la ficha. */
  readonly selfActivate = input(false);
  readonly linksChange = output<readonly GroupAgentLink[]>();
  readonly outboundGroupChange = output<number | null>();
  /** Los candados llevan a donde se cambia lo que bloquea: sus canales (General) o «Activación por grupo»
   *  (Configuración). Como el candado de la tabla del grupo, que enlaza a la ficha del agente (DD-150). */
  readonly irA = output<'canales' | 'configuracion'>();

  /** Cuántos grupos asignados se han quedado sin canal: lo dice la barra, como en la tabla del grupo. */
  protected readonly sinCanal = computed(() => this.visibleRows().filter((r) => r.link && r.link.channels.length === 0).length);

  protected readonly query = signal('');
  /** Al editar, los asignados; en el alta, todos (no tiene ninguno). */
  protected readonly filter = linkedSignal(() => (this.agentId() === 0 ? 'all' : 'assigned'));
  protected readonly filterOptions = computed(() => {
    this.currentLang();
    return ['all', 'assigned', 'unassigned'].map((value) => ({
      value,
      label: this.translate.instant(`groups.form.assigned.filter_${value}`),
    }));
  });
  protected readonly announcement = signal('');
  protected readonly pending = signal(false);

  /* El filtro conserva sus filas hasta que cambia la búsqueda o la vista (`untracked`): marcar o desmarcar Asignado no
   * desplaza la fila bajo el puntero (DD-151). */
  private readonly filteredGroups = computed(() => {
    const filter = this.filter();
    const query = this.query().trim().toLowerCase();
    const assigned = new Set(untracked(this.links).map((l) => l.groupId));
    return this.availableGroups().filter(
      (g) =>
        (filter === 'all' || (filter === 'assigned') === assigned.has(g.id)) &&
        (!query || g.name.toLowerCase().includes(query)),
    );
  });

  protected readonly visibleRows = computed<readonly VisibleRow[]>(() => {
    const links = new Map(this.links().map((l) => [l.groupId, l]));
    return this.filteredGroups().map((group) => {
      const link = links.get(group.id);
      return { group, link: link ? clampLinksToChannels([link], group.channels, () => this.allowedChannels())[0] : null };
    });
  });

  protected compatible(group: AgentGroupAssignmentRef): boolean {
    return permittedFamilies(group.channels, this.allowedChannels()).length > 0;
  }

  /** ¿Ofrece este grupo la familia? Un `string` porque llega del `field` de la columna. */
  protected offers(group: AgentGroupAssignmentRef, channel: string): boolean {
    return familiesOf(group.channels).includes(channel as Channel);
  }

  protected allowed(channel: string): boolean {
    return this.allowedChannels().includes(channel as Channel);
  }

  protected hasChannel(link: GroupAgentLink | null, channel: string): boolean {
    return link?.channels.includes(channel as Channel) ?? false;
  }

  protected isLastChannel(link: GroupAgentLink | null, channel: string): boolean {
    return !!link && isLastChannel(link, channel);
  }

  /** Puede ser el de sus salientes: asignado y con Teléfono marcado. */
  protected canBeOutbound(row: VisibleRow): boolean {
    return this.hasChannel(row.link, 'phone');
  }

  protected setOutbound(groupId: number): void {
    this.outboundGroupChange.emit(groupId);
  }

  // -- La casilla de «todos» de cada columna (DD-180, DD-181) ---------------------------------------------------------

  protected hasHeaderCheckbox(field: string): boolean {
    return field === 'assigned' || field === 'active' || (CHANNEL_FAMILIES as readonly string[]).includes(field);
  }

  /** Las filas que cuenta: Asignado, las que se pueden asignar (o ya lo están); un canal, las asignadas que lo ofrecen
   *  con permiso; Habilitado, las asignadas. */
  private headerRows(field: string): readonly VisibleRow[] {
    return this.visibleRows().filter((row) =>
      field === 'assigned'
        ? !!row.link || this.compatible(row.group)
        : field === 'active'
          ? !!row.link
          : !!row.link && this.offers(row.group, field) && this.allowed(field),
    );
  }

  private isOn(row: VisibleRow, field: string): boolean {
    return field === 'assigned' ? !!row.link : field === 'active' ? !!row.link?.active : this.hasChannel(row.link, field);
  }

  protected headerState(field: string): 'all' | 'some' | 'none' {
    const rows = this.headerRows(field);
    const on = rows.filter((row) => this.isOn(row, field)).length;
    return on === 0 ? 'none' : on === rows.length ? 'all' : 'some';
  }

  protected headerDisabled(field: string): boolean {
    return this.pending() || (field === 'active' && this.selfActivate()) || this.bulkTargets(field).length === 0;
  }

  private bulkTargets(field: string): readonly VisibleRow[] {
    const remove = this.headerState(field) === 'all';
    return this.headerRows(field).filter((row) => {
      if (field === 'assigned') return remove ? !!row.link : !row.link;
      if (remove) return this.isOn(row, field) && (field === 'active' || !this.isLastChannel(row.link, field));
      return !this.isOn(row, field);
    });
  }

  private bulkAction(field: string, remove: boolean): string {
    if (field === 'assigned') return this.translate.instant(`agents.form.assigned.${remove ? 'bulk_remove' : 'bulk_add'}`);
    if (field === 'active') return this.translate.instant(`groups.form.assigned.${remove ? 'bulk_disable' : 'bulk_enable'}`);
    return this.translate.instant(`groups.form.assigned.${remove ? 'bulk_channel_remove' : 'bulk_channel_add'}`, {
      channel: this.translate.instant(FAMILY_LABEL_KEYS[field as ChannelFamily]),
    });
  }

  /** Cambia la columna entera en las filas a la vista; con dos o más, confirma antes (DD-151). */
  protected async toggleHeader(field: string): Promise<void> {
    if (this.pending()) return;
    const rows = this.bulkTargets(field);
    if (!rows.length) return;
    const remove = this.headerState(field) === 'all';
    this.pending.set(true);
    try {
      if (
        rows.length >= 2 &&
        !(await this.confirm.request({
          title: this.translate.instant('groups.form.assigned.bulk_title'),
          body: this.translate.instant('agents.form.assigned.bulk_body', { action: this.bulkAction(field, remove), count: rows.length }),
          acceptLabel: this.translate.instant('groups.form.assigned.bulk_confirm'),
          rejectLabel: this.translate.instant('common.cancel'),
        }))
      )
        return;
      const ids = new Set(rows.map((row) => row.group.id));
      if (field === 'assigned') {
        this.linksChange.emit(
          remove
            ? this.links().filter((l) => !ids.has(l.groupId))
            : [...this.links(), ...rows.map((row) => this.newLink(row.group))],
        );
      } else if (field === 'active') {
        this.linksChange.emit(this.links().map((l) => (ids.has(l.groupId) ? { ...l, active: !remove } : l)));
      } else {
        const groups = new Map(this.availableGroups().map((g) => [g.id, g]));
        this.linksChange.emit(
          this.links().map((l) =>
            ids.has(l.groupId)
              ? toggleLinkChannel(
                  clampLinksToChannels([l], groups.get(l.groupId)?.channels ?? [], () => this.allowedChannels())[0],
                  field as Channel,
                  { minOne: true },
                )
              : l,
          ),
        );
      }
      this.announcement.set(this.translate.instant('groups.form.assigned.bulk_done', { count: rows.length }));
    } finally {
      this.pending.set(false);
    }
  }

  // -- Cada fila ------------------------------------------------------------------------------------------------------

  private newLink(group: AgentGroupAssignmentRef): GroupAgentLink {
    return newLinkFor({
      agentId: this.agentId(),
      groupId: group.id,
      groupChannels: [...group.channels],
      allowedChannels: this.allowedChannels(),
    });
  }

  protected toggleAssignment(row: VisibleRow): void {
    if (this.pending()) return;
    if (row.link) this.linksChange.emit(this.links().filter((l) => l.groupId !== row.group.id));
    else if (this.compatible(row.group)) this.linksChange.emit([...this.links(), this.newLink(row.group)]);
  }

  protected toggleChannel(groupId: number, field: string): void {
    if (!this.allowed(field)) return;
    const group = this.availableGroups().find((g) => g.id === groupId);
    this.linksChange.emit(
      this.links().map((l) =>
        l.groupId === groupId
          ? toggleLinkChannel(clampLinksToChannels([l], group?.channels ?? [], () => this.allowedChannels())[0], field as Channel, {
              minOne: true,
            })
          : l,
      ),
    );
  }

  protected toggleActive(groupId: number, active: boolean): void {
    if (this.selfActivate()) return;
    this.linksChange.emit(this.links().map((l) => (l.groupId === groupId ? { ...l, active } : l)));
  }
}
