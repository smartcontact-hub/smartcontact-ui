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
export type ScInputNumberSize = ScFieldSize;

/**
 * Smart Contact numeric input. Wraps a native `<input type="number">`
 * with the SCDS field-pattern chrome (label + required mark + helper
 * + error + optional suffix unit). Mirrors `sc-inputtext` shape so the
 * two read as a family.
 *
 * Emits `number | null` (null when the field is empty). Se consume con
 * `[(value)]` (signals). El CVA que daba soporte a ngModel/Reactive Forms se
 * retiró (DD, 2026-08-30): no lo usaba ningún consumidor.
 *
 * Chose native input over `p-inputNumber` because AED's 8 current
 * usages are all integer counters with `min` only — no formatting,
 * no spinners, no locale parsing needed. Upgrade-path remains open:
 * the API surface (`min/max/step/suffix`) is a strict subset of
 * `p-inputNumber`'s.
 */
@Component({
  selector: 'sc-inputnumber',
  standalone: true,
  imports: [InputTextModule, ScFieldLabelComponent, ScFieldMsgComponent],
  templateUrl: './sc-inputnumber.component.html',
  styleUrl: './sc-inputnumber.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'sc-inputnumber',
    '[class.sc-inputnumber--sm]': "size() === 'sm'",
    '[class.sc-inputnumber--lg]': "size() === 'lg'",
    '[class.sc-inputnumber--invalid]': 'isInvalid()',
    '[class.sc-inputnumber--disabled]': 'disabled()',
    '[class.sc-inputnumber--has-suffix]': 'hasSuffix()',
    '[style.--sc-inputnumber-suffix-pad]': 'suffixPad()',
  },
})
export class ScInputNumberComponent {
  // ─── Chrome inputs (mirror sc-inputtext) ───────────────────────────────
  readonly size = input<ScFieldSize>('md');
  readonly label = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly helperText = input<string>();
  readonly error = input<string>();
  /** Estado inválido explícito. Se combina con `error` (paridad con sc-inputtext). */
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly inputId = input<string>();
  readonly name = input<string>();

  // ─── Number-specific ───────────────────────────────────────────────
  readonly min = input<number>();
  readonly max = input<number>();
  readonly step = input<number>(1);
  /** Unit text after the number (e.g. "s", "min", "%", "agentes"). */
  readonly suffix = input<string>();

  // ─── Two-way value binding ─────────────────────────────────────────
  /** Current value. `null` when the field is empty. */
  readonly value = model<number | null>(null);

  // ─── Outputs (paridad con sc-inputtext) ────────────────────────────
  readonly focused = output<FocusEvent>();
  readonly blurred = output<FocusEvent>();

  // ─── Derived ───────────────────────────────────────────────────────
  // ─── Estado del field-pattern (compartido) ─────────────────────────
  private readonly field = createScFieldState('sc-inputnumber', {
    inputId: this.inputId,
    error: this.error,
    helperText: this.helperText,
    invalid: this.invalid,
  });
  protected readonly resolvedId = this.field.resolvedId;
  protected readonly msgId = this.field.msgId;
  protected readonly isInvalid = this.field.isInvalid;
  protected readonly footerText = this.field.footerText;

  protected readonly hasSuffix = computed(() => !!this.suffix());

  /**
   * Padding-right del control para reservar espacio del suffix. Se calcula
   * a partir del length del texto (Inter ≈ 0.6em por carácter + 0.5em safety,
   * mínimo 2.3em para preservar el comportamiento previo de suffixes cortos).
   * Cuando no hay suffix devuelve null y el SCSS aplica su fallback.
   */
  protected readonly suffixPad = computed<string | null>(() => {
    const len = (this.suffix() ?? '').trim().length;
    if (!len) return null;
    const em = Math.max(len * 0.6 + 0.5, 2.3);
    return `${em.toFixed(2)}em`;
  });

  /** The string we hand to the native input — `''` for null. */
  protected readonly displayValue = computed(() => {
    const v = this.value();
    return v === null || v === undefined ? '' : String(v);
  });

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    if (raw === '') {
      this.value.set(null);
      return;
    }
    const n = Number(raw);
    this.value.set(Number.isFinite(n) ? n : null);
  }

  /**
   * Aplica `min`/`max` AL SALIR del campo, y esto no es un extra: hasta ahora
   * el componente los declaraba en su API y solo los pintaba como atributos
   * HTML, que no impiden teclear nada. O sea que todo consumidor que pasaba
   * `[min]="0"` se creía protegido y no lo estaba.
   *
   * El síntoma era feo de verdad: en la página de AED se podía escribir -5 en
   * el campo de cuarentena; la página rechazaba el valor por su cuenta y se
   * quedaba con el anterior, pero el campo seguía enseñando -5. Medido:
   * pantalla y modelo discrepando, y el usuario sin enterarse de que lo suyo
   * se había descartado.
   *
   * Se acota en `blur` y no en `input` a propósito: acotar mientras teclea
   * pelea con el usuario — para llegar a 50 con `max` 40 hay que pasar por el
   * 5, y no queremos corregirle a mitad del número.
   */
  protected onFocus(event: FocusEvent): void {
    this.focused.emit(event);
  }

  protected onBlur(event: FocusEvent): void {
    const current = this.value();
    if (current !== null) {
      const min = this.min();
      const max = this.max();
      let next = current;
      if (min !== undefined && next < min) next = min;
      if (max !== undefined && next > max) next = max;
      if (next !== current) this.value.set(next);
    }
    this.blurred.emit(event);
  }
}
