import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScDatepickerComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-datepicker-demo',
  imports: [ScDatepickerComponent],
  templateUrl: './datepicker-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerDemoComponent {}
