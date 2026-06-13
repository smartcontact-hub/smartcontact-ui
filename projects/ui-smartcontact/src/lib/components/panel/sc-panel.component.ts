import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PanelModule } from 'primeng/panel';

@Component({
    selector: 'sc-panel',
    standalone: true,
    imports: [PanelModule],
    templateUrl: './sc-panel.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScPanelComponent {
    @Input() header: string | null = null;

    @Input() toggleable = false;

    @Input() collapsed = false;

    @Input() showHeader = true;

    @Output() collapsedChange = new EventEmitter<boolean>();

    @Output() beforeToggle = new EventEmitter<unknown>();

    @Output() afterToggle = new EventEmitter<unknown>();
}
