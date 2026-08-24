import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Shell de sc-docs: barra superior + outlet.
 *
 * La nav son CUATRO secciones, no una lista plana de páginas: Fundamentos agrupa
 * escala/color + tipografía + tema (ver `pages/fundamentos`). Lab y el interruptor de
 * tema viven en un cluster aparte a la derecha porque son herramientas, no doc.
 *
 * El interruptor va con TEXTO y no con `<sc-icon>` a propósito: este shell es eager, y
 * el mapa de glifos de `@smartcontact-hub/icons` mete +127 kB en `main.js` (573,85 →
 * 701,15 kB, medido) — se sale del presupuesto de bundle por un glifo decorativo. Dentro
 * de las páginas, que son lazy, usar `sc-icon` sí sale gratis.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  toggleDark(): void {
    document.documentElement.classList.toggle('sc-dark');
  }
}
