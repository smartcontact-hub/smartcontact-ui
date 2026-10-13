import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SC_ICON_SIZE_SM, ScIconComponent } from '@smartcontact-hub/icons';

import type { Conversation } from '../../data/conversation.types';

/**
 * Pictograma única canal+estado para la columna "Estado" de `ConversationTable`: SVGs propios
 * entregados por diseño, "una sola señal por estado".
 *
 * Dos tonos (Figma «Memory +», Iconografía transcripciones, 2026-09-23): gris sin fallo, rojo si
 * algo falló. La forma dice en qué punto está (líneas = transcrita, destello = analizada). El color
 * lo pone el botón que lo envuelve (`currentColor`), porque en hover el botón se rellena y el glifo
 * pasa a blanco.
 *
 * Cada estado tiene además su FORMA (DD-200; ficha en `figma-pendiente`): el fallo lleva la
 * insignia de error, el trabajo en curso la de progreso (antes, un pulso que «reducir movimiento»
 * apagaba y dejaba igual que «transcrita») y la llamada sin grabación, el teléfono tachado (antes,
 * el mismo dibujo que «grabada»). Así nada depende solo del color (WCAG 1.4.1).
 *
 * Los overlays (contador multi-grabación) los pinta el caller alrededor de este componente.
 */
type StatusKind =
  | 'call'
  | 'call_recorded'
  | 'call_transcribed'
  | 'call_analyzed'
  | 'chat'
  | 'chat_transcribed'
  | 'chat_analyzed';

export type StatusTone = 'neutral' | 'error';

interface ResolvedStatus {
  readonly kind: StatusKind;
  readonly tone: StatusTone;
  readonly animating: boolean;
  readonly labelKey: string;
}

@Component({
  selector: 'sc-memory-status-icon',
  imports: [ScIconComponent],
  templateUrl: './memory-status-icon.component.html',
  styleUrl: './memory-status-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemoryStatusIconComponent {
  readonly conversation = input.required<Conversation>();
  readonly isProcessing = input<boolean>(false);
  readonly isAnalyzing = input<boolean>(false);
  readonly size = input<number>(18);

  /** La insignia de fallo o de trabajo en curso, en la esquina del glifo. */
  protected readonly tallaInsignia = SC_ICON_SIZE_SM;

  protected readonly status = computed<ResolvedStatus>(() =>
    resolveStatus(this.conversation(), this.isProcessing(), this.isAnalyzing()),
  );
}

/** El caller combina el estado con su `aria-label`: el lector de pantalla tiene que oírlo. */
export function resolveStatusLabelKey(conv: Conversation, processing: boolean, analyzing: boolean): string {
  return resolveStatus(conv, processing, analyzing).labelKey;
}

export function resolveStatusTone(conv: Conversation, processing: boolean, analyzing: boolean): StatusTone {
  return resolveStatus(conv, processing, analyzing).tone;
}

function resolveStatus(conv: Conversation, processing: boolean, analyzing: boolean): ResolvedStatus {
  const isCall = conv.channel === 'llamada';
  const st = (kind: StatusKind, labelKey: string, tone: StatusTone = 'neutral', animating = false): ResolvedStatus => ({
    kind,
    tone,
    animating,
    labelKey: `memory.conversations.status.${labelKey}`,
  });
  if (analyzing) return st(isCall ? 'call_analyzed' : 'chat_analyzed', 'analyzing', 'neutral', true);
  if (processing) return st(isCall ? 'call_transcribed' : 'chat_transcribed', 'transcribing', 'neutral', true);
  if (conv.analysisFailure) return st(isCall ? 'call_analyzed' : 'chat_analyzed', 'analysis_failed', 'error');
  if (conv.hasFailedTranscription) return st(isCall ? 'call_transcribed' : 'chat_transcribed', 'failed', 'error');
  if (isCall) {
    if (conv.hasTranscription && conv.hasAnalysis) return st('call_analyzed', 'call_analyzed');
    if (conv.hasTranscription) return st('call_transcribed', 'call_transcribed');
    return conv.hasRecording ? st('call_recorded', 'call_recorded') : st('call', 'call');
  }
  if (conv.hasAnalysis) return st('chat_analyzed', 'chat_analyzed');
  if (conv.hasTranscription) return st('chat_transcribed', 'chat_transcribed');
  return st('chat', 'chat');
}
