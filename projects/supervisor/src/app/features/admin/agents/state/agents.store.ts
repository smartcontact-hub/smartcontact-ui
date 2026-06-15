import { computed, Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services';
import { Agent, AGENTS_SEED, AgentType, PresenceStatus } from '../data/agents-data';

/** Fields exposed to bulk edit (subset that is safe to set across many rows). */
export type AgentBulkField = 'status' | 'presenceStatus' | 'agentType' | 'recording';

function nextCode(items: readonly Agent[]): string {
  const maxN = items.reduce((max, a) => {
    const n = Number(a.code);
    return Number.isFinite(n) && n > max ? n : max;
  }, 10000);
  return String(maxN + 1);
}

@Injectable({ providedIn: 'root' })
export class AgentsStore {
  private readonly store: LocalStore<Agent> = createLocalStore<Agent>({
    storageKey: 'sc-agents',
    versionKey: 'sc-agents-v',
    /** Bumped to 2 when the slim Agent type was expanded with the full schema. */
    currentVersion: 2,
    defaults: AGENTS_SEED,
  });

  readonly agents = this.store.items;

  /** Map of `labelId -> agentCount` derived from the current roster. */
  readonly agentCountByLabel = computed(() => {
    const map = new Map<number, number>();
    for (const agent of this.agents()) {
      for (const labelId of agent.labels ?? []) {
        map.set(labelId, (map.get(labelId) ?? 0) + 1);
      }
    }
    return map;
  });

  addAgent(data: Omit<Agent, 'id' | 'code'>): Agent {
    return this.store.addItem({ ...data, code: nextCode(this.agents()) });
  }

  updateAgent(id: number, updates: Partial<Agent>): void {
    this.store.updateItem(id, updates);
  }

  deleteAgent(id: number): void {
    this.store.deleteItem(id);
  }

  deleteAgents(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }

  getAgent(id: number): Agent | undefined {
    return this.store.getItem(id);
  }

  /** Update a single field on a presence-only fast path (avoids spreading full record). */
  updatePresence(id: number, presence: PresenceStatus): void {
    this.store.updateItem(id, { presenceStatus: presence });
  }

  /**
   * Apply a single-field change to many agents at once. Used by the bulk action
   * bar's "Editar" menu — mirrors the React prototype's `bulkUpdate(ids, field, value)`.
   */
  bulkUpdate(ids: readonly number[], field: AgentBulkField, value: unknown): void {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    for (const agent of this.agents()) {
      if (!idSet.has(agent.id)) continue;
      let patch: Partial<Agent>;
      switch (field) {
        case 'status':
          patch = { status: value as Agent['status'] };
          break;
        case 'presenceStatus':
          patch = { presenceStatus: value as PresenceStatus };
          break;
        case 'agentType':
          patch = { agentType: value as AgentType };
          break;
        case 'recording':
          patch = { permissions: { ...agent.permissions, recording: !!value } };
          break;
        default:
          continue;
      }
      this.store.updateItem(agent.id, patch);
    }
  }

  /** Strip a list of label ids from every agent that references them. */
  removeLabelsFromAllAgents(labelIds: readonly number[]): void {
    if (labelIds.length === 0) return;
    const removalSet = new Set(labelIds);
    for (const agent of this.agents()) {
      const current = agent.labels ?? [];
      if (!current.some((id) => removalSet.has(id))) continue;
      this.store.updateItem(agent.id, {
        labels: current.filter((id) => !removalSet.has(id)),
      });
    }
  }
}
