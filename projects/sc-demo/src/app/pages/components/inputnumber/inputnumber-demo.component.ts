import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScInputNumberComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-inputnumber-demo',
  imports: [ScInputNumberComponent],
  templateUrl: './inputnumber-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputNumberDemoComponent {}
