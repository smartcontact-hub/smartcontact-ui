import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ToastModule } from 'primeng/toast';

import { ScToastMessage } from './sc-toast.service';

export type ScToastPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
    | 'center';

export type ScToastCloseEvent = {
    index?: number;
    message?: ScToastMessage;
};

@Component({
    selector: 'sc-toast',
    standalone: true,
    imports: [ToastModule],
    templateUrl: './sc-toast.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScToastComponent {
    readonly key = input<string | null>(null);

    readonly position = input<ScToastPosition>('bottom-right');

    readonly baseZIndex = input(5000);

    readonly life = input(3000);

    readonly preventDuplicates = input(false, { transform: booleanAttribute });

    readonly preventOpenDuplicates = input(false, { transform: booleanAttribute });

    readonly closed = output<ScToastCloseEvent>();

    protected onClose(event: unknown): void {
        this.closed.emit(event as ScToastCloseEvent);
    }
}
