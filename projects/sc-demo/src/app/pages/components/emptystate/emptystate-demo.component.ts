import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScEmptyStateComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-emptystate-demo',
  imports: [ScEmptyStateComponent],
  templateUrl: './emptystate-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateDemoComponent {}
