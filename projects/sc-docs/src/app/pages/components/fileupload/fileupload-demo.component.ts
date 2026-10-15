import { ChangeDetectionStrategy, Component, TemplateRef, computed, signal, viewChild } from '@angular/core';

import { ScFileUploadComponent, type ScSavedFile } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const AUDIO_SNIPPET = `<sc-fileupload
  accept=".wav,audio/wav"
  chooseLabel="Subir archivo"
  [clearAfterSelect]="true"
  (filesSelected)="musica.set($event[0]?.name ?? null)"
/>
<span>{{ musica() ?? 'Música por defecto' }}</span>`;

const SAVED_SNIPPET = `<sc-fileupload
  accept=".wav,.mp3,audio/wav,audio/mpeg"
  chooseLabel="Elegir"
  dropLabel="o suelta aquí el archivo."
  removeLabel="Quitar archivo"
  [saved]="guardado()"
  (uploaded)="guardar($event)"
  (savedRemoved)="guardado.set([])"
/>
<p>Admite archivos .wav y .mp3.</p>`;

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

const ADVANCED_SNIPPET = `<sc-fileupload
  [auto]="false"
  [multiple]="true"
  chooseLabel="Elegir"
  uploadLabel="Subir"
  cancelLabel="Cancelar"
  dropLabel="o suelta aquí los archivos."
/>`;

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
  protected readonly savedTpl = viewChild<TemplateRef<StoryContext>>('saved');
  protected readonly listTpl = viewChild<TemplateRef<StoryContext>>('list');
  protected readonly advancedTpl = viewChild<TemplateRef<StoryContext>>('advanced');
  protected readonly basicTpl = viewChild<TemplateRef<StoryContext>>('basic');
  protected readonly rulesTpl = viewChild<TemplateRef<StoryContext>>('rules');

  readonly musica = signal<string | null>(null);
  /** Lo guardado del ejemplo: un audio de muestra, que sale en la lista como subido. */
  readonly guardado = signal<readonly ScSavedFile[]>([{ name: 'musica-espera.wav', size: 482_304 }]);

  /** Un solo archivo: el elegido sustituye a lo guardado. */
  guardar(files: readonly File[]): void {
    const f = files[0];
    if (f) this.guardado.set([{ name: f.name, size: f.size }]);
  }
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
    const sa = this.savedTpl();
    const li = this.listTpl();
    const ba = this.basicTpl();
    const ru = this.rulesTpl();
    const ad = this.advancedTpl();
    if (!pg || !au || !sa || !li || !ba || !ru || !ad) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Un audio, guardado en el campo', template: au, snippet: AUDIO_SNIPPET },
      { name: 'Un audio, guardado en su lista', template: sa, snippet: SAVED_SNIPPET },
      { name: 'Varios archivos, con su lista', template: li, snippet: LIST_SNIPPET },
      { name: 'Validación y envío', template: ru, snippet: RULES_SNIPPET },
      { name: 'Con «Subir» y «Cancelar»', template: ad, snippet: ADVANCED_SNIPPET },
      { name: 'Básico', template: ba, snippet: BASIC_SNIPPET },
    ];
  });
}
