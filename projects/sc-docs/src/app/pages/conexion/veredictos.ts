import type { ScSeverity } from '@smartcontact-hub/components';

/**
 * Qué significa cada veredicto del mapa de conexión, en UN solo sitio. La página lo pinta y
 * `docs/conexion-variables.md` enlaza aquí en vez de repetirlo: así una definición no puede
 * decir una cosa en la doc y otra en la web.
 *
 * Cada veredicto cae en uno de cuatro grupos según lo que le pasa al valor. Los grupos son los
 * que ordenan la página (la barra, la leyenda y las tarjetas de componente), así que un
 * veredicto nuevo solo necesita su línea aquí.
 *
 * Cómo se asigna cada uno (el cruce automático y la revisión a mano) es método, y vive en el
 * doc y en `scripts/variables-map.mjs`, no aquí.
 */
export type Grupo = 'llega' | 'dibujo' | 'fuera' | 'no-llega';

export interface GrupoDef {
  id: Grupo;
  titulo: string;
  que: string;
  severidad: ScSeverity;
}

export interface VeredictoDef {
  nombre: string;
  grupo: Grupo;
  que: string;
}

export const GRUPOS: readonly GrupoDef[] = [
  { id: 'llega', titulo: 'Llega', que: 'El cambio en Figma acaba en la pantalla.', severidad: 'success' },
  {
    id: 'dibujo',
    titulo: 'Llega, pero el Kit no lo enseña',
    que: 'El valor viaja bien. Lo que puede desviarse es el dibujo.',
    severidad: 'warn',
  },
  { id: 'fuera', titulo: 'Fuera del Kit', que: 'Uno de los dos lados no lo modela.', severidad: 'secondary' },
  { id: 'no-llega', titulo: 'No llega', que: 'Es lo que hay que mirar.', severidad: 'danger' },
];

export const VEREDICTOS: readonly VeredictoDef[] = [
  { nombre: 'conectada', grupo: 'llega', que: 'La usa una capa y la lee PrimeNG.' },
  { nombre: 'viaja por --sc-*', grupo: 'llega', que: 'PrimeNG no la lee y no hace falta: llega por --sc-*.' },
  { nombre: 'no es un hallazgo', grupo: 'llega', que: 'Parecía un fallo y, abierto el nodo, no lo era.' },

  { nombre: 'Figma no la usa', grupo: 'dibujo', que: 'Llega a la web, pero ninguna capa del Kit la dibuja.' },
  {
    nombre: 'conectada por el primitivo',
    grupo: 'dibujo',
    que: 'Dos variables apuntan al mismo primitivo: hoy coinciden.',
  },

  { nombre: 'solo web', grupo: 'fuera', que: 'El tema la publica y el Kit no la modela.' },
  { nombre: 'solo Figma', grupo: 'fuera', que: 'El Kit dibuja algo sin token detrás: no puede viajar.' },

  { nombre: 'espejismo', grupo: 'no-llega', que: 'El Kit la usa y PrimeNG no la lee.' },
  { nombre: 'muerta', grupo: 'no-llega', que: 'No la usa nadie, ni el Kit ni PrimeNG.' },
  { nombre: 'mal apuntada', grupo: 'no-llega', que: 'Atada a otra variable: la del estado vecino u otro componente.' },
  { nombre: 'muerta en el tema', grupo: 'no-llega', que: 'El tema la publica y el componente lee otro canal.' },
];

/** El grupo de un veredicto. Uno que no esté en la lista cuenta como «no llega»: mejor de más que de menos. */
export function grupoDe(veredicto: string): Grupo {
  return VEREDICTOS.find((v) => v.nombre === veredicto)?.grupo ?? 'no-llega';
}

export function severidadDe(veredicto: string): ScSeverity {
  const g = grupoDe(veredicto);
  return GRUPOS.find((x) => x.id === g)?.severidad ?? 'danger';
}
