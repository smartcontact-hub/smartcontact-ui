import { Injectable, signal } from '@angular/core';

export interface PageHeaderState {
  readonly titleKey: string;
  readonly subtitleKey: string | null;
  readonly entityKey: string | null;
  /** Material Symbols name (S60). `<sc-page-header [icon]>` lo renderiza. */
  readonly icon: string | null;
}

/**
 * Lifts a leaf page's header out of its template and into a parent shell
 * (today: `sc-settings-shell`). The shell renders `sc-page-header` at
 * the top of the page so the rail + main content sit below it — matching
 * the /admin form layout where `sticky-form-header` spans full width.
 *
 * Each leaf component calls `set(...)` in its constructor / ngOnInit
 * with the title / icon / subtitle for that route. The shell reads the
 * signal and rerenders. No subscriptions needed — the signal is the
 * single source of truth.
 */
@Injectable({ providedIn: 'root' })
export class PageHeaderService {
  readonly state = signal<PageHeaderState | null>(null);

  set(config: PageHeaderState): void {
    this.state.set(config);
  }

  clear(): void {
    this.state.set(null);
  }
}
