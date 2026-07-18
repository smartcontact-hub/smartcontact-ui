import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';


interface SettingsNavItem {
  readonly path: string;
  readonly labelKey: string;
  readonly hintKey: string;
  readonly icon: string;
}

/**
 * Inner navigation rail for the AED hub (`/config/aed/*`). Three
 * items mirror the Figma source (224:9167): Servicio (Estados y
 * conversaciones), Agentes (Parámetros por defecto), Grupos
 * (Parámetros por defecto). Stuck to the start of the scrollable
 * content area; the shell handles the sticky behaviour.
 *
 * `aria-current="page"` is applied via the active class so screen
 * readers announce "current page" — RouterLinkActive only sets the
 * class, not the aria attribute, so we mirror it manually below.
 */
@Component({
  selector: 'sc-settings-sidebar',
  imports: [IconComponent, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './settings-sidebar.component.html',
  styleUrl: './settings-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSidebarComponent {
  protected readonly items: readonly SettingsNavItem[] = [
    {
      path: '/config/aed/servicio',
      labelKey: 'config.sidebar.servicio_label',
      hintKey: 'config.sidebar.servicio_hint',
      icon: 'call',
    },
    {
      path: '/config/aed/agentes',
      labelKey: 'config.sidebar.agentes_label',
      hintKey: 'config.sidebar.agentes_hint',
      icon: 'person',
    },
    {
      path: '/config/aed/grupos',
      labelKey: 'config.sidebar.grupos_label',
      hintKey: 'config.sidebar.grupos_hint',
      icon: 'groups',
    },
  ];
}
