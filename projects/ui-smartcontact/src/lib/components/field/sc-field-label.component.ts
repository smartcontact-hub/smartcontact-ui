import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Etiqueta compartida de los campos del DS (B2).
 *
 * Cinco componentes —inputtext, select, multiselect, datepicker, inputnumber—
 * repetían este bloque VERBATIM: solo cambiaban el nombre BEM y el guard que
 * decide si se pinta. Cada arreglo de a11y o de markup había que hacerlo cinco
 * veces, y ese es exactamente el terreno donde nace el drift.
 *
 * Emite DOS clases a propósito: la compartida (`sc-field__label`) y la del
 * bloque (`sc-inputtext__label`). La segunda no es redundancia — es el contrato
 * hacia fuera: el SCSS de cada componente sigue estilando por su nombre BEM y
 * hay e2e que localizan por él (`category-modal.spec.ts` busca
 * `.sc-inputtext__msg--error`). Conservarla hace que esta extracción no tenga
 * riesgo de estilos: no se toca ni una regla CSS.
 *
 * `display: contents` para que el envoltorio no exista a efectos de layout: el
 * `<label>` sigue siendo, para el flex/grid del padre, lo que era antes.
 */
@Component({
  selector: 'sc-field-label',
  standalone: true,
  template: `
    <label [class]="labelClass()" [attr.for]="for()">
      {{ text() }}
      @if (required()) {
        <span [class]="requiredClass()" aria-hidden="true">*</span>
      }
    </label>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScFieldLabelComponent {
  /** Nombre del bloque BEM del componente anfitrión, p.ej. `sc-inputtext`. */
  readonly block = input.required<string>();
  readonly text = input.required<string>();
  readonly required = input(false);
  /** `id` del control al que apunta la etiqueta. */
  readonly for = input<string>();

  protected readonly labelClass = computed(() => `sc-field__label ${this.block()}__label`);
  protected readonly requiredClass = computed(
    () => `sc-field__required ${this.block()}__required`,
  );
}
