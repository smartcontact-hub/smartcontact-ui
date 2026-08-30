import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  ViewEncapsulation,
} from '@angular/core';
// `FormsModule` sigue haciendo falta: la plantilla usa `[ngModel]` como puente
// INTERNO hacia `<p-multiselect>` (no es el CVA exterior, que se retiró).
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { ScFieldLabelComponent } from '../field/sc-field-label.component';
import { ScFieldMsgComponent } from '../field/sc-field-msg.component';
import {
  createScFieldState,
  createScOptionState,
  createScPanelSizing,
  type ScFieldSize,
} from '../field/sc-field';

/** @deprecated Usa `ScFieldSize`. Alias conservado por compatibilidad de imports. */
export type ScMultiSelectSize = ScFieldSize;
export type ScMultiSelectDisplay = 'chip' | 'comma';

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
  imports: [MultiSelectModule, FormsModule, ScFieldLabelComponent, ScFieldMsgComponent],
  templateUrl: './sc-multiselect.component.html',
  styleUrl: './sc-multiselect.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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
export class ScMultiSelectComponent {
  // ─── Chrome (mirrors sc-select) ─────────────────────────────────────
  readonly size = input<ScFieldSize>('md');
  readonly label = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly helperText = input<string>();
  readonly error = input<string>();
  readonly placeholder = input<string>('');
  readonly disabled = input(false, { transform: booleanAttribute });
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

  // ─── Estado del field-pattern (compartido) ─────────────────────────
  private readonly field = createScFieldState('sc-multiselect', {
    inputId: this.inputId,
    error: this.error,
    helperText: this.helperText,
  });
  protected readonly resolvedId = this.field.resolvedId;
  protected readonly msgId = this.field.msgId;
  protected readonly isInvalid = this.field.isInvalid;
  protected readonly footerText = this.field.footerText;

  private readonly panel = createScPanelSizing('sc-multiselect', this.size);
  protected readonly pSize = this.panel.pSize;
  protected readonly panelStyleClass = this.panel.panelStyleClass;

  private readonly optionState = createScOptionState({
    options: this.options,
    optionLabel: this.optionLabel,
    optionValue: this.optionValue,
  });
  protected readonly optionsMutable = this.optionState.optionsMutable;
  protected readonly hasPrimitiveOptions = this.optionState.hasPrimitiveOptions;
  protected readonly resolvedOptionLabel = this.optionState.resolvedOptionLabel;
  protected readonly resolvedOptionValue = this.optionState.resolvedOptionValue;

  protected onModelChange(v: unknown[]): void {
    this.value.set(v ?? []);
  }
}
