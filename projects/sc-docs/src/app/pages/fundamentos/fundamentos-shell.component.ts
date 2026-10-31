import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Sección «Fundamentos»: solo el outlet. Sus páginas (escala y color, tipografía, iconos, patrones) se eligen en el
 * lateral del shell (`app.component`), como en cualquier doc de sistema de diseño; antes las elegía una fila de
 * pestañas aquí, que con el lateral sería una segunda navegación para lo mismo. Se queda como ruta padre para que
 * `/fundamentos` y sus hijas sigan donde estaban.
 */
@Component({
  selector: 'app-fundamentos-shell',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class FundamentosShellComponent {}
