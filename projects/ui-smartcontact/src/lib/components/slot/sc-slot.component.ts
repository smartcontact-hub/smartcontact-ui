import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SC_ICON_SIZE_LG, ScIconComponent } from '@smartcontact-hub/icons';

/**
 * Slot (hoja) del árbol Section → Subsection → Slot (§4.5, nodo Figma
 * `12610:23080`). Fila titulada (icono + título + hint opcional) + área de
 * contenido proyectado. Dentro de una `sc-subsection` se apilan 1–5 slots; el
 * **divisor** entre slots lo pinta el CSS (`:host(:not(:first-of-type))`) — el
 * consumidor no inserta líneas a mano.
 *
 * `titleKey`/`hintKey` son claves i18n que traduce el consumidor (convención del
 * section-card: los títulos son contenido, no chrome del DS).
 */
@Component({
  selector: 'sc-slot',
  imports: [TranslateModule, ScIconComponent],
  templateUrl: './sc-slot.component.html',
  styleUrl: './sc-slot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScSlotComponent {
  readonly titleKey = input.required<string>();
  readonly icon = input<string | null>(null);
  readonly hintKey = input<string | null>(null);

  protected readonly iconSizeLg = SC_ICON_SIZE_LG;
}
