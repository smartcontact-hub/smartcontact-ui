import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScAvatarComponent, ScButtonComponent } from '@smartcontact-hub/components';

import { PROFILE } from '../../data/seed';

/** Tile KPI: perfil del agente — foto, datos y acciones (historial / desconectar). */
@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [ScAvatarComponent, ScButtonComponent],
  template: `
    <div class="agent-card profile">
      <sc-avatar [image]="profile.photo" size="xlarge" shape="square" ariaLabel="Foto del agente" />
      <div class="profile__info">
        <div class="profile__name">{{ profile.name }}</div>
        <div class="agent-muted">PIN: {{ profile.pin }}</div>
        <div class="agent-muted">Extensión: {{ profile.ext }}</div>
        <div class="profile__actions">
          <sc-button icon="history" appearance="outlined" size="sm" [rounded]="true" iconAriaLabel="Historial" />
          <sc-button icon="power_settings_new" variant="danger" size="sm" [rounded]="true" iconAriaLabel="Desconectar" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .profile {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-1);
      height: 100%;
    }
    .profile__info {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-25);
    }
    .profile__name {
      font-size: var(--sc-font-size-300);
      font-weight: 600;
      color: var(--sc-text-primary);
    }
    .profile__actions {
      display: flex;
      gap: var(--sc-spacing-0-5);
      margin-top: var(--sc-spacing-0-5);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileCardComponent {
  protected readonly profile = PROFILE;
}
