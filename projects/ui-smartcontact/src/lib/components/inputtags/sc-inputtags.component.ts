import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTagsModule } from 'primeng/inputtags';
import type { InputTagsAddEvent, InputTagsRemoveEvent } from 'primeng/types/inputtags';

import { ScFieldLabelComponent } from '../field/sc-field-label.component';
import { ScFieldMsgComponent } from '../field/sc-field-msg.component';
import { createScFieldState, joinDescribedBy, type ScFieldSize } from '../field/sc-field';

/**
 * Un campo de varios valores cortos: se escribe uno, Enter (o la coma) lo convierte en etiqueta, y cada etiqueta se
 * quita con su ✕ o con Retroceso. Wrapper Extended sobre `<p-inputtags>` de primeng.dev (DD-194): la plantilla, las
 * fichas, el teclado (flechas entre etiquetas) y el aspecto son los nativos, con los tokens del tema.
 *
 * **Cuándo sí y cuándo no**: una lista abierta de textos que escribe el usuario (dominios, etiquetas libres, correos de
 * aviso). Si los valores salen de una lista cerrada, `sc-multiselect`; si es uno solo, `sc-inputtext`.
 *
 * Qué añade el wrapper, y por qué:
 *   - **La etiqueta, la ayuda y el error del DS** (`sc-field-label`, `sc-field-msg`), como `sc-inputtext`.
 *   - **El nombre llega al campo de escribir.** `p-inputtags` no pasa `inputId` a su campo interno, así que la etiqueta
 *     y la ayuda llegan por su entrada `pt` (`aria-labelledby` y `aria-describedby`), sin CSS ni DOM encima.
 *   - **Coma, pegar y salir del campo también añaden** (`delimiter`, `addOnPaste`, `addOnBlur`, por defecto
 *     encendidos): lo escrito no se pierde por no pulsar Enter.
 *   - **`[(value)]` con señales**, como el resto de campos del DS; el `ngModel` de PrimeNG queda dentro.
 *
 * Uso:
 * ```html
 * <sc-inputtags
 *   label="Dominios permitidos"
 *   placeholder="ejemplo.com"
 *   helperText="Las webs donde se puede insertar el chat."
 *   [(value)]="dominios"
 * />
 * ```
 *
 * Figma: el `InputTags` de PrimeOne (pendiente de nodo, `docs/figma-pendiente.md`).
 */
@Component({
  selector: 'sc-inputtags',
  standalone: true,
  imports: [FormsModule, InputTagsModule, ScFieldLabelComponent, ScFieldMsgComponent],
  templateUrl: './sc-inputtags.component.html',
  styleUrl: './sc-inputtags.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'sc-inputtags' },
})
export class ScInputTagsComponent {
  /** Talla del campo: `sm`, `md` o `lg`, la de los demás campos del DS. */
  readonly size = input<ScFieldSize>('md');
  /** Etiqueta del campo. Sin ella el campo no tiene nombre accesible (o se le da uno por `ariaLabel`). */
  readonly label = input<string>();
  /** Nombre accesible cuando no hay `label` visible. */
  readonly ariaLabel = input<string>();
  /** Marca el campo como obligatorio en su etiqueta. No valida por sí solo. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Texto de ayuda bajo el campo. Lo tapa `error` cuando lo hay. */
  readonly helperText = input<string>();
  /** Mensaje de error. Su sola presencia pone el campo en estado inválido. */
  readonly error = input<string>();
  /** Estado inválido explícito. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Texto del campo de escribir mientras está vacío. */
  readonly placeholder = input<string>();
  /** Deshabilita el campo entero: ni se escribe ni se quitan etiquetas. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Id del campo de escribir; si no se pasa, se genera. */
  readonly inputId = input<string>();
  /** Ids de lo que describe el campo desde fuera; se oyen después de la ayuda propia. */
  readonly ariaDescribedBy = input<string>();
  /** Ocupa todo el ancho de su contenedor. */
  readonly fluid = input(true, { transform: booleanAttribute });
  /** Carácter (o expresión) que, además de Enter, cierra una etiqueta. Por defecto, la coma. */
  readonly delimiter = input<string | RegExp>(',');
  /** Pegar un texto lo parte por `delimiter` en etiquetas. */
  readonly addOnPaste = input(true, { transform: booleanAttribute });
  /** Salir del campo con algo escrito lo añade como etiqueta. */
  readonly addOnBlur = input(true, { transform: booleanAttribute });
  /** Cuántas etiquetas como máximo. */
  readonly max = input<number>();
  /** Deja repetir una etiqueta que ya está. */
  readonly allowDuplicate = input(false, { transform: booleanAttribute });

  /** Las etiquetas. */
  readonly value = model<readonly string[]>([]);

  /** Se ha añadido una etiqueta. */
  readonly added = output<InputTagsAddEvent>();
  /** Se ha quitado una etiqueta. */
  readonly removed = output<InputTagsRemoveEvent>();

  private readonly field = createScFieldState('sc-inputtags', {
    inputId: this.inputId,
    error: this.error,
    helperText: this.helperText,
    invalid: this.invalid,
  });
  protected readonly resolvedId = this.field.resolvedId;
  protected readonly msgId = this.field.msgId;
  protected readonly labelId = this.field.labelId;
  protected readonly isInvalid = this.field.isInvalid;
  protected readonly footerText = this.field.footerText;

  protected readonly pSize = computed(() => {
    const s = this.size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });

  /** Lo que el campo interno necesita y `p-inputtags` no le pasa: id, nombre y descripción, por su `pt`. */
  protected readonly tagsPt = computed(() => ({
    pcAutoComplete: {
      pcInputText: {
        root: {
          id: this.resolvedId(),
          'aria-labelledby': this.label() ? this.labelId() : null,
          'aria-label': this.label() ? null : (this.ariaLabel() ?? null),
          'aria-describedby': joinDescribedBy(this.footerText() ? this.msgId() : null, this.ariaDescribedBy()),
          'aria-invalid': this.isInvalid() ? true : null,
          'aria-required': this.required() ? true : null,
        },
      },
    },
  }));
}
