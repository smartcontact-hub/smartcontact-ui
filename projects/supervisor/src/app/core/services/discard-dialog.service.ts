import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { injectAlertModal } from './alert-modal';

/**
 * Programmatic "¿Descartar cambios?" confirmation. Used by the form-dirty
 * route guard and by anything else that needs to ask the user before
 * throwing away unsaved work.
 *
 * Es `sc-alert-modal` en `warning` (DD-241), con la superficie blanca (DD-242): pide atención sin alarmar, y el foco
 * abre en «Seguir editando».
 */
@Injectable({ providedIn: 'root' })
export class DiscardDialogService {
  private readonly alertModal = injectAlertModal();
  private readonly translate = inject(TranslateService);

  /** Resolves `true` if the user chose to discard, `false` if they kept editing. */
  confirm(): Promise<boolean> {
    return this.alertModal({
      variant: 'warning',
      surface: 'plain',
      title: this.translate.instant('common.discard_title'),
      message: this.translate.instant('common.discard_body'),
      actionLabel: this.translate.instant('common.discard_confirm'),
      secondaryActionLabel: this.translate.instant('common.discard_keep'),
    });
  }
}
