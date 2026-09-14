import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import type { MenuItem } from 'primeng/api';

import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { TopBarSlotService } from './top-bar-slot.service';
// El cheat-sheet de atajos ahora lo renderiza `<sc-keyboard-shortcuts>` del
// paquete, cuya visibilidad la posee `ScKeyboardShortcutsService` publicado.
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScBreadcrumbComponent, ScKeyboardShortcutsService } from '@smartcontact-hub/components';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { IllustratedAvatarComponent } from '@shared/components';

/**
 * TopBar — breadcrumb trail on the left, avatar with user menu on the right.
 *
 * The avatar is the {@link IllustratedAvatarComponent}: hashed from the
 * supervisor's name so the chrome shares a visual language with the
 * agents list (where the same component renders each agent's portrait).
 * The menu popover is anchored to the avatar and dismissed by
 * {@link ClickOutsideDirective}; Esc returns focus to the trigger.
 */
@Component({
  selector: 'sc-top-bar',
  imports: [
    ButtonComponent,
    ClickOutsideDirective,
    IconComponent,
    IllustratedAvatarComponent,
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
  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly shortcuts = inject(ScKeyboardShortcutsService);
  private readonly topBarSlot = inject(TopBarSlotService);

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
  private readonly avatarBtn = viewChild<ElementRef<HTMLButtonElement>>('avatarBtn');

  protected goToDashboard(): void {
    void this.router.navigateByUrl('/dashboard');
  }

  protected openShortcuts(): void {
    this.shortcuts.toggle();
  }

  protected toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  protected closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  /** Esc closes the menu and returns focus to the avatar trigger. */
  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.userMenuOpen()) return;
    event.preventDefault();
    this.userMenuOpen.set(false);
    this.avatarBtn()?.nativeElement.focus();
  }
}
