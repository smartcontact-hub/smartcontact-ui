import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AgIconComponent } from '../ui/app-icon.component';

import { GRUPOS } from '../../data/seed';

/** Tile KPI: Assigned groups — search + filas con nombre + pill de canal (tel/chat/mail). */
@Component({
  selector: 'app-grupos-card',
  standalone: true,
  imports: [AgIconComponent],
  template: `
    <div class="agent-card grupos">
      <div class="grupos__head">
        <span class="grupos__title">Assigned groups</span>
        <label class="grupos__search">
          <app-icon name="search" [size]="12" />
          <input
            type="text"
            placeholder="Search..."
            aria-label="Search groups"
          />
        </label>
      </div>
      <ul class="grupos__list" role="list">
        @for (g of grupos; track $index) {
        <li class="grupos__row">
          <span class="grupos__name">{{ g.name }}</span>
          <span class="grupos__ch" aria-hidden="true">
            <app-icon name="phone" [size]="12" />
            <app-icon name="chat" [size]="13" />
            <app-icon name="mail" [size]="12" />
          </span>
        </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .grupos {
      display: flex;
      flex-direction: column;
      gap: 0.549451vw;
      height: 100%;
      padding: 0.824176vw 0.961539vw;
    }
    .grupos__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.686814vw;
    }
    .grupos__title {
      font-size: 0.803572vw;
      font-weight: 400;
      color: var(--ag-text);
      white-space: nowrap;
    }
    .grupos__search {
      display: inline-flex;
      align-items: center;
      gap: 0.412088vw;
      background: var(--ag-elev);
      border-radius: 0.48077vw;
      padding: 0.274726vw 0.549451vw;
      color: var(--ag-muted);
      max-width: 10.302198vw;
    }
    .grupos__search input {
      background: transparent;
      border: none;
      outline: none;
      color: var(--ag-text);
      font: inherit;
      font-size: 0.803572vw;
      width: 100%;
      min-width: 0;
    }
    .grupos__list {
      display: flex;
      flex-direction: column;
      gap: 0.412088vw;
      margin: 0;
      padding: 0;
      overflow: auto;
    }
    .grupos__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.549451vw;
      font-size: 0.803572vw;
      color: var(--ag-row);
    }
    .grupos__name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* Pill de canal: negro (#000), radio 6px, 3 iconos dentro (exacto). */
    .grupos__ch {
      display: inline-flex;
      align-items: center;
      gap: 0.412088vw;
      flex: none;
      background: var(--ag-ch-off);
      color: var(--ag-ch-on-ic);
      border-radius: 0.412088vw;
      padding: 0.137363vw 0.343407vw;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GruposCardComponent {
  protected readonly grupos = GRUPOS;
}
