import { booleanAttribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, ElementRef, inject, input, signal } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { resolveScComponentIconClass } from '../../core/icons/sc-component-icon-resolver';
import { ScSeverity } from '../../core/types/theme-component.types';
import { LabelColor } from '../../core/types/label.types';

type PrimeTagSeverity = 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
    selector: 'sc-tag',
    standalone: true,
    imports: [TagModule, TooltipModule],
    templateUrl: './sc-tag.component.html',
    styleUrl: './sc-tag.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(pointerenter)': 'medirRecorte()'
    }
})
export class ScTagComponent {
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly value = input<string | null>(null);

    readonly severity = input<ScSeverity>('primary');

    readonly icon = input<string | null>(null);

    readonly rounded = input(false, { transform: booleanAttribute });

    /**
     * Variante categórica (§4.1): etiqueta de solo lectura con punto + 9 colores
     * del DS. Default `'default'` = wrapper `<p-tag>` semántico (intacto). Hereda
     * el comportamiento read-only del retirado `sc-label-chip`.
     */
    readonly variant = input<'default' | 'label'>('default');

    /** Color categórico cuando `variant='label'`. */
    readonly labelColor = input<LabelColor>('gray');

    /**
     * Solo con `variant='label'`: `false` quita el borde y deja el fondo tintado, para una cifra que ya va dentro de
     * una tarjeta con borde (la de cada destino del hub de Repositorios, DD-179). El borde queda transparente, así que
     * la pastilla mide lo mismo con él o sin él.
     */
    readonly bordered = input(true, { transform: booleanAttribute });

    /**
     * Talla: `sm` (por defecto) es la del Kit, 12 en negrita; `md` es 14 en semibold, la del texto de una fila de datos,
     * para una píldora que hace de valor junto a otros valores de 14 (el resumen de la ficha de grupo, DD-186). Va por
     * la entrada `pt` de `p-tag`, no con CSS encima.
     */
    readonly size = input<'sm' | 'md'>('sm');

    protected readonly tagPt = computed(() =>
        this.size() === 'md'
            ? {
                  root: {
                      style: {
                          'font-size': 'var(--sc-font-size-body-2)',
                          'line-height': 'var(--sc-line-height-body-2)',
                          'font-weight': 'var(--sc-font-weight-semibold)',
                          padding: 'var(--sc-spacing-0-125) var(--sc-spacing-0-75)'
                      }
                  }
              }
            : undefined
    );

    /** CSS custom props del color de la etiqueta (consumidas por el SCSS). */
    protected readonly labelVars = computed<Record<string, string>>(() => {
        const c = this.labelColor();

        return {
            '--label-bg': `var(--sc-label-${c}-bg)`,
            '--label-text': `var(--sc-label-${c}-text)`,
            '--label-border': this.bordered() ? `var(--sc-label-${c}-border)` : 'transparent'
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

    /** El valor entero para el tooltip si la pastilla está recortada; vacío (sin tooltip) si cabe. */
    protected readonly valorRecortado = signal('');

    /**
     * Una etiqueta no se parte: si no cabe, el tema la recorta con puntos
     * suspensivos (`tagOneLineCss`). Al pasar el ratón, el valor entero sale en
     * el tooltip del Kit (`pTooltip`, DD-212), pero SOLO si está recortada: en las
     * que caben repetiría lo que ya se lee. En la variante `label` lo hace
     * `showOnEllipsis` sobre `.sc-tag__text`, que es quien recorta. En la de
     * `p-tag` recorta `.p-tag-label`, dentro de PrimeNG, y `showOnEllipsis` mide
     * el elemento que lleva el tooltip (la pastilla entera, que no se desborda):
     * por eso se mide aquí. Va en `pointerenter`, que llega antes que el
     * `mouseenter` con el que el tooltip decide si sale, y se aplica en el acto
     * (`detectChanges`) para que lo encuentre ya puesto. Se mide al entrar y no
     * antes porque el recorte depende del ancho de la columna, que cambia con la
     * ventana.
     */
    protected medirRecorte(): void {
        const texto = this.host.nativeElement.querySelector<HTMLElement>('.p-tag-label');
        const recortada = !!texto && texto.scrollWidth > texto.clientWidth;
        this.valorRecortado.set(recortada ? (this.value() ?? '') : '');
        this.cdr.detectChanges();
    }
}
