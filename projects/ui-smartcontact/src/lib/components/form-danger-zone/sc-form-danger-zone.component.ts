import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

import { SC_ICON_SIZE_DEFAULT, ScIconComponent } from '@smartcontact/icons';

import { SC_FORM_DANGER_ZONE_TRANSLATIONS } from './i18n/sc-form-danger-zone.translations';

/**
 * End-of-form section that hosts irreversible / sensitive actions
 * (delete, transfer, archive). Lives at the bottom of edit pages so the
 * destructive button is intentionally out of the primary scan path.
 *
 * Pairs with the page's existing impact-preview / confirmation dialog —
 * this component is just the visual frame and the trigger.
 *
 * i18n: la descripción la suministra el consumidor (`descriptionKey`); el
 * título y la etiqueta de acción por defecto viven en el diccionario colocado
 * `sc.formDangerZone.*` (sin claves `common.*`). Iconos vía `@smartcontact/icons`.
 */
@Component({
  selector: 'sc-form-danger-zone',
  standalone: true,
  imports: [ButtonModule, ScIconComponent, TranslateModule],
  templateUrl: './sc-form-danger-zone.component.html',
  styleUrl: './sc-form-danger-zone.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScFormDangerZoneComponent {
  readonly titleKey = input<string>('sc.formDangerZone.title');
  readonly descriptionKey = input.required<string>();
  readonly actionKey = input<string>('sc.formDangerZone.action');
  readonly disabled = input<boolean>(false);

  readonly action = output<void>();

  protected readonly trashIcon = 'delete';
  protected readonly iconSizeDefault = SC_ICON_SIZE_DEFAULT;

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    const translate = inject(TranslateService);
    for (const [language, dict] of Object.entries(SC_FORM_DANGER_ZONE_TRANSLATIONS)) {
      translate.setTranslation(language, dict, true);
    }
  }
}
