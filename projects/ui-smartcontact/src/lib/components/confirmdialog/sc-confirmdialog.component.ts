import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ConfirmDialog } from 'primeng/confirmdialog';

/**
 * Host único de confirmaciones programáticas sobre `<p-confirmdialog>`
 * (Kit `❖ ConfirmDialog`, canvas 6738:50207). Se monta una vez en el shell de
 * la app; el estado y accept/reject se enrutan por `ScConfirmService`, que
 * envuelve el `ConfirmationService` de PrimeNG conservando la API
 * `await confirm(): Promise<boolean>`.
 *
 * Nombre DD-12 (pegado): envuelve 1:1 un componente PrimeNG. El origen lo
 * llamaba `sc-confirm-host`; el racional del rename está en DECISIONS-LOG-B.
 */
@Component({
    selector: 'sc-confirmdialog',
    standalone: true,
    imports: [ConfirmDialog],
    templateUrl: './sc-confirmdialog.component.html',
    styleUrl: './sc-confirmdialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScConfirmDialogComponent {}
