import { InjectionToken, signal, Signal } from '@angular/core';

export interface LocalStoreConfig<T> {
  /** localStorage key for the items themselves. */
  readonly storageKey: string;
  /** localStorage key that records the data schema version. */
  readonly versionKey: string;
  /** Bump this whenever the seed data or shape of T changes. */
  readonly currentVersion: number;
  /** Items used the very first time the store boots, or after a version bump. */
  readonly defaults: readonly T[];
}

export interface LocalStore<T extends { id: number }> {
  /** Read-only signal of the current items. */
  readonly items: Signal<readonly T[]>;
  /** Insert a new item. Returns the inserted item with its assigned id. */
  addItem(item: Omit<T, 'id'>): T;
  /** Patch an existing item by id. No-op if the id is unknown. */
  updateItem(id: number, updates: Partial<T>): void;
  /** Remove a single item. */
  deleteItem(id: number): void;
  /** Remove a batch of items. */
  deleteItems(ids: readonly number[]): void;
  /** Convenience getter. */
  getItem(id: number): T | undefined;
  /** Replace the whole list (mostly for tests / imports). */
  setItems(updater: (prev: readonly T[]) => readonly T[]): void;
}

/**
 * Generic localStorage-backed signal store factory (port of the React
 * prototype's `createLocalStore` — DD#297).
 *
 * Design goals:
 *   - Same shape every domain store can wrap (Labels, Templates, Users, …).
 *   - Versioned: bump `currentVersion` and the next boot wipes stale data
 *     instead of crashing on a shape change.
 *   - Resilient to corrupted JSON: falls back to `defaults`.
 *   - Returns Angular signals so consumers compose with `computed`/`effect`.
 *
 * Each domain typically wraps a single `createLocalStore` inside an
 * `@Injectable({ providedIn: 'root' })` service that exposes domain-specific
 * names (`labels`, `addLabel`, …).
 */
/** La mitad de persistencia de un store: leer y escribir con versión. */
export interface VersionedStorage<T> {
  /** Lee lo persistido, o los `defaults` si no hay nada válido. */
  read(): readonly T[];
  /** Persiste la lista y sella la versión. */
  write(items: readonly T[]): void;
}

/**
 * Persistencia versionada en `localStorage`, SIN exigir `id: number`.
 *
 * Es la mitad de abajo de `createLocalStore`, extraída el 2026-08-24 porque
 * estaba **reimplementada palabra por palabra** en `group-agent-links.store`.
 * Y no por descuido: ese store guarda enlaces con clave compuesta
 * (`groupId` + `agentId`), no un `id: number`, así que no podía usar
 * `createLocalStore` y copió su parte de storage.
 *
 * Separarlas arregla justo eso — la restricción `id: number` la necesita la
 * mitad de ARRIBA (altas, patch por id, borrado), no la de guardar. Cualquier
 * store con otra forma de clave puede persistir igual sin duplicar el manejo
 * de versión, el `try/catch` del JSON corrupto ni la guarda de SSR.
 */
export function createVersionedStorage<T>(config: LocalStoreConfig<T>): VersionedStorage<T> {
  const { storageKey, versionKey, currentVersion, defaults } = config;

  return {
    read(): readonly T[] {
      if (typeof localStorage === 'undefined') return defaults;
      try {
        const version = localStorage.getItem(versionKey);
        if (version && Number(version) >= currentVersion) {
          const raw = localStorage.getItem(storageKey);
          if (raw) return JSON.parse(raw) as T[];
        } else {
          localStorage.removeItem(storageKey);
          localStorage.setItem(versionKey, String(currentVersion));
        }
      } catch {
        // corrupted JSON or storage disabled — fall through to defaults
      }
      return defaults;
    },

    write(items: readonly T[]): void {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(items));
        localStorage.setItem(versionKey, String(currentVersion));
      } catch {
        // Quota exceeded or storage disabled — keep in-memory state, drop on reload.
      }
    },
  };
}

export function createLocalStore<T extends { id: number }>(
  config: LocalStoreConfig<T>,
): LocalStore<T> {
  const storage = createVersionedStorage<T>(config);
  const writeToStorage = (items: readonly T[]): void => storage.write(items);

  const itemsSignal = signal<readonly T[]>(storage.read());

  function commit(next: readonly T[]): void {
    itemsSignal.set(next);
    writeToStorage(next);
  }

  function nextId(items: readonly T[]): number {
    return items.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
  }

  return {
    items: itemsSignal.asReadonly(),

    addItem(item: Omit<T, 'id'>): T {
      const current = itemsSignal();
      const created = { ...item, id: nextId(current) } as T;
      commit([...current, created]);
      return created;
    },

    updateItem(id: number, updates: Partial<T>): void {
      const current = itemsSignal();
      let changed = false;
      const next = current.map((item) => {
        if (item.id !== id) return item;
        changed = true;
        return { ...item, ...updates };
      });
      if (changed) commit(next);
    },

    deleteItem(id: number): void {
      commit(itemsSignal().filter((item) => item.id !== id));
    },

    deleteItems(ids: readonly number[]): void {
      const idSet = new Set(ids);
      commit(itemsSignal().filter((item) => !idSet.has(item.id)));
    },

    getItem(id: number): T | undefined {
      return itemsSignal().find((item) => item.id === id);
    },

    setItems(updater: (prev: readonly T[]) => readonly T[]): void {
      commit(updater(itemsSignal()));
    },
  };
}

/**
 * Un repositorio del panel de administración, listo para `inject()`.
 *
 * Los 9 repos (`agendas`, `entidades`, `horarios`, `variables`…) no hacían otra
 * cosa que envolver `createLocalStore` en una clase `@Injectable` cuyos cuatro
 * métodos eran pass-through 1:1 — 22 líneas idénticas carácter a carácter salvo
 * el nombre del tipo. Y no hacía falta ninguna: el `LocalStore<T>` que devuelve
 * el factory YA cumple `RepoStore<T>`, que es un subconjunto suyo (`RepoStore`
 * no expone `getItem`/`setItems`).
 *
 * Devuelve un `InjectionToken` en vez de un objeto suelto para conservar EXACTO
 * lo que había: singleton perezoso —el `localStorage` se lee en la primera
 * inyección, no al importar el módulo, que es lo que pasaría con un `const`
 * inicializado arriba— y `inject(XStore)` sin tocar una sola línea en los
 * consumidores.
 */
export function createRepoStore<T extends { id: number }>(
  nombre: string,
  config: LocalStoreConfig<T>,
): InjectionToken<LocalStore<T>> {
  return new InjectionToken<LocalStore<T>>(nombre, {
    providedIn: 'root',
    factory: () => createLocalStore<T>(config),
  });
}
