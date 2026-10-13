import { NgClass } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, effect, input, isDevMode } from '@angular/core';

import { ScIconTalla } from '../../icons/sc-icon-sizes';
import {
    resolveScIconGlyph,
    resolveScIconName,
    ScIconGrade,
    ScIconName,
    ScIconOpticalSize,
    ScIconSize,
    ScIconWeight
} from '../../icons/sc-icon.types';

/** Los tonos de `sc-icon`: cada uno es un token `--sc-icon-*`. */
export type ScIconTono = 'default' | 'subtle' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'disabled';

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
     *
     * El número solo admite las tallas de la escala (`ScIconTalla`, DD-200): una intermedia (13, 15, 24) no compila.
     */
    readonly size = input<ScIconSize | ScIconTalla | 'inherit'>('md');

    readonly filled = input(false, { transform: booleanAttribute });

    readonly weight = input<ScIconWeight>(400);

    readonly grade = input<ScIconGrade>(0);

    readonly opticalSize = input<ScIconOpticalSize>(24);

    readonly ariaLabel = input<string | null>(null);

    /**
     * El color con significado, solo desde los tokens `--sc-icon-*` (DD-200). `default` sigue al texto
     * (`currentColor`). Un tono no basta para decir un estado: va con su forma (`check_circle`, `warning`, `error`,
     * `info`) y con texto.
     */
    readonly tone = input<ScIconTono>('default');

    /** Gira el glifo en bucle (spinner). Respeta prefers-reduced-motion. */
    readonly spin = input(false, { transform: booleanAttribute });

    protected readonly numericSize = computed<number | null>(() => {
        const size = this.size();

        return typeof size === 'number' ? size : null;
    });

    protected readonly glyph = computed(() => resolveScIconGlyph(this.name()));

    constructor() {
        // Un nombre que no existe se pinta como palabra (la ligadura no casa): en desarrollo, que se note.
        if (isDevMode()) {
            effect(() => {
                const nombre = this.name()?.trim();
                if (nombre && !resolveScIconName(nombre)) {
                    console.warn(`sc-icon: «${nombre}» no es un icono de Material ni un alias del DS (DD-200).`);
                }
            });
        }
    }

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
            [`sc-icon--tono-${this.tone()}`]: this.tone() !== 'default',
            [`sc-icon--weight-${this.weight()}`]: true,
            [`sc-icon--grade-${grade < 0 ? 'negative-25' : grade}`]: true,
            [`sc-icon--optical-${this.opticalSize()}`]: true
        };
    });
}
