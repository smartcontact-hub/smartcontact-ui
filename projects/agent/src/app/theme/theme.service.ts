import { computed, effect, inject, Injectable, signal, DOCUMENT } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'sc-agent-theme';
const DARK_CLASS = 'sc-dark';

/**
 * Tema del Agent. Copia del de supervisor pero con **default `dark`** (el Agent es
 * oscuro de fábrica; el toggle del header puede pasarlo a claro). Aplica `.sc-dark`
 * en `<html>` — mismo selector que el preset PrimeNG (`darkModeSelector`), así que
 * el flip invierte todos los componentes sin más. Persiste en localStorage.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);

  readonly mode = signal<ThemeMode>(this.readPersisted());

  readonly effectiveMode = computed<'light' | 'dark'>(() => {
    const m = this.mode();
    return m === 'system' ? this.systemPref() : m;
  });

  private readonly systemPref = signal<'light' | 'dark'>(this.readSystemPref());

  constructor() {
    effect(() => {
      const dark = this.effectiveMode() === 'dark';
      const root = this.doc.documentElement;
      if (dark) root.classList.add(DARK_CLASS);
      else root.classList.remove(DARK_CLASS);
    });

    effect(() => {
      const m = this.mode();
      try {
        this.doc.defaultView?.localStorage?.setItem(STORAGE_KEY, m);
      } catch {
        /* quota o disabled — ignorar */
      }
    });

    const mql = this.doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    if (mql) {
      mql.addEventListener('change', (e) => this.systemPref.set(e.matches ? 'dark' : 'light'));
    }
  }

  set(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  toggle(): void {
    this.set(this.effectiveMode() === 'dark' ? 'light' : 'dark');
  }

  /** Default DARK (no persistido → oscuro). */
  private readPersisted(): ThemeMode {
    try {
      const raw = this.doc.defaultView?.localStorage?.getItem(STORAGE_KEY);
      if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    } catch {
      /* fall through */
    }
    return 'dark';
  }

  private readSystemPref(): 'light' | 'dark' {
    return this.doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
