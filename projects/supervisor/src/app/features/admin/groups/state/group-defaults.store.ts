import { Injectable, signal, Signal } from '@angular/core';

import { createVersionedStorage } from '@core/services/local-store.factory';
import { FACTORY_GROUP_DEFAULTS, GroupDefaults } from '../data/groups-data';

/**
 * Los valores con los que nace un grupo. Los escribe Configuración del AED > Grupos y los lee la ficha de grupo al
 * crear, así que las dos pantallas hablan de lo mismo con las mismas palabras. Un solo objeto, guardado como lista de
 * uno para reutilizar la persistencia versionada.
 */
@Injectable({ providedIn: 'root' })
export class GroupDefaultsStore {
  private readonly storage = createVersionedStorage<GroupDefaults>({
    storageKey: 'sc-group-defaults',
    versionKey: 'sc-group-defaults-v',
    currentVersion: 1,
    defaults: [FACTORY_GROUP_DEFAULTS],
  });

  private readonly state = signal<GroupDefaults>(this.read());

  readonly defaults: Signal<GroupDefaults> = this.state.asReadonly();

  save(next: GroupDefaults): void {
    this.state.set(next);
    this.storage.write([next]);
  }

  /** Lo guardado sobre los de fábrica: un campo nuevo no llega vacío a quien guardó antes de que existiera. */
  private read(): GroupDefaults {
    const saved = this.storage.read()[0];
    return {
      ...FACTORY_GROUP_DEFAULTS,
      ...saved,
      advanced: { ...FACTORY_GROUP_DEFAULTS.advanced, ...saved?.advanced },
    };
  }
}
