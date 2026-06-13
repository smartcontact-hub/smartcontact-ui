import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScChipComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-chip-demo',
  imports: [ScChipComponent],
  templateUrl: './chip-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipDemoComponent {}
