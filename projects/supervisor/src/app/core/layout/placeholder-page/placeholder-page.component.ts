import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ThemeService } from '@core/services/theme.service';

/**
 * Generic "section under construction" page used for routes that exist in the
 * navigation tree but are not yet implemented (mirrors PlaceholderPage in the
 * React prototype).
 */
@Component({
  selector: 'sc-placeholder-page',
  imports: [TranslateModule],
  templateUrl: './placeholder-page.component.html',
  styleUrl: './placeholder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderPageComponent {
  private readonly theme = inject(ThemeService);

  /** La ilustración sigue al tema, como la del acceso: la clara en claro y la oscura en oscuro. */
  protected readonly artSrc = computed(() =>
    this.theme.effectiveMode() === 'dark'
      ? '/illustrations/under-construction-dark.webp'
      : '/illustrations/under-construction-light.webp',
  );
}
