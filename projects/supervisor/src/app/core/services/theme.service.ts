import { computed, effect, inject, Injectable, signal, DOCUMENT } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'sc-theme';
const DARK_CLASS = 'sc-dark';

/**
 * App-wide theme switch. Owns three states (`light` / `dark` / `system`)
 * and applies the `.sc-dark` class to `<html>` when the resolved mode
 * is dark — the same selector PrimeNG's Aura preset uses for its dark
 * variants (see `app.config.ts → darkModeSelector`), so flipping the
 * class also inverts every PrimeNG component without further wiring.
 *
 * `system` follows `prefers-color-scheme: dark` and reacts live to the
 * OS-level switch. The chosen mode is persisted to `localStorage` under
 * `sc-theme`; missing or invalid values fall back to `system`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);

  readonly mode = signal<ThemeMode>(this.readPersisted());

  /** Resolves `'system'` to the OS preference; `light` / `dark` pass through. */
  readonly effectiveMode = computed<'light' | 'dark'>(() => {
    const m = this.mode();
    if (m === 'system') return this.systemPref();
    return m;
  });

  /** Tracks `prefers-color-scheme: dark`. Updated by the media query listener. */
  private readonly systemPref = signal<'light' | 'dark'>(this.readSystemPref());

  constructor() {
    /* Apply the resolved theme to <html> on every change. */
    effect(() => {
      const dark = this.effectiveMode() === 'dark';
      const root = this.doc.documentElement;
      if (dark) root.classList.add(DARK_CLASS);
      else root.classList.remove(DARK_CLASS);
    });

    /* Persist user-selected mode (including 'system' as a deliberate choice). */
    effect(() => {
      const m = this.mode();
      try {
        this.doc.defaultView?.localStorage?.setItem(STORAGE_KEY, m);
      } catch {
        /* Quota or disabled — drop silently. */
      }
    });

    /* React to OS-level preference flips when in 'system' mode. */
    const mql = this.doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    if (mql) {
      mql.addEventListener('change', (e) => this.systemPref.set(e.matches ? 'dark' : 'light'));
    }
  }

  set(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  private readPersisted(): ThemeMode {
    try {
      const raw = this.doc.defaultView?.localStorage?.getItem(STORAGE_KEY);
      if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    } catch {
      /* fall through to default */
    }
    return 'system';
  }

  private readSystemPref(): 'light' | 'dark' {
    return this.doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}
