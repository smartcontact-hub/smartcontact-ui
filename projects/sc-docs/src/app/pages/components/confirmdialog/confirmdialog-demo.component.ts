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
} from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const TRIGGERS_SNIPPET = `<sc-confirmdialog />

<sc-button label="Confirmación primaria" (clicked)="ask('primary', 'accept')" />
<sc-button label="Destructiva" variant="danger" (clicked)="ask('danger', 'accept')" />
<sc-button label="Descartar cambios (énfasis reject)" appearance="outlined" (clicked)="ask('danger', 'reject')" />

// En el .ts:
// const ok = await this.confirm.request({ title, body, acceptLabel, rejectLabel, acceptTone, emphasis });`;

const POPUP_SNIPPET = `<sc-button label="Expirar contraseña" variant="secondary" appearance="outlined" (clicked)="askNear($event)" />

// En el .ts: con \`target\`, la misma pregunta sale en un p-confirmpopup pegado a lo pulsado (DD-205).
// const ok = await this.confirm.request({ title, body, acceptLabel, rejectLabel, acceptTone: 'danger', target: event.currentTarget });`;

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
  protected readonly popupTpl = viewChild<TemplateRef<StoryContext>>('popup');

  protected readonly meta: StoryMeta = {
    tag: 'sc-confirmdialog',
    title: 'ConfirmDialog',
    description:
      'Diálogo de confirmación imperativo vía `ScConfirmService.request()` (devuelve una promesa `boolean`). El host `<sc-confirmdialog>` se coloca una vez; el tono (primary/danger) y el énfasis (accept/reject) se pasan por llamada. Con `target`, la pregunta sale en un globo (`p-confirmpopup`) pegado a lo que se pulsó: para una frase sobre esa acción; lo que hay que explicar, en el diálogo (DD-205). Pulsa un botón para pedir confirmación.',
    argTypes: [],
    defaultArgs: {},
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const tr = this.triggersTpl();
    const pp = this.popupTpl();
    if (!pg || !tr || !pp) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Tonos y énfasis', template: tr, snippet: TRIGGERS_SNIPPET },
      { name: 'Junto al botón', template: pp, snippet: POPUP_SNIPPET },
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

  async askNear(event: MouseEvent): Promise<void> {
    const ok = await this.confirm.request({
      title: '¿Expirar contraseña?',
      body: 'Tendrá que crear una contraseña nueva al volver a entrar.',
      acceptLabel: 'Expirar contraseña',
      rejectLabel: 'Cancelar',
      acceptTone: 'danger',
      target: event.currentTarget ?? event.target,
    });
    this.result.set(ok ? 'aceptado' : 'rechazado');
  }
}
