import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
    readonly shape = input<ScSkeletonShape>('rectangle');

    readonly animation = input<ScSkeletonAnimation>('wave');

    readonly size = input<string | null>(null);

    readonly width = input('100%');

    readonly height = input('1rem');

    readonly borderRadius = input<string | null>(null);
}
