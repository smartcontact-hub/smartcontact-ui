import { ChangeDetectionStrategy, Component } from '@angular/core';

import { KPIS } from '../../data/seed';
import { AgIconComponent } from '../ui/app-icon.component';

/** Tile KPI: anillo de conversaciones (estado vacío) + métricas ART / ACT. */
@Component({
  selector: 'app-kpi-gauge-card',
  standalone: true,
  imports: [AgIconComponent],
  template: `
    <div class="agent-card gauge">
      <div class="gauge__ring">
        <svg viewBox="0 0 120 120" width="84" height="84" aria-hidden="true">
          <circle
            class="gauge__track"
            cx="60"
            cy="60"
            r="53"
            fill="none"
            stroke-width="5"
          />
        </svg>
        <div class="gauge__center">
          <div class="gauge__num">{{ kpis.total }}</div>
          <div class="gauge__sub">Total Conv.</div>
        </div>
      </div>
      <div class="gauge__metrics">
        <div class="metric">
          <span class="metric__val">{{ kpis.art }}</span>
          <span class="metric__label"
            ><app-icon name="clock" [size]="10" /> ART</span
          >
        </div>
        <div class="metric">
          <span class="metric__val">{{ kpis.act }}</span>
          <span class="metric__label"
            ><app-icon name="clock" [size]="10" /> ACT</span
          >
        </div>
      </div>
    </div>
  `,
  styles: `
    .gauge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.51099vw;
      height: 100%;
      padding: 0.824176vw 1.098902vw;
    }
    .gauge__ring {
      position: relative;
      display: inline-flex;
      flex: none;
    }
    .gauge__track {
      stroke: var(--ag-ring);
    }
    .gauge__center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.137363vw;
    }
    .gauge__num {
      font-size: 1.462913vw;
      font-weight: 400;
      color: var(--ag-text);
      line-height: 1;
    }
    .gauge__sub {
      font-size: 0.625vw;
      color: var(--ag-dim);
    }
    .gauge__metrics {
      display: flex;
      flex-direction: column;
      gap: 0.892858vw;
    }
    .metric {
      display: flex;
      flex-direction: column;
      gap: 0.137363vw;
    }
    .metric__val {
      font-size: 0.803572vw;
      font-weight: 400;
      color: var(--ag-text);
      line-height: 1;
    }
    .metric__label {
      display: inline-flex;
      align-items: center;
      gap: 0.274726vw;
      font-size: 0.625vw;
      color: var(--ag-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiGaugeCardComponent {
  protected readonly kpis = KPIS;
}
