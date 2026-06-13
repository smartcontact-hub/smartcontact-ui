import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
    @Input() value: number | null = null;

    @Input() showValue = true;

    @Input() unit = '%';

    @Input() mode: ScProgressBarMode = 'determinate';
}
