import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScTagComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-tag-demo',
  imports: [ScTagComponent],
  templateUrl: './tag-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagDemoComponent {}
