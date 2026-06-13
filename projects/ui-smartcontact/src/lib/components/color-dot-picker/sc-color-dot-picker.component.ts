import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface ColorDotOption {
  /** Stable id stored in the data model. */
  readonly value: string;
  /** Label used for tooltip + a11y. */
  readonly label: string;
  /** CSS color (or `var(--…)`) painted as the dot. */
  readonly color: string;
}

/**
 * Inline row of selectable color dots — el picker categórico de 8 colores del
 * DS (Labels form). Two-way bindable via `[(value)]`. Los colores se pasan por
 * `ColorDotOption.color` (típicamente `var(--sc-label-<color>-dot)`), así que el
 * componente no acopla la paleta: el consumidor decide qué colores ofrecer.
 */
@Component({
  selector: 'sc-color-dot-picker',
  standalone: true,
  templateUrl: './sc-color-dot-picker.component.html',
  styleUrl: './sc-color-dot-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScColorDotPickerComponent {
  readonly options = input.required<readonly ColorDotOption[]>();
  readonly value = model.required<string>();
  /** Rótulo accesible del radiogroup. Default 'Color' (idéntico es/en). */
  readonly ariaLabel = input<string>('Color');

  protected select(option: ColorDotOption): void {
    this.value.set(option.value);
  }
}
