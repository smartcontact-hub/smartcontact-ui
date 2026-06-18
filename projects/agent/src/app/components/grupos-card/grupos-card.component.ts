import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScSearchComponent, ScToggleSwitchComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { GRUPOS } from '../../data/seed';

/** Tile KPI: Grupos Asignados — search + filas con toggle e iconos de canal. */
@Component({
  selector: 'app-grupos-card',
  standalone: true,
  imports: [ScSearchComponent, ScToggleSwitchComponent, ScIconComponent],
  template: `
    <div class="agent-card grupos">
      <div class="grupos__head">
        <span class="grupos__title">Grupos Asignados</span>
        <sc-search placeholder="Buscar..." size="sm" />
      </div>
      <ul class="grupos__list" role="list">
        @for (g of grupos; track $index) {
          <li class="grupos__row">
            <sc-toggleswitch [checked]="g.on" size="sm" [ariaLabel]="g.name" />
            <span class="grupos__name">{{ g.name }}</span>
            <span class="grupos__icons">
              <sc-icon name="call" [size]="15" />
              <sc-icon name="chat_bubble" [size]="15" />
              <sc-icon name="check_box" [size]="15" />
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
      gap: var(--sc-spacing-0-75);
      height: 100%;
    }
    .grupos__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--sc-spacing-0-75);
    }
    .grupos__title {
      font-size: var(--sc-font-size-200);
      font-weight: 600;
      color: var(--sc-text-primary);
      white-space: nowrap;
    }
    .grupos__list {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-25);
    }
    .grupos__row {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-0-75);
      font-size: var(--sc-font-size-100);
      color: var(--sc-text-primary);
    }
    .grupos__name {
      flex: 1;
    }
    .grupos__icons {
      display: inline-flex;
      gap: var(--sc-spacing-0-5);
      color: var(--sc-text-secondary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GruposCardComponent {
  protected readonly grupos = GRUPOS;
}
