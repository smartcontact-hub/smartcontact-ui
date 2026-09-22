import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ScToggleSwitchComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';

import { AdminLabStore } from './admin-lab.store';

/**
 * Los controles del laboratorio, en un botón flotante con su popover.
 *
 * MISMO SITIO QUE EN EL LABORATORIO DEL SIDEBAR, y por el mismo motivo escrito allí: «los
 * controles del ejemplo van en un `p-popover` que abre un botón flotante, para no ocupar la
 * página». Las cuatro pantallas tienen que verse como pantallas del producto para poder
 * juzgarlas; un panel de opciones metido en medio del formulario las convierte en otra cosa.
 *
 * Dentro van las dos únicas cosas que no son producto: saltar entre las cuatro pantallas, y
 * el interruptor que reproduce las grietas de hoy para poder verlas al lado.
 */
@Component({
  selector: 'app-lab-options',
  imports: [
    ButtonModule,
    PopoverModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    ScToggleSwitchComponent,
    ScIconComponent,
  ],
  templateUrl: './lab-options.component.html',
  styleUrl: './lab-options.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabOptionsComponent {
  protected readonly store = inject(AdminLabStore);

  protected readonly screens = [
    { path: '/lab/admin/grupos', labelKey: 'sidebar.groups' },
    { path: '/lab/admin/usuarios', labelKey: 'sidebar.users' },
  ];
}
