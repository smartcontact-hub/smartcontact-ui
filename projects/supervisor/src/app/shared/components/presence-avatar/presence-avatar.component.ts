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

  /**
   * El punto, en proporción con la foto (revisión del 2026-10-09): un 30 % de su diámetro, nunca menos de 8 px, con un
   * aro del color de la superficie que lo separa de la foto. Hasta ese día medía siempre 16 px (el `small` del nativo):
   * en una foto de 24 eran dos tercios y la tapaba. Va dentro de la esquina, sin salirse del cuadro de la foto.
   */
  private readonly dotPx = computed(() => {
    const size = this.size();
    const px = typeof size === 'number' ? size : parseFloat(size) || 32;
    return Math.max(8, Math.round(px * 0.3));
  });

  protected readonly dotStyle = computed<Record<string, string>>(() => {
    const color = this.dotColor();
    const d = `${this.dotPx()}px`;
    // Abajo a la derecha (arriba a la derecha es la posición del nativo).
    return {
      top: 'auto',
      bottom: '0',
      right: '0',
      transform: 'none',
      width: d,
      height: d,
      'min-width': d,
      padding: '0',
      'outline-width': '2px',
      ...(color ? { background: color } : { display: 'none' }),
    };
  });
}
