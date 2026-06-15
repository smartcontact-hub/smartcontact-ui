import { inject, Signal } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

import { DiscardDialogService } from '@core/services/discard-dialog.service';

/**
 * Components that opt into the form-dirty guard expose a `formDirty` signal.
 * The guard reads it; if dirty, it shows the discard dialog and resolves
 * based on the user's choice.
 */
export interface DirtyAware {
  readonly formDirty: Signal<boolean>;
}

export const formDirtyGuard: CanDeactivateFn<DirtyAware> = (component) => {
  if (!component.formDirty()) return true;
  return inject(DiscardDialogService).confirm();
};
