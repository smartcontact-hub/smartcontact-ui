import { inject } from '@angular/core';
import {
  ScAlertModalComponent,
  ScAlertModalSurface,
  ScAlertModalVariant,
  ScDynamicDialogService,
} from '@smartcontact-hub/components';

/** Lo que el Supervisor pregunta en un aviso: los inputs de `sc-alert-modal` que usa. */
export interface AlertModalRequest {
  readonly variant: ScAlertModalVariant;
  /**
   * Obligatoria, para que cada aviso lo decida (DD-242): `plain` (blanca) para lo que decide el usuario (borrar,
   * descartar, guardar antes de salir); `tinted` (teñida) solo para un error del sistema.
   */
  readonly surface: ScAlertModalSurface;
  /** Con `false`, Escape no cierra el aviso (un error del sistema, SISMAC-4292). Por defecto, sí. */
  readonly closeOnEscape?: boolean;
  readonly title: string;
  readonly message: string;
  readonly actionLabel: string;
  readonly secondaryActionLabel: string;
}

/**
 * Abre `sc-alert-modal` como lo abren los devs en ui.smart-contact.com (`ScDynamicDialogService.open` con sus
 * `inputValues`, DD-241) y resuelve `true` si se pulsa la acción; la X, «Cancelar» y Escape resuelven `false`. Es el
 * único sitio del Supervisor que lo abre: borrar va con `error`, descartar cambios con `warning` y avisar al guardar con
 * `info`, los tres con la superficie blanca (`plain`, DD-242): el tinte es para los errores del sistema. Se llama en el
 * contexto de inyección.
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
