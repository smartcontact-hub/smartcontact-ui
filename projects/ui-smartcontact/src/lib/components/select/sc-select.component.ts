import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  output,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { PrimeTemplate } from 'primeng/api';
import { ScFieldLabelComponent } from '../field/sc-field-label.component';
import { ScFieldMsgComponent } from '../field/sc-field-msg.component';
import { SelectModule } from 'primeng/select';

export type ScSelectSize = 'sm' | 'md' | 'lg';

let scSelectIdCounter = 0;

/**
 * Smart Contact select / dropdown. Wraps PrimeNG `<p-select>` with the
 * SCDS field-pattern chrome (label + required + helper + error). Mirrors
 * `sc-inputtext` so the field family reads consistent.
 *
 * Aligned 1:1 with Figma `Smart Contact Prime → ❖ Select` (node
 * 6738:22642): border slate-300, radius 6px, padding 10.5/7, dropdown
 * area 35px wide, chevron 14px slate-400, label slate-700 14px, helper
 * slate-700 12px, gap 7px between label/input/helper.
 *
 * Options can be a plain `string[]` or an array of `{ label, value }`
 * objects. `optionLabel` / `optionValue` let you point to custom keys
 * when objects don't use that exact shape.
 */
@Component({
  selector: 'sc-select',
  standalone: true,
  imports: [SelectModule, FormsModule, PrimeTemplate, NgTemplateOutlet, ScFieldLabelComponent, ScFieldMsgComponent],
  templateUrl: './sc-select.component.html',
  styleUrl: './sc-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScSelectComponent),
      multi: true,
    },
  ],
  host: {
    class: 'sc-select',
    '[class.sc-select--sm]': "size() === 'sm'",
    '[class.sc-select--lg]': "size() === 'lg'",
    '[class.sc-select--invalid]': 'isInvalid()',
    '[class.sc-select--disabled]': 'disabled()',
    '[class.sc-select--filled]': 'filled()',
    '[class.sc-select--ifta]': 'iftaLabel()',
  },
})
export class ScSelectComponent implements ControlValueAccessor {
  // ─── Chrome (mirrors sc-inputtext) ─────────────────────────────────────
  readonly size = input<ScSelectSize>('md');
  readonly label = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly helperText = input<string>();
  readonly error = input<string>();
  readonly placeholder = input<string>('');
  readonly disabled = model<boolean>(false);
  /** Solo lectura (paridad con sc-inputtext / catálogo de desarrollo). */
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly inputId = input<string>();
  readonly name = input<string>();

  // ─── Select-specific ───────────────────────────────────────────────
  /** Items to pick from. Plain string[] or array of objects. */
  readonly options = input<readonly unknown[]>([]);
  /** Key for the visible label when `options` are objects. */
  readonly optionLabel = input<string>('label');
  /** Key for the bound value when `options` are objects. If unset, the whole object is bound. */
  readonly optionValue = input<string>();
  /** Show an "×" to clear selection. */
  readonly showClear = input(false, { transform: booleanAttribute });
  /** Enable search/filter inside the dropdown. */
  readonly filter = input(false, { transform: booleanAttribute });
  /** Field(s) used for filtering when `filter` is true. */
  readonly filterBy = input<string>();
  /** Empty-state copy when filter returns no rows. */
  readonly emptyFilterMessage = input<string>('Sin resultados');
  /** Empty-state copy when `options` is empty. */
  readonly emptyMessage = input<string>('Sin opciones');
  /**
   * Label dentro del campo (IftaLabel — *In-Field Top Aligned*, Figma node
   * `7462:106725`). El `label` se fija arriba-dentro del campo y el valor baja.
   * Tokens: padding-top 21 / bottom 7, label 10.5px regular `#8f97a3` en
   * `(x 10.5, top 7)`. Úsalo en vez del label-encima cuando el diseño lo pida
   * (p.ej. selects de config Grupos).
   */
  readonly iftaLabel = input(false, { transform: booleanAttribute });
  /** Background "filled" variant (Figma node 6195:7785): bg slate-50. */
  readonly filled = input(false, { transform: booleanAttribute });
  /**
   * Target del overlay panel del dropdown. Útil cuando el `<sc-select>` vive
   * dentro de un `<sc-dialog>` con `overflow: hidden` — `appendTo="body"`
   * monta el panel en `<body>` y evita el clip. Default null = inline.
   */
  readonly appendTo = input<'body' | null>(null);
  /** Key del flag de opción deshabilitada (passthrough de p-select). */
  readonly optionDisabled = input<string>();
  /** Spinner de carga (passthrough de p-select). */
  readonly loading = input(false, { transform: booleanAttribute });

