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
      <div class="profile__avatar" aria-hidden="true">
        {{ profile.avatarLetter }}
      </div>
      <div class="profile__info">
        <div class="profile__name">{{ profile.name }}</div>
        <div class="profile__field"><span>PIN:</span> {{ profile.pin }}</div>
        <div class="profile__field">
          <span>Extension:</span> {{ profile.ext }}
        </div>
        <div class="profile__field">
          <span>Type of ext.:</span>
          <img
            class="profile__globe"
            src="icons/globe.svg"
            width="13"
            height="13"
            alt=""
            aria-hidden="true"
          />
        </div>
      </div>
      <!--
        Toggle de tema en su estado ACTIVO, tal como lo pinta el original (tokens
        --modeWidgetsProfileModeActive/…Icon del bundle, chunk-RBZTQGX6):
          · dark  -> círculo #2450d9 (azul) con la luna en blanco,
          · light -> círculo #f6c85d (ámbar) con el sol en #654803.
        Antes iba en gris apagado (--ag-elev) con la luna azulada, que no era ninguno
        de los dos estados reales.
      -->
      <button
        class="profile__theme"
        type="button"
        (click)="toggle()"
        [style.background]="dark() ? '#2450d9' : '#f6c85d'"
        [style.color]="dark() ? '#ffffff' : '#654803'"
        aria-label="Toggle theme"
      >
        <sc-icon [name]="dark() ? 'dark_mode' : 'light_mode'" [size]="12" />
      </button>
    </div>
  `,
  styles: `
    .profile {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.961539vw;
      height: 100%;
      padding: 1.236264vw 1.098902vw;
    }
    /* Avatar: 84×84px, radio 9.26px, "R" a 26.4px (exacto). */
    .profile__avatar {
      flex: none;
      width: 5.769231vw;
      height: 5.769231vw;
      border-radius: 0.63599vw;
      background: var(--ag-red);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.813187vw;
      font-weight: 400;
    }
    .profile__info {
      display: flex;
      flex-direction: column;
      gap: 0.137363vw;
    }
    .profile__name {
      font-size: 1.043957vw;
      font-weight: 400;
      color: var(--ag-text);
      margin-bottom: 0.206044vw;
    }
    .profile__field {
      font-size: 0.803572vw;
      font-weight: 400;
      color: var(--ag-field);
      display: flex;
      align-items: center;
      gap: 0.274726vw;
      white-space: nowrap;
    }
    /*
     * Los atributos width/height del <img> NO son CSS: se quedan en px y ningun
     * codemod de hojas de estilo los alcanza. Se dejan como fallback y manda la CSS.
     */
    .profile__globe {
      /* 13px a 1456 */
      width: 0.892858vw;
      height: 0.892858vw;
    }
    /* Círculo de 22px y a 13px de cada borde en el original (medido: 1.356vw · 0.8015vw). */
    .profile__theme {
      position: absolute;
      right: 0.8015vw;
      bottom: 0.8015vw;
      width: 1.356vw;
      height: 1.356vw;
      border-radius: 50%;
      border: none;
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
