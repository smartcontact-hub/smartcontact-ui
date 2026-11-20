import { inject } from '@angular/core';

import { pruebaEnCurso } from '@core/prueba/prueba-arranque';
import { type Horario, HorariosStore } from '@features/admin/repositories/state/horarios.store';

import type { Franja } from '@features/admin/repositories/state/horarios.core.mjs';

/** Se siembra una vez por navegador: si alguien lo borra, no vuelve. */
const MARCA = 'sc-lab-horario-estres-v1';
const NOMBRE = 'Estrés: franjas a montones';

const h = (hh: number, mm = 0): number => hh * 60 + mm;
/** Un cuarto de hora a cada hora en punto, de `desde` a `hasta`. */
const cuartos = (desde: number, hasta: number): Franja[] => Array.from({ length: hasta - desde + 1 }, (_, k) => [h(desde + k), h(desde + k, 15)] as Franja);

/**
 * Un horario que casi no tiene sentido, para ver dónde se rompe la pantalla: ocho franjas el lunes, 24 h el martes, una
 * de noche el miércoles, trece cuartos de hora el jueves, pausas de 15 minutos y otra de noche el viernes, el sábado
 * casi entero y tres sueltas el domingo. Pasa la validación: ninguna franja pisa a la siguiente.
 */
const SEMANA: Franja[][] = [
  [[h(0), h(0, 30)], [h(1), h(1, 15)], [h(6), h(7)], [h(8), h(8, 15)], [h(9), h(9, 45)], [h(10), h(13, 30)], [h(14), h(14, 30)], [h(15), h(23, 45)]],
  [[h(0), h(24)]],
  [[h(7), h(9)], [h(12), h(12, 15)], [h(22), h(6)]],
  cuartos(8, 20),
  [[h(9), h(14)], [h(14, 15), h(18)], [h(18, 15), h(18, 30)], [h(23), h(2)]],
  [[h(2, 30), h(23, 45)]],
  [[h(5), h(5, 30)], [h(10), h(10, 15)], [h(20), h(23, 50)]],
];

/**
 * Guardián de las rutas del Lab: deja en la lista el horario de estrés la primera vez. Nunca con una prueba con personas
 * en marcha (cada misión empieza con la semilla) ni fuera del Lab: solo lo llaman estas rutas.
 */
export function sembrarEstres(): true {
  if (pruebaEnCurso()) return true;
  try {
    if (localStorage.getItem(MARCA)) return true;
    localStorage.setItem(MARCA, '1');
  } catch {
    return true; // sin almacenamiento, la lista se queda como está
  }
  const store = inject(HorariosStore);
  if (store.items().some((x) => x.name === NOMBRE)) return true;
  store.addItem({
    name: NOMBRE,
    description: 'Ocho franjas el lunes, 24 h el martes, cuartos de hora el jueves y dos de noche: para ver dónde se rompe la pantalla.',
    timezone: 'Europe/Madrid',
    status: 'active',
    week: SEMANA,
    periods: [],
    specials: [],
    holidayCalendarIds: [],
  } as Omit<Horario, 'id'>);
  return true;
}
