import type { Injector } from '@angular/core';

import { registrarPrueba } from '@core/prueba/prueba-ganchos';
import type { Franja, Horario, Semana } from '@features/admin/repositories/state/horarios.core.mjs';
import { HORARIOS_SEMILLA } from '@features/admin/repositories/state/horarios.semilla.mjs';
import { HorariosStore } from '@features/admin/repositories/state/horarios.store';

import { NOMBRES } from './tp-modelo';
import { ponerUsosACero, usosDelEditor } from './tp-usos';

/**
 * LA PRUEBA CON PERSONAS DEL CIERRE DE HORARIOS (modo prueba común, DD-256): tres misiones de menos a más, sobre la
 * semilla de horarios. Los enunciados viven en el plan de sc-docs (`pruebas.data.ts`, prueba `horarios-cierre`); aquí,
 * cómo empieza cada una y qué tiene que quedar guardado para que salga bien.
 *
 *   cierre-1   el Horario General cierra a las 19:00 de lunes a viernes, en el mismo horario (no en una copia).
 *   viernes-1  el Turno Mañana sale antes los viernes: ese día, de 7:00 a 14:00; lo demás, igual.
 *   nuevo-1    un horario nuevo de Recambios Valencia: jornada partida de lunes a jueves, viernes intensivo, sábado
 *              por la mañana y domingo cerrado.
 *
 * Se corrige día a día (7 de 7 es que salió bien) y solo lo GUARDADO: guardar es parte de la tarea. El titular se repite
 * igual entre personas a propósito («Sin guardar», «Mal: viernes») para que el informe cuente lo que más falta.
 *
 * Con la corrección van los gestos que usó (`tp-usos.ts`: elegir, copiar, pegar, pintar, deshacer…), contados desde que
 * empezó la misión: dicen si copiar y pegar se descubre sin explicarlo. No cuentan para el veredicto.
 */

const LJ: Franja = [540, 840];
const TARDE: Franja = [960, 1140];

interface Mision {
  /** El horario que se corrige: por `id` si ya existe, por nombre si lo crea la persona. */
  readonly id?: number;
  readonly nombre?: RegExp;
  readonly semana: Semana;
}

const MISIONES: Readonly<Record<string, Mision>> = {
  'cierre-1': { id: 1, semana: [[[540, 1140]], [[540, 1140]], [[540, 1140]], [[540, 1140]], [[540, 1140]], [], []] },
  'viernes-1': { id: 2, semana: [[[420, 900]], [[420, 900]], [[420, 900]], [[420, 900]], [[420, 840]], [], []] },
  'nuevo-1': {
    nombre: /recambios/i,
    semana: [[LJ, TARDE], [LJ, TARDE], [LJ, TARDE], [LJ, TARDE], [[480, 900]], [[600, 780]], []],
  },
};

const igualDia = (a: readonly Franja[] = [], b: readonly Franja[] = []): boolean =>
  a.length === b.length && a.every((f, i) => f[0] === b[i][0] && f[1] === b[i][1]);

const diasMal = (s: Semana | undefined, pide: Semana): number[] => [0, 1, 2, 3, 4, 5, 6].filter((d) => !igualDia(s?.[d], pide[d]));

const enLetra = (dias: readonly number[]): string => {
  const n = dias.map((d) => NOMBRES[d]);
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}` : (n[0] ?? '');
};

/** El editor con cambios sin guardar: su barra de guardar está a la vista (en un horario nuevo, siempre). */
const sinGuardar = (): boolean => document.querySelector('.tp-savebar[data-visible="true"]') !== null;

export function comprobarMision(items: readonly Horario[], mision: string): { bien: number; total: number; titular: string } | null {
  const m = MISIONES[mision];
  if (!m) return null;
  const semilla = new Set(HORARIOS_SEMILLA.map((h) => h.id));
  const candidatos = m.id !== undefined ? items.filter((h) => h.id === m.id) : items.filter((h) => !semilla.has(h.id) && m.nombre?.test(h.name));
  // Si hay varios con ese nombre, cuenta el que más se acerca.
  const h = [...candidatos].sort((a, b) => diasMal(a.week, m.semana).length - diasMal(b.week, m.semana).length)[0];
  const mal = diasMal(h?.week, m.semana);
  const bien = 7 - mal.length;
  if (!h) return { bien: 0, total: 7, titular: sinGuardar() ? 'Sin guardar' : 'No está el horario nuevo' };
  if (!mal.length) return { bien, total: 7, titular: '7 de 7 días bien' };
  if (sinGuardar()) return { bien, total: 7, titular: 'Sin guardar' };
  // Guardado como copia: la copia está bien, pero el horario que se usa sigue como estaba.
  const copia = m.id !== undefined && items.some((x) => !semilla.has(x.id) && diasMal(x.week, m.semana).length === 0);
  if (copia) return { bien, total: 7, titular: 'Guardado como copia: el que se usa sigue igual' };
  return { bien, total: 7, titular: `Mal: ${enLetra(mal)}` };
}

/** Lo llama el arranque de la app solo con una prueba en marcha (`app.config.ts`). */
export function registrarPruebaDeHorarios(injector: Injector): void {
  const store = injector.get(HorariosStore);
  registrarPrueba({
    // Cada misión empieza con la semilla (ni lo que hizo la anterior ni un ensayo previo) y sin gestos contados.
    reiniciar: () => {
      store.setItems(() => HORARIOS_SEMILLA);
      ponerUsosACero();
    },
    comprobar: (mision) => {
      const c = comprobarMision(store.items(), mision) ?? { bien: 0, total: 1, titular: 'Misión desconocida' };
      const usos = usosDelEditor();
      return Object.keys(usos).length ? { ...c, usos } : c;
    },
  });
}
