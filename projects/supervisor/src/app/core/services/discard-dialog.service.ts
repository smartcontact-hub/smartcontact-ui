import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ScConfirmService } from '@smartcontact-hub/components';

/**
 * Programmatic "¿Descartar cambios?" confirmation. Used by the form-dirty
 * route guard and by anything else that needs to ask the user before
 * throwing away unsaved work.
 *
 * Renders through the canonical `sc-dialog` shell via `ScConfirmService`
 * — same look as every other dialog (Figma 1037:34069).
 */
@Injectable({ providedIn: 'root' })
export class DiscardDialogService {
  private readonly host = inject(ScConfirmService);
  private readonly translate = inject(TranslateService);

  /** Resolves `true` if the user chose to discard, `false` if they kept editing. */
  confirm(): Promise<boolean> {
    return this.host.request({
      title: this.translate.instant('common.discard_title'),
      body: this.translate.instant('common.discard_body'),
      acceptLabel: this.translate.instant('common.discard_confirm'),
      rejectLabel: this.translate.instant('common.discard_keep'),
      acceptTone: 'danger',
      emphasis: 'reject',
    });
  }
}
