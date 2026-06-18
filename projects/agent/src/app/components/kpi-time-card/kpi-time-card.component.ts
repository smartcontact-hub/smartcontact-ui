import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScTagComponent } from '@smartcontact-hub/components';

import { KPIS } from '../../data/seed';

/** Tile KPI: tiempo de trabajo activo + pills Conexión / Desconexión. */
@Component({
  selector: 'app-kpi-time-card',
  standalone: true,
  imports: [ScTagComponent],
  template: `
    <div class="agent-card time">
      <div class="time__main">
        <div class="time__value">{{ kpis.activeTime }}</div>
        <div class="agent-muted">Tiempo trabajo activo</div>
      </div>
      <div class="time__pills">
        <sc-tag [value]="'Conexión: ' + kpis.connectedAt" severity="success" icon="schedule" [rounded]="true" />
        <sc-tag value="Desconexión" severity="secondary" icon="schedule" [rounded]="true" />
      </div>
    </div>
  `,
  styles: `
    .time {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--sc-spacing-1);
      height: 100%;
    }
    .time__value {
      font-size: var(--sc-font-size-600);
      font-weight: 700;
      line-height: 1.1;
      color: var(--sc-text-primary);
    }
    .time__pills {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-5);
      align-items: flex-end;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiTimeCardComponent {
  protected readonly kpis = KPIS;
}
