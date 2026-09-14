import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScButtonComponent, ScPanelComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const BASIC_SNIPPET = `<sc-panel header="Panel básico">
  Contenido del panel.
</sc-panel>
<sc-panel header="Colapsable" [toggleable]="true">
  Contenido colapsable.
</sc-panel>`;

const ICONS_SNIPPET = `<sc-panel header="Colas">
  <ng-template #icons>
    <sc-button
      icon="more_vert"
      variant="secondary"
      appearance="text"
      size="sm"
      [rounded]="true"
      ariaLabel="Opciones de Colas"
    />
  </ng-template>
  Contenido del panel.
</sc-panel>`;

const FILL_SNIPPET = `<!-- El contenedor fija el alto; el panel lo ocupa y su cuerpo se estira
     (dentro cabe una tabla con scrollHeight="flex"). -->
<div style="height: var(--sc-spacing-18)">
  <sc-panel header="Agentes" [fill]="true">
    <div style="flex: 1 1 auto; min-height: 0; overflow: auto">Contenido que se estira hasta el pie del hueco.</div>
  </sc-panel>
</div>`;

/** Demo de `sc-panel` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-panel-demo',
  imports: [ScButtonComponent, ScPanelComponent, StoryHostComponent],
  templateUrl: './panel-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly basicTpl = viewChild<TemplateRef<StoryContext>>('basic');
  protected readonly iconsTpl = viewChild<TemplateRef<StoryContext>>('iconsStory');
  protected readonly fillTpl = viewChild<TemplateRef<StoryContext>>('fillStory');

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
      { name: 'fill', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      header: 'Panel básico',
      toggleable: false,
      collapsed: false,
      showHeader: true,
      fill: false,
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
        name: 'fill',
        type: 'boolean',
        default: 'false',
        description:
          'Ocupa el alto de su contenedor y estira el cuerpo, para una tabla con scrollHeight="flex" o una rejilla que reparte el alto. Para paneles fijos: al colapsar, el hueco se queda.',
      },
      {
        name: '#icons',
        type: 'TemplateRef',
        description:
          'Acciones de la cabecera, a la derecha del título (plantilla `icons` de Panel en primeng.dev; en Figma, `panel` con `Custom Icon=True`).',
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
    const ic = this.iconsTpl();
    const fi = this.fillTpl();
    if (!pg || !ba || !ic || !fi) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Básico', template: ba, snippet: BASIC_SNIPPET },
      { name: 'Con acciones en la cabecera', template: ic, snippet: ICONS_SNIPPET },
      { name: 'Ocupa su hueco', template: fi, snippet: FILL_SNIPPET },
    ];
  });
}
