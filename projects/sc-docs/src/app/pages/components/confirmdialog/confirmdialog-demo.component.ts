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
  provideScConfirm,
  ScButtonComponent,
  ScConfirmDialogComponent,
  ScConfirmService,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const TRIGGERS_SNIPPET = `<sc-confirmdialog />

<sc-button label="Confirmación primaria" (clicked)="ask('primary', 'accept')" />
<sc-button label="Destructiva" variant="danger" (clicked)="ask('danger', 'accept')" />
<sc-button label="Descartar cambios (énfasis reject)" appearance="outlined" (clicked)="ask('danger', 'reject')" />

// En el .ts:
// const ok = await this.confirm.request({ title, body, acceptLabel, rejectLabel, acceptTone, emphasis });`;

/** Demo de `sc-confirmdialog` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-confirmdialog-demo',
  imports: [ScButtonComponent, ScConfirmDialogComponent, StoryHostComponent],
  providers: [provideScConfirm()],
  templateUrl: './confirmdialog-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogDemoComponent {
  private readonly confirm = inject(ScConfirmService);
  readonly result = signal<string>('—');

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly triggersTpl = viewChild<TemplateRef<StoryContext>>('triggers');

  protected readonly meta: StoryMeta = {
    tag: 'sc-confirmdialog',
    title: 'ConfirmDialog',
    description:
      'Diálogo de confirmación imperativo vía `ScConfirmService.request()` (devuelve una promesa `boolean`). El host `<sc-confirmdialog>` se coloca una vez; el tono (primary/danger) y el énfasis (accept/reject) se pasan por llamada. Pulsa un botón para pedir confirmación.',
    argTypes: [],
    defaultArgs: {},
    props: [
      {
        name: 'request()',
        type: '(opts) => Promise<boolean>',
        description: 'API del servicio: title, body, acceptLabel, rejectLabel, acceptTone, emphasis.',
      },
      {
        name: 'acceptTone',
        type: "'primary' | 'danger'",
        default: "'primary'",
        description: 'Color del botón de aceptar.',
      },
      {
        name: 'emphasis',
        type: "'accept' | 'reject'",
        default: "'accept'",
        description: 'Qué botón recibe el foco/énfasis inicial.',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const tr = this.triggersTpl();
    if (!pg || !tr) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Tonos y énfasis', template: tr, snippet: TRIGGERS_SNIPPET },
    ];
  });

  async ask(tone: 'primary' | 'danger', emphasis: 'accept' | 'reject'): Promise<void> {
    const ok = await this.confirm.request({
      title: '¿Eliminar el agente?',
      body: 'Esta acción no se puede deshacer.',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptTone: tone,
      emphasis,
    });
    this.result.set(ok ? 'aceptado' : 'rechazado');
  }
}
