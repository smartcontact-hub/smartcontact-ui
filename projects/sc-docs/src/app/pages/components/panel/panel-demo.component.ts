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

const SEVERITY_SNIPPET = `<sc-panel header="Colas" severity="warn">Hay llamadas esperando más de lo normal.</sc-panel>
<sc-panel header="Agentes" severity="danger">Ningún agente disponible.</sc-panel>`;

const HEADER_SNIPPET = `<sc-panel>
  <ng-template #header let-titleId>
    <div style="display: flex; flex-direction: column; min-width: 0">
      <h3 [id]="titleId" class="sc-text-body-semibold" style="margin: 0">Tiempo medio de espera</h3>
      <span class="sc-text-caption-regular">Colas: Soporte, Ventas</span>
    </div>
  </ng-template>
  Contenido del panel.
</sc-panel>`;

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
  protected readonly severityTpl = viewChild<TemplateRef<StoryContext>>('severityStory');
  protected readonly headerTpl = viewChild<TemplateRef<StoryContext>>('headerStory');

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
      { name: 'severity', control: { kind: 'select', options: ['', 'warn', 'danger'] } },
    ],
    defaultArgs: {
      header: 'Panel básico',
      toggleable: false,
      collapsed: false,
      showHeader: true,
      fill: false,
      severity: '',
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
        name: 'severity',
        type: "'warn' | 'danger' | null",
        default: 'null',
        description:
          'Panel en aviso: borde y anillo de 1 en --sc-border-warning o --sc-border-danger. El motivo lo dice el contenido; el borde lo hace visible de lejos.',
      },
      {
        name: '#header',
        type: 'TemplateRef<{ titleId }>',
        description:
          'Cabecera propia (plantilla `header` de Panel en primeng.dev), para un título que es encabezado o lleva una línea debajo. Pon `[id]="titleId"` en el título: nombra la región del cuerpo.',
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
    const se = this.severityTpl();
    const he = this.headerTpl();
    if (!pg || !ba || !ic || !fi || !se || !he) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Básico', template: ba, snippet: BASIC_SNIPPET },
      { name: 'Con acciones en la cabecera', template: ic, snippet: ICONS_SNIPPET },
      { name: 'Ocupa su hueco', template: fi, snippet: FILL_SNIPPET },
      { name: 'Con aviso', template: se, snippet: SEVERITY_SNIPPET },
      { name: 'Cabecera propia', template: he, snippet: HEADER_SNIPPET },
    ];
  });
}
