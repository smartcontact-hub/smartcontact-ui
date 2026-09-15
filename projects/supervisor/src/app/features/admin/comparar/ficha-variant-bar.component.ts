import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScButtonComponent } from '@smartcontact-hub/components';

import { FICHA_VARIANTS, FichaVariantService } from './ficha-variant.service';

/**
 * RAMA DE COMPARACIÓN (`comparar/fichas`). La barra flotante con la que se cambia de variante
 * dentro de una ficha, sin tocar la URL. Solo sale mientras se compara (ver el servicio).
 */
@Component({
  selector: 'sc-ficha-variant-bar',
  imports: [ScButtonComponent, TranslateModule],
  template: `
    @if (variants.comparing()) {
      <!-- Hueco en el flujo para que la barra no tape el final de la página. -->
      <div class="variant-bar-spacer" aria-hidden="true"></div>
      <div class="variant-bar" role="group" [attr.aria-label]="'compare.bar.label' | translate">
        <div class="variant-bar__row">
          <span class="variant-bar__label sc-text-caption-semibold">{{ 'compare.bar.label' | translate }}</span>
          <div class="variant-bar__options">
            @for (v of options; track v) {
              <sc-button
                size="sm"
                [variant]="variants.variant() === v ? 'primary' : 'secondary'"
                [appearance]="variants.variant() === v ? 'filled' : 'outlined'"
                [label]="'compare.variant.' + v + '.label' | translate"
                (clicked)="variants.set(v)"
              />
            }
          </div>
        </div>
        <p class="variant-bar__hint sc-text-caption-regular" aria-live="polite">
          {{ 'compare.variant.' + variants.variant() + '.hint' | translate }}
        </p>
      </div>
    }
  `,
  styleUrl: './ficha-variant-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FichaVariantBarComponent {
  protected readonly variants = inject(FichaVariantService);
  protected readonly options = FICHA_VARIANTS;
}
