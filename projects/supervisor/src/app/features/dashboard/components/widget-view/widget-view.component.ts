import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import type { AgentPresence, DashboardWidget } from '../../data/dashboard.types';
import { widgetType, type DetailKind } from '../../data/widget-catalog';
import { AgentsTableWidgetComponent } from '../agents-table-widget/agents-table-widget.component';
import { GroupPanelWidgetComponent } from '../group-panel-widget/group-panel-widget.component';
import { KpiWidgetComponent } from '../kpi-widget/kpi-widget.component';
import { RankedListWidgetComponent } from '../ranked-list-widget/ranked-list-widget.component';

export interface DetailOpen {
  readonly kind: DetailKind;
  readonly presence: AgentPresence | null;
}

/**
 * El cuerpo de un widget según su forma. Lo usan el tablero y la vista previa del asistente, así
 * que lo que se ve al crear un widget es exactamente lo que queda puesto.
 */
@Component({
  selector: 'sc-dashboard-widget-view',
  imports: [AgentsTableWidgetComponent, GroupPanelWidgetComponent, KpiWidgetComponent, RankedListWidgetComponent],
  templateUrl: './widget-view.component.html',
  styleUrl: './widget-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetViewComponent {
  readonly widget = input.required<DashboardWidget>();
  /** En la vista previa las cifras no abren detalle. */
  readonly interactive = input(true);

  readonly openDetail = output<DetailOpen>();

  /** Detalle que abre la cifra principal, según el tipo; `null` si no abre ninguno. */
  protected readonly detail = computed(() => (this.interactive() ? (widgetType(this.widget().type).detail ?? null) : null));

  protected open(kind: DetailKind, presence: AgentPresence | null = null): void {
    this.openDetail.emit({ kind, presence });
  }
}
