import { ChangeDetectionStrategy, Component, TemplateRef, computed, signal, viewChild } from '@angular/core';

import { ScTabsComponent, type ScTab } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const CHANNEL_SNIPPET = `<sc-tabs
  ariaLabel="Canal"
  [tabs]="[{ value: 'chat', label: 'Chat' }, { value: 'email', label: 'Email' }]"
  [(value)]="canal"
/>
@if (canal() === 'chat') { … } @else { … }`;

const ICON_SNIPPET = `<sc-tabs
  ariaLabel="Vistas de la conversación"
  [tabs]="[
    { value: 'transcription', label: 'Transcripción', icon: 'description' },
    { value: 'analysis', label: 'Análisis', icon: 'insights' },
    { value: 'audit', label: 'Auditoría', icon: 'fact_check', disabled: true },
  ]"
  [(value)]="vista"
/>`;

/** Demo de `sc-tabs` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-tabs-demo',
  imports: [ScTabsComponent, StoryHostComponent],
  templateUrl: './tabs-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly channelTpl = viewChild<TemplateRef<StoryContext>>('channel');
  protected readonly iconTpl = viewChild<TemplateRef<StoryContext>>('icon');

  readonly canal = signal<string | number | undefined>('chat');
  readonly vista = signal<string | number | undefined>('transcription');
  readonly pgValue = signal<string | number | undefined>('a');

  protected readonly channelTabs: readonly ScTab[] = [
    { value: 'chat', label: 'Chat' },
    { value: 'email', label: 'Email' },
  ];
  protected readonly iconTabs: readonly ScTab[] = [
    { value: 'transcription', label: 'Transcripción', icon: 'description' },
    { value: 'analysis', label: 'Análisis', icon: 'insights' },
    { value: 'audit', label: 'Auditoría', icon: 'fact_check', disabled: true },
  ];

  protected readonly meta: StoryMeta = {
    tag: 'sc-tabs',
    title: 'Tabs',
    description:
      'Vistas hermanas de una misma cosa (wrapper de `p-tabs` de primeng.dev). La tira lleva siempre su nombre accesible (`ariaLabel`), que va por `pt` al nodo con `role="tablist"`. Sin paneles: lo de debajo lo pinta quien la usa, según `value`. Para elegir el valor de un campo, `sc-selectbutton`.',
    argTypes: [{ name: 'count', control: { kind: 'number', min: 1, max: 6, step: 1 } }],
    defaultArgs: { count: 3 },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ch = this.channelTpl();
    const ic = this.iconTpl();
    if (!pg || !ch || !ic) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Dos canales', template: ch, snippet: CHANNEL_SNIPPET },
      { name: 'Con icono y una apagada', template: ic, snippet: ICON_SNIPPET },
    ];
  });

  protected tabsDe(n: number): readonly ScTab[] {
    const total = Math.min(Math.max(Number(n) || 1, 1), 6);
    return Array.from({ length: total }, (_, i) => ({ value: String.fromCharCode(97 + i), label: `Vista ${i + 1}` }));
  }
}
