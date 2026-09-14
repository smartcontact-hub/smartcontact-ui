import { ChangeDetectionStrategy, Component, TemplateRef, computed, viewChild } from '@angular/core';
import type { MenuItem } from 'primeng/api';

import { ScBreadcrumbComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const BASIC_SNIPPET = `<!-- Para navegar, routerLink: el tramo es un enlace de verdad (manita, Cmd+clic, «copiar enlace»). -->
<sc-breadcrumb
  [home]="{ icon: 'sc-icon-font sc-icon-font--home', routerLink: '/' }"
  [model]="[
    { label: 'Electronics', routerLink: '/electronics' },
    { label: 'Computer', routerLink: '/electronics/computer' },
    { label: 'Accessories', routerLink: '/electronics/computer/accessories' },
    { label: 'Keyboard', routerLink: '/electronics/computer/accessories/keyboard' },
    { label: 'Wireless' },
  ]" />`;

const FLUSH_SNIPPET = `<!-- "flush" quita el relleno propio de la miga, para cuando va dentro de una barra que ya pone su aire (la TopBar). -->
<header class="barra">
  <sc-breadcrumb [flush]="true" [model]="[{ label: 'Administración', routerLink: '/admin' }, { label: 'Usuarios' }]" />
</header>`;

/** Demo de `sc-breadcrumb` (motor «Storybook-like»). Primer componente del
 *  puente Figma→código: el aspecto sale del preset ya tokenizado, y las
 *  historias reproducen los Examples del nodo de Figma (`❖ Breadcrumb`). */
@Component({
  selector: 'app-breadcrumb-demo',
  imports: [ScBreadcrumbComponent, StoryHostComponent],
  templateUrl: './breadcrumb-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly noHomeTpl = viewChild<TemplateRef<StoryContext>>('noHome');
  protected readonly rootTpl = viewChild<TemplateRef<StoryContext>>('root');
  protected readonly flushTpl = viewChild<TemplateRef<StoryContext>>('flush');

  /** No-op para que los tramos intermedios se pinten como pulsables sin navegar
   *  en la demo (una app pasa `routerLink`, como enseñan los snippets); el último
   *  tramo NO lo lleva → es la página actual. */
  protected readonly noop = (): void => {};
  protected readonly home: MenuItem = {
    icon: 'sc-icon-font sc-icon-font--home',
    command: this.noop,
  };
  protected readonly trail: MenuItem[] = [
    { label: 'Electronics', command: this.noop },
    { label: 'Computer', command: this.noop },
    { label: 'Accessories', command: this.noop },
    { label: 'Keyboard', command: this.noop },
    { label: 'Wireless' },
  ];
  protected readonly rootOnly: MenuItem[] = [{ label: 'Inicio' }];
  protected readonly inBar: MenuItem[] = [{ label: 'Administración', command: this.noop }, { label: 'Usuarios' }];

  protected readonly meta: StoryMeta = {
    tag: 'sc-breadcrumb',
    title: 'Breadcrumb',
    description:
      'Migas de pan: dónde estás en la jerarquía. Wrapper de <p-breadcrumb> con modelo MenuItem[] + inicio, tokenizado al DS (item muted → hover, separador, anillo sky). Primer componente traído por el puente Figma→código.',
    argTypes: [],
    defaultArgs: {},
    props: [
      {
        name: 'model',
        type: 'MenuItem[]',
        default: '[]',
        description:
          'Los tramos, en orden. El último es la página actual (sin command/routerLink). Para navegar, routerLink. Los pulsables llevan manita y se subrayan al pasar el ratón.',
      },
      {
        name: 'home',
        type: 'MenuItem | undefined',
        default: 'undefined',
        description: 'Item de inicio (icono casa). Opcional; se pinta antes del primer tramo.',
      },
      {
        name: 'homeAriaLabel',
        type: 'string | undefined',
        default: 'undefined',
        description: 'Nombre accesible del icono de inicio.',
      },
      {
        name: 'flush',
        type: 'boolean',
        default: 'false',
        description: 'Sin relleno propio: para cuando la miga va dentro de una barra que ya pone su aire (la TopBar).',
      },
      {
        name: 'itemClick',
        type: 'output<MenuItemCommandEvent>',
        default: '—',
        description: 'Click en un tramo (o en el inicio).',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const nh = this.noHomeTpl();
    const ro = this.rootTpl();
    const fl = this.flushTpl();
    if (!pg || !nh || !ro || !fl) return [];
    return [
      { name: 'Básico', playground: true, template: pg, snippet: BASIC_SNIPPET },
      { name: 'Sin inicio', template: nh },
      { name: 'Página raíz', template: ro },
      { name: 'Dentro de una barra', template: fl, snippet: FLUSH_SNIPPET },
    ];
  });
}
