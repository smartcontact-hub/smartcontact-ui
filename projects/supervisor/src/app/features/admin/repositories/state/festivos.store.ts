import { createRepoStore } from '@core/services/local-store.factory';

import type { CalendarioDeFestivos } from './horarios.core.mjs';
import { FESTIVOS_SEMILLA } from './horarios.semilla.mjs';

export type { CalendarioDeFestivos, Festivo } from './horarios.core.mjs';

/* Los calendarios de festivos: listas de días cerrados que varios horarios aplican, para mantenerlos una vez. Su
 * almacén va aparte de su página, como el de horarios (DD-165), porque el editor de un horario los lee. */
export const FestivosStore = createRepoStore<CalendarioDeFestivos>('FestivosStore', {
  storageKey: 'sc-festivos-repo',
  versionKey: 'sc-festivos-repo-v',
  currentVersion: 1,
  defaults: FESTIVOS_SEMILLA,
});