  // ─── Two-way value binding ─────────────────────────────────────────
  readonly value = model<unknown>(undefined);

  // ─── Outputs (paridad con sc-inputtext) ────────────────────────────
  readonly focused = output<FocusEvent>();
  readonly blurred = output<FocusEvent>();

  // ─── Content-projected pTemplate slots ─────────────────────────────
  /**
   * Captura los `<ng-template pTemplate="...">` que el consumer escribe
   * dentro de `<sc-select>` (sintaxis idéntica a `<p-select>` nativo).
   * El HTML del componente itera estos y los re-proyecta hacia el p-select
   * interno via `[pTemplate]` + `ngTemplateOutlet`, porque el ContentChildren
   * del p-select NO ve los templates a través de doble content projection
   * (limitación conocida de Angular query origin).
   *
   * Uso típico (consumer):
   * ```html
   * <sc-select [options]="agentTypes" [value]="form().type">
   *   <ng-template pTemplate="item" let-t>{{ keys[t] | translate }}</ng-template>
   *   <ng-template pTemplate="selectedItem" let-t>{{ keys[t] | translate }}</ng-template>
   * </sc-select>
   * ```
   */
  protected readonly projectedTemplates = contentChildren(PrimeTemplate);

  // ─── Derived ───────────────────────────────────────────────────────
  protected readonly resolvedId = computed(
    () => this.inputId() ?? `sc-select-${++scSelectIdCounter}`,
  );

  protected readonly isInvalid = computed(() => {
    if (this.error()) return true;
    const ctrl = this._ngControl?.control;
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  });

  protected readonly footerText = computed(() => this.error() || this.helperText() || '');

  /** Map our sm/md/lg to PrimeNG's small/large (md = no size attr). */
  protected readonly pSize = computed<'small' | 'large' | undefined>(() => {
    const s = this.size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });

  /** Clase propagada al overlay panel (`<body>`) para que los items
   *  hereden el size. Ver `packages/design-system/styles/_sc-overlay-sizes.scss`. */
  protected readonly panelStyleClass = computed(() => {
    const s = this.size();
    return s === 'sm' ? 'sc-select-panel--sm' : s === 'lg' ? 'sc-select-panel--lg' : '';
  });

  /** PrimeNG's `[options]` is typed `any[]` (mutable); cast our readonly array. */
  protected readonly optionsMutable = computed(() => this.options() as unknown[]);

  /**
   * `true` cuando `options` es un array de primitives (string/number/boolean).
   * En ese caso PrimeNG espera que NO se le pase `optionLabel`/`optionValue` —
   * si los pasamos con un string array, intenta resolver `.label` en cada
   * string y todas las opciones renderizan vacías (bug visible en grupos:
   * tipoVoz, prioridad, estrategia con string[] mostraban "empty empty…").
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
  private _onChange: (v: unknown) => void = () => {};
  private _onTouched: () => void = () => {};
  private readonly _injector = inject(Injector);
  private get _ngControl(): NgControl | null {
    try {
      return this._injector.get(NgControl, null, { self: true, optional: true });
    } catch {
      return null;
    }
  }

  writeValue(v: unknown): void {
    /* `untracked` aísla la escritura del signal de cualquier reactive
     * context (signal forms futuro, effect en consumer). Defensa Angular
     * docs para CVA + signals. */
    untracked(() => this.value.set(v));
  }
  registerOnChange(fn: (v: unknown) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(state: boolean): void {
    this.disabled.set(state);
  }

  protected onModelChange(v: unknown): void {
    this.value.set(v);
    this._onChange(v);
  }

  protected onFocus(event: Event): void {
    // p-select reenvía el FocusEvent nativo del DOM tipado como Event.
    this.focused.emit(event as FocusEvent);
  }

  protected onBlur(event: Event): void {
    this._onTouched();
    this.blurred.emit(event as FocusEvent);
  }
}
