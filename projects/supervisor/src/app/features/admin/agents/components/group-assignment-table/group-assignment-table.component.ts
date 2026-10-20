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
  ScEmptyStateComponent as EmptyStateComponent,
  ScSearchComponent as SearchComponent,
  ScSelectButtonComponent as SelectButtonComponent,
  ScSelectComponent as SelectComponent,
  ScButtonComponent as ButtonComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import {
  ScDatatableComponent as DatatableComponent,
  type ScColumnCellContext,
  type ScColumnDef,
  type ScColumnHeaderContext,
  type ScDatatableSortEvent,
} from '@smartcontact-hub/components';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
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
import { CeldaVaciaComponent } from '@shared/components';

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
 * es la gemela: la misma densidad compacta y las mismas casillas de «todos» en la cabecera. Sin columna de Nivel: el
 * nivel del agente se pone en el grupo, que es quien reparte por niveles; y Habilitado, sin el candado, en lo que mide
 * (revisión del 2026-10-14). Sin columna de Salientes: es un desplegable bajo la tabla (revisión del 2026-10-15). Suma
 * 38,5 rem: a 1440 cabe en su caja (746) sin desplazar.
 */
const REM = { assigned: 3.5, group: 12, channel: { phone: 7, chat: 4.5, email: 4.75 }, enabled: 6.75 } as const;

/**
 * Los grupos de un agente, dentro de su ficha: LA MISMA TABLA que los agentes de un grupo (revisión de agentes del
 * 2026-10-09), con las filas al revés. Todos los grupos, con el filtro Todos · Asignados · Sin asignar y el buscador; se
 * asigna marcando Asignado (DD-151), cada canal en su columna con su casilla de «todos» (DD-181) y Habilitado.
 *
 *   [Asignados ▾] [ Buscar grupo…                 ]
 *   ☑  Grupo           ☑ Teléfono  ☑ Chat  ☑ Email   ☑ Habilitado
 *   ☑  Soporte L1 ↗       ☑          ☑       —          ●━○
 *
 *   Grupo para llamadas salientes
 *   [ Soporte L1                ▾ ]
 *
 * Y lo que solo tiene este lado: **el grupo de sus llamadas salientes**, uno de los asignados con Teléfono marcado. Un
 * desplegable bajo la tabla, y en la tabla, la flecha `call_made` junto al nombre del elegido (DD-209 §1, que corrige el
 * radio por fila de DD-204 §8): es una sola elección, no una por fila.
 *
 * «Activación por grupo» (Configuración) deja al agente habilitarse él mismo en cada grupo, desde su puesto: aquí su
 * Habilitado se ve pero no se toca, y la casilla de «todos» no lo cuenta (SISMAC-4058, que vuelve al candado de DD-187 §2
 * que la revisión del 2026-10-14 había quitado). Lo mismo en la tabla del grupo.
 *
 * No persiste nada: el formulario tiene el `links` canónico y lo guarda en `GroupAgentLinksStore`.
 */
