import { ChangeDetectionStrategy, Component, TemplateRef, computed, signal, viewChild } from '@angular/core';

import { ScInputTagsComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const DOMAINS_SNIPPET = `<sc-inputtags
  label="Dominios permitidos"
  placeholder="ejemplo.com"
  helperText="Las webs donde se puede insertar el chat."
  [(value)]="dominios"
/>`;

const MAX_SNIPPET = `<sc-inputtags
  label="Correos de aviso"
  placeholder="nombre@example.com"
  helperText="Hasta tres."
  [max]="3"
  [(value)]="correos"
/>`;

const ERROR_SNIPPET = `<sc-inputtags
  label="Dominios permitidos"
  required
  error="Añade al menos un dominio."
  [(value)]="vacio"
/>`;

const DISABLED_SNIPPET = `<sc-inputtags label="Dominios permitidos" disabled [value]="['ejemplo.com']" />`;

/** Demo de `sc-inputtags` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-inputtags-demo',
  imports: [ScInputTagsComponent, StoryHostComponent],
  templateUrl: './inputtags-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputTagsDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly domainsTpl = viewChild<TemplateRef<StoryContext>>('domains');
  protected readonly maxTpl = viewChild<TemplateRef<StoryContext>>('max');
  protected readonly errorTpl = viewChild<TemplateRef<StoryContext>>('error');
  protected readonly disabledTpl = viewChild<TemplateRef<StoryContext>>('disabled');

  readonly pgValue = signal<readonly string[]>(['ejemplo.com']);
  readonly dominios = signal<readonly string[]>(['ejemplo.com', 'tienda.ejemplo.com']);
  readonly correos = signal<readonly string[]>(['soporte@example.com']);
  readonly vacio = signal<readonly string[]>([]);

  protected readonly meta: StoryMeta = {
    tag: 'sc-inputtags',
    title: 'InputTags',
    description:
      'Varios valores cortos en un campo (wrapper de `p-inputtags` de primeng.dev): Enter o la coma cierran cada uno, pegar un texto lo parte por comas y salir del campo añade lo escrito. Cada etiqueta se quita con su ✕ o con Retroceso. Para valores de una lista cerrada, `sc-multiselect`.',
    argTypes: [
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'placeholder', control: { kind: 'text' } },
      { name: 'max', control: { kind: 'number' } },
      { name: 'delimiter', control: { kind: 'text' } },
      { name: 'addOnPaste', control: { kind: 'boolean' } },
      { name: 'addOnBlur', control: { kind: 'boolean' } },
      { name: 'allowDuplicate', control: { kind: 'boolean' } },
      { name: 'required', control: { kind: 'boolean' } },
      { name: 'invalid', control: { kind: 'boolean' } },
      { name: 'fluid', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      size: 'md',
      placeholder: 'ejemplo.com',
      max: 0,
      delimiter: ',',
      addOnPaste: true,
      addOnBlur: true,
      allowDuplicate: false,
      required: false,
      invalid: false,
      fluid: true,
      disabled: false,
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const dom = this.domainsTpl();
    const mx = this.maxTpl();
    const er = this.errorTpl();
    const di = this.disabledTpl();
    if (!pg || !dom || !mx || !er || !di) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Dominios del chat', template: dom, snippet: DOMAINS_SNIPPET },
      { name: 'Con tope', template: mx, snippet: MAX_SNIPPET },
      { name: 'Con error', template: er, snippet: ERROR_SNIPPET },
      { name: 'Deshabilitado', template: di, snippet: DISABLED_SNIPPET },
    ];
  });
}
