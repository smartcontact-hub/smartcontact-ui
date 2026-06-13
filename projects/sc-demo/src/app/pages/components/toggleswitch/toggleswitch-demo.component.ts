import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ScToggleSwitchComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-toggleswitch-demo',
  imports: [ScToggleSwitchComponent],
  templateUrl: './toggleswitch-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSwitchDemoComponent {
  readonly a = signal(false);
  readonly b = signal(true);
}
