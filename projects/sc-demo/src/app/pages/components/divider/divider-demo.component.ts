import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScDividerComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const HORIZONTAL_SNIPPET = `Texto antes del separador.
<sc-divider />
Texto después.
<sc-divider align="center"><span>o</span></sc-divider>
<sc-divider type="dashed" />`;

const VERTICAL_SNIPPET = `<div class="row" style="height: 4rem">
  Izquierda
  <sc-divider layout="vertical" />
  Derecha
</div>`;

/** Demo de `sc-divider` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-divider-demo',
  imports: [ScDividerComponent, StoryHostComponent],
  templateUrl: './divider-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly horizontalTpl = viewChild<TemplateRef<StoryContext>>('horizontal');
  protected readonly verticalTpl = viewChild<TemplateRef<StoryContext>>('vertical');

  protected readonly meta: StoryMeta = {
    tag: 'sc-divider',
    title: 'Divider',
    description:
      'Separador de contenidos. Wrapper fino de PrimeNG con orientación (horizontal/vertical), trazo (solid/dashed/dotted), alineación del contenido y proyección de texto/icono en medio.',
    argTypes: [
      { name: 'layout', control: { kind: 'select', options: ['horizontal', 'vertical'] } },
      { name: 'type', control: { kind: 'select', options: ['solid', 'dashed', 'dotted'] } },
      {
        name: 'align',
        control: { kind: 'select', options: ['left', 'center', 'right', 'top', 'bottom'] },
      },
    ],
    defaultArgs: {
      layout: 'horizontal',
      type: 'solid',
      align: '',
    },
    props: [
      {
        name: 'layout',
        type: 'ScDividerLayout',
        default: "'horizontal'",
        description: 'horizontal · vertical',
      },
      {
        name: 'type',
        type: 'ScDividerType',
        default: "'solid'",
        description: 'solid · dashed · dotted',
      },
      {
        name: 'align',
        type: 'ScDividerAlign | null',
        default: 'null',
        description:
          'Alineación del contenido proyectado. Horizontal: left/center/right; vertical: top/center/bottom.',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ho = this.horizontalTpl();
    const ve = this.verticalTpl();
    if (!pg || !ho || !ve) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Horizontal', template: ho, snippet: HORIZONTAL_SNIPPET },
      { name: 'Vertical', template: ve, snippet: VERTICAL_SNIPPET },
    ];
  });
}
