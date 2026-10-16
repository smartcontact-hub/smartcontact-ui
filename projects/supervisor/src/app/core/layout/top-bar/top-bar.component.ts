import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

import { injectLangChange } from '@core/utils/lang-change';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { AuthService } from '../../services/auth.service';
import { TopBarSlotService } from './top-bar-slot.service';
// El cheat-sheet de atajos ahora lo renderiza `<sc-keyboard-shortcuts>` del
// paquete, cuya visibilidad la posee `ScKeyboardShortcutsService` publicado.
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScBreadcrumbComponent, ScKeyboardShortcutsService } from '@smartcontact-hub/components';

import { IllustratedAvatarComponent } from '@shared/components';

/** Dónde lleva «Ayuda» del menú del avatar (2026-10-14). */
const AYUDA_URL = 'https://supervisor.smart-contact.com/#/login';

/**
 * TopBar — breadcrumb trail on the left, avatar with user menu on the right.
 *
 * The avatar is the {@link IllustratedAvatarComponent}: hashed from the
 * supervisor's name so the chrome shares a visual language with the
 * agents list (where the same component renders each agent's portrait).
 * Its menu is the native `p-menu` in popup mode: focus, arrows, outside click
 * and Esc (which returns focus to the avatar) come with it.
 */
@Component({
  selector: 'sc-top-bar',
  imports: [
    IconComponent,
    IllustratedAvatarComponent,
    MenuModule,
    NgComponentOutlet,
    NgTemplateOutlet,
    ScBreadcrumbComponent,
    TranslateModule,
  ],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly shortcuts = inject(ScKeyboardShortcutsService);
  private readonly topBarSlot = inject(TopBarSlotService);
  private readonly translate = inject(TranslateService);
  /** Los textos del menú salen de `instant()`: se recalculan al cambiar de idioma. */
  private readonly lang = injectLangChange();

  protected readonly trail = this.breadcrumbs.trail;

  /** El trail como modelo de `sc-breadcrumb` (puente Figma→código). El tramo con
   *  `path` navega; el último no. El "aquí estás" (tramo actual en color pleno +
   *  peso medio) lo añade `sc-breadcrumb` por dentro (su `renderModel`), así que
   *  aquí NO hace falta tocar nada.
   *
   *  `routerLink` y no un `command` que llame a `navigateByUrl` (así estaba hasta el
   *  2026-09-14): con dirección, el tramo es un enlace de verdad, con la manita,
   *  Cmd+clic y «copiar enlace» que da el navegador. Con `command` era texto. */
  protected readonly crumbModel = computed<MenuItem[]>(() =>
    this.trail().map((crumb) => ({
      label: crumb.label,
      routerLink: crumb.path,
    })),
  );

  /** Componente contextual inyectado por la página activa (p.ej. el selector
   * de datos demo de Memory). Vacío en la mayoría de rutas. */
  protected readonly slotComponent = this.topBarSlot.component;

  /** Acciones primarias de la página (CTA / Guardar-Cancelar) proyectadas vía
   * template. Modelo "todo arriba" (experiment S59). */
  protected readonly slotActions = this.topBarSlot.actions;

  /* Hard-coded today; eventually flows from a Supervisor / session service. */
  protected readonly userName = 'Mario Supervisor';
  protected readonly userPhone = '+34 917 945 449';

  protected readonly userMenuOpen = signal(false);
  /** Id del `p-menu`, para el `aria-controls` del avatar. */
  protected readonly userMenuId = 'sc-top-bar-user-menu';

  protected readonly userMenuItems = computed<MenuItem[]>(() => {
    this.lang();
    return [
      // La raya entre la identidad y las acciones, con el separador del propio menú.
      { separator: true },
      {
        label: this.translate.instant('topbar.keyboard_shortcuts'),
        icon: 'sc-icon-font sc-icon-font--keyboard',
        command: () => this.openShortcuts(),
      },
      {
        label: this.translate.instant('topbar.user.help'),
        icon: 'sc-icon-font sc-icon-font--help',
        command: () => this.openHelp(),
      },
      {
        label: this.translate.instant('topbar.user.logout'),
        icon: 'sc-icon-font sc-icon-font--logout',
        command: () => void this.signOut(),
      },
    ];
  });

  protected goToDashboard(): void {
    void this.router.navigateByUrl('/dashboard');
  }

  protected openShortcuts(): void {
    this.shortcuts.toggle();
  }

  /** «Ayuda» lleva al Supervisor de producción, en otra pestaña: esta app no tiene ayuda propia. */
  protected openHelp(): void {
    window.open(AYUDA_URL, '_blank', 'noopener');
  }

  /**
   * Navega PRIMERO y cierra la sesión solo si la navegación sale adelante: con un
   * formulario a medias, el guardia de cambios sin guardar pregunta, y si la persona
   * se queda, sigue dentro con su sesión.
   */
  protected async signOut(): Promise<void> {
    const left = await this.router.navigateByUrl('/login', { state: { signedOut: true } });
    if (left) this.auth.signOut();
  }
}
