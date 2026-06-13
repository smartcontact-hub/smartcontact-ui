import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ChipModule } from 'primeng/chip';

import { SC_ICON_SIZE_SM, ScIconComponent } from '@smartcontact-hub/icons';

import { resolveScComponentIconClass } from '../../core/icons/sc-component-icon-resolver';
import { LabelColor } from '../../core/types/label.types';

@Component({
    selector: 'sc-chip',
    standalone: true,
    imports: [ChipModule, ScIconComponent],
    templateUrl: './sc-chip.component.html',
    styleUrl: './sc-chip.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScChipComponent {
    @Input() label: string | null = null;

    @Input() icon: string | null = null;

    @Input() image: string | null = null;

    @Input() alt: string | null = null;

    @Input() removable = false;

    @Input() disabled = false;

    /**
     * Variante categórica (§4.1): etiqueta con punto + 8 colores del DS. Default
     * `'default'` = wrapper `<p-chip>` (intacto). Es la cara REMOVIBLE del
     * retirado `sc-label-chip` (la read-only vive en `sc-tag variant="label"`).
     */
    @Input() variant: 'default' | 'label' = 'default';

    /** Color categórico cuando `variant='label'`. */
    @Input() labelColor: LabelColor = 'gray';

    /** Aria-label del botón de quitar (variante label). El consumidor lo traduce. */
    @Input() removeAriaLabel = 'Remove';

    @Output() removed = new EventEmitter<unknown>();

    @Output() imageError = new EventEmitter<unknown>();

    protected readonly closeIcon = 'close';
    protected readonly iconSizeSm = SC_ICON_SIZE_SM;

    protected get chipIcon(): string | undefined {
        return resolveScComponentIconClass(this.icon);
    }

    /** CSS custom props del color de la etiqueta (consumidas por el SCSS). */
    protected get labelVars(): Record<string, string> {
        const c = this.labelColor;
        return {
            '--label-bg': `var(--sc-label-${c}-bg)`,
            '--label-text': `var(--sc-label-${c}-text)`,
            '--label-border': `var(--sc-label-${c}-border)`,
            '--label-dot': `var(--sc-label-${c}-dot)`
        };
    }

    protected onLabelRemove(event: MouseEvent): void {
        event.stopPropagation();
        this.removed.emit(event);
    }
}
