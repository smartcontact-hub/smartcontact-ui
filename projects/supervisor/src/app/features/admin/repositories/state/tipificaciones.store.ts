import { createRepoStore } from '@core/services/local-store.factory';

import type { Tipificacion, TipificacionOpcion } from './tipificaciones.core.mjs';

export type {
  Tipificacion,
  TipificacionCanal,
  TipificacionDireccion,
  TipificacionGrupo,
  TipificacionNiveles,
  TipificacionOpcion,
} from './tipificaciones.core.mjs';

/* El almacén de tipificaciones y su semilla, aparte de sus páginas (DD-165): el hub de Repositorios y la ficha de grupo
 * leen el almacén sin cargar la lista entera.
 *
 * Una tipificación es lo que el agente rellena al acabar una conversación: un árbol de hasta tres niveles, un
 * comentario, o los dos, con sus grupos y sus canales (`tipificaciones.core.mjs`). Hasta el 2026-10-05 era una fila
 * suelta con su categoría («Venta cerrada · Ventas»), en `sc-tipificaciones-repo`; la forma es otra, así que va en una
 * clave nueva y la vieja se queda sin leer. */

/** Un árbol escrito como lo lee una persona: cada opción es su nombre, o `[nombre, hijas]`. */
type Rama = string | readonly [string, readonly Rama[]];

function arbol(ramas: readonly Rama[]): TipificacionOpcion[] {
  let id = 0;
  const construir = (lista: readonly Rama[]): TipificacionOpcion[] =>
    lista.map((rama) => {
      const [label, hijas] = typeof rama === 'string' ? [rama, []] : rama;
      return { id: `o${++id}`, label, children: construir(hijas) };
    });
  return construir(ramas);
}

/* Los grupos, por su id en la semilla de grupos (`groups-data.ts`). Ningún grupo tiene dos para la misma dirección por
 * el mismo canal: Online Support (11) atiende con «Atención al cliente» y pregunta con «Encuesta de calidad», y Nodo AED 1
 * (10) usa «Soporte técnico» al teléfono y «Cierre de chat» en el chat. */
const SEED: readonly Tipificacion[] = [
  {
    id: 1,
    name: 'Atención al cliente',
    description: 'Motivo de la llamada o del chat de un cliente',
    inbound: true,
    outbound: false,
    categorization: true,
    comments: true,
    levels: 3,
    options: arbol([
      [
        'Consulta',
        [
          ['Facturación', ['Importe', 'Fecha de cobro', 'Duplicado de factura']],
          ['Producto', ['Características', 'Disponibilidad', 'Precio']],
        ],
      ],
      [
        'Reclamación',
        [
          ['Servicio', ['Retraso', 'Avería', 'Atención recibida']],
          ['Facturación', ['Cobro indebido', 'Importe erróneo', 'Devolución']],
        ],
      ],
      [
        'Gestión',
        [
          ['Alta', ['Nuevo cliente', 'Nuevo producto']],
          ['Cambio', ['Titular', 'Domicilio', 'Forma de pago']],
          ['Baja', ['Precio', 'Competencia', 'Mudanza']],
        ],
      ],
    ]),
    groups: [
      { groupId: 2, channels: ['phone', 'email'] },
      { groupId: 9, channels: ['phone'] },
      { groupId: 11, channels: ['phone', 'chat', 'email'] },
      { groupId: 12, channels: ['phone', 'chat'] },
    ],
  },
  {
    id: 2,
    name: 'Ventas salientes',
    description: 'Resultado de cada llamada de campaña',
    inbound: false,
    outbound: true,
    categorization: true,
    comments: true,
    levels: 2,
    options: arbol([
      ['Contactado', ['Venta', 'Interesado', 'No interesado', 'Volver a llamar']],
      ['No contactado', ['No contesta', 'Buzón de voz', 'Número erróneo', 'Comunica']],
    ]),
    groups: [
      { groupId: 3, channels: ['phone'] },
      { groupId: 4, channels: ['phone'] },
      { groupId: 14, channels: ['phone'] },
    ],
  },
  {
    id: 3,
    name: 'Soporte técnico',
    description: 'Avería o duda técnica, al atenderla y al devolver la llamada',
    inbound: true,
    outbound: true,
    categorization: true,
    comments: true,
    levels: 2,
    options: arbol([
      ['Conexión', ['Sin servicio', 'Lentitud', 'Cortes']],
      ['Equipo', ['Router', 'Decodificador', 'Teléfono fijo']],
      ['Cuenta', ['Contraseña', 'Acceso a la web', 'Configuración']],
    ]),
    groups: [
      { groupId: 10, channels: ['phone'] },
      { groupId: 13, channels: ['phone', 'chat'] },
    ],
  },
  {
    id: 4,
    name: 'Encuesta de calidad',
    description: 'Lo que contesta el cliente en la llamada de seguimiento',
    inbound: false,
    outbound: true,
    categorization: true,
    comments: false,
    levels: 1,
    options: arbol(['Muy satisfecho', 'Satisfecho', 'Ni satisfecho ni insatisfecho', 'Insatisfecho', 'No responde']),
    groups: [
      { groupId: 11, channels: ['phone'] },
      { groupId: 12, channels: ['phone'] },
    ],
  },
  {
    id: 5,
    name: 'Cierre de chat',
    description: 'Una nota al cerrar la conversación, sin categorías',
    inbound: true,
    outbound: false,
    categorization: false,
    comments: true,
    levels: 1,
    options: [],
    groups: [{ groupId: 10, channels: ['chat'] }],
  },
];

export const TipificacionesStore = createRepoStore<Tipificacion>('TipificacionesStore', {
  storageKey: 'sc-tipificaciones',
  versionKey: 'sc-tipificaciones-v',
  currentVersion: 1,
  defaults: SEED,
});
