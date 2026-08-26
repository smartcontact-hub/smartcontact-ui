import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AgTimersService } from '../../ag-timers.service';

/** Tile KPI: Current status time + punto de estado verde. */
@Component({
  selector: 'app-kpi-status-card',
  standalone: true,
  imports: [],
  template: `
    <div class="agent-card status">
      <span class="status__dot" aria-hidden="true"></span>
      <div class="status__value">{{ status() }}</div>
      <div class="agent-muted status__label">Current status time</div>
    </div>
  `,
  styles: `
    .status {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
      padding: 0.892858vw 1.236264vw;
    }
    .status__dot {
      position: absolute;
      top: 1.098902vw;
      right: 1.098902vw;
      width: 0.755495vw;
      height: 0.755495vw;
      border-radius: 50%;
      background: var(--ag-green);
    }
    .status__value {
      font-size: 2.190935vw;
      font-weight: 400;
      line-height: 0.914;
      color: var(--ag-text);
      letter-spacing: 0.019918vw;
    }
    .status__label {
      font-size: 0.803572vw;
      margin-top: 0.48077vw;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiStatusCardComponent {
  protected readonly status = inject(AgTimersService).status;
}
