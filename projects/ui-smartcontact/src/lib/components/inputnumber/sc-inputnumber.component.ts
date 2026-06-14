import {
  booleanAttribute,
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
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

export type ScInputNumberSize = 'sm' | 'md' | 'lg';

let scInputNumberIdCounter = 0;

/**
 * Smart Contact numeric input. Wraps a native `<input type="number">`
 * with the SCDS field-pattern chrome (label + required mark + helper
 * + error + optional suffix unit). Mirrors `sc-inputtext` shape so the
 * two read as a family.
 *
 * Emits `number | null` (null when the field is empty). Pairs with
 * `[(value)]` signals, `[(ngModel)]`, and Reactive Forms via
 * ControlValueAccessor.
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
  imports: [InputTextModule],
  templateUrl: './sc-inputnumber.component.html',
  styleUrl: './sc-inputnumber.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScInputNumberComponent),
      multi: true,
    },
  ],
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
export class ScInputNumberComponent implements ControlValueAccessor {
  // ─── Chrome inputs (mirror sc-inputtext) ───────────────────────────────
  readonly size = input<ScInputNumberSize>('md');
  readonly label = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly helperText = input<string>();
  readonly error = input<string>();
  readonly placeholder = input<string>();
  readonly disabled = model<boolean>(false);
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

  // ─── Derived ───────────────────────────────────────────────────────
  protected readonly resolvedId = computed(
    () => this.inputId() ?? `sc-inputnumber-${++scInputNumberIdCounter}`,
  );

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

  protected readonly isInvalid = computed(() => {
    if (this.error()) return true;
    const ctrl = this._ngControl?.control;
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  });

  protected readonly footerText = computed(() => this.error() || this.helperText() || '');

  /** The string we hand to the native input — `''` for null. */
  protected readonly displayValue = computed(() => {
    const v = this.value();
    return v === null || v === undefined ? '' : String(v);
  });

  // ─── ControlValueAccessor plumbing ─────────────────────────────────
  private _onChange: (v: number | null) => void = () => {};
  private _onTouched: () => void = () => {};
  private readonly _injector = inject(Injector);
  private get _ngControl(): NgControl | null {
    try {
      return this._injector.get(NgControl, null, { self: true, optional: true });
    } catch {
      return null;
    }
  }

  writeValue(v: number | string | null | undefined): void {
    /* `untracked` aísla la escritura del signal (defensa CVA + signals). */
    untracked(() => {
      if (v === null || v === undefined || v === '') {
        this.value.set(null);
        return;
      }
      const n = typeof v === 'number' ? v : Number(v);
      this.value.set(Number.isFinite(n) ? n : null);
    });
  }
  registerOnChange(fn: (v: number | null) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(state: boolean): void {
    this.disabled.set(state);
  }

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    if (raw === '') {
      this.value.set(null);
      this._onChange(null);
      return;
    }
    const n = Number(raw);
    const next = Number.isFinite(n) ? n : null;
    this.value.set(next);
    this._onChange(next);
  }

  protected onBlur(): void {
    this._onTouched();
  }
}
