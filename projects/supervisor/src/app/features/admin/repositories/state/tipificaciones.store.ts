import { createRepoStore } from '@core/services/local-store.factory';

import type { Tipificacion, TipificacionOpcion } from './tipificaciones.core.mjs';

export type { Tipificacion, TipificacionNiveles, TipificacionOpcion } from './tipificaciones.core.mjs';

/* El almacén de tipificaciones y su semilla, aparte de sus páginas (DD-165): el hub de Repositorios y la ficha de grupo
 * leen el almacén sin cargar la lista entera.
 *
 * Una tipificación es el árbol que el agente rellena al acabar una conversación, de hasta tres niveles
 * (`tipificaciones.core.mjs`). Qué grupo la usa, en qué conversaciones y si pide comentario lo guarda el grupo
 * (`wrapUp`, revisión de tipificaciones del 2026-10-09). Hasta el 2026-10-05 era una fila suelta con su categoría
 * («Venta cerrada · Ventas»), en `sc-tipificaciones-repo`; esa clave se quedó sin leer. */

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

/* Qué grupos usan cada una está en la semilla de grupos (`wrapUp` en `groups-data.ts`). */
const SEED: readonly Tipificacion[] = [
  {
    id: 1,
    name: 'Atención al cliente',
    description: 'Motivo de la llamada o del chat de un cliente',
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
  },
  {
    id: 2,
    name: 'Ventas salientes',
    description: 'Resultado de cada llamada de campaña',
    levels: 2,
    options: arbol([
      ['Contactado', ['Venta', 'Interesado', 'No interesado', 'Volver a llamar']],
      ['No contactado', ['No contesta', 'Buzón de voz', 'Número erróneo', 'Comunica']],
    ]),
  },
  {
    id: 3,
    name: 'Soporte técnico',
    description: 'Avería o duda técnica, al atenderla y al devolver la llamada',
    levels: 2,
    options: arbol([
      ['Conexión', ['Sin servicio', 'Lentitud', 'Cortes']],
      ['Equipo', ['Router', 'Decodificador', 'Teléfono fijo']],
      ['Cuenta', ['Contraseña', 'Acceso a la web', 'Configuración']],
    ]),
  },
  {
    id: 4,
    name: 'Encuesta de calidad',
    description: 'Lo que contesta el cliente en la llamada de seguimiento',
    levels: 1,
    options: arbol(['Muy satisfecho', 'Satisfecho', 'Ni satisfecho ni insatisfecho', 'Insatisfecho', 'No responde']),
  },
];

/** Lo guardado con la forma de antes pierde lo que ya no es suyo (dirección, comentario y grupos), sin borrar nada más:
 *  una que solo pedía comentario queda con su primer nivel vacío, para rellenarla o eliminarla. */
const normalize = (t: Tipificacion): Tipificacion => ({
  id: t.id,
  name: t.name,
  description: t.description,
  levels: t.levels,
  options: t.options,
});

export const TipificacionesStore = createRepoStore<Tipificacion>('TipificacionesStore', {
  storageKey: 'sc-tipificaciones',
  versionKey: 'sc-tipificaciones-v',
  currentVersion: 1,
  defaults: SEED,
  normalize,
});
