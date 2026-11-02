import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { ScIconComponent } from '@smartcontact-hub/icons';

import { PATRONES } from './patrones-datos';

/**
 * Fundamentos → Patrones de pantalla: el índice.
 *
 * La barra de calidad al construir una pantalla de producto con este DS. No es teoría: cada patrón apunta a lo que YA
 * lo resuelve (token, componente o regla), para que una pantalla nueva nazca consistente en vez de tener que corregirla
 * después. Aquí, una tarjeta por patrón; cada uno tiene su página (`patron.component.ts`), como los de Primer.
 */
@Component({
  selector: 'app-patrones',
  standalone: true,
  imports: [RouterLink, ScIconComponent, TranslatePipe],
  templateUrl: './patrones.component.html',
  styleUrl: './patrones.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatronesComponent {
  protected readonly patrones = PATRONES;
}
