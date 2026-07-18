import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { PageHeaderService } from '@core/services';

/**
 * Seguridad page (`/config/seguridad`).
 *
 * Intentionally empty — the previous content (políticas de contraseñas
 * + bulk regeneration accordion) was consolidated into Sistema. This
 * page is the live demo of the new SettingsShell layout (Figma node
 * 224:9167) and the canvas where future security-only configuration
 * will land. See DD#44.
 */
@Component({
  selector: 'sc-seguridad-page',
  imports: [IconComponent, TranslateModule],
  templateUrl: './seguridad-page.component.html',
  styleUrl: './seguridad-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeguridadPageComponent {
  private readonly pageHeader = inject(PageHeaderService);

  constructor() {
    this.pageHeader.set({
      titleKey: 'config.seguridad.heading',
      subtitleKey: 'config.seguridad.subtitle_empty',
      entityKey: 'config.sidebar.title',
      icon: 'shield',
    });
  }

  protected readonly shieldIcon = 'shield';
}
