import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import {
  provideScDynamicDialog,
  ScButtonComponent,
  ScDialogComponent,
  ScDynamicDialogService,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';
import { DynamicContentComponent } from './dynamic-content.component';

const DYNAMIC_SNIPPET = `<sc-button label="Abrir dinámico" (clicked)="openDynamic()" />
<p>Resultado dinámico: {{ dynResult() }}</p>

// En el .ts:
// const ref = this.dynamic.open(DynamicContentComponent, { header: 'Diálogo dinámico', width: '28rem' });
// ref.onClose.subscribe((r) => this.dynResult.set(r ?? 'cerrado'));`;

/** Demo de `sc-dialog` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-dialog-demo',
  imports: [ScButtonComponent, ScDialogComponent, StoryHostComponent],
  providers: [provideScDynamicDialog()],
  templateUrl: './dialog-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogDemoComponent {
  private readonly dynamic = inject(ScDynamicDialogService);
  readonly open = signal(false);
  readonly dynResult = signal('—');

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly dynamicTpl = viewChild<TemplateRef<StoryContext>>('dynamic');

  protected readonly meta: StoryMeta = {
    tag: 'sc-dialog',
    title: 'Dialog',
    description:
      'Diálogo modal canónico con dos vías: declarativa (`[(visible)]` two-way, contenido y `modal-actions` proyectados) y dinámica (`ScDynamicDialogService.open()` monta un componente al vuelo). Pulsa un botón para abrirlo.',
    argTypes: [
      { name: 'title', control: { kind: 'text' } },
      { name: 'subtitle', control: { kind: 'text' } },
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre Material (p.ej. delete)' },
      { name: 'width', control: { kind: 'text' } },
      { name: 'closable', control: { kind: 'boolean' } },
      { name: 'hasFooter', control: { kind: 'boolean' } },
      { name: 'bodyless', control: { kind: 'boolean' } },
      { name: 'modal', control: { kind: 'boolean' } },
      {
        name: 'position',
        control: {
          kind: 'select',
          options: [
            'center',
            'top',
            'bottom',
            'left',
            'right',
            'topleft',
            'topright',
            'bottomleft',
            'bottomright',
          ],
        },
      },
      { name: 'draggable', control: { kind: 'boolean' } },
      { name: 'resizable', control: { kind: 'boolean' } },
      { name: 'dismissableMask', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      title: '¿Eliminar el agente?',
      subtitle: 'Esta acción no se puede deshacer.',
      icon: 'delete',
      width: '440px',
      closable: true,
      hasFooter: true,
      bodyless: false,
      modal: true,
      position: 'center',
      draggable: false,
      resizable: false,
      dismissableMask: false,
    },
    props: [
      {
        name: 'visible',
        type: 'model<boolean>',
        default: 'false',
        description: 'Two-way `[(visible)]` o `[visible]` + `(visibleChange)`.',
      },
      { name: 'title', type: 'string', description: 'Título del header (requerido).' },
      { name: 'subtitle', type: 'string | null', default: 'null' },
      {
        name: 'icon',
        type: 'string | null',
        default: 'null',
        description: 'Icono Material del header.',
      },
      { name: 'width', type: 'string', default: "'440px'" },
      { name: 'closable', type: 'boolean', default: 'true', description: 'Muestra la X de cierre.' },
      {
        name: 'hasFooter',
        type: 'boolean',
        default: 'true',
        description: 'Reserva el slot `modal-actions`.',
      },
      {
        name: 'bodyless',
        type: 'boolean',
        default: 'false',
        description: 'Omite la sección de cuerpo (sin banda vacía).',
      },
      { name: 'modal', type: 'boolean', default: 'true' },
      { name: 'position', type: 'ScDialogPosition', default: "'center'" },
      { name: 'draggable', type: 'boolean', default: 'false' },
      { name: 'resizable', type: 'boolean', default: 'false' },
      { name: 'dismissableMask', type: 'boolean', default: 'false' },
      { name: 'cancelled', type: 'EventEmitter<void>', description: 'Cierre por X, ESC o máscara.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const dy = this.dynamicTpl();
    if (!pg || !dy) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Dynamic dialog', template: dy, snippet: DYNAMIC_SNIPPET },
    ];
  });

  openDynamic(): void {
    const ref = this.dynamic.open<DynamicContentComponent, unknown, never, string>(
      DynamicContentComponent,
      { header: 'Diálogo dinámico', width: '28rem' },
    );
    ref.onClose.subscribe((r) => this.dynResult.set(r ?? 'cerrado'));
  }
}
