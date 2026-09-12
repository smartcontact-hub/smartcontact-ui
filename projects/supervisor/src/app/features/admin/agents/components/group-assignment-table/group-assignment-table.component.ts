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

import { IllustratedAvatarComponent } from '@shared/components';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScSearchComponent as SearchComponent } from '@smartcontact-hub/components';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import { ScToggleSwitchComponent as ToggleSwitchComponent } from '@smartcontact-hub/components';
import {
  ScDatatableComponent as DatatableComponent,
  type ScColumnCellContext,
  type ScColumnDef,
} from '@smartcontact-hub/components';

import {
  CHANNEL_LABEL_KEYS,
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
 * Per-(agent, group) permission editor for the agent form — the
 * symmetric counterpart of `AedAgentChannelTableComponent`.
 *
 * Layout (DD#54 §2.2):
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ [picker: search + add group]   N grupos                      │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ Grupo     │ Canales │ Sus canales aquí          │ Activo │ │
 *   │ Soporte L1│ ☎ 💬 ✉ │ [☑ Tel][☑ Chat][☐ Email] │  ●━○  │⋮│
 *   │ Ventas    │ ☎     │ [☑ Tel]                    │  ●━○  │⋮│
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Heterogeneous rows: each group exposes its own channel offering, so
 * the cluster of chips per row varies in width. The "Canales del grupo"
 * column is read-only — it answers "why doesn't this row show Email?"
 * without leaving the form.
 *
 * Owns no persistence — the parent (agent form) holds the canonical
 * `links` array and writes to `GroupAgentLinksStore` on save.
 */
@Component({
  selector: 'sc-group-assignment-table',
  standalone: true,
  imports: [
    SearchComponent,
    ButtonComponent,
    DatatableComponent,
    IconComponent,
    IllustratedAvatarComponent,
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
        {
          field: 'active',
          header: this.translate.instant('agents.form.assigned.col_active'),
          width: '7.5rem',
          align: 'center',
          cellTemplate: this.activeTpl(),
        },
        {
          field: 'actions',
          header: '',
          headerAriaLabel: this.translate.instant('common.bulk.actions_aria'),
          width: '4rem',
          align: 'center',
          cellTemplate: this.actionsTpl(),
          stopRowClick: true,
        },
      ];
    }
  );

  /** Clave i18n del canal. Pasa por un método —y no por `channelKeys[ch]` en la
   *  plantilla— porque el contexto de una celda llega sin tipo: `ch` sería `any`
   *  e indexar con `any` un `Record` tipado no compila. Es el mismo recurso que
   *  usan las listas ya migradas (`typeLabel(user.type)` en usuarios). */
  protected channelKey(ch: GroupChannel): string {
    return CHANNEL_LABEL_KEYS[ch];
  }

  /** La fila en pausa se atenúa; es el mismo gancho que tenía a mano. */
  protected readonly rowClass = (row: VisibleRow): string =>
    row.link.active ? '' : 'gatbl__row--paused';

  readonly links = input.required<readonly GroupAgentLink[]>();
  readonly availableGroups =
    input.required<readonly AgentGroupAssignmentRef[]>();
  readonly agentId = input.required<number>();
  /** Section title + hint rendered in the header row, inline with the search
   * (Figma 12277-4185: título+subtítulo a la izquierda, buscador a la derecha). */
  readonly titleKey = input<string | null>(null);
  readonly hintKey = input<string | null>(null);

  readonly linksChange = output<readonly GroupAgentLink[]>();

  protected readonly searchIcon = 'search';
  protected readonly closeIcon = 'close';
  protected readonly trashIcon = 'delete';
  protected readonly checkIcon = 'check';
  protected readonly plusIcon = 'add';
  protected readonly emptyIcon = 'group';
  protected readonly channelKeys = CHANNEL_LABEL_KEYS;

  protected readonly pickerQuery = signal('');
  protected readonly pickerOpen = signal(false);

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

  /** Roster minus already-assigned, optionally filtered by the picker query. */
  protected readonly pickerCandidates = computed<
    readonly AgentGroupAssignmentRef[]
  >(() => {
    const used = new Set(this.links().map((l) => l.groupId));
    const q = this.pickerQuery().trim().toLowerCase();
    return this.availableGroups()
      .filter((g) => !used.has(g.id))
      .filter((g) => (q ? g.name.toLowerCase().includes(q) : true));
  });

  protected hasChannel(link: GroupAgentLink, channel: Channel): boolean {
    return link.channels.includes(channel);
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
    this.pickerQuery.set('');
  }

  protected removeRow(groupId: number): void {
    this.linksChange.emit(this.links().filter((l) => l.groupId !== groupId));
  }

  protected toggleChannel(groupId: number, channel: Channel): void {
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

  // -- picker --

  protected openPicker(): void {
    this.pickerOpen.set(true);
  }

  protected closePicker(): void {
    this.pickerOpen.set(false);
    this.pickerQuery.set('');
  }

  protected onPickerQuery(value: string): void {
    this.pickerQuery.set(value);
    this.pickerOpen.set(true);
  }

  protected onPickerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const candidate = this.pickerCandidates()[0];
      if (candidate) this.addGroup(candidate);
    } else if (event.key === 'Escape') {
      this.closePicker();
    }
  }

  // -- helpers --
}
