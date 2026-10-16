import { ChangeDetectionStrategy, Component, computed, HostListener, inject, type TemplateRef, viewChild } from '@angular/core';
import { Router, RouterOutlet, isActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScButtonComponent as ButtonComponent,
  ScFormSectionNavComponent as FormSectionNavComponent,
  type FormNavSection,
} from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { ResultadoAccionService, SectionLinksService } from '@core/services';
import { ContactCenterBorradorService } from '../aed/contact-center-borrador.service';

/** Las tres secciones de Contact Center (Figma 224:9167): Servicio, Agentes y Grupos. */
const SECCIONES = [
  { id: 'servicio', path: '/config/aed/servicio', labelKey: 'config.sidebar.servicio_label', icon: 'call' },
  { id: 'agentes', path: '/config/aed/agentes', labelKey: 'config.sidebar.agentes_label', icon: 'headphones' },
  { id: 'grupos', path: '/config/aed/grupos', labelKey: 'config.sidebar.grupos_label', icon: 'group' },
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
 * del mismo árbol de URL (`SectionLinksService` y `isActive`).
 *
 * UN SOLO GUARDAR (DD-211 §7): las tres secciones se editan como una ficha. Su borrador vive aquí
 * (`ContactCenterBorradorService`), así que cambiar de sección no pregunta ni pierde nada, el índice marca las que
 * tienen cambios y «Guardar» y «Deshacer» van en la barra para las tres. El guardián de cambios está en la ruta de
 * Contact Center, no en cada sección: avisa al salir de Contact Center.
 */
@Component({
  selector: 'sc-settings-shell',
  imports: [ButtonComponent, FormSectionNavComponent, RouterOutlet, TranslateModule],
  providers: [ContactCenterBorradorService],
  templateUrl: './settings-shell.component.html',
  styleUrl: './settings-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsShellComponent implements DirtyAware {
  private readonly router = inject(Router);
  private readonly sectionLinks = inject(SectionLinksService);
  private readonly translate = inject(TranslateService);
  private readonly resultado = inject(ResultadoAccionService);
  protected readonly borrador = inject(ContactCenterBorradorService);

  /** Para el `formDirtyGuard` de la ruta: con cambios en cualquier sección, avisa al salir de Contact Center. */
  readonly formDirty = this.borrador.dirty;

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

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

  /** Guarda las tres secciones a la vez: cada una en su store, y un solo toast. */
  protected save(): void {
    if (!this.borrador.canSave()) return;
    this.borrador.saving.set(true);
    setTimeout(() => {
      this.borrador.guardar();
      this.borrador.saving.set(false);
      this.resultado.contar(this.translate.instant('config.aed.toast.saved'));
    }, 600);
  }

  protected discard(): void {
    this.borrador.deshacer();
  }

  /** `⌘S` / `Ctrl+S` guarda, como en las fichas. */
  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.save();
    }
  }

  /** Cerrar la pestaña con cambios sin guardar, avisa. */
  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.borrador.dirty() && !this.borrador.saving()) event.preventDefault();
  }
}
