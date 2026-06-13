import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  output,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

export type ScInputSize = 'sm' | 'md' | 'lg';

export type ScInputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';

let scInputIdCounter = 0;

/**
 * Smart Contact text input. Wraps PrimeNG's `pInputText` directive with the
 * SCDS field-pattern chrome (label + required mark + helper + error).
 *
 * Pairs con FormsModule (`[(ngModel)]`), Reactive Forms (`[formControl]`)
 * y signals (`[(value)]`) indistintamente — todos empujan al mismo valor
 * interno via `ControlValueAccessor`. Para casos input + addon (icono,
 * botón, prefix/suffix) ver `<sc-inputgroup>`.
 *
 * Fusión Mitad B (lote 3): conserva la chrome+CVA del catálogo de diseño y
 * suma del catálogo de desarrollo `fluid` (ancho completo), `invalid`
 * explícito y los outputs `focused`/`blurred`. La variante `filled` cubre el
 * `variant: 'filled'` del molde (sin duplicar input).
 */
@Component({
  selector: 'sc-inputtext',
  standalone: true,
  imports: [InputTextModule],
  templateUrl: './sc-inputtext.component.html',
  styleUrl: './sc-inputtext.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScInputTextComponent),
      multi: true,
    },
  ],
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
export class ScInputTextComponent implements ControlValueAccessor {
  // ─── Inputs ────────────────────────────────────────────────────────
  readonly size = input<ScInputSize>('md');
  readonly label = input<string>();
  readonly required = input<boolean>(false);
  readonly helperText = input<string>();
  readonly error = input<string>();
  /** Estado inválido explícito (del catálogo de desarrollo). Se combina con
   * `error` y el estado touched+invalid del ControlValueAccessor. */
  readonly invalid = input<boolean>(false);
  /** Ancho completo (del catálogo de desarrollo): el campo ocupa el 100 %. */
  readonly fluid = input<boolean>(false);

  readonly type = input<ScInputType>('text');
  readonly placeholder = input<string>();
  readonly disabled = model<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly inputId = input<string>();
  readonly name = input<string>();
  readonly autocomplete = input<string>();
  readonly maxlength = input<number>();
  /** Hint al teclado virtual mobile (`numeric`, `tel`, `email`, `decimal`, etc.).
   * No fuerza validación — solo cambia el layout del teclado en iOS/Android. */
  readonly inputmode = input<string>();
  /** Background "filled" variant (Figma node 1729:42481): bg slate-50. */
  readonly filled = input<boolean>(false);
  /**
   * Label dentro del campo (IftaLabel — *In-Field Top Aligned*, Figma node
   * `7462:106725`). El `label` se fija arriba-dentro del campo y el valor baja
   * (padding-top 21 / bottom 7, label 10.5px regular `#8f97a3` en x10.5/top7).
   * Opt-in; los inputs con label-encima no cambian.
   */
  readonly iftaLabel = input<boolean>(false);

  // ─── Two-way value binding (signal-friendly) ───────────────────────
  /** Current value. Use `[(value)]="signalName"` from consumers. */
  readonly value = model<string>('');

  // ─── Outputs (del catálogo de desarrollo) ──────────────────────────
  readonly focused = output<FocusEvent>();
  readonly blurred = output<FocusEvent>();

  // ─── Internal ──────────────────────────────────────────────────────
  protected readonly resolvedId = computed(
    () => this.inputId() ?? `sc-inputtext-${++scInputIdCounter}`,
  );

  /** Whether `<input>` is in invalid state — `[invalid]`/`[error]` first, then ControlValueAccessor's touched+invalid. */
  protected readonly isInvalid = computed(() => {
    if (this.invalid() || this.error()) return true;
    const ctrl = this._ngControl?.control;
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  });

  /** Text under the input: error wins over helperText. */
  protected readonly footerText = computed(() => this.error() || this.helperText() || '');

  // ControlValueAccessor support — backs `[(ngModel)]` and Reactive Forms.
  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};
  private readonly _injector = inject(Injector);
  private get _ngControl(): NgControl | null {
    try {
      return this._injector.get(NgControl, null, { self: true, optional: true });
    } catch {
      return null;
    }
  }

  writeValue(v: string | null | undefined): void {
    /* `untracked` aísla la escritura del signal de cualquier reactive
     * context que pudiera invocar writeValue (e.g. signal forms futuro,
     * effect en consumer). Defensa recomendada por Angular docs para
     * CVA + signals — sin coste runtime cuando se llama imperativamente. */
    untracked(() => this.value.set(v ?? ''));
  }
  registerOnChange(fn: (v: string) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(state: boolean): void {
    this.disabled.set(state);
  }

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this._onChange(next);
  }

  protected onFocus(event: FocusEvent): void {
    this.focused.emit(event);
  }

  protected onBlur(event: FocusEvent): void {
    this._onTouched();
    this.blurred.emit(event);
  }
}
