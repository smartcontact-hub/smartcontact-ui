import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import type { Conversation } from '../../data/conversation.types';

/**
 * Pictograma única canal+processing-state para la columna "Estado" de
 * `ConversationTable`. Reemplaza el cluster de 3-5 iconos lucide que
 * traía la decisión sparring S37 — el doc canon Memory
 * (`sistema-de-diseno.md §Iconografía`) dicta SVGs propios entregados
 * por diseño + regla "una sola señal por estado".
 *
 * Paleta reducida (sec 15.21 audit del prototipo): solo dos tintes
 * activos — gray `--sc-text-subtle` para rest y teal `--sc-text-info`
 * para in-flight/completed. La forma del icono carga la distinción
 * transcrita-vs-analizada (líneas vs sparkle), y la animación pulse
 * comunica actividad.
 *
 * Inputs:
 * - `conversation` — fila a representar (canal + estado).
 * - `isProcessing` — flag externo (mock dispatch transcripción).
 * - `isAnalyzing` — flag externo (mock dispatch análisis).
 *
 * Los overlays (failed badge + multi-recording count) los pinta el
 * caller alrededor de este componente, no aquí (necesitan stack-position
 * con el button trigger).
 */
type StatusKind =
  | 'call'
  | 'call_recorded'
  | 'call_transcribed'
  | 'call_analyzed'
  | 'chat'
  | 'chat_transcribed'
  | 'chat_analyzed';

interface ResolvedStatus {
  readonly kind: StatusKind;
  readonly active: boolean;
  readonly animating: boolean;
  readonly labelKey: string;
}

@Component({
  selector: 'sc-memory-status-icon',
  imports: [TranslateModule],
  templateUrl: './memory-status-icon.component.html',
  styleUrl: './memory-status-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemoryStatusIconComponent {
  private readonly translate = inject(TranslateService);

  readonly conversation = input.required<Conversation>();
  readonly isProcessing = input<boolean>(false);
  readonly isAnalyzing = input<boolean>(false);
  readonly size = input<number>(18);

  protected readonly status = computed<ResolvedStatus>(() => {
    const conv = this.conversation();
    const processing = this.isProcessing();
    const analyzing = this.isAnalyzing();
    return resolveStatus(conv, processing, analyzing);
  });

  protected readonly tooltip = computed<string>(() => {
    return this.translate.instant(this.status().labelKey);
  });
}

/**
 * Helper público: devuelve solo el labelKey i18n del estado resuelto
 * para que el caller (ConversationTable) lo combine con su `aria-label`
 * del button trigger. Evita la regresión a11y del cluster — el screen
 * reader necesita oír el estado además del "Abrir conversación X".
 */
export function resolveStatusLabelKey(
  conv: Conversation,
  processing: boolean,
  analyzing: boolean,
): string {
  return resolveStatus(conv, processing, analyzing).labelKey;
}

function resolveStatus(
  conv: Conversation,
  processing: boolean,
  analyzing: boolean,
): ResolvedStatus {
  const isCall = conv.channel === 'llamada';
  if (analyzing) {
    return {
      kind: isCall ? 'call_analyzed' : 'chat_analyzed',
      active: true,
      animating: true,
      labelKey: 'memory.conversations.status.analyzing',
    };
  }
  if (processing) {
    return {
      kind: isCall ? 'call_transcribed' : 'chat_transcribed',
      active: true,
      animating: true,
      labelKey: 'memory.conversations.status.transcribing',
    };
  }
  if (isCall) {
    if (conv.hasTranscription && conv.hasAnalysis) {
      return {
        kind: 'call_analyzed',
        active: true,
        animating: false,
        labelKey: 'memory.conversations.status.call_analyzed',
      };
    }
    if (conv.hasTranscription) {
      return {
        kind: 'call_transcribed',
        active: true,
        animating: false,
        labelKey: 'memory.conversations.status.call_transcribed',
      };
    }
    return {
      kind: conv.hasRecording ? 'call_recorded' : 'call',
      active: false,
      animating: false,
      labelKey: conv.hasRecording
        ? 'memory.conversations.status.call_recorded'
        : 'memory.conversations.status.call',
    };
  }
  if (conv.hasAnalysis) {
    return {
      kind: 'chat_analyzed',
      active: true,
      animating: false,
      labelKey: 'memory.conversations.status.chat_analyzed',
    };
  }
  if (conv.hasTranscription) {
    return {
      kind: 'chat_transcribed',
      active: true,
      animating: false,
      labelKey: 'memory.conversations.status.chat_transcribed',
    };
  }
  return {
    kind: 'chat',
    active: false,
    animating: false,
    labelKey: 'memory.conversations.status.chat',
  };
}
