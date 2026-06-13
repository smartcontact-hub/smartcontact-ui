import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScGroupPopoverComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-grouppopover-demo',
  imports: [ScGroupPopoverComponent],
  templateUrl: './grouppopover-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupPopoverDemoComponent {
  readonly few = [{ id: 1, name: 'Soporte', active: true }, { id: 2, name: 'Ventas', active: true }];
  readonly many = [
    { id: 1, name: 'Soporte', active: true },
    { id: 2, name: 'Ventas', active: true },
    { id: 3, name: 'Postventa', active: true },
    { id: 4, name: 'Calidad', active: true },
    { id: 5, name: 'Retención', active: true },
    { id: 6, name: 'Backoffice', active: true },
    { id: 7, name: 'Incidencias', active: true },
  ];
}
