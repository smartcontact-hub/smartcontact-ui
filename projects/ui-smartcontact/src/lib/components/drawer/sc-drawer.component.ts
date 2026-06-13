import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';

import { ScOverlayPosition } from '../../core/types/theme-component.types';

@Component({
    selector: 'sc-drawer',
    standalone: true,
    imports: [DrawerModule],
    templateUrl: './sc-drawer.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScDrawerComponent {
    @Input() visible = false;

    @Input() header: string | null = null;

    @Input() position: ScOverlayPosition = 'left';

    @Input() modal = true;

    @Input() dismissible = true;

    @Input() closeOnEscape = true;

    @Input() showCloseIcon = true;

    @Input() fullScreen = false;

    @Output() visibleChange = new EventEmitter<boolean>();

    @Output() shown = new EventEmitter<unknown>();

    @Output() hidden = new EventEmitter<unknown>();

    protected onVisibleChange(visible: boolean): void {
        this.visible = visible;
        this.visibleChange.emit(visible);
    }
}
