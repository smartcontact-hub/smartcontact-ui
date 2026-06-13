import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ScRadioButtonComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-radiobutton-demo',
  imports: [ScRadioButtonComponent],
  templateUrl: './radiobutton-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioButtonDemoComponent {
  readonly selected = signal<string>('a');
}
