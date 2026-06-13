import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScButtonComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-button-demo',
  imports: [ScButtonComponent],
  templateUrl: './button-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDemoComponent {}
