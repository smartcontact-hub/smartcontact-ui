import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  BulkEditCommit,
  BulkEditFieldOption,
  ScBulkEditMenuComponent,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-bulkeditmenu-demo',
  imports: [ScBulkEditMenuComponent],
  templateUrl: './bulkeditmenu-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkEditMenuDemoComponent {
  readonly fields: BulkEditFieldOption[] = [
    {
      key: 'estado',
      label: 'Estado',
      values: [
        { value: 'activo', label: 'Activo' },
        { value: 'pausado', label: 'Pausado' },
      ],
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      values: [
        { value: 'alta', label: 'Alta' },
        { value: 'media', label: 'Media' },
        { value: 'baja', label: 'Baja' },
      ],
    },
  ];
  readonly lastCommit = signal<BulkEditCommit | null>(null);

  onCommit(c: BulkEditCommit): void {
    this.lastCommit.set(c);
  }
}
