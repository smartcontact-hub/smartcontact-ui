import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScAvatarComponent, ScBadgeComponent, ScButtonComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { PROFILE } from '../../data/seed';

/** Barra de footer: chips de llamada en curso, contador y estado "Conversando". */
@Component({
  selector: 'app-agent-footer',
  standalone: true,
  imports: [ScAvatarComponent, ScBadgeComponent, ScButtonComponent, ScIconComponent],
  template: `
    <footer class="footer">
      <div class="footer__left">
        <div class="chip">
          <sc-icon name="call_received" [size]="14" />
          <span class="chip__num">689921212</span>
          <span class="agent-muted">00:03</span>
        </div>
        <div class="chip chip--active">
          <sc-icon name="call_received" [size]="14" />
          <span class="chip__num">Marisa</span>
          <sc-badge label="5" variant="danger" size="sm" />
          <span class="agent-muted">00:03</span>
        </div>
      </div>
      <div class="footer__right">
        <span class="footer__counter"><sc-icon name="schedule" [size]="14" /> 0</span>
        <sc-button label="Conversando" variant="success" size="sm" icon="lock" iconPosition="right" />
        <sc-avatar [image]="profile.photo" size="normal" ariaLabel="Agente" />
      </div>
    </footer>
  `,
  styles: `
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--sc-spacing-1);
      padding: var(--sc-spacing-0-5) var(--sc-spacing-1-5);
      border-top: 1px solid var(--sc-border-subtle);
      background: var(--sc-bg-elevated);
    }
    .footer__left,
    .footer__right {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-1);
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: var(--sc-spacing-0-5);
      padding: var(--sc-spacing-0-25) var(--sc-spacing-0-75);
      border-radius: var(--sc-radius-full);
      background: var(--sc-bg-subtle);
      font-size: var(--sc-font-size-100);
      color: var(--sc-text-primary);
    }
    .chip--active {
      background: var(--sc-bg-primary-subtle);
    }
    .chip__num {
      font-weight: 600;
    }
    .footer__counter {
      display: inline-flex;
      align-items: center;
      gap: var(--sc-spacing-0-25);
      color: var(--sc-text-secondary);
      font-size: var(--sc-font-size-100);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentFooterComponent {
  protected readonly profile = PROFILE;
}
