import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/** Idiomas de la doc: español (referencia) e inglés. */
export type ScLang = 'es' | 'en';

const STORAGE_KEY = 'sc-docs-lang';
const LANGS: readonly ScLang[] = ['es', 'en'];

/**
 * Idioma global de sc-docs. Envuelve `TranslateService` con un signal para que la UI
 * reaccione, persiste la elección en `localStorage` y refleja el idioma en `<html lang>`
 * (accesibilidad y `:lang()`). Es `providedIn: 'root'`: una sola instancia, y como se
 * inyecta en el shell (`app.component`) aplica el idioma guardado nada más arrancar.
 *
 * El cambio va envuelto en la View Transitions API, igual que el toggle de tema
 * (`app.component#toggleDark`): la página entera hace un crossfade suave ES↔EN. Fallback
 * instantáneo si el navegador no la soporta o el usuario pide menos movimiento.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  private readonly _current = signal<ScLang>(this.initial());
  /** Idioma activo, reactivo. */
  readonly current = this._current.asReadonly();
  readonly isEnglish = computed(() => this._current() === 'en');

  constructor() {
    // Aplica el idioma inicial (guardado o 'es') sin animar: es el estado de arranque.
    this.apply(this._current());
  }

  /** Cambia el idioma con crossfade. No-op si ya es el activo. */
  set(lang: ScLang): void {
    if (lang === this._current()) return;
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => {
        ready?: Promise<unknown>;
        finished?: Promise<unknown>;
        updateCallbackDone?: Promise<unknown>;
      };
    };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const run = (): void => this.apply(lang);
    // Solo animamos con el documento VISIBLE: si está oculto (pestaña en segundo plano),
    // el navegador aborta la transición con «invalid state» y no hay nada que ver de todos
    // modos. En ese caso aplicamos el cambio directo, sin crossfade.
    const canAnimate =
      typeof doc.startViewTransition === 'function' && !reduce && document.visibilityState === 'visible';
    if (canAnimate) {
      // El callback aplica el idioma; el navegador anima el crossfade. Tragamos el rechazo de
      // sus promesas por si aún así aborta (p. ej. otra transición solapada): el cambio ya se
      // aplicó en el callback y no queremos un «Uncaught (in promise)».
      const transition = doc.startViewTransition!(run);
      void transition?.ready?.catch(() => undefined);
      void transition?.finished?.catch(() => undefined);
      void transition?.updateCallbackDone?.catch(() => undefined);
    } else {
      run();
    }
  }

  /** Alterna ES↔EN (lo usa el pill del chrome y el ⌘K). */
  toggle(): void {
    this.set(this._current() === 'es' ? 'en' : 'es');
  }

  private apply(lang: ScLang): void {
    this._current.set(lang);
    this.translate.use(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* almacenamiento no disponible (modo privado): el idioma no persiste, sin más */
    }
    document.documentElement.lang = lang;
  }

  private initial(): ScLang {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (LANGS as readonly string[]).includes(saved)) return saved as ScLang;
    } catch {
      /* almacenamiento no disponible: caemos al idioma por defecto */
    }
    return 'es';
  }
}
