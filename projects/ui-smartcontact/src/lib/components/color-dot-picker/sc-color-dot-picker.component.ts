import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

import { ScSelectButtonComponent } from '../selectbutton/sc-selectbutton.component';

export interface ColorDotOption {
  /** Stable id stored in the data model. */
  readonly value: string;
  /** El nombre del color: lo que oye el lector en cada opción y lo que se lee bajo el elegido. */
  readonly label: string;
  /** CSS color (or `var(--…)`) painted as the dot. */
  readonly color: string;
}

/**
 * Inline row of selectable color dots — el picker categórico de 9 colores del
 * DS (Labels form). Two-way bindable via `[(value)]`. Los colores se pasan por
 * `ColorDotOption.color` (típicamente `var(--sc-label-<color>-dot)`), así que el
 * componente no acopla la paleta: el consumidor decide qué colores ofrecer.
 *
 * Por dentro es `sc-selectbutton` (DD-205, fase 1: primero el nativo): el teclado y los estados son los de PrimeNG, y
 * debajo se lee el nombre del color elegido.
 */
@Component({
  selector: 'sc-color-dot-picker',
  standalone: true,
  imports: [ScSelectButtonComponent],
  templateUrl: './sc-color-dot-picker.component.html',
  styleUrl: './sc-color-dot-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScColorDotPickerComponent {
  /**
   * Los colores entre los que elegir, cada uno con su nombre — el nombre es lo que se anuncia,
   * porque el color solo no se puede oír.
   */
  readonly options = input.required<readonly ColorDotOption[]>();
  /** El color elegido. Enlace de dos sentidos: `[(value)]`. */
  readonly value = model.required<string>();
  /** Rótulo accesible del radiogroup. Default 'Color' (idéntico es/en). */
  readonly ariaLabel = input<string>('Color');

  /** La opción elegida, para escribir su nombre debajo. */
  protected readonly elegido = computed(() => this.options().find((option) => option.value === this.value()));

  protected onValue(value: unknown): void {
    if (typeof value === 'string') this.value.set(value);
  }
}
