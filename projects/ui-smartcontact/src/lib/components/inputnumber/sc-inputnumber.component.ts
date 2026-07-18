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
  protected onBlur(): void {
    this._onTouched();

    const current = this.value();
    if (current === null) return;

    const min = this.min();
    const max = this.max();
    let next = current;
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;

    if (next !== current) {
      this.value.set(next);
      this._onChange(next);
    }
  }
}
