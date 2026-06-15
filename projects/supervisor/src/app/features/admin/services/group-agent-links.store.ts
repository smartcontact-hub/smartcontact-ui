import { computed, Injectable, signal, Signal } from '@angular/core';

import { GROUP_AGENT_LINKS_SEED } from './group-agent-links.seed';
import { Channel, GroupAgentLink } from './group-agent-links.types';

const STORAGE_KEY = 'sc-group-agent-links';
const VERSION_KEY = 'sc-group-agent-links-v';
/** Bump on shape change. v1 = initial DD#54 model. */
const CURRENT_VERSION = 1;

/**
 * Single source of truth for `(agentId, groupId)` permissions.
 *
 * Why a dedicated store instead of embedding on Agent or Group:
 *   - putting the array on either side forces one feature store to import
 *     the other (write-fan-out, circular risk);
 *   - the link is a join row by definition — keeping it standalone lets
 *     both feature stores derive read-only signals (`linksForAgent`,
 *     `linksForGroup`) without coupling.
 *
 * Cascade entry points live here too (`cascadeGroupChannelRemoval`,
 * `removeAgent`, `removeGroup`) so that when a group's channels shrink
 * or an entity is deleted, link cleanup is a single call from the
 * caller — analogous to `LabelCascadeService`.
 */
@Injectable({ providedIn: 'root' })
export class GroupAgentLinksStore {
  private readonly state = signal<readonly GroupAgentLink[]>(this.readFromStorage());

  /** Read-only signal of every link in the system. */
  readonly links: Signal<readonly GroupAgentLink[]> = this.state.asReadonly();

  /** Indexed view: links grouped by agentId for O(1) lookups. */
  private readonly linksByAgentId = computed(() => {
    const map = new Map<number, GroupAgentLink[]>();
    for (const link of this.state()) {
      const bucket = map.get(link.agentId);
      if (bucket) bucket.push(link);
      else map.set(link.agentId, [link]);
    }
    return map;
  });

  /** Indexed view: links grouped by groupId for O(1) lookups. */
  private readonly linksByGroupId = computed(() => {
    const map = new Map<number, GroupAgentLink[]>();
    for (const link of this.state()) {
      const bucket = map.get(link.groupId);
      if (bucket) bucket.push(link);
      else map.set(link.groupId, [link]);
    }
    return map;
  });

  /** All links for a given agent. */
  linksForAgent(agentId: number): readonly GroupAgentLink[] {
    return this.linksByAgentId().get(agentId) ?? [];
  }

  /** All links for a given group. */
  linksForGroup(groupId: number): readonly GroupAgentLink[] {
    return this.linksByGroupId().get(groupId) ?? [];
  }

  /** Single link lookup by composite key. */
  getLink(agentId: number, groupId: number): GroupAgentLink | undefined {
    return this.linksByAgentId()
      .get(agentId)
      ?.find((l) => l.groupId === groupId);
  }

  /**
   * Insert or replace a link. The caller is responsible for clamping
   * channels against the group's own channel set; the store does not
   * resolve `groupId → group.channels` (that would couple it to GroupsStore).
   * Use `upsertLinkClamped` if you have the group at hand.
   */
  upsertLink(link: GroupAgentLink): void {
    const next = [...this.state()];
    const idx = next.findIndex((l) => l.agentId === link.agentId && l.groupId === link.groupId);
    if (idx >= 0) next[idx] = link;
    else next.push(link);
    this.commit(next);
  }

  /** Convenience: upsert with the group's channel list to clamp the subset. */
  upsertLinkClamped(link: GroupAgentLink, groupChannels: readonly Channel[]): void {
    const allowed = new Set<Channel>(groupChannels);
    this.upsertLink({
      ...link,
      channels: link.channels.filter((c) => allowed.has(c)),
    });
  }

  /** Remove a single link. */
  removeLink(agentId: number, groupId: number): void {
    this.commit(this.state().filter((l) => !(l.agentId === agentId && l.groupId === groupId)));
  }

  /** Replace all links for one agent in one go (used by agent-form save). */
  replaceLinksForAgent(agentId: number, links: readonly GroupAgentLink[]): void {
    const filtered = this.state().filter((l) => l.agentId !== agentId);
    this.commit([...filtered, ...links.filter((l) => l.agentId === agentId)]);
  }

  /** Replace all links for one group in one go (used by group-form save). */
  replaceLinksForGroup(groupId: number, links: readonly GroupAgentLink[]): void {
    const filtered = this.state().filter((l) => l.groupId !== groupId);
    this.commit([...filtered, ...links.filter((l) => l.groupId === groupId)]);
  }

  /** Drop every link that points at a deleted agent. */
  removeAgent(agentId: number): void {
    this.commit(this.state().filter((l) => l.agentId !== agentId));
  }

  /** Drop every link that points at a deleted group. */
  removeGroup(groupId: number): void {
    this.commit(this.state().filter((l) => l.groupId !== groupId));
  }

  /**
   * When a group drops one or more channels (e.g. owner unticks "chat" in
   * the group form), strip those channels from every link. Returns the
   * count of affected links — caller surfaces this in a confirm dialog.
   */
  cascadeGroupChannelRemoval(groupId: number, removed: readonly Channel[]): number {
    if (removed.length === 0) return 0;
    const removedSet = new Set<Channel>(removed);
    let affected = 0;
    const next = this.state().map((link) => {
      if (link.groupId !== groupId) return link;
      const filtered = link.channels.filter((c) => !removedSet.has(c));
      if (filtered.length === link.channels.length) return link;
      affected++;
      return { ...link, channels: filtered };
    });
    if (affected > 0) this.commit(next);
    return affected;
  }

  /** Test/import override. */
  setLinks(updater: (prev: readonly GroupAgentLink[]) => readonly GroupAgentLink[]): void {
    this.commit(updater(this.state()));
  }

  private commit(next: readonly GroupAgentLink[]): void {
    this.state.set(next);
    this.writeToStorage(next);
  }

  private readFromStorage(): readonly GroupAgentLink[] {
    if (typeof localStorage === 'undefined') return GROUP_AGENT_LINKS_SEED;
    try {
      const version = localStorage.getItem(VERSION_KEY);
      if (version && Number(version) >= CURRENT_VERSION) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as GroupAgentLink[];
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
      }
    } catch {
      // corrupted JSON or storage disabled — fall through to defaults
    }
    return GROUP_AGENT_LINKS_SEED;
  }

  private writeToStorage(items: readonly GroupAgentLink[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
    } catch {
      // quota exceeded or storage disabled — keep in-memory state
    }
  }
}
