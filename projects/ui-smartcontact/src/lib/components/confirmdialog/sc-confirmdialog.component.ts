import { ChangeDetectionStrategy, Component, effect, inject, untracked, viewChild } from '@angular/core';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmPopup } from 'primeng/confirmpopup';

import { SC_CONFIRM_POPUP_KEY, ScConfirmService } from './sc-confirm.service';

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
    imports: [ConfirmDialog, ConfirmPopup],
    templateUrl: './sc-confirmdialog.component.html',
    styleUrl: './sc-confirmdialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScConfirmDialogComponent {
    protected readonly popupKey = SC_CONFIRM_POPUP_KEY;
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
     * Aura no le pone tope de ancho: una frase larga lo estira a una línea que se sale de la pantalla (medido a
     * 1440). EXCEPCIÓN documentada: el Kit no da ancho para el globo, así que se topa en un paso de la escala
     * (350px, lo que mide el toast, la otra pieza flotante con una frase) y no en el token de otro componente.
     */
    /**
     * El diálogo centrado crece con su frase y una larga lo estira hasta ~700px (medido en «Eliminar plantilla»). Se topa
     * en 461px, lo que mide el más ancho de la plataforma (el de Tipificaciones): la frase pasa a otra línea en vez de
     * ensanchar el diálogo.
     */
    protected readonly dialogStyle = { 'max-width': '28.8125rem' };
    protected readonly popupStyle = { 'max-width': 'var(--sc-spacing-25)' };
    /** El globo no pinta título: su nombre para el lector es el título de la petición (`role="alertdialog"`). */
    protected readonly popupPt = {
        root: ({ instance }: { instance: ConfirmPopup }) => ({ 'aria-label': instance.confirmation()?.header ?? null })
    };
}
