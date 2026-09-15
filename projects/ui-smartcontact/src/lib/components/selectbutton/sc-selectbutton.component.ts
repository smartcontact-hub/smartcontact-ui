import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  model,
  type TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
// `FormsModule` es el puente INTERNO hacia `<p-selectbutton>` (como en `sc-select`).
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { createScOptionState, type ScFieldSize } from '../field/sc-field';

/**
 * Botones segmentados: elegir UNA opción (o varias, con `multiple`) de un grupo corto
 * que se ve entero. Wrapper Extended sobre `<p-selectbutton>` de primeng.dev: el carril,
 * la opción elegida, el teclado (Tab y Espacio) y `role="group"` con `aria-pressed` los
 * pone PrimeNG, y el aspecto, el tema (`togglebutton.*`, `selectbutton.*`).
 *
 * **Cuándo sí y cuándo no** (DD-112): filtrar la MISMA lista o elegir un valor
 * («Todas · Sin transcribir · Fallidas», Claro · Oscuro · Sistema). Para cambiar de
 * COLECCIÓN, cuando se vacían búsqueda y selección, van pestañas (`p-tabs`).
 *
 * Qué añade el wrapper, y por qué:
 *   - **El nombre del grupo llega.** `p-selectbutton` escribe `aria-labelledby` desde su
 *     propia entrada; un `[attr.aria-labelledby]` puesto encima se pisa y el grupo queda
 *     sin nombre (medido en Conversaciones el 2026-09-15). Aquí `ariaLabelledBy` va por la
 *     entrada, y `ariaLabel` cubre el grupo sin rótulo visible.
 *   - **`size` como el resto de campos del DS** (`sm`/`md`/`lg`), traducido a la `size`
 *     de PrimeNG.
 *   - **La plantilla `#item` se reenvía.** La consulta de `p-selectbutton` no ve una
 *     plantilla que atraviesa dos proyecciones (lo mismo que `sc-select`).
 *
 * ⚠️ El texto de cada opción (`optionLabel`) es también su nombre accesible y la clave
 * con la que PrimeNG sigue la lista (`track`): tiene que venir TRADUCIDO y ser único,
 * aunque la opción se pinte solo con un icono en `#item`.
 *
 * Uso:
 * ```html
 * <sc-selectbutton [options]="vistas" [(value)]="vista" [allowEmpty]="false" ariaLabelledBy="vistas-label" />
 * <sc-selectbutton [options]="temas" [(value)]="tema" [allowEmpty]="false" ariaLabel="Tema">
 *   <ng-template #item let-o><sc-icon [name]="o.icon" size="inherit" /><span>{{ o.label }}</span></ng-template>
 * </sc-selectbutton>
 * ```
 *
 * Figma: `❖ SelectButton` (node 6738:46433) del Smart Contact Prime kit.
 */
@Component({
  selector: 'sc-selectbutton',
  standalone: true,
  imports: [SelectButtonModule, FormsModule, NgTemplateOutlet],
  templateUrl: './sc-selectbutton.component.html',
  styleUrl: './sc-selectbutton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'sc-selectbutton',
    '[class.sc-selectbutton--fluid]': 'fluid()',
  },
})
export class ScSelectButtonComponent {
  /** Opciones: `string[]` o una lista de objetos (`{ label, value }` por defecto). */
  readonly options = input<readonly unknown[]>([]);
  /** Clave del texto visible, que es también el nombre accesible de la opción. */
  readonly optionLabel = input<string>('label');
  /** Clave del valor. Sin ella se enlaza el objeto entero. */
  readonly optionValue = input<string>();
  /** Clave del indicador de opción deshabilitada. */
  readonly optionDisabled = input<string>();
  /** Varias opciones a la vez: el valor pasa a ser una lista. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /**
   * Si pulsar la opción elegida la deselecciona. Por defecto `true`, como PrimeNG; una
   * elección obligatoria (un tema, una vista) lo quiere en `false`.
   */
  readonly allowEmpty = input(true, { transform: booleanAttribute });
  readonly size = input<ScFieldSize>('md');
  /** Ocupa todo el ancho y reparte las opciones a partes iguales. */
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  /** `id` del rótulo visible que nombra el grupo. */
  readonly ariaLabelledBy = input<string>();
  /** Nombre del grupo cuando no hay rótulo visible. */
  readonly ariaLabel = input<string>();

  readonly value = model<unknown>(undefined);

  /** `<ng-template #item let-option let-i="index">` escrito dentro de `<sc-selectbutton>`. */
  protected readonly itemTpl = contentChild<TemplateRef<unknown>>('item');

  private readonly optionState = createScOptionState({
    options: this.options,
    optionLabel: this.optionLabel,
    optionValue: this.optionValue,
  });
  protected readonly optionsMutable = this.optionState.optionsMutable;
  protected readonly resolvedOptionLabel = this.optionState.resolvedOptionLabel;
  protected readonly resolvedOptionValue = this.optionState.resolvedOptionValue;

  protected readonly pSize = computed<'small' | 'large' | undefined>(() => {
    const s = this.size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });
}
