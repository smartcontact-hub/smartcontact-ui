import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { groupCatalog } from './component-catalog';

/**
 * Layout del showcase de componentes: sidebar fija (categorías + búsqueda) + `<router-outlet>`
 * para la página del componente. Envuelve TODAS las páginas (migradas al motor story o aún
 * en formato viejo) — conviven mientras dura la migración. El top-nav y las demás rutas
 * (/foundations, /uso, /reglas) quedan intactas por fuera de este shell.
 */
@Component({
  selector: 'app-storybook-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  styleUrl: '../../storybook/storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-shell">
      <aside class="sb-shell__side">
        <div class="sb-shell__search">
          <input
            type="search"
            placeholder="Buscar componente…"
            aria-label="Buscar componente"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
        </div>
        <nav class="sb-shell__nav">
          @for (group of groups(); track group.category) {
            <div class="sb-shell__group">
              <p class="sb-shell__group-title">{{ group.category }}</p>
              <ul>
                @for (e of group.items; track e.path) {
                  <li>
                    <a [routerLink]="['/components', e.path]" routerLinkActive="is-active">
                      <span>{{ e.label }}</span>
                      @if (e.storyfied) {
                        <span class="sb-shell__badge" title="Formato story">●</span>
                      }
                    </a>
                  </li>
                }
              </ul>
            </div>
          } @empty {
            <p class="sb-shell__empty">Sin resultados.</p>
          }
        </nav>
      </aside>
      <section class="sb-shell__main">
        <router-outlet />
      </section>
    </div>
  `,
})
export class StorybookShellComponent {
  protected readonly query = signal('');
  protected readonly groups = computed(() => groupCatalog(this.query()));
}
