import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScSearchComponent as SearchComponent } from '@smartcontact-hub/components';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import {
  ScDatatableComponent as DatatableComponent,
  type ScColumnCellContext,
  type ScColumnDef,
} from '@smartcontact-hub/components';

import { IllustratedAvatarComponent } from '@shared/components';
import {
  ScToggleSwitchComponent as ToggleSwitchComponent,
  TriState,
  triStateOf,
  ScCheckboxComponent as CheckboxComponent,
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

/** Lightweight agent reference accepted by the table. */
export interface AgentChannelTableAgent {
  readonly id: number;
  readonly name: string;
  readonly photo?: string;
}

interface VisibleRow {
  readonly link: GroupAgentLink;
  readonly agent: AgentChannelTableAgent;
}

/**
 * Per-(agent, group) permission editor used inside the group form.
 *
 * Layout (DD#54):
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ [picker: search + add agent]   N asignados · K sin canal │
 *   ├─────────────────────────────────────────────────────────┤
 *   │ ☐  Agente   │ ☐ Tel │ ☐ Chat │ ☐ Email │  Activo  │     │
 *   │  ▢ A. López │  ☑   │   ☑   │   ☐    │   ●━○   │  ⋮  │
 *   │  ▢ M. Ruiz  │  ☑   │   ☐   │   ☐    │   ●━○   │  ⋮  │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Owns no persistence — the parent (group form) holds the canonical
 * `links` array and writes to `GroupAgentLinksStore` on save. The
 * component emits `linksChange` whenever the user mutates a row.
 *
 * Channel columns are rendered only for the channels the parent group
 * actually owns (so a phone-only group shows just the Teléfono column).
 *
 * Selection is internal — the bulk-action bar (rendered by the parent)
 * reads `selectedIds()` and dispatches commands back via outputs.
 */
@Component({
  selector: 'sc-agent-channel-table',
  standalone: true,
  imports: [
    SearchComponent,
    ButtonComponent,
    DatatableComponent,
    IconComponent,
    IllustratedAvatarComponent,
    ToggleSwitchComponent,
    TranslateModule,
    CheckboxComponent,
  ],
  templateUrl: './agent-channel-table.component.html',
  styleUrl: './agent-channel-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentChannelTableComponent {
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

  private readonly agentTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('agentTpl');
  private readonly activeTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('activeTpl');
  private readonly actionsTpl =
    viewChild<TemplateRef<ScColumnCellContext<VisibleRow>>>('actionsTpl');

  protected readonly columns = computed<readonly ScColumnDef<VisibleRow>[]>(
    () => {
      this.currentLang();
      return [
        {
          field: 'agent',
          header: this.translate.instant('groups.form.assigned.col_agent'),
          cellTemplate: this.agentTpl(),
        },
        {
          field: 'active',
          header: this.translate.instant('groups.form.assigned.col_active'),
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

  protected readonly rowClass = (row: VisibleRow): string =>
    row.link.active ? '' : 'actbl__row--paused';

  protected readonly rowAriaLabel = (row: VisibleRow): string => row.agent.name;

  protected channelKey(ch: GroupChannel): string {
    return CHANNEL_LABEL_KEYS[ch];
  }

  /* ── El adaptador entre el `Set<number>` de este editor y la selección por
   * FILAS del `sc-datatable`. Baja solo lo visible, porque la casilla de
   * cabecera de PrimeNG decide "están todas" comparando tamaños contra `value`.
   *
   * ⚠️ UNA DIFERENCIA DELIBERADA, y va escrita porque cambia lo que ve el
   * usuario: al SUBIR se conservan las elegidas que la búsqueda esté ocultando.
   * Antes los dos caminos no decían lo mismo — `toggleSelect` (una fila) sí las
   * conservaba y `toggleSelectAllVisible(false)` (vaciar desde la cabecera)
   * borraba el Set ENTERO, ocultas incluidas. Ahora los dos conservan, que es el
   * lado que no destruye una elección que el usuario no puede ver. */
  protected readonly selectedRows = computed<readonly VisibleRow[]>(() => {
    const sel = this.selectedIds();
    return this.visibleRows().filter((r) => sel.has(r.agent.id));
  });

  protected onSelectionChange(rows: readonly VisibleRow[]): void {
    const visibles = new Set(this.visibleRows().map((r) => r.agent.id));
    const elegidas = new Set(rows.map((r) => r.agent.id));
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      for (const id of visibles) {
        if (elegidas.has(id)) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  readonly groupChannels = input.required<readonly GroupChannel[]>();
  readonly links = input.required<readonly GroupAgentLink[]>();
  readonly availableAgents =
    input.required<readonly AgentChannelTableAgent[]>();
  readonly groupId = input.required<number>();

  readonly linksChange = output<readonly GroupAgentLink[]>();

  protected readonly plusIcon = 'add';
  protected readonly searchIcon = 'search';
  protected readonly closeIcon = 'close';
  protected readonly trashIcon = 'delete';
  protected readonly checkIcon = 'check';
  protected readonly emptyIcon = 'headphones';
  protected readonly channelKeys = CHANNEL_LABEL_KEYS;

  /**
   * Unified search/add query (Gmail-compose pattern). One field drives two
   * concurrent behaviours so the user never has to choose where to type:
   *   - filters the *assigned* rows visible in the table;
   *   - surfaces a "+ Añadir" suggestion strip below the input for any
   *     roster member that matches but isn't yet in the group.
   * Replaces the previous double `pickerQuery` / `searchQuery` pair, which
   * looked visually identical and forced the user to memorise their roles.
   */
  protected readonly query = signal('');
  protected readonly selectedIds = signal<ReadonlySet<number>>(new Set());

  /** Map agentId → AgentChannelTableAgent for fast row hydration. */
  private readonly agentById = computed(() => {
    const map = new Map<number, AgentChannelTableAgent>();
    for (const a of this.availableAgents()) map.set(a.id, a);
    return map;
  });

  /** Hydrated rows in the order their links arrive (caller chooses). */
  protected readonly assignedRows = computed<readonly VisibleRow[]>(() => {
    const map = this.agentById();
    return this.links()
      .map((link) => {
        const agent = map.get(link.agentId);
        return agent ? { link, agent } : null;
      })
      .filter((r): r is VisibleRow => r !== null);
  });

  /** Query-filtered rows used for the table body. */
  protected readonly visibleRows = computed<readonly VisibleRow[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.assignedRows();
    return this.assignedRows().filter((r) =>
      r.agent.name.toLowerCase().includes(q)
    );
  });

  /**
   * "Add" suggestions: roster members that match the query AND are not yet
   * assigned. Capped at 5 so the suggestion strip stays a single readable
   * row even on small viewports. Empty when the query is empty (the bar
   * stays hidden — no value in promoting random suggestions out of context).
   */
  protected readonly addCandidates = computed<
    readonly AgentChannelTableAgent[]
  >(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    const used = new Set(this.links().map((l) => l.agentId));
    return this.availableAgents()
      .filter((a) => !used.has(a.id))
      .filter((a) => a.name.toLowerCase().includes(q))
      .slice(0, 5);
  });

  /** Counter — how many active rows have zero channels (the soft warning). */
  protected readonly zeroChannelCount = computed(() => {
    return this.assignedRows().filter(
      (r) => r.link.active && r.link.channels.length === 0
    ).length;
  });

  /** All visible row ids (used by select-all). */
  protected readonly visibleIds = computed(() =>
    this.visibleRows().map((r) => r.agent.id)
  );

  protected readonly allVisibleSelected = computed<TriState>(() => {
    const visible = this.visibleIds();
    const sel = this.selectedIds();

    return triStateOf(
      visible.filter((id) => sel.has(id)).length,
      visible.length
    );
  });

  protected hasChannel(link: GroupAgentLink, channel: Channel): boolean {
    return link.channels.includes(channel);
  }

  // -- mutations -----------------------------------------------------

  protected addAgent(agent: AgentChannelTableAgent): void {
    if (this.links().some((l) => l.agentId === agent.id)) return;
    const link: GroupAgentLink = {
      agentId: agent.id,
      groupId: this.groupId(),
      // Default: every channel the group owns is on for new assignments.
      channels: [...this.groupChannels()],
      active: true,
    };
    this.linksChange.emit([...this.links(), link]);
    this.query.set('');
  }

  protected removeRow(agentId: number): void {
    this.linksChange.emit(this.links().filter((l) => l.agentId !== agentId));
    this.deselect(agentId);
  }

  protected toggleChannel(agentId: number, channel: Channel): void {
    this.linksChange.emit(
      this.links().map((l) => {
        if (l.agentId !== agentId) return l;
        const has = l.channels.includes(channel);
        const channels = has
          ? l.channels.filter((c) => c !== channel)
          : [...l.channels, channel];
        return { ...l, channels: canonicalizeChannels(channels) };
      })
    );
  }

  protected toggleActive(agentId: number, active: boolean): void {
    this.linksChange.emit(
      this.links().map((l) => (l.agentId === agentId ? { ...l, active } : l))
    );
  }

  /** Bulk: pause all selected (active = false). */
  protected bulkPause(): void {
    const sel = this.selectedIds();
    if (sel.size === 0) return;
    this.linksChange.emit(
      this.links().map((l) =>
        sel.has(l.agentId) ? { ...l, active: false } : l
      )
    );
  }

  /** Bulk: unassign all selected. */
  protected bulkUnassign(): void {
    const sel = this.selectedIds();
    if (sel.size === 0) return;
    this.linksChange.emit(this.links().filter((l) => !sel.has(l.agentId)));
    this.selectedIds.set(new Set());
  }

  // -- selection -----------------------------------------------------

  protected toggleSelect(agentId: number): void {
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  }

  protected toggleSelectAllVisible(on: boolean): void {
    if (!on) {
      this.selectedIds.set(new Set());
      return;
    }
    this.selectedIds.set(new Set(this.visibleIds()));
  }

  protected isSelected(agentId: number): boolean {
    return this.selectedIds().has(agentId);
  }

  private deselect(agentId: number): void {
    if (!this.selectedIds().has(agentId)) return;
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      next.delete(agentId);
      return next;
    });
  }

  // -- query input ---------------------------------------------------

  protected onQueryChange(value: string): void {
    this.query.set(value);
  }

  protected clearQuery(): void {
    this.query.set('');
  }

  protected onQueryKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Adding has priority over filtering: Enter on a query with an
      // unambiguous roster suggestion = add it. The filter side-effect
      // is passive (table already updated), no Enter action needed there.
      const candidate = this.addCandidates()[0];
      if (candidate) this.addAgent(candidate);
    } else if (event.key === 'Escape') {
      this.clearQuery();
    }
  }

  // -- helpers -------------------------------------------------------

  /** Keep a stable channel order so toggling does not visually reshuffle. */
}
