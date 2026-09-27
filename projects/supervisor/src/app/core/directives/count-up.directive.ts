import { DestroyRef, Directive, ElementRef, NgZone, effect, inject, input, untracked } from '@angular/core';

import { countUpValue, cssDurationMs } from '@shared/utils/count-up.core.mjs';

/**
 * La cifra de un widget del resumen cuenta hasta su valor: desde 0 al pintarse y desde la de antes al
 * cambiar. Es el movimiento del ejemplo de ProgressSpinner de primeng.dev, que cuenta a la vez que su
 * anillo se llena.
 *
 * El elemento es dueño de su texto: la directiva lo escribe fotograma a fotograma, fuera de la detección
 * de cambios. Va `aria-hidden`: al lector de pantalla le llega la cifra FINAL por un texto oculto al lado,
 * no cada número intermedio.
 *
 * La DURACIÓN sale del `transition-duration` del propio elemento, que el CSS declara con
 * `--sc-transition-slow` y `transition-property: none` (no transiciona nada: solo lleva la cifra). Así la
 * apagan el reset de menos movimiento del Supervisor y el `disableAnimations` de las e2e, sin un
 * `matchMedia` aparte, y no hay milisegundos escritos aquí.
 */
@Directive({ selector: '[scCountUp]', host: { 'aria-hidden': 'true' } })
export class CountUpDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);

  /** La cifra final. */
  readonly scCountUp = input.required<number>();

  private shown = 0;
  private frame = 0;

  constructor() {
    effect(() => {
      const to = this.scCountUp();
      untracked(() => this.count(to));
    });
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frame));
  }

  /**
   * Arranca en el SIGUIENTE fotograma, y es ahí donde lee su duración: leer un estilo computado dentro de la
   * detección de cambios obliga al navegador a calcular estilos a medias, y el anillo de al lado nacía con el
   * arco lleno (medido: de lleno a 8/11 en vez de vacío a 8/11). En el fotograma siguiente ya está todo puesto.
   */
  private count(to: number): void {
    cancelAnimationFrame(this.frame);
    const from = this.shown;
    if (from === to) {
      this.paint(to);
      return;
    }
    this.zone.runOutsideAngular(() => {
      this.frame = requestAnimationFrame((start) => {
        const duration = cssDurationMs(getComputedStyle(this.el).transitionDuration);
        if (duration < 1) {
          this.paint(to);
          return;
        }
        const step = (now: number): void => {
          const elapsed = now - start;
          this.paint(countUpValue(from, to, elapsed, duration));
          if (elapsed < duration) this.frame = requestAnimationFrame(step);
        };
        this.frame = requestAnimationFrame(step);
      });
    });
  }

  private paint(value: number): void {
    this.shown = value;
    this.el.textContent = String(value);
  }
}
