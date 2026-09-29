import { Injectable, signal, Signal } from '@angular/core';

import { createVersionedStorage } from '@core/services/local-store.factory';
import { FACTORY_GROUP_DEFAULTS, GroupDefaults, queueFrom } from '../data/groups-data';

/**
 * Los valores con los que nace un grupo. Los escribe Contact Center › Grupos (`/config/aed/grupos`, DD-135) y los lee
 * la ficha de grupo en su modo alta, así que las dos pantallas hablan de lo mismo con las mismas palabras. Un solo
 * objeto, guardado como lista de uno para reutilizar la persistencia versionada.
 *
 * Misma clave y misma versión que cuando los escribía la página de valores por defecto del listado de grupos: lo que
 * alguien guardó allí sigue valiendo aquí.
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

  /**
   * Lo guardado sobre los de fábrica: un campo nuevo no llega vacío a quien guardó antes de que existiera. Sin
   * subir la versión, que BORRA lo guardado. Hasta el 2026-09-26 había una sola cola para todo el grupo, en
   * `advanced`: lo guardado con ella cae en la de Teléfono y en la de Chat, igual que lee un grupo `resolveGroup`.
   */
  private read(): GroupDefaults {
    const saved = this.storage.read()[0] as Partial<GroupDefaults> | undefined;
    const advanced = { ...FACTORY_GROUP_DEFAULTS.advanced, ...saved?.advanced };
    const legacyQueue = queueFrom(advanced);
    return {
      ...FACTORY_GROUP_DEFAULTS,
      ...saved,
      advanced,
      phoneQueue: { ...legacyQueue, ...saved?.phoneQueue },
      chatQueue: { ...legacyQueue, ...saved?.chatQueue },
      chat: { ...FACTORY_GROUP_DEFAULTS.chat, ...saved?.chat },
    };
  }
}
