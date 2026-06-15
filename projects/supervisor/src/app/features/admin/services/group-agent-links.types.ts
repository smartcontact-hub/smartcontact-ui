/**
 * Cross-store link between an agent and a group.
 *
 * Replaces three legacy fields that were each only half of the story:
 *   - `Agent.channels` (the agent's global channel capabilities)
 *   - `Agent.groups`   (which groups the agent belonged to + per-group active flag)
 *   - `Group.assignedAgents` (agent names listed on the group)
 *
 * The new model collapses all three into a single `(agentId, groupId)` row
 * carrying the *per-pair* channel set and active flag, matching how Voice
 * (the legacy platform we are migrating from) actually models permissions
 * (Figura 15 of the Voice user manual).
 *
 * Invariants enforced by `GroupAgentLinksStore`:
 *   - exactly one link per `(agentId, groupId)` pair;
 *   - `link.channels ⊆ group.channels` (the link cannot enable a channel
 *     that the group does not own — the store clamps on write);
 *   - removing a channel from a group cascades to every link in O(n).
 */

import { GroupChannel } from '@features/admin/groups/data/groups-data';

/**
 * Single shared `Channel` alias. We keep `GroupChannel` re-exported as the
 * canonical type to avoid a churny rename pass, but at the type level
 * `Channel` and `GroupChannel` are the same union.
 */
export type Channel = GroupChannel;

export interface GroupAgentLink {
  readonly agentId: number;
  readonly groupId: number;
  /** Subset of the parent group's channels. */
  readonly channels: readonly Channel[];
  /** False = paused (config preserved, agent does not receive contacts in this group). */
  readonly active: boolean;
}

/** Composite key helper — useful for Map<string, GroupAgentLink> lookups. */
export function linkKey(agentId: number, groupId: number): string {
  return `${agentId}:${groupId}`;
}
