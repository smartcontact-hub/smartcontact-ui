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
  width="32rem"
  topOffset="var(--sc-spacing-4)"
  [modal]="true"
  [visible]="open()"
  (visibleChange)="open.set($event)"
>
  Contenido del drawer.
</sc-drawer>`;

const DOCKED_SNIPPET = `<!-- Acoplado: un panel de la página que no tapa nada. Va sin velo y bajo la barra de la app. -->
<sc-button label="Abrir panel acoplado" (clicked)="openDocked.set(true)" />
<sc-drawer
  header="Detalle"
  position="right"
  width="var(--sc-spacing-25)"
  topOffset="var(--sc-spacing-4)"
  docked
  [modal]="false"
  [visible]="openDocked()"
  (visibleChange)="openDocked.set($event)"
>
  Un panel de la página: sin sombra ni velo, con el borde en su filo interior y la esquina de arriba redondeada.
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
  readonly openDocked = signal(false);

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly dockedTpl = viewChild<TemplateRef<StoryContext>>('docked');

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
      { name: 'width', control: { kind: 'text' } },
      { name: 'topOffset', control: { kind: 'text' } },
      {
        name: 'docked',
        control: { kind: 'boolean' },
        description: 'Acoplado: sin sombra, con el borde en el filo interior y la esquina de arriba redondeada. Con topOffset.',
      },
    ],
    defaultArgs: {
      header: 'Cabecera del drawer',
      position: 'left',
      modal: true,
      dismissible: true,
      closeOnEscape: true,
      showCloseIcon: true,
      fullScreen: false,
      width: '',
      topOffset: '',
      docked: false,
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const dk = this.dockedTpl();
    if (!pg || !dk) return [];
    return [
      { name: 'Playground', playground: true, template: pg, snippet: PLAYGROUND_SNIPPET },
      { name: 'Acoplado', template: dk, snippet: DOCKED_SNIPPET },
    ];
  });
}
