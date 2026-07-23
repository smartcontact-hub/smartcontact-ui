import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { SC_ICON_SIZE_2XL, ScIconComponent } from '@smartcontact-hub/icons';

@Component({
    selector: 'sc-card',
    standalone: true,
    imports: [CardModule, ScIconComponent],
    templateUrl: './sc-card.component.html',
    styleUrl: './sc-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScCardComponent {
    @Input() header: string | null = null;

    @Input() subheader: string | null = null;

    /** Icono de cabecera opcional (nombre Material Symbols, p. ej. "auto_awesome"). Null = sin icono. */
    @Input() icon: string | null = null;

    /** Tamaño reservado por la escala del Kit para el icono de título de card (2xl = 21). */
    protected readonly iconSize = SC_ICON_SIZE_2XL;
}
