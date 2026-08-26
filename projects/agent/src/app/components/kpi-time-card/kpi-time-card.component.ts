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
      gap: 0.961539vw;
      height: 100%;
      padding: 0.892858vw 1.098902vw;
    }
    .time__value {
      font-size: 2.190935vw;
      font-weight: 400;
      line-height: 0.914;
      color: var(--ag-text);
      letter-spacing: 0.019918vw;
    }
    .time__label {
      font-size: 0.803572vw;
      margin-top: 0.48077vw;
    }
    .time__side {
      display: flex;
      flex-direction: column;
      gap: 0.412088vw;
      align-items: flex-start;
      min-width: 10.302198vw;
    }
    /* Connection: chip lighter #373b41, radio 9.1px, padding 6/9px (exacto). */
    .time__conn {
      display: inline-flex;
      align-items: center;
      gap: 0.48077vw;
      background: var(--ag-elev);
      border-radius: 0.625vw;
      padding: 0.412088vw 0.618132vw;
      font-size: 0.803572vw;
      color: var(--ag-text);
      white-space: nowrap;
      /* "Degradado" real: sombra interior inferior. */
      box-shadow: inset 0 -0.521979vw 0.521979vw 0 #2a2f34;
    }
    /* Disconnection: texto muted #41454c, sin chip. */
    .time__disc {
      display: inline-flex;
      align-items: center;
      gap: 0.48077vw;
      padding: 0 0.618132vw;
      font-size: 0.803572vw;
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
