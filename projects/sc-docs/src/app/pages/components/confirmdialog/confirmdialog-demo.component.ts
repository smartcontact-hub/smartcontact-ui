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

const LIMITS_SNIPPET = `// Entre 320 y 480 px de ancho y hasta 400 de alto. Título de 1 a 2 líneas y descripción de 1 a 4: lo que pase
// se recorta con «…» y el texto entero queda al pasar el ratón.
// Hasta tres botones: la tercera acción va a la izquierda y con menos peso.
const choice = await this.confirm.choose({
  title, body, acceptLabel: 'Guardar', rejectLabel: 'Cancelar', tertiaryLabel: 'No guardar',
}); // 'accept' | 'reject' | 'tertiary'`;

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
  protected readonly limitsTpl = viewChild<TemplateRef<StoryContext>>('limits');

  protected readonly meta: StoryMeta = {
    tag: 'sc-confirmdialog',
    title: 'ConfirmDialog',
    description:
      'Diálogo de confirmación imperativo vía `ScConfirmService.request()` (devuelve una promesa `boolean`). El host `<sc-confirmdialog>` se coloca una vez; el tono (primary/danger) y el énfasis (accept/reject) se pasan por llamada. Con `target`, la pregunta sale en un globo (`p-confirmpopup`) pegado a lo que se pulsó: para una frase sobre esa acción; lo que hay que explicar, en el diálogo (DD-205). Mide entre 320 y 480 px de ancho y hasta 400 de alto; el título ocupa de 1 a 2 líneas y la descripción de 1 a 4, y lo que pase se recorta. Lleva 2 botones, o 3 con `ScConfirmService.choose()`. Pulsa un botón para pedir confirmación.',
    argTypes: [],
    defaultArgs: {},
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const tr = this.triggersTpl();
    const pp = this.popupTpl();
    const lm = this.limitsTpl();
    if (!pg || !tr || !pp || !lm) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Tonos y énfasis', template: tr, snippet: TRIGGERS_SNIPPET },
      { name: 'Junto al botón', template: pp, snippet: POPUP_SNIPPET },
      { name: 'Medidas y límites', template: lm, snippet: LIMITS_SNIPPET },
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

  async askLong(): Promise<void> {
    const ok = await this.confirm.request({
      title: '¿Eliminar la regla de enrutamiento «Atención prioritaria a clientes de empresa en horario extendido de fin de semana»?',
      body: 'Las conversaciones que entren por esta regla pasarán a la regla por defecto del canal. Los informes conservan el histórico de lo que ya se enrutó, pero dejarás de ver la regla en el listado y no podrás recuperarla desde aquí. Si otra regla depende de ella, revísala antes: dejará de saltar a esta en cuanto la elimines. Esta acción no se puede deshacer.',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptTone: 'danger',
    });
    this.result.set(ok ? 'aceptado' : 'rechazado');
  }

  async askThree(): Promise<void> {
    const choice = await this.confirm.choose({
      title: '¿Guardar los cambios?',
      body: 'Si sales sin guardar, perderás lo que has cambiado en la ficha.',
      acceptLabel: 'Guardar',
      rejectLabel: 'Cancelar',
      tertiaryLabel: 'No guardar',
    });
    this.result.set({ accept: 'aceptado', reject: 'rechazado', tertiary: 'tercera' }[choice]);
  }
}
