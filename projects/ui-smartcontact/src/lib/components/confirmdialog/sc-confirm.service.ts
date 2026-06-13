import { inject, Injectable, Provider } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

import { resolveScComponentIconClass } from '../../core/icons/sc-component-icon-resolver';

export interface ScConfirmRequest {
    /** Título resuelto (traducido) mostrado en la cabecera del diálogo. */
    readonly title: string;
    /** Cuerpo resuelto. Una sola frase funciona mejor. */
    readonly body: string;
    /** Label de la acción destructiva / primaria. */
    readonly acceptLabel: string;
    /** Label de la acción segura / cancelar. */
    readonly rejectLabel: string;
    /** Tono visual del botón accept. Default `'primary'`. */
    readonly acceptTone?: 'primary' | 'danger';
    /**
     * Qué botón lleva el peso visual primario. Default `'accept'`.
     *
     * Usa `'reject'` en prompts de "descartar cambios" donde la opción segura
     * (seguir editando) es el camino recomendado — el accept queda
     * destructivo pero sutil.
     */
    readonly emphasis?: 'accept' | 'reject';
}

/**
 * Confirmación programática del DS. Respaldada por el `ConfirmationService`
 * de PrimeNG + `<sc-confirmdialog>` (montado una vez en el shell), con una
 * superficie Promise para poder hacer `await confirm()`.
 */
@Injectable()
export class ScConfirmService {
    private readonly confirmation = inject(ConfirmationService);

    /**
     * Muestra una confirmación. Resuelve `true` al aceptar, `false` al
     * rechazar (botón, ESC u otra `request()` que la supersede).
     */
    request(req: ScConfirmRequest): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const acceptTone = req.acceptTone ?? 'primary';
            const emphasizeReject = req.emphasis === 'reject';

            const acceptButtonProps = emphasizeReject
                ? acceptTone === 'danger'
                    ? { severity: 'danger' as const, outlined: true, label: req.acceptLabel }
                    : { severity: 'secondary' as const, label: req.acceptLabel }
                : acceptTone === 'danger'
                  ? { severity: 'danger' as const, label: req.acceptLabel }
                  : { label: req.acceptLabel };

            const rejectButtonProps = emphasizeReject
                ? { label: req.rejectLabel }
                : { severity: 'secondary' as const, label: req.rejectLabel };

            this.confirmation.confirm({
                header: req.title,
                message: req.body,
                // Material vía resolver — PrimeIcons no forma parte del DS.
                icon: resolveScComponentIconClass('exclamation-triangle'),
                acceptButtonProps,
                rejectButtonProps,
                accept: () => resolve(true),
                reject: () => resolve(false)
            });
        });
    }
}

export function provideScConfirm(): Provider[] {
    return [ConfirmationService, ScConfirmService];
}
