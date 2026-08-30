import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  type TemplateRef,
  input,
  model,
  output,
  ViewEncapsulation,
} from '@angular/core';
// `FormsModule` sigue haciendo falta: la plantilla usa `[ngModel]` como puente
// INTERNO hacia `<p-select>` (no es el CVA exterior, que se retiró).
import { FormsModule } from '@angular/forms';
import { ScFieldLabelComponent } from '../field/sc-field-label.component';
import { ScFieldMsgComponent } from '../field/sc-field-msg.component';
import { SelectModule } from 'primeng/select';
import {
  createScFieldState,
  createScOptionState,
  createScPanelSizing,
  type ScFieldSize,
} from '../field/sc-field';

/** @deprecated Usa `ScFieldSize`. Alias conservado por compatibilidad de imports. */
export type ScSelectSize = ScFieldSize;

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
  imports: [SelectModule, FormsModule, NgTemplateOutlet, ScFieldLabelComponent, ScFieldMsgComponent],
  templateUrl: './sc-select.component.html',
  styleUrl: './sc-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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
export class ScSelectComponent {
  // ─── Chrome (mirrors sc-inputtext) ─────────────────────────────────────
  readonly size = input<ScFieldSize>('md');
  readonly label = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly helperText = input<string>();
  readonly error = input<string>();
  readonly placeholder = input<string>('');
  readonly disabled = input(false, { transform: booleanAttribute });
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

  // ─── Slots proyectados por el consumer ─────────────────────────────
  /**
   * Captura los `<ng-template #item>` que el consumer escribe dentro de
   * `<sc-select>` (sintaxis idéntica a `<p-select>` nativo) y los re-emite en
   * el HTML hacia el p-select interno, porque su propia consulta NO ve los
   * templates a través de doble content projection (limitación de Angular
   * query origin) — el wrapper tiene que hacer de puente.
   *
   * ⚠️ **Esto se captura por NOMBRE DE REFERENCIA desde PrimeNG 22, y antes se
   * hacía con `contentChildren(PrimeTemplate)` + un `[pTemplate]` DINÁMICO.**
   * En v22 `p-select` dejó de tener el `ContentChildren(PrimeTemplate)` de
   * respaldo: resuelve cada slot con `contentChild('item')`, o sea por nombre
   * ESTÁTICO. Un nombre dinámico ya no lo encuentra nadie, así que el puente
   * viejo quedó mudo — renderizaba sin error y sin template.
   *
   * Por eso cada slot se declara explícito aquí y en el HTML: es el precio de
   * que el nombre tenga que ser estático. Añadir uno nuevo son dos líneas.
   *
   * Uso típico (consumer):
   * ```html
   * <sc-select [options]="agentTypes" [value]="form().type">
   *   <ng-template #item let-t>{{ keys[t] | translate }}</ng-template>
   *   <ng-template #selectedItem let-t>{{ keys[t] | translate }}</ng-template>
   * </sc-select>
   * ```
   */
  protected readonly itemTpl = contentChild<TemplateRef<unknown>>('item');

  protected readonly selectedItemTpl = contentChild<TemplateRef<unknown>>('selectedItem');

  protected readonly headerTpl = contentChild<TemplateRef<unknown>>('header');

  protected readonly footerTpl = contentChild<TemplateRef<unknown>>('footer');

  protected readonly emptyTpl = contentChild<TemplateRef<unknown>>('empty');

  protected readonly groupTpl = contentChild<TemplateRef<unknown>>('group');

  // ─── Estado del field-pattern (compartido) ─────────────────────────
  private readonly field = createScFieldState('sc-select', {
    inputId: this.inputId,
    error: this.error,
    helperText: this.helperText,
  });
  protected readonly resolvedId = this.field.resolvedId;
  protected readonly msgId = this.field.msgId;
  protected readonly isInvalid = this.field.isInvalid;
  protected readonly footerText = this.field.footerText;

  private readonly panel = createScPanelSizing('sc-select', this.size);
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

  protected onModelChange(v: unknown): void {
    this.value.set(v);
  }

  protected onFocus(event: Event): void {
    // p-select reenvía el FocusEvent nativo del DOM tipado como Event.
    this.focused.emit(event as FocusEvent);
  }

  protected onBlur(event: Event): void {
    this.blurred.emit(event as FocusEvent);
  }
}
