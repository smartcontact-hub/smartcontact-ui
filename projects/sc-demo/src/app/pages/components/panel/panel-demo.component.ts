import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScPanelComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const BASIC_SNIPPET = `<sc-panel header="Panel básico">
  Contenido del panel.
</sc-panel>
<sc-panel header="Colapsable" [toggleable]="true">
  Contenido colapsable.
</sc-panel>`;

/** Demo de `sc-panel` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-panel-demo',
  imports: [ScPanelComponent, StoryHostComponent],
  templateUrl: './panel-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly basicTpl = viewChild<TemplateRef<StoryContext>>('basic');

  protected readonly meta: StoryMeta = {
    tag: 'sc-panel',
    title: 'Panel',
    description:
      'Panel contenedor con cabecera opcional y colapso. Wrapper de PrimeNG; el cuerpo es contenido proyectado.',
    argTypes: [
      { name: 'header', control: { kind: 'text' } },
      { name: 'toggleable', control: { kind: 'boolean' } },
      { name: 'collapsed', control: { kind: 'boolean' } },
      { name: 'showHeader', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      header: 'Panel básico',
      toggleable: false,
      collapsed: false,
      showHeader: true,
    },
    props: [
      {
        name: 'header',
        type: 'string | null',
        default: 'null',
        description: 'Título de la cabecera.',
      },
      {
        name: 'toggleable',
        type: 'boolean',
        default: 'false',
        description: 'Permite colapsar/expandir desde la cabecera.',
      },
      {
        name: 'collapsed',
        type: 'boolean',
        default: 'false',
        description: 'Estado colapsado (two-way con collapsedChange).',
      },
      {
        name: 'showHeader',
        type: 'boolean',
        default: 'true',
        description: 'Muestra u oculta la cabecera.',
      },
      {
        name: 'collapsedChange',
        type: 'EventEmitter<boolean>',
        description: 'Output al cambiar el estado colapsado.',
      },
      { name: 'beforeToggle', type: 'EventEmitter<unknown>', description: 'Output antes del toggle.' },
      { name: 'afterToggle', type: 'EventEmitter<unknown>', description: 'Output tras el toggle.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ba = this.basicTpl();
    if (!pg || !ba) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Básico', template: ba, snippet: BASIC_SNIPPET },
    ];
  });
}
