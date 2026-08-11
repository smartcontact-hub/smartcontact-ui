import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { NAV_ITEMS, SETTINGS_ITEMS } from './nav-data';
import { NavIconComponent } from './nav-icon.component';

/**
 * Shell de CusCare: sidebar fijo + área de contenido + barra inferior de estado.
 *
 * Métrica MEDIDA del sitio real (viewport 1460×792): sidebar `w=90.3`, logo 44×45
 * en `x=23.1 y=5.6`, label "development" a `y=50.6`, e items del nav a
 * `y=145.2 / 227.3 / 312.9 / ~398` → paso ~85px. Ver scratchpad/cuscare-spec.md.
 *
 * La ruta activa se deriva de `NavigationEnd` (patrón de `projects/supervisor`),
 * normalizando el detalle de ticket para que resalte su lista padre.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NavIconComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly router = inject(Router);

  protected readonly navItems = NAV_ITEMS;
  protected readonly settingsItems = SETTINGS_ITEMS;
  protected readonly settingsOpen = signal(false);

  /** URL actual, normalizada: `/tickets/ticket/123` cuenta como `/tickets`. */
  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => this.normalize(e.urlAfterRedirects)),
      startWith(this.normalize(this.router.url)),
    ),
    { initialValue: this.normalize(this.router.url) },
  );

  protected readonly isActive = computed(() => {
    const path = this.currentPath();
    return (itemPath: string) => path === itemPath;
  });

  private normalize(url: string): string {
    const clean = url.split('?')[0].split('#').pop() ?? url;
    // El detalle de un ticket resalta "Tickets" en el nav.
    return clean.replace(/\/tickets\/ticket\/.*$/, '/tickets');
  }
}
