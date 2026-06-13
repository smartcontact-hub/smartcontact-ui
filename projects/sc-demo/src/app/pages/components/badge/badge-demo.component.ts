import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScBadgeComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-badge-demo',
  imports: [ScBadgeComponent],
  templateUrl: './badge-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeDemoComponent {}
