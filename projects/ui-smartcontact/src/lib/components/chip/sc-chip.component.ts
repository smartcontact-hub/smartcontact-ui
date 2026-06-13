import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ChipModule } from 'primeng/chip';

import { resolveScComponentIconClass } from '../../core/icons/sc-component-icon-resolver';

@Component({
    selector: 'sc-chip',
    standalone: true,
    imports: [ChipModule],
    templateUrl: './sc-chip.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScChipComponent {
    @Input() label: string | null = null;

    @Input() icon: string | null = null;

    @Input() image: string | null = null;

    @Input() alt: string | null = null;

    @Input() removable = false;

    @Input() disabled = false;

    @Output() removed = new EventEmitter<unknown>();

    @Output() imageError = new EventEmitter<unknown>();

    protected get chipIcon(): string | undefined {
        return resolveScComponentIconClass(this.icon);
    }
}
