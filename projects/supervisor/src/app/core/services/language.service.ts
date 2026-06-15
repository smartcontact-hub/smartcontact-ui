import { effect, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'es' | 'en' | 'fr' | 'pt';

const STORAGE_KEY = 'sc-language';
const DEFAULT_LANG: AppLanguage = 'es';
const SUPPORTED: readonly AppLanguage[] = ['es', 'en', 'fr', 'pt'] as const;

/**
 * App-wide language switch. Owns four locales (es / en / fr / pt) and
 * propagates the change to ngx-translate immediately. Persisted to
 * `localStorage` under `sc-language` (kebab-case, consistent con SCDS
 * naming convention). Missing or invalid values fall back to `es`
 * (prototype default).
 *
 * Used by the language picker en Configuración → Sistema. Any component
 * can inject this service y leer `lang()` o llamar `setLang(...)`.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly lang = signal<AppLanguage>(this.readPersisted());

  readonly supported = SUPPORTED;

  constructor() {
    // Initialize ngx-translate with the persisted lang.
    this.translate.addLangs([...SUPPORTED]);
    this.translate.setDefaultLang(DEFAULT_LANG);
    this.translate.use(this.lang());

    // Propagate any future signal change to ngx-translate + storage.
    effect(() => {
      const l = this.lang();
      this.translate.use(l);
      this.writePersisted(l);
    });
  }

  setLang(lang: AppLanguage): void {
    if (!SUPPORTED.includes(lang)) return;
    this.lang.set(lang);
  }

  private readPersisted(): AppLanguage {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_LANG;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw && SUPPORTED.includes(raw as AppLanguage)) return raw as AppLanguage;
    } catch {
      /* storage unavailable — fall through to default */
    }
    return DEFAULT_LANG;
  }

  private writePersisted(lang: AppLanguage): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage full or blocked — degrade silently */
    }
  }
}
