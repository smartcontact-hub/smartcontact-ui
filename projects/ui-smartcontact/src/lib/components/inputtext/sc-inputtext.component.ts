import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
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
  readonly size = input<ScFieldSize>('md');
  readonly label = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly helperText = input<string>();
  readonly error = input<string>();
  /** Estado inválido explícito (del catálogo de desarrollo). Se combina con `error`. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Ancho completo (del catálogo de desarrollo): el campo ocupa el 100 %. */
  readonly fluid = input(false, { transform: booleanAttribute });
  /** Nombre accesible cuando no hay `<label>` visible ni `iftaLabel`
   * (del catálogo de desarrollo). */
  readonly ariaLabel = input<string>();

  readonly type = input<ScInputType>('text');
  readonly placeholder = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly inputId = input<string>();
  readonly name = input<string>();
  readonly autocomplete = input<string>();
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
  readonly focused = output<FocusEvent>();
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
