import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Una pestaña de la sección: ruta hija + rótulo. */
interface FundamentosTab {
  readonly path: string;
  readonly label: string;
}

/**
 * Shell de la sección «Fundamentos»: fila de pestañas + `<router-outlet>`.
 *
 * Existe para dar JERARQUÍA al top-nav. Escala/color y tipografía son la materia prima
 * del sistema; agrupadas bajo Fundamentos, la barra de primer nivel queda más corta. El
 * smoke del preset («Tema PrimeNG») fue la tercera pestaña, pero ahora que cada componente
 * `sc-*` ya demuestra el tema no gana un hueco de sección: se movió a Lab (verificación),
 * accesible en `/tema` con redirect desde `/fundamentos/tema`.
 */
@Component({
  selector: 'app-fundamentos-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  styleUrl: './fundamentos-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="fnd-tabs" aria-label="Fundamentos">
      @for (tab of tabs; track tab.path) {
        <a [routerLink]="tab.path" routerLinkActive="is-active">{{ tab.label }}</a>
      }
    </nav>
    <router-outlet />
  `,
})
export class FundamentosShellComponent {
  protected readonly tabs: readonly FundamentosTab[] = [
    { path: 'escala-color', label: 'Escala y color' },
    { path: 'tipografia', label: 'Tipografía' },
    { path: 'patrones', label: 'Patrones' },
  ];
}
