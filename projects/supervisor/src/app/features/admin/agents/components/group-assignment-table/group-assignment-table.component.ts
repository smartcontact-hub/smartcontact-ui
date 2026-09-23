import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { inject } from '@angular/core';

import {
  ScButtonComponent as ButtonComponent,
  ScCheckboxComponent as CheckboxComponent,
  ScSearchComponent as SearchComponent,
  ScSelectComponent as SelectComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import {
  ScDatatableComponent as DatatableComponent,
  type ScColumnCellContext,
  type ScColumnDef,
} from '@smartcontact-hub/components';

import {
  CHANNEL_LABEL_KEYS,
  GROUP_CHANNELS,
  GroupChannel,
} from '@features/admin/groups/data/groups-data';
import {
  canonicalizeChannels,
  Channel,
  GroupAgentLink,
} from '@features/admin/services/group-agent-links.types';

/** Lightweight group reference accepted by this table. */
export interface AgentGroupAssignmentRef {
  readonly id: number;
  readonly name: string;
  readonly channels: readonly GroupChannel[];
}

interface VisibleRow {
  readonly link: GroupAgentLink;
  readonly group: AgentGroupAssignmentRef;
}

/**
 * Editor de los grupos de un agente, dentro de su ficha — el gemelo de
 * `AgentChannelTableComponent` (los agentes de un grupo), con su misma barra y su
 * misma tabla:
 *
 *   [ Buscar grupo…      ]                               [ Añadir grupo…  ▾ ]
 *   Grupo            Teléfono   Chat   Email   Activo
 *   Soporte L1          ☑        ☑      —      ●━○    🗑
 *
 * Una columna por canal, como la matriz de Contact Center. Cada grupo ofrece sus
 * propios canales: donde no ofrece uno, la celda lleva un guion.
 *
 * No persiste nada: el formulario tiene el `links` canónico y lo guarda en
 * `GroupAgentLinksStore`.
 */
@Component({
  selector: 'sc-group-assignment-table',
  standalone: true,
  imports: [
    ButtonComponent,
    CheckboxComponent,
    DatatableComponent,
    SearchComponent,
    SelectComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './group-assignment-table.component.html',
  styleUrl: './group-assignment-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupAssignmentTableComponent {
  private readonly translate = inject(TranslateService);
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

  private readonly groupTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('groupTpl');
  private readonly channelTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('channelTpl');
  private readonly activeTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('activeTpl');
  private readonly actionsTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('actionsTpl');

  /* Las tres columnas del editor. La de acciones lleva `headerAriaLabel` aunque
   * su `header` vaya vacío: un `<th>` sin texto es una cabecera ANÓNIMA para un
   * lector de pantalla, y la tabla a mano sí la nombraba. Y `stopRowClick`
   * porque el hueco alrededor del botón no debe contar como click de fila. */
  protected readonly columns = computed<readonly ScColumnDef<VisibleRow>[]>(
    () => {
      this.currentLang();
      return [
        {
          field: 'group',
          header: this.translate.instant('agents.form.assigned.col_group'),
          cellTemplate: this.groupTpl(),
        },
        ...GROUP_CHANNELS.map((ch) => ({
          field: ch,
          header: this.translate.instant(CHANNEL_LABEL_KEYS[ch]),
          width: '5.5rem',
          align: 'center' as const,
          cellTemplate: this.channelTpl(),
          stopRowClick: true,
        })),
        {
          field: 'active',
          header: this.translate.instant('agents.form.assigned.col_active'),
          width: '5.5rem',
          align: 'center',
          cellTemplate: this.activeTpl(),
        },
        {
          field: 'actions',
          header: '',
          headerAriaLabel: this.translate.instant('common.actions'),
          width: '3.5rem',
          align: 'center',
          cellTemplate: this.actionsTpl(),
          stopRowClick: true,
        },
      ];
    }
  );

  readonly links = input.required<readonly GroupAgentLink[]>();
  readonly availableGroups =
    input.required<readonly AgentGroupAssignmentRef[]>();
  readonly agentId = input.required<number>();
  readonly linksChange = output<readonly GroupAgentLink[]>();

  protected readonly trashIcon = 'delete';

  /** Filtro de las filas asignadas. */
  protected readonly query = signal('');
  /** El desplegable de «Añadir» vuelve a vacío después de cada alta. */
  protected readonly addPick = signal<number | null>(null);

  /** Map groupId → AgentGroupAssignmentRef for fast row hydration. */
  private readonly groupById = computed(() => {
    const map = new Map<number, AgentGroupAssignmentRef>();
    for (const g of this.availableGroups()) map.set(g.id, g);
    return map;
  });

  protected readonly assignedRows = computed<readonly VisibleRow[]>(() => {
    const map = this.groupById();
    return this.links()
      .map((link) => {
        const group = map.get(link.groupId);
        return group ? { link, group } : null;
      })
      .filter((r): r is VisibleRow => r !== null);
  });

  /** Las filas que deja ver el filtro. */
  protected readonly visibleRows = computed<readonly VisibleRow[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.assignedRows();
    return this.assignedRows().filter((r) => r.group.name.toLowerCase().includes(q));
  });

  /** Los grupos que aún se pueden añadir (el desplegable filtra por su cuenta). */
  protected readonly pickerCandidates = computed<readonly AgentGroupAssignmentRef[]>(() => {
    const used = new Set(this.links().map((l) => l.groupId));
    return this.availableGroups().filter((g) => !used.has(g.id));
  });

  protected hasChannel(link: GroupAgentLink, channel: string): boolean {
    return link.channels.includes(channel as Channel);
  }

  /** ¿Ofrece este grupo el canal? Un `string` porque llega del `field` de la columna. */
  protected offers(group: AgentGroupAssignmentRef, channel: string): boolean {
    return group.channels.includes(channel as GroupChannel);
  }

  // -- mutations --

  protected addGroup(group: AgentGroupAssignmentRef): void {
    if (this.links().some((l) => l.groupId === group.id)) return;
    const link: GroupAgentLink = {
      agentId: this.agentId(),
      groupId: group.id,
      // Default: every channel the group offers is on for new assignments.
      channels: [...group.channels],
      active: true,
    };
    this.linksChange.emit([...this.links(), link]);
  }

  protected removeRow(groupId: number): void {
    this.linksChange.emit(this.links().filter((l) => l.groupId !== groupId));
  }

  protected toggleChannel(groupId: number, field: string): void {
    const channel = field as Channel;
    this.linksChange.emit(
      this.links().map((l) => {
        if (l.groupId !== groupId) return l;
        const has = l.channels.includes(channel);
        const channels = has
          ? l.channels.filter((c) => c !== channel)
          : canonicalizeChannels([...l.channels, channel]);
        return { ...l, channels };
      })
    );
  }

  protected toggleActive(groupId: number, active: boolean): void {
    this.linksChange.emit(
      this.links().map((l) => (l.groupId === groupId ? { ...l, active } : l))
    );
  }

  // -- añadir --

  protected onAddPick(value: unknown): void {
    const group = this.availableGroups().find((g) => g.id === value);
    if (group) this.addGroup(group);
    this.addPick.set(null);
  }

  // -- helpers --
}
