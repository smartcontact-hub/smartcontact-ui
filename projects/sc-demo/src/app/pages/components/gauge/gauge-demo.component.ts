import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScGaugeComponent, type ScGaugeSegment } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-gauge-demo',
  imports: [ScGaugeComponent],
  templateUrl: './gauge-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaugeDemoComponent {
  /** Caso del Agent: mayoría verde + minoría roja. */
  protected readonly bicolor: ScGaugeSegment[] = [
    { value: 180, severity: 'success' },
    { value: 54, severity: 'danger' },
  ];
  protected readonly single: ScGaugeSegment[] = [{ value: 1, severity: 'success' }];
  protected readonly tri: ScGaugeSegment[] = [
    { value: 5, severity: 'success' },
    { value: 2, severity: 'warning' },
    { value: 1, severity: 'danger' },
  ];
}
