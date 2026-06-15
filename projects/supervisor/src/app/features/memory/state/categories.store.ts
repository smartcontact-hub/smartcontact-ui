import { computed, Injectable, signal } from '@angular/core';

import { MOCK_CATEGORIES } from '../data/categories-mock';
import type { Category } from '../data/category.types';

/**
 * Signal store de categorías IA Memory.
 *
 * Iter 11a: listado + delete + duplicate.
 * Iter 11b: + addCategory + updateCategory + CategoryRuleLinking
 *           (relación bidireccional con reglas).
 */
@Injectable({ providedIn: 'root' })
export class CategoriesStore {
  private readonly _categories = signal<readonly Category[]>(MOCK_CATEGORIES);

  readonly categories = this._categories.asReadonly();

  readonly activeCategories = computed(() => this._categories().filter((c) => c.isActive));

  readonly isEmpty = computed(() => this._categories().length === 0);

  getCategory(id: string): Category | undefined {
    return this._categories().find((c) => c.id === id);
  }

  deleteCategory(id: string): void {
    this._categories.update((list) => list.filter((c) => c.id !== id));
  }

  addCategory(partial: Omit<Category, 'id' | 'createdAt' | 'classifiedCalls'>): Category {
    const now = new Date().toISOString();
    const newCat: Category = {
      ...partial,
      id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      classifiedCalls: 0,
    };
    this._categories.update((list) => [newCat, ...list]);
    return newCat;
  }

  updateCategory(
    id: string,
    patch: Partial<Omit<Category, 'id' | 'createdAt' | 'classifiedCalls'>>,
  ): void {
    this._categories.update((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  isNameTaken(name: string, exceptId?: string): boolean {
    const lower = name.trim().toLowerCase();
    if (!lower) return false;
    return this._categories().some((c) => c.id !== exceptId && c.name.toLowerCase() === lower);
  }

  duplicateCategory(id: string): Category | null {
    const source = this.getCategory(id);
    if (!source) return null;
    const copy: Category = {
      ...source,
      id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `${source.name} (copia)`,
      createdAt: new Date().toISOString(),
      classifiedCalls: 0,
    };
    this._categories.update((list) => [copy, ...list]);
    return copy;
  }
}
