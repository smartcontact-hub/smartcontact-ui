import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
    @Input() label: string | number = '';

    @Input() variant: ScBadgeVariant = 'primary';

    @Input() size: ScBadgeSize = 'md';

    protected get badgeSeverity(): PrimeBadgeSeverity {
        if (this.variant === 'primary') {
            return undefined;
        }

        if (this.variant === 'warning') {
            return 'warn';
        }

        return this.variant;
    }

    protected get badgeSize(): PrimeBadgeSize {
        if (this.size === 'sm') {
            return 'small';
        }

        if (this.size === 'lg') {
            return 'large';
        }

        if (this.size === 'xl') {
            return 'xlarge';
        }

        return undefined;
    }

    protected get badgeValue(): string | null {
        if (this.label === null || this.label === undefined) {
            return null;
        }

        return String(this.label);
    }
}
