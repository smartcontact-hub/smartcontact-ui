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
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('storage', handler);
      // Only release the lock if it's still ours — another tab may have
      // overwritten it, in which case it owns the lifecycle now.
      if (localStorage.getItem(key) === tabId) {
        localStorage.removeItem(key);
      }
    };
  }
}
