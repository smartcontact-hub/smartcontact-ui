import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

import { trozosDeCuando } from './component-api.service';

/**
 * La primera frase de un texto y lo que queda. Corta en el primer punto (o cierre de pregunta) seguido de espacio y de
 * algo que abre frase; «96 %» o «v/14» no cortan. Sin un corte así, todo es primera frase.
 */
export function partirEnFrase(texto: string): { readonly resumen: string; readonly resto: string | null } {
  const m = /^(.+?[.!?])\s+(?=[A-ZÁÉÍÓÚÑ«¿¡`(])/su.exec(texto.trim());
  return m ? { resumen: m[1], resto: texto.trim().slice(m[0].length) } : { resumen: texto.trim(), resto: null };
}

/**
 * Un texto de la ficha (la descripción del componente o la de una story) con lo que va entre comillas invertidas pintado
 * como código, y no con las comillas a la vista. Con `plegable`, si pasa de su tope de palabras enseña la primera frase y deja
 * el resto en «Más detalle»: la procedencia (la propiedad del Kit, el token del preset, la DD) le sirve a quien mantiene
 * el DS y no a quien lo usa. El texto entero sigue en la ficha para agentes (`docs:ia`), que lo lee del mismo sitio.
 */
@Component({
  selector: 'app-texto-ficha',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #trozo let-t>
      @for (x of trozos(t); track $index) {
        @if (x.codigo) {
          <code>{{ x.texto }}</code>
        } @else {
          {{ x.texto }}
        }
      }
    </ng-template>
    <p class="texto"><ng-container *ngTemplateOutlet="trozo; context: { $implicit: partes().resumen }" /></p>
    @if (partes().resto; as resto) {
      <details class="mas">
        <summary class="sc-text-body-regular">Más detalle</summary>
        <p class="texto"><ng-container *ngTemplateOutlet="trozo; context: { $implicit: resto }" /></p>
      </details>
    }
  `,
  imports: [NgTemplateOutlet],
  styles: `
    :host {
      display: block;
    }

    .texto {
      margin: 0;
    }

    /* Un selector no se parte por su guion: «sc-» al final de una línea y «badge» al principio de la otra no se lee. */
    code {
      font-family: var(--sc-font-family-mono);
      white-space: nowrap;
    }

    .mas {
      margin-top: var(--sc-spacing-0-25);

      summary {
        width: fit-content;
        cursor: pointer;
        color: var(--sc-text-link);
      }

      summary:focus-visible {
        outline: 2px solid var(--sc-border-focus);
        outline-offset: 2px;
        border-radius: var(--sc-radius-sm);
      }

      .texto {
        margin-top: var(--sc-spacing-0-25);
      }
    }
  `,
})
export class TextoFichaComponent {
  readonly texto = input.required<string>();
  /** Pliega lo que pase de la primera frase si el texto entero pasa de `palabras`. */
  readonly plegable = input(false, { transform: booleanAttribute });
  /** El tope a partir del cual se pliega: 30 en una story; en la cabecera, menos, que es lo primero que se lee. */
  readonly palabras = input(30);

  protected readonly trozos = trozosDeCuando;

  protected readonly partes = computed(() => {
    const t = this.texto();
    const palabras = t.trim().split(/\s+/).length;
    return this.plegable() && palabras > this.palabras() ? partirEnFrase(t) : { resumen: t, resto: null };
  });
}
