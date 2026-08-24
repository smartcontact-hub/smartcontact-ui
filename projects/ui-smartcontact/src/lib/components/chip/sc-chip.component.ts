import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ChipModule } from 'primeng/chip';

import { ScIconComponent } from '@smartcontact-hub/icons';

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
    readonly label = input<string | null>(null);

    readonly icon = input<string | null>(null);

    readonly image = input<string | null>(null);

    readonly alt = input<string | null>(null);

    readonly removable = input(false, { transform: booleanAttribute });

    readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * Variante categórica (§4.1): etiqueta con punto + 8 colores del DS. Default
     * `'default'` = wrapper `<p-chip>` (intacto). Es la cara REMOVIBLE del
     * retirado `sc-label-chip` (la read-only vive en `sc-tag variant="label"`).
     */
    readonly variant = input<'default' | 'label'>('default');

    /** Color categórico cuando `variant='label'`. */
    readonly labelColor = input<LabelColor>('gray');

    /** Aria-label del botón de quitar (variante label). El consumidor lo traduce. */
    readonly removeAriaLabel = input('Remove');

    readonly removed = output<unknown>();

    readonly imageError = output<unknown>();

    protected readonly closeIcon = 'close';

    protected readonly chipIcon = computed<string | undefined>(() =>
        resolveScComponentIconClass(this.icon())
    );

    /** CSS custom props del color de la etiqueta (consumidas por el SCSS). */
    protected readonly labelVars = computed<Record<string, string>>(() => {
        const c = this.labelColor();

        return {
            '--label-bg': `var(--sc-label-${c}-bg)`,
            '--label-text': `var(--sc-label-${c}-text)`,
            '--label-border': `var(--sc-label-${c}-border)`,
            '--label-dot': `var(--sc-label-${c}-dot)`
        };
    });

    protected onLabelRemove(event: MouseEvent): void {
        event.stopPropagation();
        this.removed.emit(event);
    }
}
