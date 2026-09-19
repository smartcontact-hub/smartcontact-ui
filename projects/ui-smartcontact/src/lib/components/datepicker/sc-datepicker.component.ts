import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
// `FormsModule` sigue haciendo falta: la plantilla usa `[ngModel]` como puente
// INTERNO hacia `<p-datepicker>` (no es el CVA exterior, que se retiró).
import { FormsModule } from '@angular/forms';
import { DatePicker, DatePickerModule } from 'primeng/datepicker';
import { ScButtonComponent } from '../button/sc-button.component';
import { ScFieldLabelComponent } from '../field/sc-field-label.component';
import { ScFieldMsgComponent } from '../field/sc-field-msg.component';
import { createScFieldState, createScPanelSizing, type ScFieldSize } from '../field/sc-field';

/** @deprecated Usa `ScFieldSize`. Alias conservado por compatibilidad de imports. */
export type ScDatepickerSize = ScFieldSize;
export type ScDatepickerView = 'date' | 'month' | 'year';
export type ScDatepickerSelectionMode = 'single' | 'range';

/**
 * Atajo del pie del calendario («Hoy», «Últimos 7 días»). `resolve` se evalúa AL PULSAR, no al
 * montar: «Hoy» es el día en que se usa, aunque la pantalla lleve abierta desde ayer.
 * Devuelve un día o un rango `[inicio, fin]`; en modo `single` de un rango se toma el inicio.
 */
export interface ScDatepickerPreset {
  readonly label: string;
  readonly resolve: () => Date | readonly [Date, Date];
}

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
  imports: [DatePickerModule, FormsModule, ScButtonComponent, ScFieldLabelComponent, ScFieldMsgComponent],
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
  /**
   * Etiqueta del campo. Se pinta con `sc-field-label` y es la que ata su `for` al `id` del control,
   * así que **sin ella el campo no tiene nombre accesible** (o se le da uno por `ariaLabel`).
   */
  readonly label = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  /** Texto de ayuda bajo el campo. Lo tapa `error` cuando lo hay: nunca se ven los dos a la vez. */
  readonly helperText = input<string>();
  /**
   * Mensaje de error. Su sola presencia pone el campo en estado inválido, así que no hace falta
   * tocar `invalid` además.
   */
  readonly error = input<string>();
  /** Estado inválido explícito. Se combina con `error` (paridad con sc-inputtext). */
  readonly invalid = input(false, { transform: booleanAttribute });
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
  /**
   * `single` (un día, en `value`) o `range` (dos, en `range`). El rango es el `selectionMode`
   * nativo de PrimeNG: primer clic abre, segundo cierra.
   */
  readonly selectionMode = input<ScDatepickerSelectionMode>('single');
  /**
   * Atajos en el pie del panel (plantilla `#buttonbar` de PrimeNG). Con al menos uno, el pie
   * se muestra con los atajos y «Limpiar» en lugar de «Hoy / Limpiar».
   */
  readonly presets = input<readonly ScDatepickerPreset[]>([]);
  /** Rótulo del botón que vacía la fecha en el pie con atajos. */
  readonly clearLabel = input<string>('Limpiar');

  // ─── Two-way value binding ─────────────────────────────────────────
  /** La fecha elegida, o `null` si no hay ninguna. Enlace de dos sentidos: `[(value)]`. */
  readonly value = model<Date | null>(null);
  /** Valor en modo `range`: `[inicio, fin]`, con `fin` a `null` mientras se elige. */
  readonly range = model<readonly (Date | null)[] | null>(null);

  // ─── Outputs (paridad con sc-inputtext / sc-select) ────────────────
  /** El campo ha recibido el foco. */
  readonly focused = output<FocusEvent>();
  /** El campo ha perdido el foco. Es el momento en el que suele validarse. */
  readonly blurred = output<FocusEvent>();

  // ─── Estado del field-pattern (compartido) ─────────────────────────
  private readonly field = createScFieldState('sc-datepicker', {
    inputId: this.inputId,
    error: this.error,
    helperText: this.helperText,
    invalid: this.invalid,
  });
  protected readonly resolvedId = this.field.resolvedId;
  protected readonly msgId = this.field.msgId;
  protected readonly isInvalid = this.field.isInvalid;
  protected readonly footerText = this.field.footerText;

  private readonly panel = createScPanelSizing('sc-datepicker', this.size);
  protected readonly pSize = this.panel.pSize;
  protected readonly panelStyleClass = this.panel.panelStyleClass;

  private readonly picker = viewChild(DatePicker);

  protected readonly isRange = computed(() => this.selectionMode() === 'range');
  protected readonly pickerValue = computed(() => (this.isRange() ? this.range() : this.value()));
  protected readonly hasPresets = computed(() => this.presets().length > 0);

  protected onModelChange(v: Date | (Date | null)[] | null): void {
    if (this.isRange()) this.range.set((v as (Date | null)[] | null) ?? null);
    else this.value.set((v as Date | null) ?? null);
  }

  protected applyPreset(preset: ScDatepickerPreset): void {
    const r = preset.resolve();
    const [start, end] = r instanceof Date ? [r, r] : r;
    if (this.isRange()) this.range.set([start, end]);
    else this.value.set(start);
    this.picker()?.hideOverlay();
  }

  protected clearFromBar(): void {
    if (this.isRange()) this.range.set(null);
    else this.value.set(null);
    this.picker()?.hideOverlay();
  }

  protected onFocus(event: Event): void {
    this.focused.emit(event as FocusEvent);
  }

  protected onBlur(event: Event): void {
    this.blurred.emit(event as FocusEvent);
  }
}
