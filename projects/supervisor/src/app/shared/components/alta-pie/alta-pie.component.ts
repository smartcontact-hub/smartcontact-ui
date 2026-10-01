import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScButtonComponent } from '@smartcontact-hub/components';

/**
 * EL PIE DE LA SECCIÓN EN UN ALTA (DD-143): «Atrás» a la izquierda y «Siguiente» a la derecha, atajos a la sección de
 * al lado en el orden del índice. La primera no lleva «Atrás», y la última no lleva «Siguiente»: se crea con «Crear …»
 * de arriba, la única acción que crea (DD-122 §6). Al editar no se pinta: se va por el índice.
 *
 * Lo que hace cada botón lo decide la ficha: en la de grupo, «Siguiente» no sale de General sin nombre ni canales
 * (DD-121), y en las tres lleva el foco al título de la sección nueva (`llegarASeccion`).
 *
 * 28 por encima, el aire entre grupos (7 · 14 · 28): los botones son otro grupo que la sección. El margen de abajo de
 * la tarjeta (21) se funde con este, no se suma.
 */
@Component({
  selector: 'sc-alta-pie',
  imports: [TranslateModule, ScButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alta-pie">
      @if (conAnterior()) {
        <sc-button
          size="sm"
          variant="secondary"
          appearance="outlined"
          icon="arrow_back"
          [label]="'common.back' | translate"
          (clicked)="anterior.emit()"
        />
      }
      @if (conSiguiente()) {
        <sc-button
          class="alta-pie__siguiente"
          size="sm"
          variant="secondary"
          appearance="outlined"
          icon="arrow_forward"
          iconPosition="right"
          [label]="'common.next' | translate"
          (clicked)="siguiente.emit()"
        />
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-block-start: var(--sc-spacing-2);
    }

    .alta-pie {
      display: flex;
      gap: var(--sc-spacing-1);
    }

    /* «Siguiente», siempre a la derecha: también en la primera sección, donde va solo. */
    .alta-pie__siguiente {
      margin-inline-start: auto;
    }
  `,
})
export class AltaPieComponent {
  /** Hay una sección antes de la abierta. */
  readonly conAnterior = input.required<boolean>();
  /** Hay una sección después de la abierta. */
  readonly conSiguiente = input.required<boolean>();

  readonly anterior = output<void>();
  readonly siguiente = output<void>();
}
