import { ChangeDetectionStrategy, Component, TemplateRef, computed, signal, viewChild } from '@angular/core';

import { ScFileUploadComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const AUDIO_SNIPPET = `<sc-fileupload
  accept=".wav,audio/wav"
  chooseLabel="Subir archivo"
  [clearAfterSelect]="true"
  (filesSelected)="musica.set($event[0]?.name ?? null)"
/>
<span>{{ musica() ?? 'Música por defecto' }}</span>`;

const LIST_SNIPPET = `<sc-fileupload
  [multiple]="true"
  accept="image/*"
  chooseLabel="Subir archivo"
  dropLabel="o suelta aquí los archivos."
  (filesSelected)="elegidos.set($event)"
/>`;

const RULES_SNIPPET = `<sc-fileupload
  name="audios[]"
  accept=".wav,audio/wav"
  [maxFileSize]="5000000"
  [fileLimit]="3"
  [multiple]="true"
  chooseIconName="upload"
  chooseLabel="Subir archivo"
  dropLabel="o suelta aquí hasta 3 .wav."
  invalidFileTypeMessageSummary="{0}: tipo de archivo no válido. "
  invalidFileTypeMessageDetail="Solo .wav."
  invalidFileSizeMessageSummary="{0}: pesa demasiado. "
  invalidFileSizeMessageDetail="El máximo es {0}."
/>
<!-- Con url="https://…" PrimeNG envía los archivos; sin ella, solo se entregan por (uploaded). -->`;

const BASIC_SNIPPET = `<sc-fileupload mode="basic" chooseLabel="Subir archivo" accept=".csv" />`;

/** Demo de `sc-fileupload` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-fileupload-demo',
  imports: [ScFileUploadComponent, StoryHostComponent],
  templateUrl: './fileupload-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly audioTpl = viewChild<TemplateRef<StoryContext>>('audio');
  protected readonly listTpl = viewChild<TemplateRef<StoryContext>>('list');
  protected readonly basicTpl = viewChild<TemplateRef<StoryContext>>('basic');
  protected readonly rulesTpl = viewChild<TemplateRef<StoryContext>>('rules');

  readonly musica = signal<string | null>(null);
  readonly elegidos = signal<readonly File[]>([]);

  protected readonly meta: StoryMeta = {
    tag: 'sc-fileupload',
    title: 'FileUpload',
    description:
      'Subir archivos con zona de soltar (wrapper de `p-fileupload` de primeng.dev, modo advanced). Un solo componente para audios, importaciones y adjuntos; para la foto de una persona, `sc-photo-upload`. Sin `url` no sube a ningún sitio: entrega los archivos al elegirlos. Los textos van traducidos por quien lo usa.',
    argTypes: [
      { name: 'mode', control: { kind: 'select', options: ['advanced', 'basic'] } },
      { name: 'multiple', control: { kind: 'boolean' } },
      { name: 'auto', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
      { name: 'url', control: { kind: 'text' } },
    ],
    defaultArgs: { mode: 'advanced', multiple: false, auto: true, disabled: false, url: '' },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const au = this.audioTpl();
    const li = this.listTpl();
    const ba = this.basicTpl();
    const ru = this.rulesTpl();
    if (!pg || !au || !li || !ba || !ru) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Un audio, guardado en el campo', template: au, snippet: AUDIO_SNIPPET },
      { name: 'Varios archivos, con su lista', template: li, snippet: LIST_SNIPPET },
      { name: 'Validación y envío', template: ru, snippet: RULES_SNIPPET },
      { name: 'Básico', template: ba, snippet: BASIC_SNIPPET },
    ];
  });
}
