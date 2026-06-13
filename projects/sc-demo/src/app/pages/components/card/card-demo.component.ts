import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScCardComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-card-demo',
  imports: [ScCardComponent],
  templateUrl: './card-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDemoComponent {}
