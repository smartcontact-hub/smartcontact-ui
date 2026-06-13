import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScDividerComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-divider-demo',
  imports: [ScDividerComponent],
  templateUrl: './divider-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerDemoComponent {}
