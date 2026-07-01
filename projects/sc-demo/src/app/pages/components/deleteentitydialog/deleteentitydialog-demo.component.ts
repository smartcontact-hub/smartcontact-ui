import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import {
  DeletableEntity,
  ScDeleteEntityDialogComponent,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

/** Demo de `sc-delete-entity-dialog` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-deleteentitydialog-demo',
  imports: [ScDeleteEntityDialogComponent, StoryHostComponent],
  templateUrl: './deleteentitydialog-demo.component.html',
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

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');

  protected readonly meta: StoryMeta = {
    tag: 'sc-delete-entity-dialog',
    title: 'DeleteEntityDialog',
    description:
      'Diálogo de confirmación de borrado sobre la `sc-dialog` canónica. Single: retype del nombre (+ botón copiar vía ScClipboardService). Bulk: chips quitables (el último no auto-cierra). Pulsa un botón para abrirlo.',
    argTypes: [
      { name: 'entitySingular', control: { kind: 'text' } },
      { name: 'entityPlural', control: { kind: 'text' } },
      {
        name: 'singleDetailMessage',
        control: { kind: 'text' },
        description: 'Párrafo extra bajo el cuerpo (modo single).',
      },
      {
        name: 'bulkFooterMessage',
        control: { kind: 'text' },
        description: 'Párrafo de pie (modo bulk).',
      },
    ],
    defaultArgs: {
      entitySingular: 'agente',
      entityPlural: 'agentes',
      singleDetailMessage: '',
      bulkFooterMessage: '',
    },
    props: [
      { name: 'visible', type: 'boolean', description: 'Visibilidad (requerido).' },
      {
        name: 'mode',
        type: "'single' | 'bulk'",
        description: 'single = retype del nombre · bulk = chips quitables.',
      },
      { name: 'items', type: 'readonly DeletableEntity[]', description: 'Entidades a borrar (requerido).' },
      { name: 'entitySingular', type: 'string', description: 'Nombre singular de la entidad (requerido).' },
      { name: 'entityPlural', type: 'string', description: 'Nombre plural de la entidad (requerido).' },
      { name: 'singleDetailMessage', type: 'string | null', default: 'null' },
      { name: 'bulkFooterMessage', type: 'string | null', default: 'null' },
      { name: 'cancelled', type: 'EventEmitter<void>' },
      {
        name: 'confirm',
        type: 'EventEmitter<readonly number[] | null>',
        description: 'Ids supervivientes (bulk) o `null` (single).',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    if (!pg) return [];
    return [{ name: 'Playground', playground: true, template: pg }];
  });

  onConfirmSingle(): void {
    this.deleted.set('single');
    this.openSingle.set(false);
  }

  onConfirmBulk(ids: readonly number[] | null): void {
    this.deleted.set('bulk:' + (ids?.length ?? 0));
    this.openBulk.set(false);
  }
}
