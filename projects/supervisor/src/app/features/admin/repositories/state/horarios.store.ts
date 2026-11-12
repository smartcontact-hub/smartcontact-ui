import { createRepoStore } from '@core/services/local-store.factory';

import { type Horario, normalizarHorario } from './horarios.core.mjs';
import { HORARIOS_SEMILLA } from './horarios.semilla.mjs';

export type { Horario } from './horarios.core.mjs';

/* El almacén de horarios y su semilla, aparte de su página (DD-165): el hub de Repositorios y las fichas leen el
 * almacén sin cargar la lista entera.
 *
 * Un horario era un texto («L-V 09:00–18:00») y ahora es su semana, sus periodos y sus fechas especiales
 * (`horarios.core.mjs`). Lo guardado con la forma de antes se pone al día AL LEERLO con `normalize`, sin subir la
 * versión, que lo borraría (DD-141): los grupos eligen su horario por `id` (DD-152) y ese no cambia. */
export const HorariosStore = createRepoStore<Horario>('HorariosStore', {
  storageKey: 'sc-horarios-repo',
  versionKey: 'sc-horarios-repo-v',
  currentVersion: 1,
  defaults: HORARIOS_SEMILLA,
  normalize: (item) => normalizarHorario(item as unknown as Record<string, unknown>),
});
