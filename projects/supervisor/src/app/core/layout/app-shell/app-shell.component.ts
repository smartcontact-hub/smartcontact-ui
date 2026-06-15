import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopBarComponent } from '../top-bar/top-bar.component';

/**
 * Application shell — sidebar on the left, top bar above the routed view.
 * Mirrors the React prototype's `AppLayout` (DD#293 placeholder until the
 * global Ctrl+Z undo handler lands as part of the undo-stack feature).
 */
@Component({
  selector: 'sc-app-shell',
  imports: [RouterOutlet, SidebarComponent, TopBarComponent, TranslateModule],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {}
