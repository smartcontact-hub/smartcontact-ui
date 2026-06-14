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
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';

export type ScMultiSelectSize = 'sm' | 'md' | 'lg';
export type ScMultiSelectDisplay = 'chip' | 'comma';

let scMultiSelectIdCounter = 0;

/**
 * Smart Contact multi-select. Wraps PrimeNG `<p-multiselect>` with the
 * SCDS field-pattern chrome (label + required + helper + error).
 *
 * Aligned 1:1 with Figma `Smart Contact Prime → ❖ MultiSelect` (canvas
 * 6738:22651): tokens `multiselect/*` mirror `select/*` exactly (border
 * slate-300, padding 10.5/7, shadow #1212170D, dropdown 35px slate-400).
 * Sizes Sm/Lg use the same decimal Figma values as sc-inputtext/sc-select.
 *
 * Two display modes via `[display]`:
 *   - 'chip'  → selected items render as removable pills inside the input
 *   - 'comma' → selected items render as comma-separated text
 */
@Component({
  selector: 'sc-multiselect',
  standalone: true,
  imports: [MultiSelectModule, FormsModule],
  templateUrl: './sc-multiselect.component.html',
  styleUrl: './sc-multiselect.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScMultiSelectComponent),
      multi: true,
    },
  ],
  host: {
    class: 'sc-multiselect',
    '[class.sc-multiselect--sm]': "size() === 'sm'",
    '[class.sc-multiselect--lg]': "size() === 'lg'",
    '[class.sc-multiselect--invalid]': 'isInvalid()',
    '[class.sc-multiselect--disabled]': 'disabled()',
    '[class.sc-multiselect--filled]': 'filled()',
    '[class.sc-multiselect--ifta]': 'iftaLabel()',
  },
})
export class ScMultiSelectComponent implements ControlValueAccessor {
  // ─── Chrome (mirrors sc-select) ─────────────────────────────────────
  readonly size = input<ScMultiSelectSize>('md');
  readonly label = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly helperText = input<string>();
  readonly error = input<string>();
  readonly placeholder = input<string>('');
  readonly disabled = model<boolean>(false);
  readonly inputId = input<string>();
  readonly name = input<string>();

  // ─── MultiSelect-specific ──────────────────────────────────────────
  readonly options = input<readonly unknown[]>([]);
  readonly optionLabel = input<string>('label');
  readonly optionValue = input<string>();
  /** How to render selected items inside the input. */
  readonly display = input<ScMultiSelectDisplay>('comma');
  /** Show search/filter input inside the dropdown. */
  readonly filter = input(false, { transform: booleanAttribute });
  readonly filterBy = input<string>();
  /** Show "Select all" toggle at the top of the dropdown. */
  readonly showToggleAll = input(true, { transform: booleanAttribute });
  /** Hard limit on how many items can be selected. */
  readonly selectionLimit = input<number>();
  /** When `display='comma'`, fold to "N items selected" after this many. */
  readonly maxSelectedLabels = input<number>(3);
  /** Label template for fold state, e.g. "{0} elementos seleccionados". */
  readonly selectedItemsLabel = input<string>('{0} seleccionados');
  /** Show the "×" clear button. */
  readonly showClear = input(false, { transform: booleanAttribute });
  readonly emptyFilterMessage = input<string>('Sin resultados');
  readonly emptyMessage = input<string>('Sin opciones');
  /** Background "filled" variant (Figma node 6220:7054): bg slate-50. */
  readonly filled = input(false, { transform: booleanAttribute });
  /**
   * Label dentro del campo (IftaLabel — *In-Field Top Aligned*, Figma node
   * `7462:106725`). El `label` se fija arriba-dentro del campo y el valor baja
   * (padding-top 21 / bottom 7, label 10.5px regular `#8f97a3` en x10.5/top7).
   * Opt-in; los multiselect con label-encima no cambian.
   */
  readonly iftaLabel = input(false, { transform: booleanAttribute });

  // ─── Two-way value binding ─────────────────────────────────────────
  /** Array of selected values (id-only if `optionValue` set, else whole objects). */
  readonly value = model<unknown[]>([]);

  // ─── Derived ───────────────────────────────────────────────────────
  protected readonly resolvedId = computed(
    () => this.inputId() ?? `sc-multiselect-${++scMultiSelectIdCounter}`,
  );

  protected readonly isInvalid = computed(() => {
    if (this.error()) return true;
    const ctrl = this._ngControl?.control;
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  });

  protected readonly footerText = computed(() => this.error() || this.helperText() || '');

  protected readonly pSize = computed<'small' | 'large' | undefined>(() => {
    const s = this.size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });

  /** PrimeNG `[size]` no propaga al overlay (solo afecta al trigger). Para
   *  que los items del dropdown también respeten la variante size, pasamos
   *  una clase al panel (`<p-multiselect>` la aplica al overlay raíz). El
   *  SCSS hookea esa clase para ajustar padding/font de los items. */
  protected readonly panelStyleClass = computed(() => {
    const s = this.size();
    return s === 'sm' ? 'sc-multiselect-panel--sm' : s === 'lg' ? 'sc-multiselect-panel--lg' : '';
  });

  protected readonly optionsMutable = computed(() => this.options() as unknown[]);

  /**
   * Si las options son primitivas (string[] / number[]), `optionLabel='label'`
   * intentaría resolver `.label` en cada string → todas renderizan vacías (bug
   * visible en grupos config: voz/prioridad/estrategia/tipoCola con string[]
   * mostraban "empty empty…"). Mismo patrón que `sc-select`: con primitivos,
   * pasar `undefined` a PrimeNG para que renderice el valor directamente.
   */
  protected readonly hasPrimitiveOptions = computed(() => {
    const opts = this.options();
    return opts.length > 0 && opts.every((o) => o === null || typeof o !== 'object');
  });

  protected readonly resolvedOptionLabel = computed(() =>
    this.hasPrimitiveOptions() ? undefined : this.optionLabel(),
  );

  protected readonly resolvedOptionValue = computed(() =>
    this.hasPrimitiveOptions() ? undefined : this.optionValue(),
  );

  // ─── ControlValueAccessor ──────────────────────────────────────────
  private _onChange: (v: unknown[]) => void = () => {};
  private _onTouched: () => void = () => {};
  private readonly _injector = inject(Injector);
  private get _ngControl(): NgControl | null {
    try {
      return this._injector.get(NgControl, null, { self: true, optional: true });
    } catch {
      return null;
    }
  }

  writeValue(v: unknown[] | null | undefined): void {
    /* `untracked` aísla la escritura del signal (defensa CVA + signals). */
    untracked(() => this.value.set(Array.isArray(v) ? v : []));
  }
  registerOnChange(fn: (v: unknown[]) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(state: boolean): void {
    this.disabled.set(state);
  }

  protected onModelChange(v: unknown[]): void {
    this.value.set(v ?? []);
    this._onChange(v ?? []);
  }

  protected onBlur(): void {
    this._onTouched();
  }
}
