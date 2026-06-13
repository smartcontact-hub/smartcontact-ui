import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScPanelComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-panel-demo',
  imports: [ScPanelComponent],
  templateUrl: './panel-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelDemoComponent {}
