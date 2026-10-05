import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScGroupPopoverComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const OVERFLOW_SNIPPET = `<sc-group-popover [groups]="few" />
<sc-group-popover [groups]="many" />`;

const ACTIVAR_SNIPPET = `<!-- Pulsar la cifra (clic, Intro o Espacio) emite "activated" y cierra el globo: la lista de grupos abre ahí
     la asignación de ese grupo. Al pasar por encima o con el foco, sigue enseñando los nombres. -->
<sc-group-popover [groups]="grupos" (activated)="abrirAsignacion()" />`;

/** Demo de `sc-group-popover` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-grouppopover-demo',
  imports: [ScGroupPopoverComponent, StoryHostComponent],
  templateUrl: './grouppopover-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupPopoverDemoComponent {
  readonly few = [{ id: 1, name: 'Soporte', active: true }, { id: 2, name: 'Ventas', active: true }];
  readonly many = [
    { id: 1, name: 'Soporte', active: true },
    { id: 2, name: 'Ventas', active: true },
    { id: 3, name: 'Postventa', active: true },
    { id: 4, name: 'Calidad', active: true },
    { id: 5, name: 'Retención', active: true },
    { id: 6, name: 'Backoffice', active: true },
    { id: 7, name: 'Incidencias', active: true },
  ];

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly overflowTpl = viewChild<TemplateRef<StoryContext>>('overflow');
  protected readonly activarTpl = viewChild<TemplateRef<StoryContext>>('activar');

  /** La cifra de «Al pulsar la cifra» tiene que HACER algo: si no, el `(activated)` del código es decorativo. */
  protected readonly pulsaciones = signal(0);

  protected onActivated(): void {
    this.pulsaciones.update((n) => n + 1);
  }

  protected readonly meta: StoryMeta = {
    tag: 'sc-group-popover',
    title: 'GroupPopover',
    description:
      'Celda inline con conteo de grupos; lista flotante en hover/focus con TODOS los nombres (pasada media pantalla, hace scroll dentro). Los datos van en `[groups]`; `countAriaLabel` cambia lo que la cifra dice al lector cuando no cuenta grupos («12 agentes»), y `activated` avisa al pulsarla. Pasa el ratón por encima o enfoca la celda.',
    argTypes: [],
    defaultArgs: {},
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ov = this.overflowTpl();
    const ac = this.activarTpl();
    if (!pg || !ov || !ac) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Pocos y muchos', template: ov, snippet: OVERFLOW_SNIPPET },
      { name: 'Al pulsar la cifra', template: ac, snippet: ACTIVAR_SNIPPET },
    ];
  });
}
