import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScProgressBarComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-progressbar-demo',
  imports: [ScProgressBarComponent],
  templateUrl: './progressbar-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarDemoComponent {}
