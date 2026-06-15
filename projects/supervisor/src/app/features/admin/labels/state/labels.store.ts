import { Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services/local-store.factory';
import { Label, LABELS_SEED } from '../data/labels-data';

@Injectable({ providedIn: 'root' })
export class LabelsStore {
  private readonly store: LocalStore<Label> = createLocalStore<Label>({
    storageKey: 'sc-labels',
    versionKey: 'sc-labels-v',
    currentVersion: 1,
    defaults: LABELS_SEED,
  });

  readonly labels = this.store.items;

  addLabel(data: Omit<Label, 'id'>): Label {
    return this.store.addItem(data);
  }

  updateLabel(id: number, updates: Partial<Label>): void {
    this.store.updateItem(id, updates);
  }

  deleteLabel(id: number): void {
    this.store.deleteItem(id);
  }

  deleteLabels(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }

  getLabel(id: number): Label | undefined {
    return this.store.getItem(id);
  }
}
