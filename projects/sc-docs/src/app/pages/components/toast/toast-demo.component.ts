import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';

import {
  provideScToast,
  ScButtonComponent,
  ScToastComponent,
  ScToastService,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const TRIGGERS_SNIPPET = `<sc-toast />

<sc-button label="Success" variant="success" (clicked)="toast.success('Título del toast', 'Detalle…')" />
<sc-button label="Info" variant="info" (clicked)="toast.info('Título del toast', 'Detalle…')" />
<sc-button label="Warn" variant="warn" (clicked)="toast.warn('Título del toast', 'Detalle…')" />
<sc-button label="Danger" variant="danger" (clicked)="toast.error('Título del toast', 'Detalle…')" />`;

/** Demo de `sc-toast` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-toast-demo',
  imports: [ScButtonComponent, ScToastComponent, StoryHostComponent],
  providers: [provideScToast()],
  templateUrl: './toast-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastDemoComponent {
  private readonly toast = inject(ScToastService);

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly triggersTpl = viewChild<TemplateRef<StoryContext>>('triggers');

  protected readonly meta: StoryMeta = {
    tag: 'sc-toast',
    title: 'Toast',
    description:
      'Notificación flotante (toast) disparada vía ScToastService. El host `<sc-toast>` se coloca una vez; la posición, duración y anti-duplicados son configurables. Pulsa un botón para lanzar uno.',
    argTypes: [
      {
        name: 'position',
        control: {
          kind: 'select',
          options: [
            'top-left',
            'top-center',
            'top-right',
            'bottom-left',
            'bottom-center',
            'bottom-right',
            'center',
          ],
        },
      },
      { name: 'life', control: { kind: 'number', min: 1000, max: 10000, step: 500 } },
      { name: 'baseZIndex', control: { kind: 'number', min: 0, step: 100 } },
      { name: 'preventDuplicates', control: { kind: 'boolean' } },
      { name: 'preventOpenDuplicates', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      position: 'bottom-right',
      life: 3000,
      baseZIndex: 5000,
      preventDuplicates: false,
      preventOpenDuplicates: false,
    },
    props: [
      {
        name: 'key',
        type: 'string | null',
        default: 'null',
        description: 'Agrupa toasts por clave (multi-host).',
      },
      {
        name: 'position',
        type: 'ScToastPosition',
        default: "'bottom-right'",
        description: 'Esquina/centro donde aparece.',
      },
      { name: 'life', type: 'number', default: '3000', description: 'Duración en ms.' },
      { name: 'baseZIndex', type: 'number', default: '5000', description: 'z-index base.' },
      {
        name: 'preventDuplicates',
        type: 'boolean',
        default: 'false',
        description: 'Ignora toasts idénticos.',
      },
      {
        name: 'preventOpenDuplicates',
        type: 'boolean',
        default: 'false',
        description: 'Ignora duplicados ya visibles.',
      },
      { name: 'closed', type: 'EventEmitter<ScToastCloseEvent>', description: 'Output al cerrar.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const tr = this.triggersTpl();
    if (!pg || !tr) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Disparadores', template: tr, snippet: TRIGGERS_SNIPPET },
    ];
  });

  protected show(severity: 'success' | 'info' | 'warn' | 'error'): void {
    this.toast[severity]('Título del toast', 'Detalle del mensaje de ejemplo.');
  }
}
