import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  ScSectionCardComponent,
  ScSlotComponent,
  ScSubsectionComponent,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-sectioncard-demo',
  imports: [ScSectionCardComponent, ScSubsectionComponent, ScSlotComponent],
  templateUrl: './sectioncard-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCardDemoComponent {}
