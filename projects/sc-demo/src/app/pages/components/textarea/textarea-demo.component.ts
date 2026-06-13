import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScTextareaComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-textarea-demo',
  imports: [ScTextareaComponent],
  templateUrl: './textarea-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaDemoComponent {}
