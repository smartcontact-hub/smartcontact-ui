import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  ColumnDef,
  ScColumnSelectorComponent,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-columnselector-demo',
  imports: [ScColumnSelectorComponent],
  templateUrl: './columnselector-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnSelectorDemoComponent {
  readonly columns: readonly ColumnDef[] = [
    { key: 'name', label: 'Nombre', locked: true },
    { key: 'group', label: 'Grupo' },
    { key: 'status', label: 'Estado' },
    { key: 'lastCall', label: 'Última llamada', defaultVisible: false },
  ];
}
