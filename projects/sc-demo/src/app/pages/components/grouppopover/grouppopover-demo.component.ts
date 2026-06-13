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
  readonly few = [{ id: '1', name: 'Soporte' }, { id: '2', name: 'Ventas' }];
  readonly many = [
    { id: '1', name: 'Soporte' },
    { id: '2', name: 'Ventas' },
    { id: '3', name: 'Postventa' },
    { id: '4', name: 'Calidad' },
    { id: '5', name: 'Retención' },
    { id: '6', name: 'Backoffice' },
    { id: '7', name: 'Incidencias' },
  ];
}
