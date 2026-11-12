import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ScIconComponent } from '@smartcontact-hub/icons';

/**
 * Avatar circular de una persona. Con `photo` pinta la foto; sin ella, el avatar de tipo Icon del Kit
 * (Avatar · Type=Icon · Circle): el icono de usuario genérico sobre el círculo neutro. No se inventa una cara
 * a partir del nombre: una ilustración que no es de esa persona se lee como si lo fuera.
 *
 * El icono mide la mitad del círculo (14 en el de 28, 28 en el de 56 del Kit) y hereda el `font-size`, así que
 * escala con el `size` sea cual sea (un número en px o un token del DS).
 *
 * El zoom al pasar el ratón replica el par de Figma sin segundo recurso: la foto se escala con una transformación
 * CSS y el círculo exterior la vuelve a recortar al borde original.
 */
@Component({
  selector: 'sc-illustrated-avatar',
  standalone: true,
  imports: [ScIconComponent],
  templateUrl: './illustrated-avatar.component.html',
  styleUrl: './illustrated-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IllustratedAvatarComponent {
  /** El nombre de la persona: es el nombre accesible del avatar (con o sin foto). */
  readonly name = input.required<string>();
  /** La foto subida. Acepta `undefined` para enlazarla directa a un campo opcional de la entidad
   *  (`Agent.photo?: string`) sin `?? null` en cada uso. Sin ella, el icono de usuario. */
  readonly photo = input<string | null | undefined>(null);
  /** Diámetro del círculo: un número son píxeles (por defecto 40); un texto es cualquier longitud CSS,
   *  para pasar un token del DS (`var(--sc-cmp-avatar-width)`) en vez de un número a mano. */
  readonly size = input<number | string>(40);

  protected readonly photoSrc = computed(() => this.photo() ?? null);

  /** El icono, a la mitad del círculo; `sc-icon` con `inherit` toma este `font-size`. */
  protected readonly iconSize = computed(() => `calc(${this.sizePx()} / 2)`);

  protected readonly sizePx = computed(() => {
    const size = this.size();
    return typeof size === 'number' ? `${size}px` : size;
  });
}
