import { createRepoStore } from '@core/services/local-store.factory';

import { type HorarioTipo, normalizarHorarioTipo } from './horarios.core.mjs';
import { HORARIOS_TIPO_SEMILLA } from './horarios.semilla.mjs';

export type { HorarioTipo } from './horarios.core.mjs';

/* Los horarios: semanas tipo, de lunes a domingo, que cualquier calendario puede usar como su periodo general o en un
 * periodo. Se crean y se editan una vez y valen para todos los calendarios que los usan. */
export const HorariosTipoStore = createRepoStore<HorarioTipo>('HorariosTipoStore', {
  storageKey: 'sc-horarios-tipo-repo',
  versionKey: 'sc-horarios-tipo-repo-v',
  currentVersion: 3,
  defaults: HORARIOS_TIPO_SEMILLA,
  normalize: (item) => normalizarHorarioTipo(item as unknown as Record<string, unknown>),
});
