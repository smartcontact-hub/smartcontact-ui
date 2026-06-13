import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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
    @Input() key: string | null = null;

    @Input() position: ScToastPosition = 'bottom-right';

    @Input() baseZIndex = 5000;

    @Input() life = 3000;

    @Input() preventDuplicates = false;

    @Input() preventOpenDuplicates = false;

    @Output() closed = new EventEmitter<ScToastCloseEvent>();

    protected onClose(event: unknown): void {
        this.closed.emit(event as ScToastCloseEvent);
    }
}