@Component({
  selector: 'sc-group-assignment-table',
  standalone: true,
  imports: [
    CeldaVaciaComponent,
    ButtonComponent,
    CheckboxComponent,
    DatatableComponent,
    EmptyStateComponent,
    IconComponent,
    LlegaAlPieDirective,
    SearchComponent,
    SelectButtonComponent,
    SelectComponent,
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
  private readonly activeTpl = viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('activeTpl');
  /** La cabecera de las columnas con casilla de «todos», dentro del `th` del DS. */
  private readonly headerCheckTpl = viewChild<TemplateRef<ScColumnHeaderContext<VisibleRow>>>('headerCheckTpl');

  protected readonly columns = computed<readonly ScColumnDef<VisibleRow>[]>(() => {
    this.currentLang();
    const check = this.headerCheckTpl();
    /* Cada cabecera se llama como su rótulo (`headerAriaLabel`): las que llevan la casilla de «todos» dentro, también. */
    const assigned = this.translate.instant('groups.form.assigned.assignment');
    const group = this.translate.instant('agents.form.assigned.col_group');
    const active = this.translate.instant('agents.form.assigned.col_active');
    return [
      {
        field: 'assigned',
        header: assigned,
        headerAriaLabel: assigned,
        headerTemplate: check,
        width: `${REM.assigned}rem`,
        align: 'center' as const,
        cellTemplate: this.assignedTpl(),
        stopRowClick: true,
      },
      {
        field: 'group',
        header: group,
        headerAriaLabel: group,
        // Por nombre, A→Z y Z→A, como «Agente» en la tabla del grupo (SISMAC-4058).
        sortable: true,
        rowHeader: true,
        cellTemplate: this.groupTpl(),
      },
      ...CHANNEL_FAMILIES.map((ch) => {
        const canal = this.translate.instant(FAMILY_LABEL_KEYS[ch]);
        return {
          field: ch,
          header: canal,
          headerAriaLabel: canal,
          headerTemplate: check,
          width: `${REM.channel[ch]}rem`,
          align: 'center' as const,
          cellTemplate: this.channelTpl(),
          stopRowClick: true,
        };
      }),
      {
        field: 'active',
        header: active,
        headerAriaLabel: active,
        headerTemplate: check,
        width: `${REM.enabled}rem`,
        align: 'center' as const,
        cellTemplate: this.activeTpl(),
        stopRowClick: true,
      },
    ];
  });

  /** Lo que suman las columnas: el mínimo de la tabla, que desplaza por dentro antes que cortar el nombre. */
  protected readonly tableMinWidth = `${
    REM.assigned + REM.group + CHANNEL_FAMILIES.reduce((s, f) => s + REM.channel[f], 0) + REM.enabled
  }rem`;

  readonly links = input.required<readonly GroupAgentLink[]>();
  readonly availableGroups = input.required<readonly AgentGroupAssignmentRef[]>();
  readonly agentId = input.required<number>();
  readonly allowedChannels = input<readonly Channel[]>(CHANNEL_FAMILIES);
  /** «Activación por grupo»: se habilita él mismo desde su puesto, y su Habilitado no se toca aquí (SISMAC-4058). */
  readonly selfActivate = input(false);
  /** El grupo de sus llamadas salientes. */
  readonly outboundGroupId = input<number | null>(null);
  readonly linksChange = output<readonly GroupAgentLink[]>();
  readonly outboundGroupChange = output<number | null>();
  /** El candado de un canal que el agente no tiene lleva a donde se cambia: sus canales (General). Como el candado de
   *  la tabla del grupo, que enlaza a la ficha del agente (DD-150). */
  readonly irA = output<'canales'>();

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

  /** El orden por nombre: `1`, A→Z; `-1`, Z→A; `null`, el de la lista de grupos. */
  protected readonly orden = signal<1 | -1 | null>(null);

  /* Solo si CAMBIA: la tabla vuelve a avisar del orden cada vez que recibe filas nuevas. */
  protected onSortChange(event: ScDatatableSortEvent): void {
    const orden = event.field === 'group' && (event.order === 1 || event.order === -1) ? event.order : null;
    if (orden !== this.orden()) this.orden.set(orden);
  }

  protected readonly visibleRows = computed<readonly VisibleRow[]>(() => {
    const links = new Map(this.links().map((l) => [l.groupId, l]));
    const orden = this.orden();
    const groups = orden
      ? [...this.filteredGroups()].sort((a, b) => a.name.localeCompare(b.name, 'es') * orden)
      : this.filteredGroups();
    return groups.map((group) => {
      const link = links.get(group.id);
      return { group, link: link ? clampLinksToChannels([link], group.channels, () => this.allowedChannels())[0] : null };
    });
  });

  /** Se puede asignar si le deja algún canal; un grupo sin canales (DD-217), siempre: ahí se pertenece sin canal. */
  protected compatible(group: AgentGroupAssignmentRef): boolean {
    return group.channels.length === 0 || permittedFamilies(group.channels, this.allowedChannels()).length > 0;
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

  /** Los que pueden ser el de sus salientes: asignados y con Teléfono marcado, en el orden de la tabla. Con todos los
   *  asignados, no solo los que deja ver el filtro. */
  protected readonly outboundOptions = computed(() => {
    const links = new Map(this.links().map((l) => [l.groupId, l]));
    return this.availableGroups().filter((g) => {
      const link = links.get(g.id);
      return !!link && clampLinksToChannels([link], g.channels, () => this.allowedChannels())[0].channels.includes('phone');
    });
  });

  /** El elegido para sus salientes: lleva la flecha junto al nombre. */
  protected isOutbound(row: VisibleRow): boolean {
    return row.group.id === this.outboundGroupId() && this.hasChannel(row.link, 'phone');
  }

  protected setOutbound(groupId: number | null): void {
    if (groupId !== null) this.outboundGroupChange.emit(groupId);
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
          ? !!row.link && !this.selfActivate()
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

  /**
   * Sin `pending()`: la pregunta sale en un globo pegado a esta casilla, y al cerrarlo el foco vuelve a ella; deshabilitada
   * mientras pregunta, no lo aceptaría y se iría al `body`. La segunda pulsación la corta `toggleHeader`.
   */
  protected headerDisabled(field: string): boolean {
    return this.bulkTargets(field).length === 0;
  }

  private bulkTargets(field: string): readonly VisibleRow[] {
    const remove = this.headerState(field) === 'all';
    return this.headerRows(field).filter((row) => {
      if (field === 'assigned') return remove ? !!row.link : !row.link;
      if (remove) return this.isOn(row, field) && (field === 'active' || !this.isLastChannel(row.link, field));
      return !this.isOn(row, field);
    });
  }

  /** La pregunta y su botón, como en la tabla del grupo: «¿Quitar el agente de 3 grupos?» · «Quitar» (SISMAC-4058). */
  private bulkCopy(field: string, remove: boolean, count: number): { readonly ask: string; readonly verb: string } {
    const ask = (key: string, params?: Record<string, unknown>) => this.translate.instant(`agents.form.assigned.bulk_ask.${key}`, { count, ...params });
    const verb = (key: string) => this.translate.instant(`groups.form.assigned.bulk_verb.${key}`);
    if (field === 'assigned') return remove ? { ask: ask('remove'), verb: verb('remove') } : { ask: ask('add'), verb: verb('assign') };
    if (field === 'active') return remove ? { ask: ask('disable'), verb: verb('disable') } : { ask: ask('enable'), verb: verb('enable') };
    const channel = this.translate.instant(FAMILY_LABEL_KEYS[field as ChannelFamily]);
    return remove ? { ask: ask('channel_remove', { channel }), verb: verb('remove') } : { ask: ask('channel_add', { channel }), verb: verb('activate') };
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
      if (
        rows.length >= 2 &&
        !(await this.confirm.request({
          title: copy.ask,
          target: celda?.querySelector('input') ?? celda,
          body: copy.ask,
          acceptLabel: copy.verb,
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
      this.announcement.set(this.translate.instant('agents.form.assigned.bulk_done', { count: rows.length }));
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
    this.linksChange.emit(this.links().map((l) => (l.groupId === groupId ? { ...l, active } : l)));
  }
}
