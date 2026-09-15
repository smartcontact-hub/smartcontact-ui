import { Injectable } from '@angular/core';

/**
 * Remembers the router's current view transition so a component can wait for
 * its cross-fade to end. While it runs, the browser covers the page with a
 * snapshot and nothing is under the pointer: `:hover` drops without the mouse
 * moving. The sidebar uses this to stay open after a click (SISMAC-4340).
 */
@Injectable({ providedIn: 'root' })
export class ViewTransitionTracker {
  private current: Promise<void> = Promise.resolve();

  track(transition: ViewTransition): void {
    this.current = transition.finished.then(
      () => undefined,
      () => undefined,
    );
  }

  /** Resolves when the latest transition has finished, or at once if there is none. */
  settled(): Promise<void> {
    return this.current;
  }
}
