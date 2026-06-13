import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ScFormDangerZoneComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-formdangerzone-demo',
  imports: [ScFormDangerZoneComponent],
  templateUrl: './formdangerzone-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDangerZoneDemoComponent {
  readonly fired = signal(false);

  onAction(): void {
    this.fired.set(true);
  }
}
