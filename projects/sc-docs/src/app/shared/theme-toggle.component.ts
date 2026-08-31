import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Toggle de tema claro/oscuro: un botón único con iconos SVG de sol y luna (no emoji) que
 * se TRANSFORMA de uno a otro (funde + rota + escala), sutil y elegante, respetando
 * `prefers-reduced-motion`. No guarda estado: recibe `dark` y emite `toggle`, así el mismo
 * control sirve para el tema global (sidebar) y para el lienzo local de cada componente.
 *
 * `role="switch"` + `aria-checked`: es un interruptor accesible, no un botón cualquiera.
 */
@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="tt"
      role="switch"
      [class.tt--dark]="dark()"
      [attr.aria-checked]="dark()"
      [attr.aria-label]="dark() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
      [attr.title]="dark() ? 'Tema oscuro' : 'Tema claro'"
      (click)="toggled.emit()"
    >
      <span class="tt__stage" aria-hidden="true">
        <!-- Sol: núcleo + rayos. Visible en claro. -->
        <svg class="tt__ico tt__sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.4 19.6l1.6-1.6M18 6l1.6-1.6" />
        </svg>
        <!-- Luna: creciente. Visible en oscuro. -->
        <svg class="tt__ico tt__moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.5 13.2A8.2 8.2 0 1 1 10.8 3.5 6.4 6.4 0 0 0 20.5 13.2Z" />
        </svg>
      </span>
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .tt {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: 1px solid var(--sc-border-default);
      border-radius: var(--sc-radius-full, 999px);
      background: var(--sc-bg-default);
      color: var(--sc-text-secondary);
      cursor: pointer;
      transition:
        background-color 160ms ease-out,
        color 160ms ease-out,
        border-color 160ms ease-out;
    }

    .tt:hover {
      color: var(--sc-text-primary);
      border-color: var(--sc-border-strong);
      background: var(--sc-bg-subtle);
    }

    .tt:focus-visible {
      outline: 2px solid var(--sc-color-sky-500);
      outline-offset: 2px;
    }

    /* Escenario cuadrado donde se cruzan los dos iconos, apilados. */
    .tt__stage {
      position: relative;
      display: block;
      width: 1.05rem;
      height: 1.05rem;
    }

    .tt__ico {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      transition:
        opacity 420ms cubic-bezier(0.34, 0.08, 0.16, 1),
        transform 420ms cubic-bezier(0.34, 0.08, 0.16, 1);
    }

    /* Claro: sol presente, luna fuera (girada y encogida). */
    .tt__sun {
      opacity: 1;
      transform: rotate(0) scale(1);
    }

    .tt__moon {
      opacity: 0;
      transform: rotate(-70deg) scale(0.55);
    }

    /* Oscuro: se cruzan. */
    .tt--dark .tt__sun {
      opacity: 0;
      transform: rotate(70deg) scale(0.55);
    }

    .tt--dark .tt__moon {
      opacity: 1;
      transform: rotate(0) scale(1);
    }

    @media (prefers-reduced-motion: reduce) {
      .tt__ico {
        transition-duration: 1ms;
      }
    }
  `,
})
export class ThemeToggleComponent {
  /** ¿Está en oscuro ahora mismo? Lo decide quien lo usa. */
  readonly dark = input.required<boolean>();
  /** Click en el interruptor: el padre cambia el tema. */
  readonly toggled = output<void>();
}
