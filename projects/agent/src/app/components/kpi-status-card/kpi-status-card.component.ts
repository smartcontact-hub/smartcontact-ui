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
      padding: 13px 18px;
    }
    .status__dot {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: var(--ag-green);
    }
    .status__value {
      font-size: 31.9px;
      font-weight: 400;
      line-height: 0.914;
      color: var(--ag-text);
      letter-spacing: 0.29px;
    }
    .status__label {
      font-size: 11.7px;
      margin-top: 7px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiStatusCardComponent {
  protected readonly status = inject(AgTimersService).status;
}
