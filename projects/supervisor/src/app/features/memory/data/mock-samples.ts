import { MOCK_CONVERSATIONS } from './conversations-mock';
import type { Conversation } from './conversation.types';

/**
 * Mock-data samples · prototype feature permanente (S39).
 *
 * Cada sample es una re-shaping del mock base `MOCK_CONVERSATIONS` que
 * demuestra un estado distinto del prototipo. La `ConversationsPage`
 * expone un switcher arriba a la derecha (clase demo) para que Rafa,
 * el equipo de diseño o un stakeholder cycle entre escenarios sin recargar mock
 * manualmente.
 *
 * Réplica del prototipo React `data/mockSamples.ts` adaptado al mock
 * Angular (15 entries vs 156 React). Las muestras se reducen al
 * subset que tiene sentido con la base actual.
 *
 * El proyecto SmartContact es prototipo permanente sin backend real,
 * por lo que este sistema de samples es parte canonical del demo
 * (no deuda).
 *
 * S49 bug 2b: `label`/`description` → `labelKey`/`descriptionKey` (i18n
 * keys), el switcher los traduce en runtime. Las claves viven en
 * `memory.mock_samples.<id>.{label,description}` de los 4 locales.
 */

export interface MockSample {
  readonly id: string;
  /** i18n key (e.g. `memory.mock_samples.default.label`). */
  readonly labelKey: string;
  /** i18n key (e.g. `memory.mock_samples.default.description`). */
  readonly descriptionKey: string;
  readonly build: () => readonly Conversation[];
}

/** Clone shallow + arrays profundos para evitar mutación accidental. */
const clone = (c: Conversation): Conversation => ({
  ...c,
  recordings: c.recordings ? c.recordings.map((r) => ({ ...r })) : undefined,
  transcription: c.transcription ? c.transcription.map((l) => ({ ...l })) : undefined,
});

const cloneAll = (): Conversation[] => MOCK_CONVERSATIONS.map(clone);

/** Helper: construye `labelKey` + `descriptionKey` desde el id del sample. */
const i18n = (id: string) => ({
  labelKey: `memory.mock_samples.${id}.label`,
  descriptionKey: `memory.mock_samples.${id}.description`,
});

export const MOCK_SAMPLES: readonly MockSample[] = [
  {
    id: 'default',
    ...i18n('default'),
    build: () => cloneAll(),
  },
  {
    id: 'all-pending',
    ...i18n('all-pending'),
    build: () =>
      cloneAll().map((c) => {
        if (c.channel === 'chat') return c;
        return {
          ...c,
          hasTranscription: false,
          hasAnalysis: false,
          hasFailedTranscription: false,
          transcription: undefined,
          recordings: c.recordings
            ? c.recordings.map((r) => ({ ...r, hasTranscription: false }))
            : undefined,
        };
      }),
  },
  {
    id: 'all-done',
    ...i18n('all-done'),
    build: () =>
      cloneAll().map((c) => {
        if (c.deleted) return c; // respetar custodia GDPR vencida
        return {
          ...c,
          hasRecording: c.channel === 'llamada' ? true : c.hasRecording,
          hasTranscription: true,
          hasAnalysis: true,
          hasFailedTranscription: false,
          recordings: c.recordings
            ? c.recordings.map((r) => ({ ...r, hasTranscription: true }))
            : undefined,
        };
      }),
  },
  {
    id: 'calls-only-untranscribed',
    ...i18n('calls-only-untranscribed'),
    build: () =>
      cloneAll()
        .filter((c) => c.channel === 'llamada' && c.hasRecording && !c.deleted)
        .map((c) => ({
          ...c,
          hasTranscription: false,
          hasAnalysis: false,
          hasFailedTranscription: false,
          transcription: undefined,
          recordings: c.recordings
            ? c.recordings.map((r) => ({ ...r, hasTranscription: false }))
            : undefined,
        })),
  },
  {
    id: 'chats-only',
    ...i18n('chats-only'),
    build: () => cloneAll().filter((c) => c.channel === 'chat'),
  },
  {
    id: 'small',
    ...i18n('small'),
    build: () => cloneAll().slice(0, 8),
  },
  {
    id: 'multi-recording',
    ...i18n('multi-recording'),
    build: () => cloneAll().filter((c) => c.recordings && c.recordings.length > 1),
  },
  {
    id: 'only-failed',
    ...i18n('only-failed'),
    build: () =>
      cloneAll()
        .filter((c) => c.channel === 'llamada' && c.hasRecording && !c.deleted)
        .map((c) => ({
          ...c,
          hasTranscription: false,
          hasAnalysis: false,
          hasFailedTranscription: true,
          transcription: undefined,
        })),
  },
  {
    id: 'gdpr-expired',
    ...i18n('gdpr-expired'),
    build: () =>
      cloneAll()
        .slice(0, 6)
        .map((c) => ({
          ...c,
          deleted: true,
          hasRecording: c.channel === 'llamada' ? false : c.hasRecording,
          hasTranscription: false,
          hasAnalysis: false,
        })),
  },
  {
    id: 'multi-tramo-parcial',
    ...i18n('multi-tramo-parcial'),
    build: () =>
      cloneAll()
        .filter((c) => c.recordings && c.recordings.length > 1)
        .map((c) => {
          if (!c.recordings) return c;
          // Primer tramo transcrito, resto no — estado "parcialmente transcrito".
          const recordings = c.recordings.map((r, idx) => ({
            ...r,
            hasTranscription: idx === 0,
          }));
          return {
            ...c,
            hasTranscription: false, // agregado: solo si TODOS los tramos lo están
            hasAnalysis: false,
            recordings,
          };
        }),
  },
  {
    id: 'no-recording',
    ...i18n('no-recording'),
    build: () =>
      cloneAll()
        .filter((c) => c.channel === 'llamada')
        .slice(0, 8)
        .map((c) => ({
          ...c,
          hasRecording: false,
          hasTranscription: false,
          hasAnalysis: false,
          hasFailedTranscription: false,
          transcription: undefined,
          recordings: undefined,
        })),
  },
];

export const DEFAULT_SAMPLE_ID = 'default';

export function getSample(id: string): MockSample {
  return MOCK_SAMPLES.find((s) => s.id === id) ?? MOCK_SAMPLES[0];
}
