import { ChangeDetectionStrategy, Component } from '@angular/core';

import { GROUPS, GROUPS_TOTALS } from '../../data/seed';

/**
 * Vista Dashboard: 4 tarjetas KPI (Workload · Contacts · Session · Tickets
 * completed) + tabla Groups + panel Tickets.
 *
 * Medido del real: las KPI cards viven sobre el lienzo `#f4f6fc` en tarjetas
 * blancas de radio 12; la tabla Groups repite el chrome de la de Tickets.
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  protected readonly groups = GROUPS;
  protected readonly totals = GROUPS_TOTALS;

  protected readonly groupCols = [
    'Group name',
    'My assigned',
    'Total workload',
    'New',
    'Updated',
    'Pending',
    'Emails sent',
    'SMS sent',
    'Total actions',
  ];
}
