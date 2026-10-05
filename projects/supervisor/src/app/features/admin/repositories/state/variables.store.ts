import { createRepoStore } from '@core/services/local-store.factory';

/* El almacén de variables y su semilla, aparte de su página (DD-165): el hub de Repositorios y las fichas leen el
 * almacén sin cargar la lista entera. */
export interface RepoVariable {
  readonly id: number;
  readonly name: string;
  readonly key: string;
  readonly defaultValue: string;
  readonly type: string;
  readonly description: string;
}

const SEED: readonly RepoVariable[] = [
  {
    id: 1,
    name: 'Nombre del agente',
    key: '{agente}',
    defaultValue: 'Agente',
    type: 'text',
    description: 'Nombre del agente que atiende la conversación',
  },
  {
    id: 2,
    name: 'Nombre del cliente',
    key: '{cliente}',
    defaultValue: 'Cliente',
    type: 'text',
    description: 'Nombre del cliente obtenido del CRM',
  },
  {
    id: 3,
    name: 'Número de referencia',
    key: '{ref}',
    defaultValue: '',
    type: 'text',
    description: 'Número de referencia del caso o pedido',
  },
  {
    id: 4,
    name: 'Fecha actual',
    key: '{fecha}',
    defaultValue: '',
    type: 'date',
    description: 'Fecha actual formateada según la localización',
  },
  {
    id: 5,
    name: 'Hora actual',
    key: '{hora}',
    defaultValue: '',
    type: 'text',
    description: 'Hora actual del sistema',
  },
  {
    id: 6,
    name: 'Empresa',
    key: '{empresa}',
    defaultValue: 'SmartContact',
    type: 'text',
    description: 'Nombre de la empresa o marca comercial',
  },
  {
    id: 7,
    name: 'Número de cola',
    key: '{cola_pos}',
    defaultValue: '0',
    type: 'number',
    description: 'Posición del cliente en la cola de espera',
  },
  {
    id: 8,
    name: 'Tiempo estimado',
    key: '{eta}',
    defaultValue: '5 min',
    type: 'text',
    description: 'Tiempo estimado de espera en cola',
  },
  {
    id: 9,
    name: 'ID de ticket',
    key: '{ticket_id}',
    defaultValue: '',
    type: 'text',
    description: 'Identificador único del ticket de soporte',
  },
  {
    id: 10,
    name: 'Encuesta URL',
    key: '{survey_url}',
    defaultValue: 'https://survey.example.com',
    type: 'text',
    description: 'Enlace a la encuesta de satisfacción post-atención',
  },
];

export const VariablesStore = createRepoStore<RepoVariable>('VariablesStore', {
  storageKey: 'sc-variables-repo',
  versionKey: 'sc-variables-repo-v',
  currentVersion: 1,
  defaults: SEED,
});
