import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LanguageService, ScLang } from './language.service';

/**
 * Selector de idioma: un control segmentado ES | EN (pill), compacto y moderno, hermano
 * visual del `theme-toggle` (mismos tokens, mismo tamaño, `prefers-reduced-motion`). Vive
 * en el cluster de herramientas de la sidebar, que está en TODAS las rutas: por eso el
 * idioma se puede cambiar desde cualquier parte. El crossfade ES↔EN lo pone el propio
 * `LanguageService` (View Transitions), no este control.
 *
 * `role="group"` + `aria-pressed` por segmento: es un grupo de dos interruptores, no un
 * botón suelto. Cada segmento marca su `lang` para que `:lang()` y los lectores lo lean bien.
 */
@Component({
  selector: 'app-language-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lt" role="group" aria-label="Idioma / Language">
      @for (l of langs; track l.code) {
        <button
          type="button"
          class="lt__seg"
          [class.is-active]="lang.current() === l.code"
          [attr.aria-pressed]="lang.current() === l.code"
          [attr.lang]="l.code"
          [attr.title]="l.title"
          (click)="lang.set(l.code)"
        >
          {{ l.label }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .lt {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 2px;
      border: 1px solid var(--sc-border-default);
      border-radius: var(--sc-radius-full, 999px);
      background: var(--sc-bg-subtle);
    }

    .lt__seg {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.9rem;
      height: 1.5rem;
      padding: 0 0.4rem;
      border: 0;
      border-radius: var(--sc-radius-full, 999px);
      background: transparent;
      color: var(--sc-text-secondary);
      font-family: inherit;
      font-size: var(--sc-font-size-50);
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition:
        background-color 160ms ease-out,
        color 160ms ease-out;
    }

    .lt__seg:hover {
      color: var(--sc-text-primary);
    }

    /* Segmento activo: se "eleva" con el fondo por defecto sobre el sutil del contenedor. */
    .lt__seg.is-active {
      background: var(--sc-bg-default);
      color: var(--sc-text-primary);
    }

    .lt__seg:focus-visible {
      outline: 2px solid var(--sc-color-sky-500);
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      .lt__seg {
        transition-duration: 1ms;
      }
    }
  `,
})
export class LanguageToggleComponent {
  protected readonly lang = inject(LanguageService);

  protected readonly langs: ReadonlyArray<{ code: ScLang; label: string; title: string }> = [
    { code: 'es', label: 'ES', title: 'Español' },
    { code: 'en', label: 'EN', title: 'English' },
  ];
}
