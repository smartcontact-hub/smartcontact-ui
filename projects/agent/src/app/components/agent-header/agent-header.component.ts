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
        <span class="hdr__mark" aria-hidden="true">
          <svg width="26" height="18" viewBox="0 0 26 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="4" cy="4" r="3.4" fill="#8b95a1" />
            <circle cx="13" cy="4" r="3.4" fill="#c2cad3" />
            <circle cx="4" cy="14" r="3.4" fill="#c2cad3" />
            <circle cx="13" cy="14" r="3.4" fill="#8b95a1" />
            <circle cx="22" cy="9" r="3.4" fill="#dde2e8" />
          </svg>
        </span>
        <span class="hdr__name"><strong>Smart</strong>Contact<span class="hdr__sub">Agent</span></span>
      </div>
      <div class="hdr__actions">
        <button class="hdr__btn" type="button" aria-label="Help"><app-icon name="help" [size]="15" /></button>
        <button class="hdr__btn hdr__btn--power" type="button" aria-label="Log out">
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
      gap: 10px;
    }
    .hdr__mark {
      display: inline-flex;
    }
    .hdr__name {
      font-size: 20px;
      font-weight: 400;
      color: var(--ag-brand);
      letter-spacing: 0.2px;
    }
    .hdr__name strong {
      font-weight: 700;
    }
    .hdr__sub {
      font-style: italic;
      font-size: 12.5px;
      color: var(--ag-muted);
      margin-left: 4px;
      vertical-align: 2px;
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
