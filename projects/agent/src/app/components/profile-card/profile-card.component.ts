import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { PROFILE } from '../../data/seed';
import { AgThemeService } from '../../theme/ag-theme.service';

/** Tile KPI: perfil del agente — avatar letra, PIN / Extension / Type of ext. + toggle tema. */
@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [ScIconComponent],
  template: `
    <div class="agent-card profile">
      <div class="profile__avatar" aria-hidden="true">{{ profile.avatarLetter }}</div>
      <div class="profile__info">
        <div class="profile__name">{{ profile.name }}</div>
        <div class="profile__field"><span>PIN:</span> {{ profile.pin }}</div>
        <div class="profile__field"><span>Extension:</span> {{ profile.ext }}</div>
        <div class="profile__field">
          <span>Type of ext.:</span>
          <img class="profile__globe" src="icons/globe.svg" width="13" height="13" alt="" aria-hidden="true" />
        </div>
      </div>
      <button
        class="profile__theme"
        type="button"
        (click)="toggle()"
        [style.color]="dark() ? '#7db3ff' : '#f5a623'"
        aria-label="Toggle theme"
      >
        <sc-icon [name]="dark() ? 'dark_mode' : 'light_mode'" [size]="14" />
      </button>
    </div>
  `,
  styles: `
    .profile {
      position: relative;
      display: flex;
      align-items: center;
      gap: 14px;
      height: 100%;
      padding: 18px 16px;
    }
    /* Avatar: 84×84px, radio 9.26px, "R" a 26.4px (exacto). */
    .profile__avatar {
      flex: none;
      width: 84px;
      height: 84px;
      border-radius: 9.26px;
      background: var(--ag-red);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26.4px;
      font-weight: 400;
    }
    .profile__info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .profile__name {
      font-size: 15.2px;
      font-weight: 400;
      color: var(--ag-text);
      margin-bottom: 3px;
    }
    .profile__field {
      font-size: 11.7px;
      font-weight: 400;
      color: var(--ag-field);
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }
    .profile__theme {
      position: absolute;
      right: 14px;
      bottom: 14px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: none;
      background: var(--ag-elev);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileCardComponent {
  protected readonly profile = PROFILE;
  private readonly theme = inject(AgThemeService);
  protected readonly dark = this.theme.dark;

  protected toggle(): void {
    this.theme.toggle();
  }
}
