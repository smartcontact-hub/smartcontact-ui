import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TagModule } from 'primeng/tag';

import { resolveScComponentIconClass } from '../../core/icons/sc-component-icon-resolver';
import { ScSeverity } from '../../core/types/theme-component.types';

type PrimeTagSeverity = 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
    selector: 'sc-tag',
    standalone: true,
    imports: [TagModule],
    templateUrl: './sc-tag.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScTagComponent {
    @Input() value: string | null = null;

    @Input() severity: ScSeverity = 'primary';

    @Input() icon: string | null = null;

    @Input() rounded = false;

    protected get tagValue(): string | undefined {
        return this.value ?? undefined;
    }

    protected get tagSeverity(): PrimeTagSeverity {
        if (this.severity === 'primary') {
            return undefined;
        }

        if (this.severity === 'warning') {
            return 'warn';
        }

        return this.severity;
    }

    protected get tagIcon(): string | undefined {
        return resolveScComponentIconClass(this.icon);
    }
}
