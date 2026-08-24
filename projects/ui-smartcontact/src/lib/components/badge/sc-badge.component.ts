import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeModule } from 'primeng/badge';

import { ScBadgeSize, ScBadgeVariant } from '../../core/types/badge.types';

type PrimeBadgeSeverity = 'secondary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast' | undefined;
type PrimeBadgeSize = 'small' | 'large' | 'xlarge' | undefined;

@Component({
    selector: 'sc-badge',
    standalone: true,
    imports: [BadgeModule],
    templateUrl: './sc-badge.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScBadgeComponent {
    readonly label = input<string | number>('');

    readonly variant = input<ScBadgeVariant>('primary');

    readonly size = input<ScBadgeSize>('md');

    protected readonly badgeSeverity = computed<PrimeBadgeSeverity>(() => {
        const variant = this.variant();

        if (variant === 'primary') {
            return undefined;
        }

        if (variant === 'warning') {
            return 'warn';
        }

        return variant;
    });

    protected readonly badgeSize = computed<PrimeBadgeSize>(() => {
        const size = this.size();

        if (size === 'sm') {
            return 'small';
        }

        if (size === 'lg') {
            return 'large';
        }

        if (size === 'xl') {
            return 'xlarge';
        }

        return undefined;
    });

    protected readonly badgeValue = computed<string | null>(() => {
        const label = this.label();

        if (label === null || label === undefined) {
            return null;
        }

        return String(label);
    });
}
