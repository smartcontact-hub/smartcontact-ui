import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScButtonComponent, ScDrawerComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const PLAYGROUND_SNIPPET = `<!-- "visible" es un model: se abre con "[(visible)]" o, si el estado vive fuera, con
     "[visible]" + "(visibleChange)" como aquí. -->
<sc-button label="Abrir drawer" (clicked)="open.set(true)" />

<sc-drawer
  header="Detalle"
  position="right"
  [modal]="true"
  [visible]="open()"
  (visibleChange)="open.set($event)"
>
  Contenido del drawer.
</sc-drawer>`;

/** Demo de `sc-drawer` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-drawer-demo',
  imports: [ScButtonComponent, ScDrawerComponent, StoryHostComponent],
  templateUrl: './drawer-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerDemoComponent {
  readonly open = signal(false);

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');

  protected readonly meta: StoryMeta = {
    tag: 'sc-drawer',
    title: 'Drawer',
    description:
      'Panel deslizante (drawer) anclado a un borde. Visibilidad vía `[visible]` + `(visibleChange)`; posición, modalidad y cierre son configurables. Pulsa el botón para abrirlo.',
    argTypes: [
      { name: 'header', control: { kind: 'text' } },
      {
        name: 'position',
        control: { kind: 'select', options: ['left', 'right', 'top', 'bottom'] },
      },
      { name: 'modal', control: { kind: 'boolean' } },
      { name: 'dismissible', control: { kind: 'boolean' } },
      { name: 'closeOnEscape', control: { kind: 'boolean' } },
      { name: 'showCloseIcon', control: { kind: 'boolean' } },
      { name: 'fullScreen', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      header: 'Cabecera del drawer',
      position: 'left',
      modal: true,
      dismissible: true,
      closeOnEscape: true,
      showCloseIcon: true,
      fullScreen: false,
    },
    props: [
      { name: 'visible', type: 'boolean', default: 'false', description: '`[visible]` + `(visibleChange)`.' },
      { name: 'header', type: 'string | null', default: 'null' },
      {
        name: 'position',
        type: 'ScOverlayPosition',
        default: "'left'",
        description: 'left · right · top · bottom',
      },
      { name: 'modal', type: 'boolean', default: 'true' },
      {
        name: 'dismissible',
        type: 'boolean',
        default: 'true',
        description: 'Cierra al pulsar la máscara.',
      },
      { name: 'closeOnEscape', type: 'boolean', default: 'true' },
      { name: 'showCloseIcon', type: 'boolean', default: 'true' },
      { name: 'fullScreen', type: 'boolean', default: 'false' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    if (!pg) return [];
    return [{ name: 'Playground', playground: true, template: pg, snippet: PLAYGROUND_SNIPPET }];
  });
}
