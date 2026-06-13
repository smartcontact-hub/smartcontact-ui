import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';

export type ScDatepickerSize = 'sm' | 'md' | 'lg';
export type ScDatepickerView = 'date' | 'month' | 'year';

let scDatepickerIdCounter = 0;

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
  imports: [DatePickerModule, FormsModule],
  templateUrl: './sc-datepicker.component.html',
  styleUrl: './sc-datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScDatepickerComponent),
      multi: true,
    },
  ],
  host: {
    class: 'sc-datepicker',
    '[class.sc-datepicker--sm]': "size() === 'sm'",
    '[class.sc-datepicker--lg]': "size() === 'lg'",
    '[class.sc-datepicker--invalid]': 'isInvalid()',
    '[class.sc-datepicker--disabled]': 'disabled()',
    '[class.sc-datepicker--inline]': 'inline()',
  },
})
export class ScDatepickerComponent implements ControlValueAccessor {
  // ─── Chrome ────────────────────────────────────────────────────────
  readonly size = input<ScDatepickerSize>('md');
  readonly label = input<string>();
  readonly required = input<boolean>(false);
  readonly helperText = input<string>();
  readonly error = input<string>();
  readonly placeholder = input<string>('dd/mm/aaaa');
  readonly disabled = model<boolean>(false);
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
  readonly inline = input<boolean>(false);
  /** Show a clear "×" inside the input. */
  readonly showClear = input<boolean>(false);
  /** Show the calendar icon button to open the picker (right side, popup mode only). */
  readonly showIcon = input<boolean>(true);
  /** Show today / clear buttons in the panel footer. */
  readonly showButtonBar = input<boolean>(false);
  /** Locale identifier consumed by PrimeNG. Default Spanish. */
  readonly locale = input<unknown>();

  // ─── Two-way value binding ─────────────────────────────────────────
  readonly value = model<Date | null>(null);

  // ─── Derived ───────────────────────────────────────────────────────
  protected readonly resolvedId = computed(
    () => this.inputId() ?? `sc-datepicker-${++scDatepickerIdCounter}`,
  );

  protected readonly isInvalid = computed(() => {
    if (this.error()) return true;
    const ctrl = this._ngControl?.control;
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  });

  protected readonly footerText = computed(() => this.error() || this.helperText() || '');

  /** sm/md/lg → PrimeNG small/large (md = no attr). */
  protected readonly pSize = computed<'small' | 'large' | undefined>(() => {
    const s = this.size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });

  /** Clase propagada al overlay panel para que los items hereden el size.
   *  Ver `packages/design-system/styles/_sc-overlay-sizes.scss`. */
  protected readonly panelStyleClass = computed(() => {
    const s = this.size();
    return s === 'sm' ? 'sc-datepicker-panel--sm' : s === 'lg' ? 'sc-datepicker-panel--lg' : '';
  });

  // ─── ControlValueAccessor ──────────────────────────────────────────
  private _onChange: (v: Date | null) => void = () => {};
  private _onTouched: () => void = () => {};
  private readonly _injector = inject(Injector);
  private get _ngControl(): NgControl | null {
    try {
      return this._injector.get(NgControl, null, { self: true, optional: true });
    } catch {
      return null;
    }
  }

  writeValue(v: Date | string | null | undefined): void {
    /* `untracked` aísla la escritura del signal (defensa CVA + signals). */
    untracked(() => {
      if (v === null || v === undefined || v === '') {
        this.value.set(null);
        return;
      }
      this.value.set(v instanceof Date ? v : new Date(v));
    });
  }
  registerOnChange(fn: (v: Date | null) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(state: boolean): void {
    this.disabled.set(state);
  }

  protected onModelChange(v: Date | null): void {
    this.value.set(v);
    this._onChange(v);
  }

  protected onBlur(): void {
    this._onTouched();
  }
}
