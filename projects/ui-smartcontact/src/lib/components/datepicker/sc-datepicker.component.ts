import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  ViewEncapsulation,
} from '@angular/core';
// `FormsModule` sigue haciendo falta: la plantilla usa `[ngModel]` como puente
// INTERNO hacia `<p-datepicker>` (no es el CVA exterior, que se retiró).
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { ScFieldLabelComponent } from '../field/sc-field-label.component';
import { ScFieldMsgComponent } from '../field/sc-field-msg.component';
import { createScFieldState, createScPanelSizing, type ScFieldSize } from '../field/sc-field';

/** @deprecated Usa `ScFieldSize`. Alias conservado por compatibilidad de imports. */
export type ScDatepickerSize = ScFieldSize;
export type ScDatepickerView = 'date' | 'month' | 'year';

/**
 * Smart Contact date picker. Wraps PrimeNG `<p-datepicker>` with the
 * SCDS field-pattern chrome (label + required + helper + error).
 *
 * Aligned 1:1 with Figma `Smart Contact Prime → ❖ Datepicker` (node
 * 6738:20817):
 *  - input chrome same as sc-inputtext/sc-select (slate-300 border, 6px
 *    radius, drop shadow #1212170D)
 *  - panel: white bg, slate-200 border, padding 10.5, double-layer
 *    shadow, anchor-gutter 2
 *  - dates: 28×28 circular (border-radius 14)
 *  - week day labels: slate-700 500w, padding 3.5
 *
 * v1 supports single date selection in popup mode. Range, time, and
 * inline modes are exposed but no special wrappers — pass through to
 * the underlying p-datepicker props.
 */
@Component({
  selector: 'sc-datepicker',
  standalone: true,
  imports: [DatePickerModule, FormsModule, ScFieldLabelComponent, ScFieldMsgComponent],
  templateUrl: './sc-datepicker.component.html',
  styleUrl: './sc-datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'sc-datepicker',
    '[class.sc-datepicker--sm]': "size() === 'sm'",
    '[class.sc-datepicker--lg]': "size() === 'lg'",
    '[class.sc-datepicker--invalid]': 'isInvalid()',
    '[class.sc-datepicker--disabled]': 'disabled()',
    '[class.sc-datepicker--inline]': 'inline()',
  },
})
export class ScDatepickerComponent {
  // ─── Chrome ────────────────────────────────────────────────────────
  readonly size = input<ScFieldSize>('md');
  readonly label = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly helperText = input<string>();
  readonly error = input<string>();
  readonly placeholder = input<string>('dd/mm/aaaa');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input<string>();
  readonly name = input<string>();

  // ─── Datepicker-specific ───────────────────────────────────────────
  /** Date format string for display + parsing. Default es-ES short format. */
  readonly dateFormat = input<string>('dd/mm/yy');
  /** Initial / max view mode. */
  readonly view = input<ScDatepickerView>('date');
  /** Earliest selectable date. */
  readonly minDate = input<Date>();
  /** Latest selectable date. */
  readonly maxDate = input<Date>();
  /** Show the panel inline (always visible) instead of in a popup. */
  readonly inline = input(false, { transform: booleanAttribute });
  /** Show a clear "×" inside the input. */
  readonly showClear = input(false, { transform: booleanAttribute });
  /** Show the calendar icon button to open the picker (right side, popup mode only). */
  readonly showIcon = input(true, { transform: booleanAttribute });
  /** Show today / clear buttons in the panel footer. */
  readonly showButtonBar = input(false, { transform: booleanAttribute });
  /** Locale identifier consumed by PrimeNG. Default Spanish. */
  readonly locale = input<unknown>();

  // ─── Two-way value binding ─────────────────────────────────────────
  readonly value = model<Date | null>(null);

  // ─── Estado del field-pattern (compartido) ─────────────────────────
  private readonly field = createScFieldState('sc-datepicker', {
    inputId: this.inputId,
    error: this.error,
    helperText: this.helperText,
  });
  protected readonly resolvedId = this.field.resolvedId;
  protected readonly msgId = this.field.msgId;
  protected readonly isInvalid = this.field.isInvalid;
  protected readonly footerText = this.field.footerText;

  private readonly panel = createScPanelSizing('sc-datepicker', this.size);
  protected readonly pSize = this.panel.pSize;
  protected readonly panelStyleClass = this.panel.panelStyleClass;

  protected onModelChange(v: Date | null): void {
    this.value.set(v);
  }
}
