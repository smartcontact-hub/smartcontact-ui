import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ScChipComponent as ChipComponent } from '@smartcontact-hub/components';

import type { LabelColor } from './label-chip.types';

export interface LabelChipModel {
  readonly name: string;
  readonly color: LabelColor;
}

/**
 * Chip categórico de una label (celda de tabla, fila de agente, selección de
 * un picker…). Es una fachada fina sobre `sc-chip variant="label"` del DS: el
 * modelo de la app (`{ name, color }`) entra por un solo input y el DS pinta
 * punto, fondo, texto y el botón de quitar con sus tokens. Antes duplicaba
 * ese chip a mano (y con un tamaño `xs` propio que el DS no modela).
 */
@Component({
  selector: 'sc-label-chip',
  imports: [ChipComponent],
  templateUrl: './label-chip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelChipComponent {
  readonly label = input.required<LabelChipModel>();
  /** Se acepta por compatibilidad con los consumidores; el DS tiene un solo tamaño. */
  readonly size = input<'sm' | 'xs'>('sm');
  readonly removable = input(false);

  readonly remove = output<void>();
}
