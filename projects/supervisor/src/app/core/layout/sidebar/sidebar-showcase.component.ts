import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SidebarComponent } from './sidebar.component';
import { SidebarVariantService } from './sidebar-variant.service';

/**
 * RAMA DE COMPARACIÓN (`comparar/sidebar`). Solo el sidebar, con la propuesta de selección en cyan,
 * sobre un suelo casi negro para enseñarlo sin la app alrededor. Se puede tocar: se despliega, abre
 * subsecciones y marca la fila pulsada, pero no sale de esta página.
 * El modo de plegado sigue eligiéndose con `?plegado=drawer|slim`.
 */
@Component({
  selector: 'sc-sidebar-showcase',
  imports: [SidebarComponent],
  template: '<sc-sidebar />',
  styles: `
    :host {
      display: block;
      min-block-size: 100dvh;
      background: var(--sc-sidebar-showcase-bg);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarShowcaseComponent {
  constructor() {
    const compare = inject(SidebarVariantService);
    compare.showcase.set(true);
    compare.variant.set('cyan');
  }
}
