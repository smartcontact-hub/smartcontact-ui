import { Injectable } from '@angular/core';

/**
 * DD#169 cross-tab edit conflict detection. When a form mounts in edit mode
 * it acquires a lock keyed by `<entityType>:<entityId>` in localStorage. If
 * another tab already holds the lock, or grabs it later, the consumer is
 * notified and can show a warning.
 *
 * Returns a release function that removes the lock when the form unmounts —
 * call it from `ngOnDestroy` (or pass the component's `DestroyRef` cleanup).
 */
@Injectable({ providedIn: 'root' })
export class CrossTabLockService {
  acquire(entityType: string, entityId: number, onConflict: () => void): () => void {
    const key = `sc_editing:${entityType}:${entityId}`;
    const tabId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const existing = localStorage.getItem(key);
    if (existing && existing !== tabId) {
      onConflict();
    }
    localStorage.setItem(key, tabId);

    const handler = (event: StorageEvent) => {
      if (event.key === key && event.newValue && event.newValue !== tabId) {
        onConflict();
      }
    };
    // Only release the lock if it's still ours — another tab may have
    // overwritten it, in which case it owns the lifecycle now.
    const release = () => {
      if (localStorage.getItem(key) === tabId) {
        localStorage.removeItem(key);
      }
    };
    /* Recargar (F5) NO destruye el componente, así que sin esto el candado de la carga anterior
     * seguía en localStorage y la carga nueva se creía en conflicto consigo misma: cada F5 habría
     * dicho «otra pestaña está editando». `pagehide` salta al recargar, al cerrar la pestaña y al
     * salir de la app; `pageshow` con `persisted` es la vuelta desde la caché de atrás/adelante,
     * con la ficha otra vez abierta, y ahí el candado se vuelve a poner. */
    const onPageHide = () => release();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) localStorage.setItem(key, tabId);
    };
    window.addEventListener('storage', handler);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);

    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      release();
    };
  }
}
