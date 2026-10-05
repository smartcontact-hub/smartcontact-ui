import { createRepoStore } from '@core/services/local-store.factory';

import { contactosDeNumeros, type AgendaContact } from './agenda-contacts.core.mjs';

export type { AgendaContact } from './agenda-contacts.core.mjs';

/**
 * Una agenda: los contactos que el agente ve en la sección Agenda de su teléfono, con el nombre de cada número
 * (DD-163). Hasta el 2026-10-04 era un texto con números separados por comas (`numbers`).
 */
export interface Agenda {
  readonly id: number;
  readonly name: string;
  readonly contacts: readonly AgendaContact[];
  readonly description: string;
  readonly status: string;
}

/** Los contactos de una semilla, numerados en su orden. */
const contactos = (...pares: readonly (readonly [string, string])[]): AgendaContact[] =>
  pares.map(([name, phone], i) => ({ id: i + 1, name, phone }));

/**
 * La agenda grande: ~1.250 contactos, para ver la escala del editor (su tabla, su buscador) como la verá quien tenga
 * la agenda comercial de verdad. Se genera al cargar: ningún teléfono es un literal (`audit:seed-pii` lee los
 * literales), y la serie 900 7xx xxx no es la de los móviles de los agentes.
 */
const DIRECTORIO = Array.from({ length: 1250 }, (_, i): AgendaContact => {
  const n = String(700001 + i);
  return { id: i + 1, name: `Punto de venta ${String(i + 1).padStart(4, '0')}`, phone: `900 ${n.slice(0, 3)} ${n.slice(3)}` };
});

const SEED: readonly Agenda[] = [
  {
    id: 1,
    name: 'Ventas Nacional',
    contacts: contactos(['Centralita de ventas', '900 100 200'], ['Ventas a empresas', '900 100 201'], ['Ventas a particulares', '900 100 202']),
    description: 'Contactos de ventas para el mercado nacional',
    status: 'active',
  },
  {
    id: 2,
    name: 'Soporte Premium',
    contacts: contactos(['Soporte premium', '900 200 300'], ['Soporte premium fuera de horario', '900 200 301']),
    description: 'Líneas dedicadas a clientes premium',
    status: 'active',
  },
  {
    id: 3,
    name: 'Cobros',
    contacts: contactos(
      ['Cobros', '900 300 400'],
      ['Impagos', '900 300 401'],
      ['Facturación', '900 300 402'],
      ['Pagos fraccionados', '900 300 403'],
    ),
    description: 'Contactos para la gestión de cobros e impagos',
    status: 'active',
  },
  {
    id: 4,
    name: 'Emergencias 24h',
    contacts: contactos(['Emergencias 24 horas', '900 400 500']),
    description: 'Línea de emergencias disponible 24 horas',
    status: 'active',
  },
  {
    id: 5,
    name: 'Internacional LATAM',
    contacts: contactos(['Atención en Estados Unidos', '+1 800 555 1234'], ['Atención en México', '+52 800 123 4567']),
    description: 'Contactos internacionales para Latinoamérica',
    status: 'active',
  },
  {
    id: 6,
    name: 'Soporte Técnico',
    contacts: contactos(['Soporte técnico', '900 500 600'], ['Incidencias graves', '900 500 601']),
    description: 'Líneas de soporte técnico general',
    status: 'inactive',
  },
  {
    id: 7,
    name: 'Campañas Outbound',
    contacts: contactos(
      ['Campaña de bienvenida', '911 222 333'],
      ['Campaña de renovación', '911 222 334'],
      ['Campaña de fidelización', '911 222 335'],
    ),
    description: 'Contactos para campañas salientes',
    status: 'active',
  },
  {
    id: 8,
    name: 'Retención',
    contacts: contactos(['Retención de clientes', '900 600 700']),
    description: 'Línea especializada en retención de clientes',
    status: 'active',
  },
  {
    id: 9,
    name: 'Directorio comercial',
    contacts: DIRECTORIO,
    description: 'Puntos de venta de la red comercial',
    status: 'active',
  },
];

/** Lo guardado antes de DD-163 (`numbers`, un texto con comas) se lee como contactos sin nombre, sin subir la versión
 *  (AGENTS: «normalize», la vía que no borra). Lo que ya va al día sale tal cual. */
export function agendaAlDia(guardada: Agenda): Agenda {
  if (Array.isArray(guardada.contacts)) return guardada;
  const { numbers, ...resto } = guardada as Agenda & { readonly numbers?: string };
  return { ...resto, contacts: contactosDeNumeros(numbers) };
}

export const AgendasStore = createRepoStore<Agenda>('AgendasStore', {
  storageKey: 'sc-agendas-repo',
  versionKey: 'sc-agendas-repo-v',
  currentVersion: 1,
  defaults: SEED,
  normalize: agendaAlDia,
});
