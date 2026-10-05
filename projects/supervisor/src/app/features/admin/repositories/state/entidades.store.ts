import { createRepoStore } from '@core/services/local-store.factory';

/* El almacén de entidades y su semilla, aparte de su página (DD-165): el hub de Repositorios y las fichas leen el
 * almacén sin cargar la lista entera. */
export interface Entidad {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly values: string;
  readonly description: string;
}

const SEED: readonly Entidad[] = [
  {
    id: 1,
    name: 'Producto',
    type: 'list',
    values: 'Internet Fibra, Móvil Prepago, Móvil Contrato, TV Premium, Pack Convergente',
    description: 'Productos y servicios del catálogo comercial',
  },
  {
    id: 2,
    name: 'Motivo de contacto',
    type: 'list',
    values: 'Consulta, Reclamación, Alta, Baja, Modificación, Avería',
    description: 'Razón principal por la que el cliente contacta',
  },
  {
    id: 3,
    name: 'Número de teléfono',
    type: 'regex',
    values: '^(\\+34)?[6-9]\\d{8}$',
    description: 'Número de teléfono español (fijo o móvil)',
  },
  {
    id: 4,
    name: 'Email',
    type: 'regex',
    values: '^[\\w.-]+@[\\w.-]+\\.\\w+$',
    description: 'Dirección de correo electrónico del cliente',
  },
  {
    id: 5,
    name: 'DNI/NIE',
    type: 'regex',
    values: '^[0-9XYZ]\\d{7}[A-Z]$',
    description: 'Documento de identidad español',
  },
  {
    id: 6,
    name: 'Fecha',
    type: 'date',
    values: 'DD/MM/YYYY',
    description: 'Fecha mencionada en la conversación',
  },
  {
    id: 7,
    name: 'Importe',
    type: 'number',
    values: '0.00–9999.99',
    description: 'Cantidad monetaria mencionada por el cliente',
  },
  {
    id: 8,
    name: 'Dirección',
    type: 'text',
    values: '',
    description: 'Dirección postal del cliente',
  },
];

export const EntidadesStore = createRepoStore<Entidad>('EntidadesStore', {
  storageKey: 'sc-entidades-repo',
  versionKey: 'sc-entidades-repo-v',
  currentVersion: 1,
  defaults: SEED,
});
