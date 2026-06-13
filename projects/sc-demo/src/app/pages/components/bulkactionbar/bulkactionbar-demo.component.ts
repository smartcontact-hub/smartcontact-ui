import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  BulkActionEntityLabels,
  ScBulkActionBarComponent,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-bulkactionbar-demo',
  imports: [ScBulkActionBarComponent],
  templateUrl: './bulkactionbar-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkActionBarDemoComponent {
  readonly count = signal(3);
  /** Sufijo omitido a propósito → cae al colocado `sc.bulkActionBar.selectedOther`. */
  readonly entity: BulkActionEntityLabels = { singular: 'agente', plural: 'agentes' };
}
