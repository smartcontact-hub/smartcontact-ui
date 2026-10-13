import { ChangeDetectionStrategy, Component, TemplateRef, computed, viewChild } from '@angular/core';

import { ScIconTileComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const SIZES_SNIPPET = `<sc-icon-tile icon="call" />
<sc-icon-tile icon="call" size="sm" />
<sc-icon-tile icon="alt_route" tone="strong" />`;

/** Demo de `sc-icon-tile` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-icontile-demo',
  imports: [ScIconTileComponent, StoryHostComponent],
  templateUrl: './icontile-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconTileDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly sizesTpl = viewChild<TemplateRef<StoryContext>>('sizes');

  protected readonly meta: StoryMeta = {
    tag: 'sc-icon-tile',
    title: 'IconTile',
    description:
      'La baldosa de un icono: un cuadrado redondeado en relieve, con el icono dentro. Da a una fila de datos o a un título su icono con peso propio (el resumen de las fichas). Medida en proporción al texto de al lado: md, 28 con el icono a 16, para texto de 14; sm, 24,5 con el icono a 14, para texto de 12. Decorativa: lo que dice lo dice el texto.',
    argTypes: [
      { name: 'icon', control: { kind: 'text' } },
      { name: 'size', control: { kind: 'select', options: ['md', 'sm'] } },
      { name: 'tone', control: { kind: 'select', options: ['default', 'strong'] } },
    ],
    defaultArgs: { icon: 'call', size: 'md', tone: 'default' },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const sz = this.sizesTpl();
    if (!pg || !sz) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Tallas y tono', template: sz, snippet: SIZES_SNIPPET },
    ];
  });
}
