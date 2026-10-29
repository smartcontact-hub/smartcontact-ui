import { inject, Injectable, Provider } from '@angular/core';
import { Confirmation, ConfirmationService } from 'primeng/api';

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
    /**
     * Icono de la cabecera. Nombre de símbolo Material (p. ej. `'delete'`,
     * `'info'`) o clase ya resuelta. Default: `'exclamation-triangle'` — el
     * aviso genérico, que es lo correcto para un confirm destructivo. Se expone
     * porque un confirm informativo con triángulo de peligro miente al usuario.
     */
    readonly icon?: string;
    /**
     * El botón que la pide. Con él, la pregunta sale en un `p-confirmpopup` pegado a ese botón en vez de en el
     * diálogo centrado: se ve lo que va a cambiar mientras se decide. El título no se pinta en el globo; queda como
     * su nombre para el lector.
     */
    readonly target?: EventTarget | null;
}

/**
 * Confirmación con una tercera salida (p. ej. «Guardar», «No guardar», «Cancelar»). El diálogo admite como máximo
 * tres botones; la tercera acción va a la izquierda y con menos peso que las otras dos. Siempre centrada: el globo
 * de `target` no tiene sitio para tres botones.
 */
export interface ScConfirmChoiceRequest extends Omit<ScConfirmRequest, 'target'> {
    /** Label de la tercera acción. */
    readonly tertiaryLabel: string;
}

/** Lo que eligió la persona en `choose()`. Cerrar con ESC o con la X cuenta como `'reject'`. */
export type ScConfirmChoice = 'accept' | 'reject' | 'tertiary';

/** Clave del diálogo de tres botones que monta `<sc-confirmdialog>`. */
export const SC_CONFIRM_TERTIARY_KEY = 'sc-confirm-tertiary';

/** Clave del `p-confirmpopup` que monta `<sc-confirmdialog>`; el diálogo, sin clave, no la atiende. */
export const SC_CONFIRM_POPUP_KEY = 'sc-confirm-popup';

/**
 * Confirmación programática del DS. Respaldada por el `ConfirmationService`
 * de PrimeNG + `<sc-confirmdialog>` (montado una vez en el shell), con una
 * superficie Promise para poder hacer `await confirm()`.
 */
@Injectable()
export class ScConfirmService {
    private readonly confirmation = inject(ConfirmationService);

    /** La respuesta del globo abierto: el globo puede cerrarse sin pasar por «reject» (ver `popupClosed`). */
    private pendingPopup: ((value: boolean) => void) | null = null;

    /** La respuesta del diálogo de tres botones abierto, para que su tercer botón la resuelva (ver `tertiaryChosen`). */
    private pendingChoice: ((value: ScConfirmChoice) => void) | null = null;

    /**
     * Muestra una confirmación. Resuelve `true` al aceptar, `false` al
     * rechazar (botón, ESC, cerrar el globo sin responder u otra `request()` que la supersede).
     */
    request(req: ScConfirmRequest): Promise<boolean> {
        return new Promise<boolean>((resolveOnce) => {
            let settled = false;
            const resolve = (value: boolean): void => {
                if (settled) return;
                settled = true;
                if (this.pendingPopup === resolve) this.pendingPopup = null;
                resolveOnce(value);
            };
            if (req.target) {
                this.pendingPopup?.(false);
                this.pendingPopup = resolve;
            }
            this.confirmation.confirm({
                ...(req.target ? { key: SC_CONFIRM_POPUP_KEY, target: req.target } : {}),
                ...this.dialogOptions(req),
                accept: () => resolve(true),
                reject: () => resolve(false)
            });
        });
    }

    /**
     * Muestra una confirmación de tres botones. Resuelve `'accept'`, `'reject'` (botón, ESC, la X u otra
     * confirmación que la supersede) o `'tertiary'`.
     */
    choose(req: ScConfirmChoiceRequest): Promise<ScConfirmChoice> {
        return new Promise<ScConfirmChoice>((resolveOnce) => {
            let settled = false;
            const resolve = (value: ScConfirmChoice): void => {
                if (settled) return;
                settled = true;
                if (this.pendingChoice === resolve) this.pendingChoice = null;
                resolveOnce(value);
            };
            this.pendingChoice?.('reject');
            this.pendingChoice = resolve;
            this.confirmation.confirm({
                key: SC_CONFIRM_TERTIARY_KEY,
                ...this.dialogOptions(req),
                // El pie lo pinta `<sc-confirmdialog>`: el tercer botón lo lee de aquí.
                tertiaryLabel: req.tertiaryLabel,
                accept: () => resolve('accept'),
                reject: () => resolve('reject')
            } as Confirmation);
        });
    }

    /**
     * Se pulsó el tercer botón. Resuelve la respuesta antes de que el diálogo se cierre: el cierre llama a «reject»,
     * que ya no hace nada porque la promesa está resuelta.
     */
    tertiaryChosen(): void {
        this.pendingChoice?.('tertiary');
    }

    private dialogOptions(req: Omit<ScConfirmRequest, 'target'>): Confirmation {
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

        return {
            header: req.title,
            message: req.body,
            // El foco abre en la opción segura cuando aceptar destruye o no es lo recomendado: si no,
            // un Intro de más ejecuta (WAI-ARIA APG, «Dialog (Modal) Pattern»: con una acción
            // irreversible, el foco inicial va al elemento menos destructivo). PrimeNG lo abre en
            // «accept» por defecto.
            defaultFocus: acceptTone === 'danger' || emphasizeReject ? 'reject' : 'accept',
            // Material vía resolver — PrimeIcons no forma parte del DS.
            icon: resolveScComponentIconClass(req.icon ?? 'exclamation-triangle'),
            acceptButtonProps,
            rejectButtonProps
        };
    }

    /**
     * El globo se ha cerrado. `p-confirmpopup` se cierra solo, sin llamar a «reject», con un clic fuera, al
     * desplazar la página o al cambiar el tamaño de la ventana (PrimeNG 22.1: `hide()` en sus escuchas de
     * documento); sin esto la promesa se quedaba sin resolver y quien esperaba la respuesta, bloqueado (DD-211 §3).
     * Cerrar sin responder es no aceptar. Tras aceptar o rechazar no hace nada: la promesa ya se resolvió.
     */
    popupClosed(): void {
        this.pendingPopup?.(false);
    }
}

export function provideScConfirm(): Provider[] {
    return [ConfirmationService, ScConfirmService];
}
