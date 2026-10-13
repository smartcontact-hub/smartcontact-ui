import { createRepoStore } from '@core/services/local-store.factory';

/* Los equipos (revisión de agentes del 2026-10-09): una marca que se le pone a un agente para filtrar por ella
 * («Inglés», «Turno de tarde»). No reparten conversaciones, no son los grupos de Administración › Grupos. En Voice se
 * llaman «grupos de agentes», viven dentro de Agentes y solo sirven para filtrar una columna del Supervisor; aquí son
 * «equipos», porque «grupo de agentes» se confundía con los grupos y con los agentes. Van en Repositorios,
 * que es donde se crean las cosas que luego se asignan, y el agente los recibe en su sección Recursos. Un agente puede
 * estar en varios. */
export interface Equipo {
  readonly id: number;
  readonly name: string;
  readonly description: string;
}

const SEED: readonly Equipo[] = [
  { id: 1, name: 'Inglés', description: 'Atienden en inglés' },
  { id: 2, name: 'Francés', description: 'Atienden en francés' },
  { id: 3, name: 'Turno de tarde', description: 'De 15:00 a 23:00' },
  { id: 4, name: 'Seniors', description: 'Más de un año en el servicio' },
];

export const EquiposStore = createRepoStore<Equipo>('EquiposStore', {
  storageKey: 'sc-equipos',
  versionKey: 'sc-equipos-v',
  currentVersion: 1,
  defaults: SEED,
});
