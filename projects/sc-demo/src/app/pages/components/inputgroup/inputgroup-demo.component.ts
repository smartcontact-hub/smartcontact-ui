import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';

import { ScInputGroupComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const ADDONS_SNIPPET = `<sc-inputgroup>
  <p-inputgroup-addon>$</p-inputgroup-addon>
  <input pInputText placeholder="Precio" />
  <p-inputgroup-addon>.00</p-inputgroup-addon>
</sc-inputgroup>

<sc-inputgroup size="sm">
  <p-inputgroup-addon>@</p-inputgroup-addon>
  <input pInputText placeholder="Usuario (sm)" />
</sc-inputgroup>`;

/** Demo de `sc-inputgroup` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-inputgroup-demo',
  imports: [ScInputGroupComponent, InputGroupAddonModule, InputTextModule, StoryHostComponent],
  templateUrl: './inputgroup-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputGroupDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly addonsTpl = viewChild<TemplateRef<StoryContext>>('addons');

  protected readonly meta: StoryMeta = {
    tag: 'sc-inputgroup',
    title: 'InputGroup',
    description:
      'Compone un input con addons left/right (texto, icono, botón, checkbox o radio) vía content-projection. Wrapper sobre `<p-inputgroup>`; el contenido son `<p-inputgroup-addon>` + `<input pInputText>`.',
    argTypes: [
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'fluid', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      size: 'md',
      fluid: true,
    },
    props: [
      { name: 'size', type: 'ScInputGroupSize', default: "'md'", description: 'sm · md · lg (matchea sc-inputtext).' },
      {
        name: 'fluid',
        type: 'boolean',
        default: 'true',
        description: 'El grupo ocupa todo el ancho disponible.',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ad = this.addonsTpl();
    if (!pg || !ad) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Con addons', template: ad, snippet: ADDONS_SNIPPET },
    ];
  });
}
