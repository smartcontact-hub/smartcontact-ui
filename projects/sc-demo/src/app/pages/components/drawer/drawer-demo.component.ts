import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ScButtonComponent, ScDrawerComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-drawer-demo',
  imports: [ScButtonComponent, ScDrawerComponent],
  templateUrl: './drawer-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerDemoComponent {
  readonly open = signal(false);
}
