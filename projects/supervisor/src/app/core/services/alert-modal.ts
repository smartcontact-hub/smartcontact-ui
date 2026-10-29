import { inject } from '@angular/core';
import { ScAlertModalComponent, ScAlertModalVariant, ScDynamicDialogService } from '@smartcontact-hub/components';

/** Lo que el Supervisor pregunta en un aviso: los inputs de `sc-alert-modal` que usa. */
export interface AlertModalRequest {
  readonly variant: ScAlertModalVariant;
  readonly title: string;
  readonly message: string;
  readonly actionLabel: string;
  readonly secondaryActionLabel: string;
}

/**
 * Abre `sc-alert-modal` como lo abren los devs en ui.smart-contact.com (`ScDynamicDialogService.open` con sus
 * `inputValues`, DD-240) y resuelve `true` si se pulsa la acción; la X, «Cancelar» y Escape resuelven `false`. Es el
 * único sitio del Supervisor que lo abre: borrar va con `error`, descartar cambios con `warning` y avisar al guardar con
 * `info`. Se llama en el contexto de inyección.
 */
export function injectAlertModal(): (request: AlertModalRequest) => Promise<boolean> {
  const dynamicDialog = inject(ScDynamicDialogService);
  return (request) =>
    new Promise<boolean>((resolve) => {
      const ref = dynamicDialog.open<ScAlertModalComponent, unknown, Record<string, unknown>, 'action' | 'closed'>(
        ScAlertModalComponent,
        {
          inputValues: {
            ...request,
            closeRequested: () => ref.close('closed'),
            actionRequested: () => ref.close('action'),
          },
        },
      );
      ref.onClose.subscribe((result) => resolve(result === 'action'));
    });
}
