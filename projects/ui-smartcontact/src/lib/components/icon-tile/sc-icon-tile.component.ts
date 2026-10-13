import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import { ScIconComponent } from '@smartcontact-hub/icons';

/**
 * La baldosa de un icono: un cuadrado redondeado, de un gris frío un paso más hondo que lo que tiene debajo, con un
 * brillo arriba y una sombra mínima, y el icono dentro. Sale del widget de resumen de la ficha de grupo (DD-185, DD-186),
 * medido en proporción al texto: la baldosa, dos veces la letra de al lado; el icono, algo más de la mitad, con su trazo.
 *
 * **Cuándo sí y cuándo no**: para dar a una fila de datos o a un título su icono con peso propio (un resumen, una ficha
 * de datos). Para un icono suelto junto a un texto, `sc-icon`; para una persona, `sc-avatar`.
 *
 * El icono es decorativo (`aria-hidden`): lo que dice lo dice el texto de al lado. Uno del DS por `icon`, u otro propio
 * proyectado dentro (el de un canal, por ejemplo).
 *
 * Uso:
 * ```html
 * <sc-icon-tile icon="call_made" />
 * <sc-icon-tile size="sm"><app-channel-icon channel="whatsapp" /></sc-icon-tile>
 * ```
 */
@Component({
  selector: 'sc-icon-tile',
  standalone: true,
  imports: [ScIconComponent],
  template: `
    @if (icon(); as name) {
      <sc-icon [name]="name" [size]="iconSize()" aria-hidden="true" />
    }
    <ng-content />
  `,
  styleUrl: './sc-icon-tile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'sc-icon-tile',
    '[class.sc-icon-tile--sm]': "size() === 'sm'",
    '[class.sc-icon-tile--strong]': "tone() === 'strong'",
    'aria-hidden': 'true',
  },
})
export class ScIconTileComponent {
  /** El icono del DS (nombre de Material Symbols). Sin él, va el que se proyecte dentro. */
  readonly icon = input<string | null>(null);
  /** `md`: 28 con el icono a 16, para texto de 14. `sm`: 24,5 con el icono a 14, para texto de 12. */
  readonly size = input<'sm' | 'md'>('md');
  /** `strong`: el icono en el color de los títulos (el de un encabezado); por defecto, el del texto. */
  readonly tone = input<'default' | 'strong'>('default');

  protected readonly iconSize = computed(() => (this.size() === 'sm' ? 14 : 16));
}
