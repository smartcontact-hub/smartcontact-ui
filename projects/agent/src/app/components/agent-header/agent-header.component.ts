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
      padding: 1.03022vw 2.541209vw;
    }
    .hdr__brand {
      display: flex;
      align-items: center;
    }
    /* Logo oficial: 239 x 42 en el fichero, servido a escala (ratio 5.69:1). */
    .hdr__logo {
      display: block;
      width: 13.255495vw;
      height: 2.335165vw;
    }
    .hdr__actions {
      display: inline-flex;
      gap: 0.618132vw;
    }
    .hdr__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.06044vw;
      height: 1.785715vw;
      border: 1px solid var(--ag-btn-line);
      border-radius: 0.412088vw;
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
