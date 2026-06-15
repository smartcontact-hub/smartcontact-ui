import { Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services';
import { User, USERS_SEED } from '../data/users-data';

function nextCode(items: readonly User[]): string {
  const maxN = items.reduce((max, u) => {
    const n = Number(u.code.replace(/^U/, ''));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `U${String(maxN + 1).padStart(3, '0')}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class UsersStore {
  private readonly store: LocalStore<User> = createLocalStore<User>({
    storageKey: 'sc-users',
    versionKey: 'sc-users-v',
    currentVersion: 1,
    defaults: USERS_SEED,
  });

  readonly users = this.store.items;

  addUser(data: Omit<User, 'id' | 'code' | 'createdAt'>): User {
    const code = nextCode(this.users());
    return this.store.addItem({ ...data, code, createdAt: today() });
  }

  updateUser(id: number, updates: Partial<User>): void {
    this.store.updateItem(id, updates);
  }

  deleteUser(id: number): void {
    this.store.deleteItem(id);
  }

  deleteUsers(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }

  getUser(id: number): User | undefined {
    return this.store.getItem(id);
  }
}
