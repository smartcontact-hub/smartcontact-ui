import { Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services';
import { Group, GROUPS_SEED, GroupChannel, GroupPriority } from '../data/groups-data';

/** Fields exposed to bulk edit on the Groups list. */
export type GroupBulkField = 'priority' | 'strategy' | 'channels';

function nextCode(items: readonly Group[]): string {
  const maxN = items.reduce((max, g) => {
    const n = Number(g.code);
    return Number.isFinite(n) && n > max ? n : max;
  }, 20000);
  return String(maxN + 1);
}

@Injectable({ providedIn: 'root' })
export class GroupsStore {
  private readonly store: LocalStore<Group> = createLocalStore<Group>({
    storageKey: 'sc-groups',
    versionKey: 'sc-groups-v',
    currentVersion: 1,
    defaults: GROUPS_SEED,
  });

  readonly groups = this.store.items;

  addGroup(data: Omit<Group, 'id' | 'code'>): Group {
    return this.store.addItem({ ...data, code: nextCode(this.groups()) });
  }

  updateGroup(id: number, updates: Partial<Group>): void {
    this.store.updateItem(id, updates);
  }

  deleteGroup(id: number): void {
    this.store.deleteItem(id);
  }

  deleteGroups(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }

  getGroup(id: number): Group | undefined {
    return this.store.getItem(id);
  }

  bulkUpdate(ids: readonly number[], field: GroupBulkField, value: unknown): void {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    for (const group of this.groups()) {
      if (!idSet.has(group.id)) continue;
      let patch: Partial<Group>;
      switch (field) {
        case 'priority':
          patch = { priority: value as GroupPriority };
          break;
        case 'strategy':
          patch = { strategy: value as string };
          break;
        case 'channels':
          patch = { channels: value as readonly GroupChannel[] };
          break;
        default:
          continue;
      }
      this.store.updateItem(group.id, patch);
    }
  }
}
