import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet, isActive } from '@angular/router';
import {
  ScFormSectionNavComponent as FormSectionNavComponent,
  type FormNavSection,
} from '@smartcontact-hub/components';

import { SectionLinksService } from '@core/services';

/** Las tres secciones de Contact Center (Figma 224:9167): Servicio, Agentes y Grupos. */
const SECCIONES = [
  { id: 'servicio', path: '/config/aed/servicio', labelKey: 'config.sidebar.servicio_label', icon: 'call' },
  { id: 'agentes', path: '/config/aed/agentes', labelKey: 'config.sidebar.agentes_label', icon: 'person' },
  { id: 'grupos', path: '/config/aed/grupos', labelKey: 'config.sidebar.grupos_label', icon: 'groups' },
] as const;

/**
 * Layout shell for `/config/aed/*` routes (Figma node 224:9167).
 *
 * Rail (izquierda, navegación AED) + columna de contenido. Sin cabecera
 * propia: la orientación la da el breadcrumb de la TopBar ("Configuración AED
 * / [sección]", ver `config.routes.ts`) + el rail (resalta la sección activa).
 * El contenido arranca directo, alineado con el modelo "todo arriba" del resto
 * de la app — sin banda full-width ni título de página de un solo uso.
 *
 * EL ÍNDICE ES EL DE LA APP (DD-122): `sc-form-section-nav`, el mismo de las fichas y del constructor
 * de reglas, con su rótulo «Contact Center» encima. Hasta el 2026-09-27 lo pintaba una pieza propia
 * (`sc-settings-sidebar`, con `routerLink`) que medía igual al píxel pero era otra: dos índices, dos
 * comportamientos. Aquí cada sección es una RUTA hija; el enlace, el clic y la sección activa salen
 * del mismo árbol de URL (`SectionLinksService` y `isActive`), así que el guardián de cambios de cada
 * página sigue preguntando al salir, como con `routerLink`.
 */
@Component({
  selector: 'sc-settings-shell',
  imports: [FormSectionNavComponent, RouterOutlet],
  templateUrl: './settings-shell.component.html',
  styleUrl: './settings-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsShellComponent {
  private readonly router = inject(Router);
  private readonly sectionLinks = inject(SectionLinksService);

  private readonly arboles = SECCIONES.map((s) => this.router.parseUrl(s.path));
  /** Activa como la marcaba `routerLinkActive`: la ruta de la sección o cualquiera por debajo. */
  private readonly activas = this.arboles.map((arbol) => isActive(arbol, this.router));

  protected readonly sections: readonly FormNavSection[] = SECCIONES.map((s, i) => ({
    id: s.id,
    labelKey: s.labelKey,
    icon: s.icon,
    href: this.sectionLinks.href(this.arboles[i]!),
  }));

  protected readonly activeId = computed(() => SECCIONES[this.activas.findIndex((activa) => activa())]?.id ?? null);

  protected go(id: string): void {
    const i = SECCIONES.findIndex((s) => s.id === id);
    if (i >= 0) void this.sectionLinks.go(this.arboles[i]!);
  }
}
