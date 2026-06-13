import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
    @Input() value: string | null = null;

    @Input() severity: ScSeverity = 'primary';

    @Input() icon: string | null = null;

    @Input() rounded = false;

    /**
     * Variante categórica (§4.1): etiqueta de solo lectura con punto + 8 colores
     * del DS. Default `'default'` = wrapper `<p-tag>` semántico (intacto). Hereda
     * el comportamiento read-only del retirado `sc-label-chip`.
     */
    @Input() variant: 'default' | 'label' = 'default';

    /** Color categórico cuando `variant='label'`. */
    @Input() labelColor: LabelColor = 'gray';

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
