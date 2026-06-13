import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ScInputTextComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-inputtext-demo',
  imports: [ScInputTextComponent, FormsModule],
  templateUrl: './inputtext-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputTextDemoComponent {
  readonly name = signal('');
}
