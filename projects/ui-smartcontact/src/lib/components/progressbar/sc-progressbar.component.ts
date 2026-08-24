import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProgressBarModule } from 'primeng/progressbar';

import { ScProgressBarMode } from '../../core/types/theme-component.types';

@Component({
    selector: 'sc-progressbar',
    standalone: true,
    imports: [ProgressBarModule],
    templateUrl: './sc-progressbar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScProgressBarComponent {
    readonly value = input<number | null>(null);

    readonly showValue = input(true, { transform: booleanAttribute });

    readonly unit = input('%');

    readonly mode = input<ScProgressBarMode>('determinate');
}
