import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Mensaje de pie de los campos del DS (B2) — el que muestra el error o el
 * texto de ayuda. Misma historia que `sc-field-label`: los cinco componentes lo
 * repetían palabra por palabra salvo el nombre BEM.
 *
 * Doble clase igual que la etiqueta, y aquí importa MÁS: la e2e del supervisor
 * localiza el error por `.sc-inputtext__msg--error`
 * (`category-modal.spec.ts:52`). Si esa clase desapareciera, el test seguiría
 * en verde solo hasta que alguien mirara — un locator que no casa nada es un
 * assert que no asevera.
 */
@Component({
  selector: 'sc-field-msg',
  standalone: true,
  template: ` <span [class]="msgClass()" [id]="msgId()">{{ text() }}</span> `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScFieldMsgComponent {
  /** Nombre del bloque BEM del componente anfitrión, p.ej. `sc-inputtext`. */
  readonly block = input.required<string>();
  readonly text = input.required<string>();
  /** Cuando es `true`, el mensaje se pinta como error. */
  readonly isError = input(false);
  readonly msgId = input<string>();

  protected readonly msgClass = computed(() => {
    const block = this.block();
    const base = `sc-field__msg ${block}__msg`;
    return this.isError() ? `${base} sc-field__msg--error ${block}__msg--error` : base;
  });
}
