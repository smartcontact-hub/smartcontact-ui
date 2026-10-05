import { createRepoStore } from '@core/services/local-store.factory';

/* El almacén de intenciones y su semilla, aparte de su página (DD-165): el hub de Repositorios y las fichas leen el
 * almacén sin cargar la lista entera. */
export interface Intencion {
  readonly id: number;
  readonly name: string;
  readonly examples: string;
  readonly category: string;
  readonly description: string;
}

const SEED: readonly Intencion[] = [
  {
    id: 1,
    name: 'Saludo',
    examples: 'Hola, Buenos días, Buenas tardes',
    category: 'General',
    description: 'El usuario saluda al iniciar la conversación',
  },
  {
    id: 2,
    name: 'Despedida',
    examples: 'Adiós, Hasta luego, Gracias por todo',
    category: 'General',
    description: 'El usuario se despide y quiere finalizar',
  },
  {
    id: 3,
    name: 'Consultar factura',
    examples: 'Quiero ver mi factura, ¿Cuánto debo?, Mi último recibo',
    category: 'Facturación',
    description: 'El usuario desea consultar su factura o saldo',
  },
  {
    id: 4,
    name: 'Reportar avería',
    examples: 'No tengo internet, Se me ha caído la línea, No funciona',
    category: 'Soporte',
    description: 'El usuario reporta un problema técnico',
  },
  {
    id: 5,
    name: 'Dar de baja',
    examples: 'Quiero cancelar, Darme de baja, No quiero seguir',
    category: 'Gestión',
    description: 'El usuario quiere cancelar su servicio',
  },
  {
    id: 6,
    name: 'Contratar servicio',
    examples: 'Quiero contratar, Me interesa, ¿Qué planes tienen?',
    category: 'Ventas',
    description: 'El usuario quiere contratar un nuevo servicio',
  },
  {
    id: 7,
    name: 'Cambiar datos',
    examples: 'Cambiar mi dirección, Actualizar mi email, Nuevo teléfono',
    category: 'Gestión',
    description: 'El usuario quiere modificar sus datos personales',
  },
  {
    id: 8,
    name: 'Hablar con humano',
    examples: 'Quiero hablar con una persona, Agente real, No quiero bot',
    category: 'General',
    description: 'El usuario solicita hablar con un agente humano',
  },
  {
    id: 9,
    name: 'Reclamar',
    examples: 'Quiero poner una queja, Estoy insatisfecho, No es aceptable',
    category: 'Reclamación',
    description: 'El usuario quiere presentar una reclamación formal',
  },
  {
    id: 10,
    name: 'Consultar horario',
    examples: '¿Cuál es su horario?, ¿A qué hora abren?, ¿Están abiertos?',
    category: 'General',
    description: 'El usuario pregunta por horarios de atención',
  },
];

export const IntencionesStore = createRepoStore<Intencion>('IntencionesStore', {
  storageKey: 'sc-intenciones-repo',
  versionKey: 'sc-intenciones-repo-v',
  currentVersion: 1,
  defaults: SEED,
});
