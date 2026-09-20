import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScSelectButtonComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const VIEWS_SNIPPET = `<span id="vistas-label">Vistas</span>
<sc-selectbutton
  [options]="vistas"
  optionLabel="label"
  optionValue="value"
  [allowEmpty]="false"
  [value]="vista()"
  (valueChange)="vista.set($event)"
  ariaLabelledBy="vistas-label"
/>`;

/* El icono de cada opción es `sc-icon` (paquete `@smartcontact-hub/icons`) dentro de `#item`. */
const ICONS_SNIPPET = `<sc-selectbutton
  [options]="temas"
  optionValue="value"
  [allowEmpty]="false"
  [value]="tema()"
  (valueChange)="tema.set($event)"
  ariaLabel="Tema"
>
  <ng-template #item let-o>
    <!-- icono: sc-icon [name]="o.icon" size="inherit" -->
    <span>{{ o.label }}</span>
  </ng-template>
</sc-selectbutton>`;

const SIZES_SNIPPET = `<sc-selectbutton size="sm" [options]="vistas" optionValue="value" [value]="vista()" (valueChange)="vista.set($event)" ariaLabel="Vistas (sm)" />
<sc-selectbutton [options]="vistas" optionValue="value" [value]="vista()" (valueChange)="vista.set($event)" ariaLabel="Vistas (md)" />
<sc-selectbutton size="lg" [options]="vistas" optionValue="value" [value]="vista()" (valueChange)="vista.set($event)" ariaLabel="Vistas (lg)" />
<sc-selectbutton [multiple]="true" [options]="canales" optionValue="value" optionDisabled="disabled" [value]="elegidos()" (valueChange)="elegidos.set($event)" ariaLabel="Canales" />
<sc-selectbutton [disabled]="true" [options]="vistas" optionValue="value" [value]="'all'" ariaLabel="Vistas deshabilitadas" />`;

/** Demo de `sc-selectbutton` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-selectbutton-demo',
  imports: [ScSelectButtonComponent, ScIconComponent, StoryHostComponent],
  templateUrl: './selectbutton-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectButtonDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly viewsTpl = viewChild<TemplateRef<StoryContext>>('views');
  protected readonly iconsTpl = viewChild<TemplateRef<StoryContext>>('icons');
  protected readonly sizesTpl = viewChild<TemplateRef<StoryContext>>('sizes');

  protected readonly vistas = [
    { label: 'Todas', value: 'all' },
    { label: 'Sin transcribir', value: 'pending' },
    { label: 'Fallidas', value: 'failed' },
  ];
  protected readonly temas = [
    { label: 'Claro', value: 'light', icon: 'light_mode' },
    { label: 'Oscuro', value: 'dark', icon: 'dark_mode' },
    { label: 'Sistema', value: 'system', icon: 'desktop_windows' },
  ];
  protected readonly canales = [
    { label: 'Llamada', value: 'call' },
    { label: 'Chat', value: 'chat' },
    { label: 'Email', value: 'email', disabled: true },
  ];

  readonly vista = signal<unknown>('all');
  readonly tema = signal<unknown>('light');
  readonly elegidos = signal<unknown>(['call', 'chat']);

  protected readonly meta: StoryMeta = {
    tag: 'sc-selectbutton',
    title: 'SelectButton',
    description:
      'Botones segmentados de primeng.dev (wrapper de `p-selectbutton`) para filtrar la misma lista o elegir un valor de un grupo corto que se ve entero. Para cambiar de colección, pestañas (`p-tabs`). El texto de cada opción es también su nombre accesible: va traducido y único, aunque se pinte solo con un icono.',
    argTypes: [
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'allowEmpty', control: { kind: 'boolean' } },
      { name: 'multiple', control: { kind: 'boolean' } },
      { name: 'fluid', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
      { name: 'invalid', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      size: 'md',
      allowEmpty: false,
      multiple: false,
      fluid: false,
      disabled: false,
      invalid: false,
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const vw = this.viewsTpl();
    const ic = this.iconsTpl();
    const sz = this.sizesTpl();
    if (!pg || !vw || !ic || !sz) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Vistas de una lista', template: vw, snippet: VIEWS_SNIPPET },
      { name: 'Con icono', template: ic, snippet: ICONS_SNIPPET },
      { name: 'Tallas y estados', template: sz, snippet: SIZES_SNIPPET },
    ];
  });
}
