import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ScIconComponent } from '@smartcontact-hub/icons';

/**
 * Toggle de tema claro/oscuro: un botón único con el sol y la luna de Material (`light_mode`,
 * `dark_mode`; DD-200: un solo juego de iconos, también en la doc) que
 * se TRANSFORMA de uno a otro (funde + rota + escala), sutil y elegante, respetando
 * `prefers-reduced-motion`. No guarda estado: recibe `dark` y emite `toggle`, así el mismo
 * control sirve para el tema global (sidebar) y para el lienzo local de cada componente.
 *
 * `role="switch"` + `aria-checked`: es un interruptor accesible, no un botón cualquiera. Su nombre
 * no cambia («Tema oscuro»): el estado lo dice `aria-checked`. Antes el nombre decía la acción
 * («Cambiar a tema claro») y el lector oía «Cambiar a tema claro, activado».
 */
@Component({
  selector: 'app-theme-toggle',
  imports: [ScIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="tt"
      role="switch"
      [class.tt--dark]="dark()"
      [attr.aria-checked]="dark()"
      aria-label="Tema oscuro"
      title="Tema oscuro"
      (click)="toggled.emit()"
    >
      <span class="tt__stage" aria-hidden="true">
        <!-- Sol, visible en claro; luna, visible en oscuro. -->
        <sc-icon class="tt__ico tt__sun" name="light_mode" [size]="14" />
        <sc-icon class="tt__ico tt__moon" name="dark_mode" [size]="14" />
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
      align-items: center;
      justify-content: center;
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
