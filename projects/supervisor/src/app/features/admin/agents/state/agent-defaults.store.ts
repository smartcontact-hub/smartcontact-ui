import { Injectable, signal, Signal } from '@angular/core';

import { createVersionedStorage } from '@core/services/local-store.factory';
import { AgentDefaults, FACTORY_AGENT_DEFAULTS } from '../data/agents-data';

/**
 * Los valores con los que nace un agente. Los escribe Contact Center › Agentes (`/config/aed/agentes`, DD-135) y los
 * lee la ficha de agente en su modo alta, como `GroupDefaultsStore` con los grupos. Un solo objeto, guardado como
 * lista de uno para reutilizar la persistencia versionada.
 */
@Injectable({ providedIn: 'root' })
export class AgentDefaultsStore {
  private readonly storage = createVersionedStorage<AgentDefaults>({
    storageKey: 'sc-agent-defaults',
    versionKey: 'sc-agent-defaults-v',
    currentVersion: 1,
    defaults: [FACTORY_AGENT_DEFAULTS],
  });

  private readonly state = signal<AgentDefaults>(this.read());

  readonly defaults: Signal<AgentDefaults> = this.state.asReadonly();

  save(next: AgentDefaults): void {
    this.state.set(next);
    this.storage.write([next]);
  }

  /** Lo guardado sobre los de fábrica: un permiso nuevo no llega vacío a quien guardó antes de que existiera. Sin
   *  subir la versión, que BORRA lo guardado. */
  private read(): AgentDefaults {
    const saved = this.storage.read()[0] as Partial<AgentDefaults> | undefined;
    return {
      ...FACTORY_AGENT_DEFAULTS,
      ...saved,
      permissions: { ...FACTORY_AGENT_DEFAULTS.permissions, ...saved?.permissions },
    };
  }
}
