import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MeterGroupModule } from 'primeng/metergroup';

import type { RankedItem } from '../../data/dashboard.types';
import { AnimateOnChangeDirective } from '../animate-on-change.directive';

/**
 * Lista con totales (intenciones, tipificaciones), de más a menos. La barra (`p-metergroup`) es la
 * proporción sobre la primera, para comparar de un vistazo; la cifra va escrita siempre.
 */
@Component({
  selector: 'sc-dashboard-ranked-list',
  imports: [TranslateModule, MeterGroupModule, AnimateOnChangeDirective],
  templateUrl: './ranked-list-widget.component.html',
  styleUrl: './ranked-list-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankedListWidgetComponent {
  readonly items = input.required<readonly RankedItem[]>();
  readonly emptyKey = input('dashboard.ranked_list.empty');

  protected readonly rows = computed(() => {
    const sorted = [...this.items()].sort((a, b) => b.total - a.total);
    const max = sorted[0]?.total || 1;
    return sorted.map((item) => ({
      ...item,
      meter: [{ label: item.label, value: Math.round((item.total / max) * 100), color: 'var(--sc-border-accent)' }],
    }));
  });
}
