import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, numberAttribute, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
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
  imports: [NgTemplateOutlet, TranslateModule, ScIconComponent],
  templateUrl: './sc-section-card.component.html',
  styleUrl: './sc-section-card.component.scss',
  host: {
    '[class.sc-section-card--flush]': 'flush()',
    '[class.sc-section-card--page]': 'headingLevel() === 1',
    '[class.sc-section-card--card]': "surface() === 'card'",
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
  /**
   * Nivel del encabezado: `2` (por defecto) para una sección DENTRO de una página, `1` cuando
   * esta card lleva el título de LA PÁGINA.
   *
   * Existe porque el patrón «el título va contenido en su sección» (Figma Supervisor 393:12588)
   * lo pedían las dos cosas a la vez: la misma caja, la misma posición y el mismo icono, pero un
   * `<h1>` cuando titula la página y un `<h2>` cuando titula una parte de ella. Sin esto, la
   * página que quisiera el patrón tenía que copiarlo a mano —que es lo que pasaba en
   * `config/aed/*`— y a partir de ahí las dos copias derivan.
   *
   * El nivel arrastra el TAMAÑO, porque son dos cosas distintas en la jerarquía: `1` usa los
   * tokens de rol `h3` (18/24) y `2` los de `body` en semibold (14/20). Tres escalones legibles:
   * 18 semibold la página · 14 semibold la sección · 14 regular el contenido.
   *
   * Un documento tiene UN solo `<h1>`, así que `1` es para una card por página. Lo vigila
   * `e2e/supervisor/page-identity.spec.ts`.
   */
  readonly headingLevel = input(2, { transform: numberAttribute });
  /**
   * La PIEL de la caja, con el mismo esqueleto dentro:
   *
   *   `subtle` (por defecto) — gris plano, sin borde, con una línea bajo la cabecera. Es el
   *     contenedor de formulario de siempre: agrupa campos, y las subsecciones blancas de dentro
   *     son las que destacan sobre él.
   *   `card` — superficie blanca con borde y sin línea bajo la cabecera. Es el `Block` de la
   *     maqueta (Figma Supervisor 393:12587): una sección que va SOLA sobre el lienzo y necesita
   *     un filo que la separe de él, no un fondo que la hunda.
   *
   * Existe porque las dos son la misma caja con otra superficie, y tenerlas como dos componentes
   * —que es lo que había: éste y un `settings-card` copiado en `config/aed/*`— significa que la
   * cabecera, el radio y el espaciado se arreglan dos veces, o una sola y la otra deriva.
   */
  readonly surface = input<'subtle' | 'card'>('subtle');

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
