import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, signal } from '@angular/core';
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
 *
 * `collapsible` es el mismo de `sc-subsection` (default-off): para el tramo que casi nunca
 * se toca, que nace plegado y deja a la vista solo su título y su aclaración. El título
 * entero es el botón, con `aria-expanded`, y el chevron dice hacia dónde va.
 */
@Component({
  selector: 'sc-slot',
  imports: [TranslateModule, ScIconComponent],
  templateUrl: './sc-slot.component.html',
  styleUrl: './sc-slot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScSlotComponent {
  /** Clave de traducción del título. */
  readonly titleKey = input.required<string>();
  /** Icono junto al título. Decorativo. */
  readonly icon = input<string | null>(null);
  /** Clave de traducción de la aclaración bajo el título. */
  readonly hintKey = input<string | null>(null);
  /** Deja plegar y desplegar el slot desde su título. */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Empieza plegado. Solo tiene efecto con `collapsible`. */
  readonly initiallyCollapsed = input(false, { transform: booleanAttribute });

  protected readonly chevronDownIcon = 'expand_more';
  protected readonly chevronRightIcon = 'chevron_right';
  protected readonly iconSizeLg = SC_ICON_SIZE_LG;

  private readonly userToggled = signal<boolean | null>(null);

  /** Estado abierto efectivo: el toggle del usuario gana; si no, `!initiallyCollapsed`. */
  protected readonly open = computed(() => {
    const u = this.userToggled();
    if (u !== null) return u;
    return !this.initiallyCollapsed();
  });

  protected toggle(): void {
    if (!this.collapsible()) return;
    this.userToggled.set(!this.open());
  }
}
