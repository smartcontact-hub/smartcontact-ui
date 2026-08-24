import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

import { resolveScComponentIconClass } from '../../core/icons/sc-component-icon-resolver';
import { ScSeverity } from '../../core/types/theme-component.types';
import { LabelColor } from '../../core/types/label.types';

type PrimeTagSeverity = 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
    selector: 'sc-tag',
    standalone: true,
    imports: [TagModule],
    templateUrl: './sc-tag.component.html',
    styleUrl: './sc-tag.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScTagComponent {
    readonly value = input<string | null>(null);

    readonly severity = input<ScSeverity>('primary');

    readonly icon = input<string | null>(null);

    readonly rounded = input(false, { transform: booleanAttribute });

    /**
     * Variante categórica (§4.1): etiqueta de solo lectura con punto + 8 colores
     * del DS. Default `'default'` = wrapper `<p-tag>` semántico (intacto). Hereda
     * el comportamiento read-only del retirado `sc-label-chip`.
     */
    readonly variant = input<'default' | 'label'>('default');

    /** Color categórico cuando `variant='label'`. */
    readonly labelColor = input<LabelColor>('gray');

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

    protected readonly tagValue = computed<string | undefined>(() => this.value() ?? undefined);

    protected readonly tagSeverity = computed<PrimeTagSeverity>(() => {
        const severity = this.severity();

        if (severity === 'primary') {
            return undefined;
        }

        if (severity === 'warning') {
            return 'warn';
        }

        return severity;
    });

    protected readonly tagIcon = computed<string | undefined>(() =>
        resolveScComponentIconClass(this.icon())
    );
}
