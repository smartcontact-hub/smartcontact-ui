import { ChangeDetectionStrategy, Component, effect, input, signal, untracked, ViewEncapsulation } from '@angular/core';

/** Dónde está una sección en un recorrido: sin ver, a la vista, resuelta bien o resuelta con algo por hacer. */
export type ScStepMarkerState = 'pendiente' | 'actual' | 'hecha' | 'error';

/**
 * El marcador de paso del índice de una ficha en alta: siempre está, y cambia de estado EN SU SITIO, así que nada
 * aparece ni desaparece de un hueco vacío. Parte del radiobutton (anillo vacío, anillo con punto, halo) y le añade lo
 * que un paso necesita: el ✓ y el «!».
 *
 *  · `pendiente`: anillo gris con punto gris. No se ha visto.
 *  · `actual`: relleno de marca, punto blanco y halo. Es la sección a la vista.
 *  · `hecha`: círculo verde con ✓. El ✓ se dibuja con trazo y un halo verde se abre y se va, una vez.
 *  · `error`: círculo rojo con «!». Con el color no basta (daltonismo): lleva signo. Sin movimiento más que el relleno.
 *
 * El cambio se anima solo si ocurre con el marcador a la vista: el que se pinta ya en su estado se queda quieto. Con
 * menos movimiento, un fundido y nada más. Es decorativo (`aria-hidden`): lo que dice lo dice el texto de la fila.
 *
 * Uso:
 * ```html
 * <sc-step-marker state="hecha" />
 * ```
 */
@Component({
  selector: 'sc-step-marker',
  standalone: true,
  template: `
    <svg viewBox="0 0 14 14" width="14" height="14" focusable="false" aria-hidden="true">
      <circle class="sc-step-marker__disco" cx="7" cy="7" r="6.25" />
      <circle class="sc-step-marker__punto" cx="7" cy="7" r="2" />
      <path class="sc-step-marker__check" d="M4.1 7.2 6.2 9.3 9.9 5" pathLength="1" />
      <path class="sc-step-marker__aviso" d="M7 3.9V7.6M7 10v.1" />
    </svg>
  `,
  styleUrl: './sc-step-marker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'sc-step-marker',
    '[class.sc-step-marker--pendiente]': "state() === 'pendiente'",
    '[class.sc-step-marker--actual]': "state() === 'actual'",
    '[class.sc-step-marker--hecha]': "state() === 'hecha'",
    '[class.sc-step-marker--error]': "state() === 'error'",
    '[class.sc-step-marker--pulsa]': 'pulsa() && !fundido()',
    '[class.sc-step-marker--fundido]': 'fundido()',
    'aria-hidden': 'true',
  },
})
export class ScStepMarkerComponent {
  readonly state = input<ScStepMarkerState>('pendiente');
  /** Solo un fundido de color: sin trazo que se dibuja, sin halo de éxito y sin escala. */
  readonly fundido = input(false);

  /** El halo de éxito: solo la primera vez que llega a `hecha` con el marcador ya pintado. Volver a una sección hecha y
   *  salir otra vez no se celebra de nuevo: el ✓ se dibuja, sin halo. */
  protected readonly pulsa = signal(false);

  private pintado = false;
  private yaHecha = false;

  constructor() {
    effect(() => {
      const estado = this.state();
      untracked(() => {
        this.pulsa.set(this.pintado && estado === 'hecha' && !this.yaHecha);
        if (estado === 'hecha') this.yaHecha = true;
        this.pintado = true;
      });
    });
  }
}
