import { Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services';
import { User, USERS_SEED, type UserType } from '../data/users-data';

/** Campos que admiten edición masiva. Ver `bulkUpdate`. */
export type UserBulkField = 'type' | 'status';

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

  /**
   * Edición masiva. Usuarios era la única de las tres hermanas que no la tenía
   * —agentes y grupos sí— y la ausencia era accidental, no diseñada: los tres
   * ficheros son casi el mismo.
   *
   * Solo se exponen `type` y `status`. El resto de campos del usuario (nombre,
   * email, identificador) son ÚNICOS por persona: ofrecerlos en lote sería
   * ofrecer pisar a diez usuarios con el mismo email.
   */
  bulkUpdate(ids: readonly number[], field: UserBulkField, value: unknown): void {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    for (const user of this.users()) {
      if (!idSet.has(user.id)) continue;
      const patch: Partial<User> =
        field === 'type'
          ? { type: value as UserType }
          : { status: value as User['status'] };
      this.store.updateItem(user.id, patch);
    }
  }
}
