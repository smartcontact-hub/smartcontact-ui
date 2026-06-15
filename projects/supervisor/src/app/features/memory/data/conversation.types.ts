/**
 * Modelo de datos Memory — conversaciones procesables.
 *
 * Migrado 1:1 desde `legacy-react/src/app/data/mockData.ts` (interface
 * `Conversation`). Mantenemos el mismo shape para que durante Fase 5 la
 * comparación visual y funcional con el prototipo React sea directa.
 */

export interface Recording {
  readonly id: string;
  /** mm:ss like "02:14" */
  readonly duration: string;
  /** hh:mm like "12:50" */
  readonly startTime: string;
  readonly label?: string;
  readonly hasTranscription?: boolean;
}

export interface TranscriptionLine {
  readonly time: string;
  readonly speaker: string;
  readonly text: string;
}

export type ConversationType = 'interna' | 'externa';
export type ConversationChannel = 'llamada' | 'chat';
export type ConversationDirection = 'entrante' | 'saliente';

export interface Conversation {
  readonly hour: string;
  readonly date: string;
  readonly service: string;
  readonly origin: string;
  readonly group: string;
  readonly destination: string;
  readonly id: string;
  readonly waiting: string;
  readonly duration: string;
  readonly deleted?: boolean;
  readonly hasRecording?: boolean;
  readonly hasTranscription?: boolean;
  readonly hasAnalysis?: boolean;
  /**
   * Mock-only: marca una conversación cuyo intento de transcripción falló.
   * La tabla la pinta roja y ofrece "Ver fallidas". Se limpia al re-correr
   * la transcripción con éxito.
   */
  readonly hasFailedTranscription?: boolean;
  /**
   * Cuando length > 1 → conversación multi-recording (IVR transfers).
   * Length 1 o undefined → single-audio.
   */
  readonly recordings?: readonly Recording[];
  readonly transcription?: readonly TranscriptionLine[];
  readonly type: ConversationType;
  readonly channel: ConversationChannel;
  readonly direction: ConversationDirection;
  readonly hasRecordingRule?: boolean;
  readonly hasTranscriptionRule?: boolean;
  readonly hasClassificationRule?: boolean;
  readonly aiCategories?: readonly string[];
}
