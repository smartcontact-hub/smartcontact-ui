import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/** Una pestaña de la sección: ruta hija (también la clave i18n del rótulo). */
interface FundamentosTab {
  readonly path: string;
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
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  styleUrl: './fundamentos-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="fnd-tabs" [attr.aria-label]="'chrome.nav.fundamentos' | translate">
      @for (tab of tabs; track tab.path) {
        <a [routerLink]="tab.path" routerLinkActive="is-active">
          {{ 'fundamentos.tabs.' + tab.path | translate }}
        </a>
      }
    </nav>
    <router-outlet />
  `,
})
export class FundamentosShellComponent {
  protected readonly tabs: readonly FundamentosTab[] = [
    { path: 'escala-color' },
    { path: 'tipografia' },
    { path: 'patrones' },
  ];
}
