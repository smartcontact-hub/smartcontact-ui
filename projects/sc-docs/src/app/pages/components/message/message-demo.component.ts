import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScMessageComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const SEVERITIES_SNIPPET = `<sc-message text="Mensaje informativo." />
<sc-message text="Operación completada." severity="success" />
<sc-message text="Atención requerida." severity="warn" />
<sc-message text="Algo ha fallado." severity="danger" />
<sc-message text="Mensaje secundario." severity="secondary" />`;

const VARIANTS_SNIPPET = `<sc-message text="Outlined" variant="outlined" />
<sc-message text="Texto plano" variant="text" />
<sc-message text="Small" size="sm" />
<sc-message text="Large" size="lg" />
<sc-message text="Cerrable" [closable]="true" />`;

/** Demo de `sc-message` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-message-demo',
  imports: [ScMessageComponent, StoryHostComponent],
  templateUrl: './message-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly severitiesTpl = viewChild<TemplateRef<StoryContext>>('severities');
  protected readonly variantsTpl = viewChild<TemplateRef<StoryContext>>('variants');

  protected readonly meta: StoryMeta = {
    tag: 'sc-message',
    title: 'Message',
    description:
      'Mensaje inline (banner) con severidad de marca. Wrapper de PrimeNG con variantes, tamaños y opción de cierre.',
    argTypes: [
      { name: 'text', control: { kind: 'text' } },
      {
        name: 'severity',
        control: {
          kind: 'select',
          options: ['info', 'success', 'warn', 'danger', 'secondary', 'contrast'],
        },
      },
      {
        name: 'variant',
        control: { kind: 'select', options: ['simple', 'outlined', 'text'] },
      },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre Material (opcional)' },
      { name: 'closable', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      text: 'Mensaje informativo.',
      severity: 'info',
      variant: 'simple',
      size: 'md',
      icon: '',
      closable: false,
    },
    props: [
      { name: 'text', type: 'string | null', default: 'null', description: 'Texto del mensaje.' },
      {
        name: 'severity',
        type: 'ScSeverity',
        default: "'info'",
        description: 'info · success · warn · danger · secondary · contrast',
      },
      {
        name: 'variant',
        type: "'simple' | 'outlined' | 'text'",
        default: "'simple'",
        description: 'simple · outlined · text',
      },
      { name: 'size', type: 'ScComponentSize', default: "'md'", description: 'sm · md · lg' },
      {
        name: 'icon',
        type: 'string | null',
        default: 'null',
        description: 'Icono Material (ligadura) o legacy `pi pi-*`.',
      },
      { name: 'closable', type: 'boolean', default: 'false', description: 'Muestra botón de cierre.' },
      { name: 'closed', type: 'EventEmitter<unknown>', description: 'Output al cerrar.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const se = this.severitiesTpl();
    const va = this.variantsTpl();
    if (!pg || !se || !va) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Severities', template: se, snippet: SEVERITIES_SNIPPET },
      { name: 'Variantes y tamaños', template: va, snippet: VARIANTS_SNIPPET },
    ];
  });
}
