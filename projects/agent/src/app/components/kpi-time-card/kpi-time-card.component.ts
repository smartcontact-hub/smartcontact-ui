import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AgTimersService } from '../../ag-timers.service';
import { KPIS } from '../../data/seed';
import { AgIconComponent } from '../ui/app-icon.component';

/** Tile KPI: Active work time + chip Connection (resaltado) / Disconnection (muted). */
@Component({
  selector: 'app-kpi-time-card',
  standalone: true,
  imports: [AgIconComponent],
  template: `
    <div class="agent-card time">
      <div class="time__main">
        <div class="time__value">{{ active() }}</div>
        <div class="agent-muted time__label">Active work time</div>
      </div>
      <div class="time__side">
        <div class="time__conn">
          <app-icon name="clock" [size]="12" />
          <span>Connection: {{ kpis.connectedAt }}</span>
        </div>
        <div class="time__disc">
          <app-icon name="clock" [size]="12" />
          <span>Disconnection: {{ kpis.disconnectedAt }}</span>
        </div>
      </div>
    </div>
  `,
  styles: `
    .time {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      height: 100%;
      padding: 13px 16px;
    }
    .time__value {
      font-size: 31.9px;
      font-weight: 400;
      line-height: 0.914;
      color: var(--ag-text);
      letter-spacing: 0.29px;
    }
    .time__label {
      font-size: 11.7px;
      margin-top: 7px;
    }
    .time__side {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: flex-start;
      min-width: 150px;
    }
    /* Connection: chip lighter #373b41, radio 9.1px, padding 6/9px (exacto). */
    .time__conn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: var(--ag-elev);
      border-radius: 9.1px;
      padding: 6px 9px;
      font-size: 11.7px;
      color: var(--ag-text);
      white-space: nowrap;
      /* "Degradado" real: sombra interior inferior. */
      box-shadow: inset 0 -7.6px 7.6px 0 #2a2f34;
    }
    /* Disconnection: texto muted #41454c, sin chip. */
    .time__disc {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 0 9px;
      font-size: 11.7px;
      color: var(--ag-disc);
      white-space: nowrap;
    }
    .time__conn app-icon,
    .time__disc app-icon {
      opacity: 0.85;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiTimeCardComponent {
  protected readonly kpis = KPIS;
  protected readonly active = inject(AgTimersService).active;
}
