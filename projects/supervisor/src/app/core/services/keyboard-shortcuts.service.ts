import { Injectable, signal } from '@angular/core';

/**
 * Owner of the keyboard-shortcuts overlay's visibility. Lives as a service
 * so anything in the chrome (TopBar trigger button, command-palette
 * "Atajos" entry, future help menu) can open the overlay without owning
 * a reference to the component instance.
 *
 * The overlay component itself just reads `visible` and toggles it on
 * `?` / `Escape` — the host listener stays where it was.
 */
@Injectable({ providedIn: 'root' })
export class KeyboardShortcutsService {
  readonly visible = signal(false);

  open(): void {
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
  }

  toggle(): void {
    this.visible.update((v) => !v);
  }
}
