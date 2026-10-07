import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

import { PRESENCE_LABEL_KEYS, PRESENCE_TAGS, type PresenceStatus } from '@features/admin/agents/data/agents-data';
import { IllustratedAvatarComponent } from '../illustrated-avatar/illustrated-avatar.component';

/**
 * El avatar de una persona con su estado como burbuja: el `p-overlay-badge` de primeng.dev/avatar («Badge»), sin valor
 * (un punto), abajo a la derecha y del color del estado (DD-185). Sustituye a la columna «Estado» de la tabla de agentes
 * del grupo, y es lo que se ve en el listado de agentes con la columna escondida.
 *
 * Lo del nativo, tal cual: la plantilla del ejemplo y sus entradas (`badgeSize`, `severity` no hace falta: el color va
 * por `style`, su propia entrada). Lo que se desvía, y por qué: la posición. El nativo lo pone arriba a la derecha; aquí
 * va abajo, con `top`/`bottom` y su `translate` por la misma entrada `style`, sin CSS encima de PrimeNG.
 *
 * El estado se dice con palabras: el punto no es el único canal (`aria-label` del grupo y `title`).
 */
@Component({
  selector: 'sc-presence-avatar',
  standalone: true,
  imports: [OverlayBadgeModule, IllustratedAvatarComponent, TranslateModule],
  template: `
    <p-overlay-badge badgeSize="small" [style]="dotStyle()" class="presence-avatar" [attr.title]="label() ? (label()! | translate) : null">
      <sc-illustrated-avatar [name]="name()" [photo]="photo()" [size]="size()" [pool]="pool()" />
    </p-overlay-badge>
    @if (label(); as text) {
      <span class="visually-hidden">{{ text | translate }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresenceAvatarComponent {
  readonly name = input.required<string>();
  readonly photo = input<string | null | undefined>(null);
  readonly size = input<number | string>(32);
  readonly pool = input<'illustrated' | 'abstract'>('illustrated');
  readonly presence = input<PresenceStatus | null | undefined>(null);

  /** La palabra del estado, en el idioma de la pantalla. */
  protected readonly label = computed<string | null>(() => {
    const p = this.presence();
    return p ? PRESENCE_LABEL_KEYS[p] : null;
  });

  /** El color del punto, el del punto de su etiqueta (`--sc-label-<color>-dot`); «Desconectado», el gris. */
  private readonly dotColor = computed(() => {
    const p = this.presence();
    if (!p) return null;
    const tag = PRESENCE_TAGS[p];
    return `var(--sc-label-${'labelColor' in tag ? tag.labelColor : 'gray'}-dot)`;
  });

  protected readonly dotStyle = computed<Record<string, string>>(() => {
    const color = this.dotColor();
    // Abajo a la derecha, sobre el borde del círculo (arriba a la derecha es la posición del nativo).
    return {
      top: 'auto',
      bottom: '0',
      right: '0',
      transform: 'translate(25%, 25%)',
      'transform-origin': '100% 100%',
      ...(color ? { background: color } : { display: 'none' }),
    };
  });
}
