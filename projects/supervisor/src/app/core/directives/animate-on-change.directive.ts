import { Directive, effect, ElementRef, inject, input } from '@angular/core';

/**
 * Reproduce una animación CSS cada vez que cambia un valor (una cifra que se actualiza).
 *
 * Sustituye al truco de `@for (v of [valor]; track v)`, que recreaba el nodo en cada cambio y
 * llenaba la consola de avisos NG0956. Aquí el nodo es el mismo: se quita la clase, se fuerza un
 * reflow y se vuelve a poner. No anima en el primer pintado (para eso está la entrada del widget).
 */
@Directive({ selector: '[scAnimateOnChange]' })
export class AnimateOnChangeDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** El valor que, al cambiar, dispara la animación. */
  readonly scAnimateOnChange = input.required<unknown>();
  /** Clase con la animación. */
  readonly animateClass = input.required<string>();

  constructor() {
    let first = true;
    effect(() => {
      this.scAnimateOnChange();
      const cls = this.animateClass();
      if (first) {
        first = false;
        return;
      }
      this.el.classList.remove(cls);
      void this.el.offsetWidth;
      this.el.classList.add(cls);
    });
  }
}
