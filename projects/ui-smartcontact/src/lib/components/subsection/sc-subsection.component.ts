import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SC_ICON_SIZE_LG, ScIconComponent } from '@smartcontact-hub/icons';

/**
 * Subsección (nivel medio) del árbol Section → Subsection → Slot (§4.5, nodo
 * Figma `12610:23080`). Card BLANCA con cabecera propia (icono + título + hint);
 * dentro de una `sc-section-card` se apilan 1–4 subsecciones (gap por su propio
 * `:host`, no por flex del body de la sección — así el contenido plano de la
 * sección no se ve afectado). Aloja 1–5 `sc-slot`.
 *
 * `collapsible` está cableado (misma lógica que la sección) pero **default-off**:
 * el colapso vive en la sección salvo que el consumidor lo active aquí.
 */
@Component({
  selector: 'sc-subsection',
  imports: [TranslateModule, ScIconComponent],
  templateUrl: './sc-subsection.component.html',
  styleUrl: './sc-subsection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScSubsectionComponent {
  readonly titleKey = input.required<string>();
  readonly hintKey = input<string | null>(null);
  readonly icon = input<string | null>(null);
  readonly collapsible = input<boolean>(false);
  readonly initiallyCollapsed = input<boolean>(false);

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
