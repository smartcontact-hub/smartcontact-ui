import { computed, Injectable, signal } from '@angular/core';

import { MOCK_ENTITIES } from '../data/entities-mock';
import type { Entity } from '../data/entity.types';

/**
 * Signal store de entidades Memory.
 *
 * Iter 10a (S38): listado + delete + computeds para system / user.
 * Iter 10b: + addEntity + updateEntity (Create Modal + Edit Sidepanel).
 *
 * System entities (`isSystem: true`) son inmutables — `deleteEntity`
 * las ignora silenciosamente como defensive filter.
 */
@Injectable({ providedIn: 'root' })
export class EntitiesStore {
  private readonly _entities = signal<readonly Entity[]>(MOCK_ENTITIES);

  readonly entities = this._entities.asReadonly();

  readonly systemEntities = computed(() => this._entities().filter((e) => e.isSystem));

  readonly userEntities = computed(() => this._entities().filter((e) => !e.isSystem));

  readonly hasUserEntities = computed(() => this.userEntities().length > 0);

  getEntity(id: string): Entity | undefined {
    return this._entities().find((e) => e.id === id);
  }

  deleteEntity(id: string): void {
    const target = this.getEntity(id);
    if (!target || target.isSystem) return;
    this._entities.update((list) => list.filter((e) => e.id !== id));
  }

  /**
   * Crear una entidad user nueva. Auto-genera id + createdAt/updatedAt.
   * Las system entities NO se pueden crear via esta API (defensive).
   */
  addEntity(partial: Omit<Entity, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>): Entity {
    const now = new Date().toISOString();
    const newEntity: Entity = {
      ...partial,
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    };
    this._entities.update((list) => [...list, newEntity]);
    return newEntity;
  }

  /**
   * Actualizar entidad user existente. Las system entities NO se pueden
   * editar (defensive filter — el listado las marca read-only).
   */
  updateEntity(id: string, patch: Partial<Omit<Entity, 'id' | 'isSystem' | 'createdAt'>>): void {
    this._entities.update((list) => {
      const now = new Date().toISOString();
      return list.map((e) => (e.id === id && !e.isSystem ? { ...e, ...patch, updatedAt: now } : e));
    });
  }

  /**
   * Verifica si un name está ya en uso (excluyendo opcionalmente un id
   * concreto para validar edits sin chocar consigo mismo).
   */
  isNameTaken(name: string, exceptId?: string): boolean {
    const lower = name.trim().toLowerCase();
    if (!lower) return false;
    return this._entities().some((e) => e.id !== exceptId && e.name.toLowerCase() === lower);
  }
}
