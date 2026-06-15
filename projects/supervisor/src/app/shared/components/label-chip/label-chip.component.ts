import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { IconComponent } from '../icon/icon.component';
import { SC_ICON_SIZE_SM } from '@shared/utils/icon-size';

import type { LabelColor } from './label-chip.types';

export interface LabelChipModel {
  readonly name: string;
  readonly color: LabelColor;
}

/**
 * Small categorical chip used to render a label inline (table cell, agent
 * row, picker selection…). Optionally renders a × button for removal flows.
 */
@Component({
  selector: 'sc-label-chip',
  imports: [IconComponent],
  templateUrl: './label-chip.component.html',
  styleUrl: './label-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelChipComponent {
  readonly label = input.required<LabelChipModel>();
  readonly size = input<'sm' | 'xs'>('sm');
  readonly removable = input(false);

  readonly remove = output<void>();

  protected readonly closeIcon = 'close';
  protected readonly iconSizeSm = SC_ICON_SIZE_SM;

  protected readonly cssVars = computed(() => {
    const color = this.label().color;
    return {
      '--chip-bg': `var(--sc-label-${color}-bg)`,
      '--chip-text': `var(--sc-label-${color}-text)`,
      '--chip-border': `var(--sc-label-${color}-border)`,
      '--chip-dot': `var(--sc-label-${color}-dot)`,
    } as Record<string, string>;
  });

  protected onRemove(event: MouseEvent): void {
    event.stopPropagation();
    this.remove.emit();
  }
}
