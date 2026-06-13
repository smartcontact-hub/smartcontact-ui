import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

import { ScSkeletonAnimation, ScSkeletonShape } from '../../core/types/theme-component.types';

@Component({
    selector: 'sc-skeleton',
    standalone: true,
    imports: [SkeletonModule],
    templateUrl: './sc-skeleton.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScSkeletonComponent {
    @Input() shape: ScSkeletonShape = 'rectangle';

    @Input() animation: ScSkeletonAnimation = 'wave';

    @Input() size: string | null = null;

    @Input() width = '100%';

    @Input() height = '1rem';

    @Input() borderRadius: string | null = null;
}
