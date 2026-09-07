import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ScIconComponent } from '@smartcontact-hub/icons';
import { ScSkeletonComponent } from '@smartcontact-hub/components';

/**
 * Un patrón de pantalla: icono + clave i18n. Los textos (título, la regla en positivo, el
 * anti-patrón y con qué del sistema ya se resuelve) viven en `fundamentos.patterns.principles.<key>`.
 */
interface Principle {
  readonly icon: string;
  readonly key: string;
}

/**
 * Fundamentos → Patrones de pantalla.
 *
 * La barra de calidad al construir una pantalla de producto con este DS. No es teoría:
 * cada patrón apunta a lo que YA lo resuelve (token, componente o regla), para que una
 * pantalla nueva nazca consistente en vez de tener que corregirla después. El orden mezcla
 * lo que el sistema ya te da (color, iconos, carga) con las reglas que no viven en ningún
 * componente (copy, densidad, estabilidad visual).
 */
@Component({
  selector: 'app-patrones',
  standalone: true,
  imports: [ScIconComponent, ScSkeletonComponent, TranslatePipe],
  templateUrl: './patrones.component.html',
  styleUrl: './patrones.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatronesComponent {
  protected readonly heroIcon = 'auto_awesome';

  protected readonly principles: readonly Principle[] = [
    { icon: 'palette', key: 'color' },
    { icon: 'progress_activity', key: 'loading' },
    { icon: 'subject', key: 'copy' },
    { icon: 'grid_view', key: 'icons' },
    { icon: 'table_rows', key: 'density' },
    { icon: 'accessibility_new', key: 'a11y' },
    { icon: 'animation', key: 'motion' },
  ];
}
