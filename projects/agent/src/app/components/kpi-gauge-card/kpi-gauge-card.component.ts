import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScGaugeComponent, ScTagComponent, type ScGaugeSegment } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { KPIS } from '../../data/seed';

/** Tile KPI: anillo de conversaciones (sc-gauge) + No atendidas + TMR/TMC. */
@Component({
  selector: 'app-kpi-gauge-card',
  standalone: true,
  imports: [ScGaugeComponent, ScTagComponent, ScIconComponent],
  template: `
    <div class="agent-card gaugecard">
      <div class="gaugecard__ring">
        <span class="gaugecard__badge">
          <sc-tag [value]="'No atendidas · ' + kpis.missed" severity="danger" icon="phone_missed" [rounded]="true" />
        </span>
        <sc-gauge
          [segments]="segments"
          size="lg"
          [label]="kpis.total.toString()"
          sublabel="Conv. Totales"
          [ariaLabel]="ariaLabel"
        />
      </div>
      <div class="gaugecard__metrics">
        <div class="metric">
          <span class="metric__value">{{ kpis.tmr }}</span>
          <span class="agent-muted"><sc-icon name="schedule" [size]="13" /> TMR</span>
        </div>
        <div class="metric">
          <span class="metric__value">{{ kpis.tmc }}</span>
          <span class="agent-muted"><sc-icon name="schedule" [size]="13" /> TMC</span>
        </div>
      </div>
    </div>
  `,
  styles: `
    .gaugecard {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--sc-spacing-1-5);
      height: 100%;
    }
    .gaugecard__ring {
      position: relative;
      display: inline-flex;
    }
    .gaugecard__badge {
      position: absolute;
      top: calc(var(--sc-spacing-1) * -1);
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
      z-index: 1;
    }
    .gaugecard__metrics {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-1);
    }
    .metric {
      display: flex;
      flex-direction: column;
    }
    .metric__value {
      font-size: var(--sc-font-size-400);
      font-weight: 600;
      color: var(--sc-text-primary);
    }
    .agent-muted sc-icon {
      vertical-align: -2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiGaugeCardComponent {
  protected readonly kpis = KPIS;
  protected readonly segments: ScGaugeSegment[] = [
    { value: KPIS.attended, severity: 'success' },
    { value: KPIS.missed, severity: 'danger' },
  ];
  protected readonly ariaLabel = `${KPIS.total} conversaciones totales, ${KPIS.missed} no atendidas`;
}
