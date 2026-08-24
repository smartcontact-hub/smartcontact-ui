import { NgClass } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
    resolveScIconGlyph,
    ScIconGrade,
    ScIconName,
    ScIconOpticalSize,
    ScIconSize,
    ScIconWeight
} from '../../icons/sc-icon.types';

@Component({
    selector: 'sc-icon',
    standalone: true,
    imports: [NgClass],
    templateUrl: './sc-icon.component.html',
    styleUrls: ['./sc-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScIconComponent {
    readonly name = input<ScIconName | string | null>(null);

    /**
     * Tamaño tokenizado ('sm'|'md'|'lg'), numérico en px (px de diseño del
     * Kit, p. ej. SC_ICON_SIZE_DEFAULT = 14) o 'inherit'. El numérico aplica
     * font-size inline y alimenta el eje opsz — reconciliación con el sc-icon
     * del catálogo de diseño (ejes FILL/wght/opsz conservados).
     *
     * 'inherit' (DD-24) → el icono *companion* hereda el font-size de su
     * componente (`font-size: 1em`): icono y texto riman por fuente y escalan
     * juntos en sm/lg. Es el default semántico de los iconos junto a texto
     * dentro de un control (button/input/search/chip/tag/menu…); el size
     * pinneado queda como escape hatch e iconos sueltos/decorativos.
     */
    readonly size = input<ScIconSize | number | 'inherit'>('md');

    readonly filled = input(false, { transform: booleanAttribute });

    readonly weight = input<ScIconWeight>(400);

    readonly grade = input<ScIconGrade>(0);

    readonly opticalSize = input<ScIconOpticalSize>(24);

    readonly ariaLabel = input<string | null>(null);

    /** Gira el glifo en bucle (spinner). Respeta prefers-reduced-motion. */
    readonly spin = input(false, { transform: booleanAttribute });

    protected readonly numericSize = computed<number | null>(() => {
        const size = this.size();

        return typeof size === 'number' ? size : null;
    });

    protected readonly glyph = computed(() => resolveScIconGlyph(this.name()));

    protected readonly ariaHidden = computed<'true' | null>(() => (this.ariaLabel() ? null : 'true'));

    protected readonly iconRole = computed<'img' | null>(() => (this.ariaLabel() ? 'img' : null));

    protected readonly iconClasses = computed<Record<string, boolean>>(() => {
        const size = this.size();
        const grade = this.grade();

        return {
            'sc-icon--sm': size === 'sm',
            'sc-icon--md': size === 'md',
            'sc-icon--lg': size === 'lg',
            'sc-icon--inherit': size === 'inherit',
            'sc-icon--spin': this.spin(),
            'sc-icon--filled': this.filled(),
            [`sc-icon--weight-${this.weight()}`]: true,
            [`sc-icon--grade-${grade < 0 ? 'negative-25' : grade}`]: true,
            [`sc-icon--optical-${this.opticalSize()}`]: true
        };
    });
}
