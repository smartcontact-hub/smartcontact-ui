import { booleanAttribute, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input } from '@angular/core';
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(mouseenter)': 'syncTruncatedTitle()'
    }
})
export class ScTagComponent {
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

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
            '--label-border': `var(--sc-label-${c}-border)`
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

    /**
     * Una etiqueta no se parte: si no cabe, el tema la recorta con puntos
     * suspensivos (`tagOneLineCss`). Al pasar el ratón, el valor entero vuelve en
     * `title`, pero SOLO si está recortada: en las que caben sería un tooltip que
     * repite lo que ya se lee. Se mide al entrar el ratón y no antes porque el
     * recorte depende del ancho de la columna, que cambia con la ventana. Va en la
     * pastilla y no en el host, para no pisar un `title` que ponga el consumidor.
     */
    protected syncTruncatedTitle(): void {
        const pill = this.host.nativeElement.querySelector<HTMLElement>('.p-tag, .sc-tag__label');
        const text = pill?.querySelector<HTMLElement>('.p-tag-label, .sc-tag__text');
        if (!pill || !text) {
            return;
        }

        if (text.scrollWidth > text.clientWidth) {
            pill.setAttribute('title', this.value() ?? '');
        } else {
            pill.removeAttribute('title');
        }
    }
}
