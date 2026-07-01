import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import {
  ImpactBadge,
  ImpactItem,
  ScImpactPreviewDialogComponent,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

/** Demo de `sc-impact-preview-dialog` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-impactpreviewdialog-demo',
  imports: [ScImpactPreviewDialogComponent, StoryHostComponent],
  templateUrl: './impactpreviewdialog-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpactPreviewDialogDemoComponent {
  readonly open = signal(false);
  readonly items = signal<ImpactItem[]>([
    { id: 1, name: 'Agente Soporte', hint: '(3 grupos)' },
    { id: 2, name: 'Agente Ventas' },
    { id: 3, name: 'Agente Postventa' },
  ]);
  readonly badge: ImpactBadge = {
    fieldLabel: 'Prioridad',
    currentValueLabel: 'Media',
    newValueLabel: 'Alta',
  };
  readonly result = signal<readonly number[] | null>(null);

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');

  protected readonly meta: StoryMeta = {
    tag: 'sc-impact-preview-dialog',
    title: 'ImpactPreviewDialog',
    description:
      'Previsualización de una operación en bloque antes de aplicar. Los items se pueden quitar uno a uno (el último no); el confirm emite los ids supervivientes. Compone la `sc-dialog` canónica. Pulsa el botón para abrirlo.',
    argTypes: [
      { name: 'mode', control: { kind: 'select', options: ['bulkEdit', 'duplicate'] } },
      { name: 'title', control: { kind: 'text' } },
      {
        name: 'confirmLabel',
        control: { kind: 'text' },
        description: 'Override de la etiqueta de confirmar.',
      },
      {
        name: 'cancelLabel',
        control: { kind: 'text' },
        description: 'Override de la etiqueta de cancelar.',
      },
    ],
    defaultArgs: {
      mode: 'bulkEdit',
      title: 'Aplicar cambios a 3 agentes',
      confirmLabel: '',
      cancelLabel: '',
    },
    props: [
      { name: 'visible', type: 'boolean', description: 'Visibilidad (requerido).' },
      {
        name: 'mode',
        type: "'bulkEdit' | 'duplicate'",
        description: 'Tipo de operación previsualizada (requerido).',
      },
      { name: 'title', type: 'string', description: 'Título del diálogo (requerido).' },
      { name: 'items', type: 'readonly ImpactItem[]', description: 'Items afectados (requerido).' },
      {
        name: 'badge',
        type: 'ImpactBadge | null',
        default: 'null',
        description: 'Chip campo/valor actual→nuevo.',
      },
      { name: 'confirmLabel', type: 'string | null', default: 'null' },
      { name: 'cancelLabel', type: 'string | null', default: 'null' },
      { name: 'cancelled', type: 'EventEmitter<void>' },
      {
        name: 'confirm',
        type: 'EventEmitter<readonly number[]>',
        description: 'Ids supervivientes en orden original.',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    if (!pg) return [];
    return [{ name: 'Playground', playground: true, template: pg }];
  });

  onConfirm(ids: readonly number[]): void {
    this.result.set(ids);
    this.open.set(false);
  }
}
