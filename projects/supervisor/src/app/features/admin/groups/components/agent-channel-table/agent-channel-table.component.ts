import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { IconComponent, IllustratedAvatarComponent } from '@shared/components';
import {
  ScToggleSwitchComponent as ToggleSwitchComponent,
  TriState,
  ScCheckboxComponent as CheckboxComponent,
} from '@smartcontact-hub/components';

import { CHANNEL_LABEL_KEYS, GroupChannel } from '@features/admin/groups/data/groups-data';
import { Channel, GroupAgentLink } from '@features/admin/services/group-agent-links.types';

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
    ButtonComponent,
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
  readonly groupChannels = input.required<readonly GroupChannel[]>();
  readonly links = input.required<readonly GroupAgentLink[]>();
  readonly availableAgents = input.required<readonly AgentChannelTableAgent[]>();
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
    return this.assignedRows().filter((r) => r.agent.name.toLowerCase().includes(q));
  });

  /**
   * "Add" suggestions: roster members that match the query AND are not yet
   * assigned. Capped at 5 so the suggestion strip stays a single readable
   * row even on small viewports. Empty when the query is empty (the bar
   * stays hidden — no value in promoting random suggestions out of context).
   */
  protected readonly addCandidates = computed<readonly AgentChannelTableAgent[]>(() => {
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
    return this.assignedRows().filter((r) => r.link.active && r.link.channels.length === 0).length;
  });

  /** All visible row ids (used by select-all). */
  protected readonly visibleIds = computed(() => this.visibleRows().map((r) => r.agent.id));

  protected readonly allVisibleSelected = computed<TriState>(() => {
    const visible = this.visibleIds();
    if (visible.length === 0) return 'none';
    const sel = this.selectedIds();
    let some = false;
    let all = true;
    for (const id of visible) {
      if (sel.has(id)) some = true;
      else all = false;
    }
    return all ? 'all' : some ? 'some' : 'none';
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
        const channels = has ? l.channels.filter((c) => c !== channel) : [...l.channels, channel];
        return { ...l, channels: this.canonicalize(channels) };
      }),
    );
  }

  protected toggleActive(agentId: number, active: boolean): void {
    this.linksChange.emit(this.links().map((l) => (l.agentId === agentId ? { ...l, active } : l)));
  }

  /** Bulk: pause all selected (active = false). */
  protected bulkPause(): void {
    const sel = this.selectedIds();
    if (sel.size === 0) return;
    this.linksChange.emit(
      this.links().map((l) => (sel.has(l.agentId) ? { ...l, active: false } : l)),
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

  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
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
  private canonicalize(channels: readonly Channel[]): readonly Channel[] {
    const set = new Set(channels);
    const order: readonly Channel[] = ['phone', 'chat', 'email'];
    return order.filter((c) => set.has(c));
  }
}
