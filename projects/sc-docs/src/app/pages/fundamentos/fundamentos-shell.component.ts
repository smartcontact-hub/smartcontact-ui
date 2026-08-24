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
 * Existe para dar JERARQUÍA al top-nav. Escala/color, tipografía y el smoke del tema son
 * la misma cosa —la materia prima del sistema— y gastaban tres huecos de primer nivel de
 * siete; agrupadas, la barra baja a cuatro destinos. Las páginas hijas no cambian: solo
 * se re-parentan bajo `/fundamentos/*`, con redirects desde las rutas viejas.
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
    { path: 'tema', label: 'Tema PrimeNG' },
  ];
}
