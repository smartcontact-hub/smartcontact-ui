import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

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
    @Input() name: ScIconName | string | null = null;

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
    @Input() size: ScIconSize | number | 'inherit' = 'md';

    @Input() filled = false;

    @Input() weight: ScIconWeight = 400;

    @Input() grade: ScIconGrade = 0;

    @Input() opticalSize: ScIconOpticalSize = 24;

    @Input() ariaLabel: string | null = null;

    /** Gira el glifo en bucle (spinner). Respeta prefers-reduced-motion. */
    @Input() spin = false;

    protected get numericSize(): number | null {
        return typeof this.size === 'number' ? this.size : null;
    }

    protected get glyph(): string {
        return resolveScIconGlyph(this.name);
    }

    protected get ariaHidden(): 'true' | null {
        return this.ariaLabel ? null : 'true';
    }

    protected get iconRole(): 'img' | null {
        return this.ariaLabel ? 'img' : null;
    }

    protected get iconClasses(): Record<string, boolean> {
        return {
            'sc-icon--sm': this.size === 'sm',
            'sc-icon--md': this.size === 'md',
            'sc-icon--lg': this.size === 'lg',
            'sc-icon--inherit': this.size === 'inherit',
            'sc-icon--spin': this.spin,
            'sc-icon--filled': this.filled,
            [`sc-icon--weight-${this.weight}`]: true,
            [`sc-icon--grade-${this.grade < 0 ? 'negative-25' : this.grade}`]: true,
            [`sc-icon--optical-${this.opticalSize}`]: true
        };
    }
}
