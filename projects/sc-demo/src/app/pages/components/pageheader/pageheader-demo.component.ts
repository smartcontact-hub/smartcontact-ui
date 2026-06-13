import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScPageHeaderComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-pageheader-demo',
  imports: [ScPageHeaderComponent],
  templateUrl: './pageheader-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderDemoComponent {}
