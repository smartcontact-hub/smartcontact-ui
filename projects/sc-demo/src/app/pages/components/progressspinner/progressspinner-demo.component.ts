import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScProgressSpinnerComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-progressspinner-demo',
  imports: [ScProgressSpinnerComponent],
  templateUrl: './progressspinner-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressSpinnerDemoComponent {}
