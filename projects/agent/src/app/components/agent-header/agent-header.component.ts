import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AgIconComponent } from '../ui/app-icon.component';

/** Barra superior real: marca SmartContact·Agent + botones ayuda / logout. */
@Component({
  selector: 'app-agent-header',
  standalone: true,
  imports: [AgIconComponent],
  template: `
    <header class="hdr">
      <div class="hdr__brand">
        <img class="hdr__logo" src="icons/logo.svg" alt="SmartContact Agent" />
      </div>
      <div class="hdr__actions">
        <button class="hdr__btn" type="button" aria-label="Help">
          <app-icon name="help" [size]="15" />
        </button>
        <button
          class="hdr__btn hdr__btn--power"
          type="button"
          aria-label="Log out"
        >
          <app-icon name="power" [size]="14" />
        </button>
      </div>
    </header>
  `,
  styles: `
    .hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px 37px;
    }
    .hdr__brand {
      display: flex;
      align-items: center;
    }
    /* Logo oficial: 239 x 42 en el fichero, servido a escala (ratio 5.69:1). */
    .hdr__logo {
      display: block;
      width: 193px;
      height: 34px;
    }
    .hdr__actions {
      display: inline-flex;
      gap: 9px;
    }
    .hdr__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 26px;
      border: 1px solid var(--ag-btn-line);
      border-radius: 6px;
      background: transparent;
      color: var(--ag-btn-ic);
      cursor: pointer;
    }
    .hdr__btn--power {
      color: #fff;
      background: var(--ag-red);
      border-color: var(--ag-red);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentHeaderComponent {}
