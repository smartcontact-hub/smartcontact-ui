import { Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services/local-store.factory';
import { Template, TEMPLATES_SEED } from '../data/templates-data';

export type TemplateInput = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class TemplatesStore {
  private readonly store: LocalStore<Template> = createLocalStore<Template>({
    storageKey: 'sc-templates',
    versionKey: 'sc-templates-v',
    currentVersion: 1,
    defaults: TEMPLATES_SEED,
  });

  readonly templates = this.store.items;

  addTemplate(data: TemplateInput): Template {
    const stamp = today();
    return this.store.addItem({ ...data, createdAt: stamp, updatedAt: stamp });
  }

  updateTemplate(id: number, updates: Partial<TemplateInput>): void {
    this.store.updateItem(id, { ...updates, updatedAt: today() });
  }

  deleteTemplate(id: number): void {
    this.store.deleteItem(id);
  }

  deleteTemplates(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }

  getTemplate(id: number): Template | undefined {
    return this.store.getItem(id);
  }
}
