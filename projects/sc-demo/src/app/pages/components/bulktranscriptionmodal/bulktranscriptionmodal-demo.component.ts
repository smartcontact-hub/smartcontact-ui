import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import {
  ScBulkTranscriptionModalComponent,
  ScBulkTranscriptionModalResult,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const HYBRID_SNIPPET = `@if (open()) {
  <sc-bulk-transcription-modal
    [selectedCount]="12"
    [newCallsCount]="8"
    [transcribedCallsPendingAnalysisCount]="3"
    [chatsPendingAnalysisCount]="1"
    [readyToTranscribeIds]="['c1','c2','c3','c4','c5','c6','c7','c8']"
    [readyToAnalyzeIds]="['c9','c10','c11','c12']"
    [multiSegmentCallsCount]="2"
    [excludedInProgressCount]="1"
    (processed)="onProcessed($event)"
    (closed)="onClosed()"
  />
} @else {
  <button type="button" (click)="reopen()">Reabrir modal</button>
}`;

/** Demo de `sc-bulk-transcription-modal` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-bulktranscriptionmodal-demo',
  imports: [ScBulkTranscriptionModalComponent, StoryHostComponent],
  templateUrl: './bulktranscriptionmodal-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkTranscriptionModalDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly hybridTpl = viewChild<TemplateRef<StoryContext>>('hybrid');

  readonly open = signal(true);
  readonly lastResult = signal<ScBulkTranscriptionModalResult | null>(null);

  /**
   * Construye ids sintéticos a partir de un contador del knob para que el modal
   * tenga elegibles que procesar en el Playground (`processed` los cuenta).
   */
  protected ids(prefix: string, count: unknown): string[] {
    const n = Math.max(0, Number(count) || 0);
    return Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);
  }

  protected readonly meta: StoryMeta = {
    tag: 'sc-bulk-transcription-modal',
    title: 'Bulk Transcription Modal',
    description:
      'Modal de procesamiento masivo (transcripción + análisis). Port presentacional: recibe los contadores YA calculados como @Input y emite la decisión (processed). Renderiza su propia <section role="dialog">; el overlay lo provee el consumidor. Pulsa el disparador para abrirlo.',
    argTypes: [
      {
        name: 'selectedCount',
        control: { kind: 'number', min: 0, max: 100, step: 1 },
        description: 'Total seleccionado (hero).',
      },
      {
        name: 'newCallsCount',
        control: { kind: 'number', min: 0, max: 100, step: 1 },
        description: 'Llamadas nuevas a transcribir.',
      },
      {
        name: 'transcribedCallsPendingAnalysisCount',
        control: { kind: 'number', min: 0, max: 100, step: 1 },
      },
      {
        name: 'chatsPendingAnalysisCount',
        control: { kind: 'number', min: 0, max: 100, step: 1 },
      },
      {
        name: 'multiSegmentCallsCount',
        control: { kind: 'number', min: 0, max: 100, step: 1 },
      },
      {
        name: 'excludedInProgressCount',
        control: { kind: 'number', min: 0, max: 100, step: 1 },
      },
      {
        name: 'surface',
        control: { kind: 'select', options: ['default', 'dark', 'green'] },
      },
    ],
    defaultArgs: {
      selectedCount: 12,
      newCallsCount: 8,
      transcribedCallsPendingAnalysisCount: 3,
      chatsPendingAnalysisCount: 1,
      multiSegmentCallsCount: 2,
      excludedInProgressCount: 1,
      surface: 'default',
    },
    props: [
      { name: 'selectedCount', type: 'number', default: '0', description: 'Total seleccionado.' },
      {
        name: 'newCallsCount',
        type: 'number | null',
        default: 'null',
        description: 'Llamadas nuevas a transcribir.',
      },
      {
        name: 'transcribedCallsPendingAnalysisCount',
        type: 'number | null',
        default: 'null',
        description: 'Llamadas transcritas pendientes de análisis.',
      },
      {
        name: 'chatsPendingAnalysisCount',
        type: 'number | null',
        default: 'null',
        description: 'Chats pendientes de análisis.',
      },
      {
        name: 'readyToTranscribeIds',
        type: 'string[]',
        default: '[]',
        description: 'Ids elegibles para transcribir.',
      },
      {
        name: 'readyToAnalyzeIds',
        type: 'string[]',
        default: '[]',
        description: 'Ids elegibles para analizar.',
      },
      {
        name: 'multiSegmentCallsCount',
        type: 'number',
        default: '0',
        description: 'Llamadas con varios tramos.',
      },
      {
        name: 'excludedInProgressCount',
        type: 'number',
        default: '0',
        description: 'Excluidas por estar en curso.',
      },
      {
        name: 'surface',
        type: 'ScBulkTranscriptionModalSurface',
        default: "'default'",
        description: 'default · dark · green',
      },
      { name: 'processed', type: 'EventEmitter<ScBulkTranscriptionModalResult>' },
      { name: 'closed', type: 'EventEmitter<void>' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const hy = this.hybridTpl();
    if (!pg || !hy) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Híbrido (transcripción + análisis)', template: hy, snippet: HYBRID_SNIPPET },
    ];
  });

  onProcessed(result: ScBulkTranscriptionModalResult): void {
    this.lastResult.set(result);
    this.open.set(false);
  }

  onClosed(): void {
    this.open.set(false);
  }

  reopen(): void {
    this.lastResult.set(null);
    this.open.set(true);
  }
}
