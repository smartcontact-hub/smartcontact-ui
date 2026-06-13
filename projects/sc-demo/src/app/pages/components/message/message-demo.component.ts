import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScMessageComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-message-demo',
  imports: [ScMessageComponent],
  templateUrl: './message-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageDemoComponent {}
