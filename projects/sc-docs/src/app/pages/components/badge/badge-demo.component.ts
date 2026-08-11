import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScBadgeComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const VARIANTS_SNIPPET = `<sc-badge label="3" />
<sc-badge label="5" variant="secondary" />
<sc-badge label="OK" variant="success" />
<sc-badge label="i" variant="info" />
<sc-badge label="!" variant="warning" />
<sc-badge label="9+" variant="danger" />
<sc-badge label="C" variant="contrast" />`;

const SIZES_SNIPPET = `<sc-badge label="s" size="sm" />
<sc-badge label="m" />
<sc-badge label="l" size="lg" />
<sc-badge label="xl" size="xl" />`;

/** Demo de `sc-badge` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-badge-demo',
  imports: [ScBadgeComponent, StoryHostComponent],
  templateUrl: './badge-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly variantsTpl = viewChild<TemplateRef<StoryContext>>('variants');
  protected readonly sizesTpl = viewChild<TemplateRef<StoryContext>>('sizes');

  protected readonly meta: StoryMeta = {
    tag: 'sc-badge',
    title: 'Badge',
    description:
      'Contador / indicador numérico compacto. Wrapper de PrimeNG con variantes de marca y cuatro tamaños.',
    argTypes: [
      { name: 'label', control: { kind: 'text' }, description: 'Contenido del badge.' },
      {
        name: 'variant',
        control: {
          kind: 'select',
          options: ['primary', 'secondary', 'success', 'info', 'warning', 'danger', 'contrast'],
        },
      },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg', 'xl'] } },
    ],
    defaultArgs: {
      label: '3',
      variant: 'primary',
      size: 'md',
    },
    props: [
      { name: 'label', type: 'string | number', default: "''", description: 'Contenido del badge.' },
      {
        name: 'variant',
        type: 'ScBadgeVariant',
        default: "'primary'",
        description: 'primary · secondary · success · info · warning · danger · contrast',
      },
      { name: 'size', type: 'ScBadgeSize', default: "'md'", description: 'sm · md · lg · xl' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const va = this.variantsTpl();
    const sz = this.sizesTpl();
    if (!pg || !va || !sz) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Variantes', template: va, snippet: VARIANTS_SNIPPET },
      { name: 'Tamaños', template: sz, snippet: SIZES_SNIPPET },
    ];
  });
}
