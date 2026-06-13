import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  DeletableEntity,
  ScDeleteEntityDialogComponent,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-deleteentitydialog-demo',
  imports: [ScDeleteEntityDialogComponent],
  templateUrl: './deleteentitydialog-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteEntityDialogDemoComponent {
  readonly openSingle = signal(false);
  readonly openBulk = signal(false);
  readonly singleItem: DeletableEntity[] = [{ id: 1, name: 'Agente Soporte' }];
  readonly bulkItems: DeletableEntity[] = [
    { id: 1, name: 'Agente Soporte' },
    { id: 2, name: 'Agente Ventas' },
    { id: 3, name: 'Agente Postventa' },
  ];
  readonly deleted = signal<string | null>(null);

  onConfirmSingle(): void {
    this.deleted.set('single');
    this.openSingle.set(false);
  }

  onConfirmBulk(ids: readonly number[] | null): void {
    this.deleted.set('bulk:' + (ids?.length ?? 0));
    this.openBulk.set(false);
  }
}
