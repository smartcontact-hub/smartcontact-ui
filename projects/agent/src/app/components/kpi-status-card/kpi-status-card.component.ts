import { ChangeDetectionStrategy, Component } from '@angular/core';

import { KPIS } from '../../data/seed';

/** Tile KPI: tiempo en el estado actual + punto de estado verde. */
@Component({
  selector: 'app-kpi-status-card',
  standalone: true,
  imports: [],
  template: `
    <div class="agent-card status">
      <span class="status__dot" aria-hidden="true"></span>
      <div class="status__value">{{ kpis.statusTime }}</div>
      <div class="agent-muted">Tiempo estado actual</div>
    </div>
  `,
  styles: `
    .status {
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
      position: relative;
    }
    .status__dot {
      position: absolute;
      top: 0;
      right: 0;
      width: 12px;
      height: 12px;
      border-radius: var(--sc-radius-full);
      background: var(--sc-icon-success);
    }
    .status__value {
      font-size: var(--sc-font-size-600);
      font-weight: 700;
      line-height: 1.1;
      color: var(--sc-text-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiStatusCardComponent {
  protected readonly kpis = KPIS;
}
