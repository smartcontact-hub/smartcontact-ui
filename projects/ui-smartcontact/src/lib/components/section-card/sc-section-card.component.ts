import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SC_ICON_SIZE_LG, ScIconComponent } from '@smartcontact-hub/icons';

/**
 * Section (nivel raíz) del árbol Section → Subsection → Slot (§4.5, nodo Figma
 * `12610:23080`). Contenedor GRIS redondeado con cabecera para agrupar campos
 * de formulario. Aloja 1–4 `sc-subsection` (cards blancas) **o** contenido plano
 * directo — **retrocompatible**: una `sc-section-card` con campos proyectados sin
 * subsecciones renderiza idéntica al card plano (el gap entre subsecciones lo
 * pone la propia `sc-subsection`, no este body).
 *
 * `collapsible` (DD#57) convierte la cabecera en botón y colapsa el body;
 * `initiallyCollapsed` arranca plegado (secciones "avanzadas"). `flush` (SnowUI
 * S62) quita la caja (fondo/borde/radio/padding lateral) para sangrar el
 * contenido. `anchorId` expone `[id]`/`[data-section-anchor]` + `scroll-margin-top`
 * para el salto-a-ancla de `sc-form-section-nav`.
 */
@Component({
  selector: 'sc-section-card',
  imports: [TranslateModule, ScIconComponent],
  templateUrl: './sc-section-card.component.html',
  styleUrl: './sc-section-card.component.scss',
  host: {
    '[class.sc-section-card--flush]': 'flush()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScSectionCardComponent {
  readonly titleKey = input.required<string>();
  readonly hintKey = input<string | null>(null);
  /** Anchor id que usa `sc-form-section-nav` para scroll-spy / salto a la sección. */
  readonly anchorId = input<string | null>(null);
  /** Icono opcional de la cabecera. Cualquier nombre de Material Symbols. */
  readonly icon = input<string | null>(null);
  /** Cuando es true, la cabecera actúa de toggle y el body colapsa. */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Estado colapsado inicial cuando `collapsible` es true. Ignorado si no. */
  readonly initiallyCollapsed = input(false, { transform: booleanAttribute });
  /** Flush (sin caja): quita fondo/borde/radio + padding lateral; el contenido va a sangre. */
  readonly flush = input(false, { transform: booleanAttribute });

  protected readonly chevronDownIcon = 'expand_more';
  protected readonly chevronRightIcon = 'chevron_right';
  protected readonly iconSizeLg = SC_ICON_SIZE_LG;

  private readonly userToggled = signal<boolean | null>(null);

  /** Estado abierto efectivo — el toggle del usuario gana; si no, `!initiallyCollapsed`. */
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
