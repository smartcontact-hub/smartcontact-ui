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
import { InputTextModule } from 'primeng/inputtext';
import { ScFieldLabelComponent } from '../field/sc-field-label.component';
import { ScFieldMsgComponent } from '../field/sc-field-msg.component';
import { createScFieldState, type ScFieldSize } from '../field/sc-field';

/** @deprecated Usa `ScFieldSize`. Alias conservado por compatibilidad de imports. */
export type ScInputSize = ScFieldSize;

export type ScInputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';

/**
 * Smart Contact text input. Wraps PrimeNG's `pInputText` directive with the
 * SCDS field-pattern chrome (label + required mark + helper + error).
 *
 * Enlaza con signals (`[(value)]`), que es como lo consumen todas las apps. El
 * `ControlValueAccessor` que daba soporte a `[(ngModel)]`/Reactive Forms se
 * retiró (DD, 2026-08-30): no lo ejercía ni un consumidor en todo el repo, y
 * Angular 22 gradúa Signal Forms —que detecta el `value = model()` de este
 * componente de forma estructural— como la vía de sustitución. Para input +
 * addon (icono, botón, prefix/suffix) ver `<sc-inputgroup>`.
 *
 * Fusión Mitad B (lote 3): conserva la chrome del catálogo de diseño y suma del
 * catálogo de desarrollo `fluid` (ancho completo), `invalid` explícito y los
 * outputs `focused`/`blurred`. La variante `filled` cubre el `variant: 'filled'`
 * del molde (sin duplicar input).
 */
@Component({
  selector: 'sc-inputtext',
  standalone: true,
  imports: [InputTextModule, ScFieldLabelComponent, ScFieldMsgComponent],
  templateUrl: './sc-inputtext.component.html',
  styleUrl: './sc-inputtext.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'sc-inputtext',
    '[class.sc-inputtext--sm]': "size() === 'sm'",
    '[class.sc-inputtext--lg]': "size() === 'lg'",
    '[class.sc-inputtext--invalid]': 'isInvalid()',
    '[class.sc-inputtext--disabled]': 'disabled()',
    '[class.sc-inputtext--filled]': 'filled()',
    '[class.sc-inputtext--ifta]': 'iftaLabel()',
  },
})
export class ScInputTextComponent {
  // ─── Inputs ────────────────────────────────────────────────────────
  /**
   * Talla del campo: `sm`, `md` o `lg`. Mueve alto, tipografía y espaciado a la rampa del Kit; no
   * cambia el comportamiento.
   */
  readonly size = input<ScFieldSize>('md');
  /**
   * Etiqueta del campo. Se pinta con `sc-field-label` y es la que ata su `for` al `id` del control,
   * así que **sin ella el campo no tiene nombre accesible** (o se le da uno por `ariaLabel`).
   */
  readonly label = input<string>();
  /**
   * Marca el campo como obligatorio: pinta la marca en la etiqueta y lo anuncia con `aria-
   * required`. No valida por sí solo — de eso se encarga el formulario.
   */
  readonly required = input(false, { transform: booleanAttribute });
  /** Texto de ayuda bajo el campo. Lo tapa `error` cuando lo hay: nunca se ven los dos a la vez. */
  readonly helperText = input<string>();
  /**
   * Mensaje de error. Su sola presencia pone el campo en estado inválido, así que no hace falta
   * tocar `invalid` además.
   */
  readonly error = input<string>();
  /** Estado inválido explícito (del catálogo de desarrollo). Se combina con `error`. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Ancho completo (del catálogo de desarrollo): el campo ocupa el 100 %. */
  readonly fluid = input(false, { transform: booleanAttribute });
  /** Nombre accesible cuando no hay `<label>` visible ni `iftaLabel`
   * (del catálogo de desarrollo). */
  readonly ariaLabel = input<string>();

  /**
   * Tipo del `<input>` nativo (`text`, `email`, `tel`…). Cambia el teclado del móvil y la
   * validación del navegador.
   */
  readonly type = input<ScInputType>('text');
  /** Texto dentro del campo mientras está vacío. No sustituye a `label`: desaparece al escribir. */
  readonly placeholder = input<string>();
  /** Deshabilita el campo. No se puede enfocar ni editar, y no viaja en el envío del formulario. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * El valor se ve pero no se edita. A diferencia de `disabled`, **sigue siendo enfocable y se
   * puede copiar**.
   */
  readonly readonly = input(false, { transform: booleanAttribute });
  /**
   * Id del control interno. Si no se pasa se genera uno, así que solo hace falta para atar una
   * etiqueta externa o un `aria-describedby` de fuera.
   */
  readonly inputId = input<string>();
  /**
   * Atributo `name` del control, para el envío nativo del formulario y para que el navegador sepa
   * qué autocompletar.
   */
  readonly name = input<string>();
  /**
   * Pista de autocompletado para el navegador (`email`, `current-password`, `off`…). Va tal cual al
   * atributo nativo.
   */
  readonly autocomplete = input<string>();
  /**
   * Máximo de caracteres que deja teclear el navegador. Es un tope duro, no un aviso: no avisa,
   * simplemente no deja escribir más.
   */
  readonly maxlength = input<number>();
  /** Hint al teclado virtual mobile (`numeric`, `tel`, `email`, `decimal`, etc.).
   * No fuerza validación — solo cambia el layout del teclado en iOS/Android. */
  readonly inputmode = input<string>();
  /** Background "filled" variant (Figma node 1729:42481): bg slate-50. */
  readonly filled = input(false, { transform: booleanAttribute });
  /**
   * Label dentro del campo (IftaLabel — *In-Field Top Aligned*, Figma node
   * `7462:106725`). El `label` se fija arriba-dentro del campo y el valor baja
   * (padding-top 21 / bottom 7, label 10.5px regular `#8f97a3` en x10.5/top7).
   * Opt-in; los inputs con label-encima no cambian.
   */
  readonly iftaLabel = input(false, { transform: booleanAttribute });

  // ─── Two-way value binding (signal-friendly) ───────────────────────
  /** Current value. Use `[(value)]="signalName"` from consumers. */
  readonly value = model<string>('');

  // ─── Outputs (del catálogo de desarrollo) ──────────────────────────
  /** El campo ha recibido el foco. */
  readonly focused = output<FocusEvent>();
  /** El campo ha perdido el foco. Es el momento en el que suele validarse. */
  readonly blurred = output<FocusEvent>();

  // ─── Estado del field-pattern (compartido) ─────────────────────────
  private readonly field = createScFieldState('sc-inputtext', {
    inputId: this.inputId,
    error: this.error,
    helperText: this.helperText,
    invalid: this.invalid,
  });
  protected readonly resolvedId = this.field.resolvedId;
  protected readonly msgId = this.field.msgId;
  protected readonly isInvalid = this.field.isInvalid;
  protected readonly footerText = this.field.footerText;
  /** La talla llega al `pInputText` como `p-inputtext-sm/lg`, y el tema le da letra,
   * interlineado y relleno del Kit. Antes el wrapper los escribía a mano (DD-91). */
  protected readonly pSize = computed(() => {
    const s = this.size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected onFocus(event: FocusEvent): void {
    this.focused.emit(event);
  }

  protected onBlur(event: FocusEvent): void {
    this.blurred.emit(event);
  }
}
