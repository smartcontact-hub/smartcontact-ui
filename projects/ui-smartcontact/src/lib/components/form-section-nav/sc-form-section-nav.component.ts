import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input, type OnInit, output } from '@angular/core';
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
  /**
   * Adónde lleva la fila: la URL de la sección, ya preparada por quien pinta el índice (una ruta, o
   * la misma página con `?seccion=`). Con ella la fila es un enlace de verdad: Cmd/Ctrl+clic o el
   * clic central la abren en otra pestaña, y Atrás vuelve a la sección de antes. Sin ella la fila
   * apunta a `#` y solo avisa a la página (compatibilidad; el DS no conoce el router).
   */
  readonly href?: string;
}

let siguienteId = 0;

/**
 * El índice de secciones: una lista de ENLACES, uno por sección, y la sección a la vista marcada
 * como la página actual (`aria-current="page"`). Lo usan las fichas de agente, grupo y usuario, el
 * constructor de reglas y Contact Center (DD-122: un solo índice, y que funcione de una sola forma).
 *
 * Controlado: la página manda `activeId`. Un clic principal sin teclas no navega solo: emite
 * `activeChange` y la página decide (la ficha de grupo, en el alta, no deja salir de General sin
 * nombre ni canales) y navega ella. Cualquier otro gesto de enlace —Cmd/Ctrl, Mayús, Alt o el clic
 * central— lo hace el navegador con el `href` de la fila, la misma regla que `routerLink`.
 *
 * Las marcas de cada fila: lo que falta (punto rojo), los cambios sin guardar (punto de marca) y, en un
 * alta, la sección que se dejó completa (✓, DD-143). Se ve una sola, en ese orden, y se oyen todas.
 *
 * i18n: las etiquetas de cada `FormNavSection.labelKey` y el rótulo `titleKey` los resuelve el
 * consumidor. El nav registra SOLO su copy propio (`sc.formSectionNav.*`: el nombre accesible del
 * `<nav>` y los textos que se oyen con cada marca) — desacoplado de las claves `common.*` de la app
 * de origen. Iconos vía `@smartcontact-hub/icons` (§4.6).
 */
@Component({
  selector: 'sc-form-section-nav',
  standalone: true,
  imports: [ScIconComponent, TranslateModule],
  templateUrl: './sc-form-section-nav.component.html',
  styleUrl: './sc-form-section-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScFormSectionNavComponent implements OnInit {
  /** Las secciones, en orden, tal como se listan en el índice. */
  readonly sections = input.required<readonly FormNavSection[]>();
  /** Qué sección está a la vista. La manda la página (en las del Supervisor, la URL). */
  readonly activeId = input<string | null>(null);
  /**
   * Clave de traducción del nombre accesible del índice, que es lo que oye quien navega por
   * landmarks. Si hay rótulo visible (`titleKey`), el nombre es el rótulo y esta no se usa.
   */
  readonly labelKey = input<string>('sc.formSectionNav.label');
  /**
   * Rótulo visible encima de las filas («Contact Center»), alineado con ellas como en Figma
   * `393:12569`. Es también el nombre del índice (`aria-labelledby`): lo que se ve es lo que se oye.
   * Un rótulo, no un título: no es un encabezado y no compite con el `h1` de la página.
   */
  readonly titleKey = input<string | null>(null);
  /**
   * Flush: el índice de las pantallas con carril (fichas, constructor de reglas y Contact Center),
   * el marco `393:12565` de Figma: sin panel, icono desnudo y el activo como única mancha. Opt-in,
   * default off (el default es el panel con borde). Ver customs-catalog §2.7.
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
   * Se oye con el texto `sc.formSectionNav.sectionHasErrors`, dentro del enlace.
   */
  readonly sectionsWithErrors = input<ReadonlySet<string>>(new Set());

  /**
   * Las secciones con cambios sin guardar: un punto en el color de marca, distinto del rojo de lo
   * que falta, como el «modificado» de un editor. En la ficha hay un solo «Guardar» para todas las
   * secciones (DD-122): el índice dice dónde está lo que se va a guardar. Si una sección tiene las
   * dos cosas, se ve el rojo (es lo que no deja guardar) y se oyen las dos. Se oye con
   * `sc.formSectionNav.sectionHasChanges`.
   */
  readonly sectionsWithChanges = input<ReadonlySet<string>>(new Set());

  /**
   * Las secciones que se dejaron completas, en un alta (DD-143): un ✓ en el verde de éxito detrás de la
   * etiqueta, donde va el punto, para que el índice diga lo que ya está y lo que queda. Lo decide la
   * página (las fichas, cuando se sale de una sección con lo suyo hecho; la abierta no lo lleva). Se ve
   * si la sección no tiene también algo que falta o cambios sin guardar, que ganan; se oye siempre, con
   * `sc.formSectionNav.sectionDone`.
   *
   * Entra con movimiento, el de un icono que cambia de estado (escala, opacidad y desenfoque), solo si
   * llega después de pintar el índice: el que ya estaba al abrir la página no es un cambio que se vea.
   */
  readonly sectionsDone = input<ReadonlySet<string>>(new Set());

  /** El usuario ha pulsado otra sección del índice (clic principal, sin teclas). */
  readonly activeChange = output<string>();

  /** El id del rótulo, para nombrar el `<nav>` con él. */
  protected readonly titleId = `sc-form-nav-title-${siguienteId++}`;

  /** Las que ya estaban hechas al pintar el índice: su ✓ aparece quieto. */
  private hechasAlPintar: ReadonlySet<string> = new Set();

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

  ngOnInit(): void {
    this.hechasAlPintar = new Set(this.sectionsDone());
  }

  protected hasChanges(id: string): boolean {
    return this.sectionsWithChanges().has(id);
  }

  protected isDone(id: string): boolean {
    return this.sectionsDone().has(id);
  }

  /** El ✓ entra con movimiento si la sección se completó con el índice ya a la vista. */
  protected doneEnters(id: string): boolean {
    return !this.hechasAlPintar.has(id);
  }

  protected onJump(event: MouseEvent, section: FormNavSection): void {
    // Con URL, lo que un enlace sabe hacer lo hace el navegador (la regla de `routerLink`). Sin URL
    // no hay adónde abrir otra pestaña: se queda en la página, como siempre.
    const gestoDeEnlace = event.button !== 0 || event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
    if (section.href && gestoDeEnlace) return;
    event.preventDefault();
    this.activeChange.emit(section.id);
  }
}
