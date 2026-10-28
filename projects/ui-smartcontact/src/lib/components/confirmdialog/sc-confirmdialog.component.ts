import { ChangeDetectionStrategy, Component, effect, inject, untracked, viewChild } from '@angular/core';
import { Confirmation } from 'primeng/api';
import { AutoFocus } from 'primeng/autofocus';
import { ButtonDirective } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmPopup } from 'primeng/confirmpopup';

import { SC_CONFIRM_POPUP_KEY, SC_CONFIRM_TERTIARY_KEY, ScConfirmService } from './sc-confirm.service';

/**
 * Host único de confirmaciones programáticas sobre `<p-confirmdialog>`
 * (Kit `❖ ConfirmDialog`, canvas 6738:50207). Se monta una vez en el shell de
 * la app; el estado y accept/reject se enrutan por `ScConfirmService`, que
 * envuelve el `ConfirmationService` de PrimeNG conservando la API
 * `await confirm(): Promise<boolean>`.
 *
 * Nombre DD-12 (pegado): envuelve 1:1 un componente PrimeNG. El origen lo
 * llamaba `sc-confirm-host`; el racional del rename está en el tag `archive/docs-history`.
 */
@Component({
    selector: 'sc-confirmdialog',
    standalone: true,
    imports: [AutoFocus, ButtonDirective, ConfirmDialog, ConfirmPopup],
    templateUrl: './sc-confirmdialog.component.html',
    styleUrl: './sc-confirmdialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScConfirmDialogComponent {
    protected readonly popupKey = SC_CONFIRM_POPUP_KEY;
    protected readonly tertiaryKey = SC_CONFIRM_TERTIARY_KEY;
    private readonly confirm = inject(ScConfirmService, { optional: true });
    private readonly popup = viewChild(ConfirmPopup);

    constructor() {
        // El globo que se cierra sin respuesta (clic fuera, scroll, resize) cuenta como «no»: ver `popupClosed`.
        let wasVisible = false;
        effect(() => {
            const visible = this.popup()?.computedVisible() ?? false;
            if (wasVisible && !visible) untracked(() => this.confirm?.popupClosed());
            wasVisible = visible;
        });
    }
    /**
     * Medidas del diálogo centrado (`--sc-confirmdialog-*`): entre 320 y 480 px de ancho y como mucho 400 de alto.
     * Aura lo deja crecer con el texto; el diálogo se pinta en `body`, fuera de este host, así que van por `[style]`.
     */
    protected readonly dialogStyle = {
        'min-width': 'var(--sc-confirmdialog-min-width)',
        'max-width': 'var(--sc-confirmdialog-max-width)',
        'max-height': 'var(--sc-confirmdialog-max-height)'
    };
    /**
     * Título de 1 a 2 líneas y descripción de 1 a 4: lo que pase se recorta con «…» y el texto entero queda en su
     * `title`, para leerlo al pasar el ratón.
     */
    protected readonly dialogPt = {
        title: ({ instance }: { instance: { header?: () => string | undefined } }) => ({
            title: instance.header?.() ?? null,
            style: clampStyle('var(--sc-confirmdialog-title-lines)')
        }),
        message: ({ instance }: { instance: ConfirmDialog }) => ({
            title: messageText(instance.confirmation()),
            style: clampStyle('var(--sc-confirmdialog-body-lines)')
        })
    };
    /** La tercera acción va a la izquierda, separada de la pareja reject/accept. */
    protected readonly tertiaryStyle = { 'margin-inline-end': 'auto' };

    protected tertiaryLabel(confirmation: Confirmation | null | undefined): string {
        return (confirmation as (Confirmation & { tertiaryLabel?: string }) | null)?.tertiaryLabel ?? '';
    }

    /** Resuelve «tertiary» antes de cerrar: el cierre llama a «reject», que ya no cuenta. */
    protected onTertiary(dialog: ConfirmDialog): void {
        this.confirm?.tertiaryChosen();
        dialog.onReject();
    }

    /**
     * Aura no le pone tope de ancho: una frase larga lo estira a una línea que se sale de la pantalla (medido a
     * 1440). EXCEPCIÓN documentada: el Kit no da ancho para el globo, así que se topa en un paso de la escala
     * (350px, lo que mide el toast, la otra pieza flotante con una frase) y no en el token de otro componente.
     */
    protected readonly popupStyle = { 'max-width': 'var(--sc-spacing-25)' };
    /** El globo no pinta título: su nombre para el lector es el título de la petición (`role="alertdialog"`). */
    protected readonly popupPt = {
        root: ({ instance }: { instance: ConfirmPopup }) => ({ 'aria-label': instance.confirmation()?.header ?? null })
    };
}

function clampStyle(lines: string): Record<string, string> {
    return {
        display: '-webkit-box',
        '-webkit-box-orient': 'vertical',
        '-webkit-line-clamp': lines,
        'line-clamp': lines,
        overflow: 'hidden'
    };
}

/** El cuerpo como texto plano: `message` puede traer HTML y el `title` no lo pinta. */
function messageText(confirmation: Confirmation | null | undefined): string | null {
    const message = confirmation?.message;
    return message ? message.replace(/<[^>]*>/g, '') : null;
}
