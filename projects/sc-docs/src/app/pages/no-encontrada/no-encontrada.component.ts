import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ScButtonComponent, ScCommandPaletteService } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { MascotaComponent } from '../../shared/mascota/mascota.component';

/**
 * La página de una dirección que no existe (la ruta `**`).
 *
 * Antes no había: el router no casaba la dirección, cancelaba la navegación y la doc se quedaba en blanco, sin decir
 * nada. Pasa con enlaces viejos (rutas que se renombraron), con previews de una rama que ya no tiene esa página y con
 * direcciones mal copiadas. Aquí se dice qué dirección falló y se ofrecen las dos salidas que usa quien se ha perdido
 * en una doc: buscar lo que venía a ver, o volver al principio.
 *
 * La mascota de obras pone la cara: una dirección rota es justo donde la doc está «en obras».
 */
@Component({
  selector: 'app-no-encontrada',
  imports: [MascotaComponent, RouterLink, ScButtonComponent, ScIconComponent],
  templateUrl: './no-encontrada.component.html',
  styleUrl: './no-encontrada.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoEncontradaComponent {
  private readonly palette = inject(ScCommandPaletteService);

  /** La dirección que se pidió, tal cual la escribió quien llega (sin el `#` del enrutado). */
  protected readonly direccion = inject(Router).url;

  protected buscar(): void {
    this.palette.open();
  }
}
