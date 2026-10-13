import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { NAV_ITEMS } from './nav-data';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly router = inject(Router);

  protected readonly items = NAV_ITEMS;

  /** La entrada cuyo path abre la URL actual. */
  protected readonly activeKey = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
      map((url) => NAV_ITEMS.find((item) => url.startsWith(item.path))?.key ?? null),
    ),
    { initialValue: null },
  );

  /** El acceso va a pantalla completa: sin sidebar ni margen. */
  protected readonly isLogin = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.startsWith('/login')),
      startWith(this.router.url.startsWith('/login')),
    ),
    { initialValue: false },
  );

  protected go(key: string): void {
    const item = NAV_ITEMS.find((i) => i.key === key);
    if (item) void this.router.navigateByUrl(item.path);
  }
}
