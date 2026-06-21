import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ScIconComponent } from '@smartcontact-hub/icons';

import { SC_FORM_SECTION_NAV_TRANSLATIONS } from './i18n/sc-form-section-nav.translations';

export interface FormNavSection {
  /** Stable id used by the parent to identify the active section. */
  readonly id: string;
  /** i18n key for the link label. */
  readonly labelKey: string;
  /** Material Symbols icon name shown to the left of the label. Optional. */
  readonly icon?: string;
}

/**
 * Controlled in-form section nav. Each item is a tab — the parent owns
 * `activeId` and the nav emits `activeChange` when the user clicks. Used
 * by the form shells (agents / groups / users) where each section is a
 * switchable pane instead of a scrolled block.
 *
 * i18n: las etiquetas de cada `FormNavSection.labelKey` las resuelve el
 * consumidor. El nav registra SOLO su copy propio (`sc.formSectionNav.*`:
 * rótulo accesible del `<nav>` + aria-label del punto de error) — desacoplado
 * de las claves `common.*` de la app de origen. Iconos vía `@smartcontact-hub/icons`
 * (§4.6).
 */
@Component({
  selector: 'sc-form-section-nav',
  standalone: true,
  imports: [ScIconComponent, TranslateModule],
  templateUrl: './sc-form-section-nav.component.html',
  styleUrl: './sc-form-section-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScFormSectionNavComponent {
  readonly sections = input.required<readonly FormNavSection[]>();
  readonly activeId = input<string | null>(null);
  readonly labelKey = input<string>('sc.formSectionNav.label');
  /**
   * Flush: el índice se renderiza como PANEL embebido del rail (fondo, radio,
   * padding; chip 32, activo gris-100), 1:1 con el Figma de editar-agente
   * (12277:4185), referencia común de agents/groups/users. Opt-in, default off.
   * Ver customs-catalog §2.7.
   */
  readonly flush = input(false, { transform: booleanAttribute });

  /**
   * Set of section ids that currently have required fields empty (or invalid
   * required state). Each id present here renders a red dot next to the
   * label, indicating "te falta algo aquí". Updates en tiempo real al
   * rellenar los campos faltantes.
   *
   * NO incluye errores de formato (e.g. email malformado) — solo "required
   * vacíos". Decisión consciente: la bola roja en el nav señala bloqueos de
   * guardado, no warnings cosméticos. Errors de formato se ven en el campo
   * mismo.
   *
   * Aria-label del dot via key `sc.formSectionNav.sectionHasErrors` para
   * screen readers.
   */
  readonly sectionsWithErrors = input<ReadonlySet<string>>(new Set());

  readonly activeChange = output<string>();

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    const translate = inject(TranslateService);
    for (const [language, dict] of Object.entries(SC_FORM_SECTION_NAV_TRANSLATIONS)) {
      translate.setTranslation(language, dict, true);
    }
  }

  protected hasError(id: string): boolean {
    return this.sectionsWithErrors().has(id);
  }

  protected onJump(event: MouseEvent, id: string): void {
    event.preventDefault();
    this.activeChange.emit(id);
  }
}
