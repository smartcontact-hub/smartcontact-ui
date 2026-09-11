import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';

import { anatomiaDe } from './anatomy';

/**
 * Enseña el DOM que de verdad renderiza el componente, LEÍDO del navegador.
 *
 * Va debajo del Playground de cada página. No hay ningún texto escrito a mano aquí: busca el
 * primer `<tag>` de la página (el mismo `meta.tag` que ya usa el snippet) y recorre su árbol. Si
 * PrimeNG cambia su estructura o el wrapper deja de envolver lo que envuelve, esto cambia solo.
 *
 * Por qué importa (Rafa, 2026-09-11): quien consume el DS escribe `<sc-button label="…">`, pero
 * quien depura CSS o escribe un selector necesita ver `sc-button > p-button > button.p-button`.
 * Las dos cosas son ciertas y la doc solo contaba la primera.
 */
@Component({
  selector: 'app-story-anatomy',
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (lineas().length) {
      <div class="sb-anatomy" data-testid="sb-anatomy">
        <p class="sb-anatomy__lead">
          Lo que se escribe es <code>&lt;{{ tag() }}&gt;</code>. Lo que el navegador renderiza es
          esto, leído del DOM de la demo de arriba:
        </p>
        <pre><code>{{ lineas().join('\n') }}</code></pre>
      </div>
    }
  `,
})
export class StoryAnatomyComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly tag = input.required<string>();

  protected readonly lineas = signal<readonly string[]>([]);

  constructor() {
    // `afterNextRender` y no un `effect`: hace falta que el canvas de la story ya esté pintado, y
    // solo corre en navegador (en SSR no hay DOM del que leer).
    afterNextRender(() => {
      const raiz = (this.host.nativeElement as HTMLElement).ownerDocument;
      const el = raiz.querySelector(this.tag());
      if (el) this.lineas.set(anatomiaDe(el));
    });
  }
}
