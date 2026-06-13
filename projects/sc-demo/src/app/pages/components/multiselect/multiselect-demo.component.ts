import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScMultiSelectComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-multiselect-demo',
  imports: [ScMultiSelectComponent],
  templateUrl: './multiselect-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiSelectDemoComponent {
  readonly groups = ['Soporte', 'Ventas', 'Postventa', 'Calidad'];
}
