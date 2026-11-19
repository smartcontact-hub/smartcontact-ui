import type { Group } from '@features/admin/groups/data/groups-data';

import { subcanalesConHorario } from './horario-uso.service';

/** Los sitios donde se usa un horario, en el orden en que se enseñan. */
export type TipoDeUso = 'grupos' | 'vui' | 'calendarios';
export const TIPOS_DE_USO: readonly TipoDeUso[] = ['grupos', 'vui', 'calendarios'];

/** El icono (Material Symbols) de cada sitio: grupos, el del Diseñador VUI y calendarios. */
export const ICONO_DE_USO: Readonly<Record<TipoDeUso, string>> = { grupos: 'groups', vui: 'account_tree', calendarios: 'calendar_month' };

/** La clave de traducción de cada sitio (`repositories.horarios.uses.<clave>`). */
export const CLAVE_DE_USO: Readonly<Record<TipoDeUso, string>> = { grupos: 'groups', vui: 'vui', calendarios: 'calendars' };

export interface UsoDeHorario {
  readonly tipo: TipoDeUso;
  readonly items: readonly { readonly nombre: string; readonly detalle?: string; readonly grupoId?: number }[];
}

/**
 * Datos de EJEMPLO para estresar la pantalla: dónde más se usan los horarios además de en los grupos (que son reales). El
 * modelo aún no guarda estos vínculos: son nombres inventados, por id de horario, para ver cómo se reflejan en la tabla y
 * en «Dónde se usa» cuando un horario se usa en muchos sitios.
 */
const EJEMPLOS: Readonly<Record<number, Partial<Record<Exclude<TipoDeUso, 'grupos'>, readonly string[]>>>> = {
  1: { vui: ['Atención telefónica', 'Menú principal', 'Autoservicio de pedidos'], calendarios: ['Calendario laboral España', 'Calendario Barcelona', 'Calendario Madrid'] },
  2: { vui: ['Atención telefónica'], calendarios: ['Calendario laboral España'] },
  3: { calendarios: ['Calendario laboral España'] },
  4: { vui: ['Urgencias nocturnas'], calendarios: ['Calendario de guardias'] },
  5: { vui: ['Guardia de fin de semana'], calendarios: ['Calendario de festivos'] },
  6: { vui: ['Atención LATAM'], calendarios: ['Calendario México', 'Calendario Colombia'] },
  7: { vui: ['Urgencias'], calendarios: ['Calendario de guardias'] },
  8: { calendarios: ['Calendario de verano'] },
  9: { vui: ['Postventa', 'Encuesta de satisfacción'], calendarios: ['Calendario laboral España', 'Calendario de verano'] },
};

/** Dónde se usa un horario: los grupos de verdad (con el canal) y los demás sitios (VUI y calendarios), de ejemplo. Solo los sitios que lo usan. */
export function usosDelHorario(id: number | null, grupos: readonly Group[]): readonly UsoDeHorario[] {
  if (id === null) return [];
  const usos: UsoDeHorario[] = [];
  const mios = grupos.filter((g) => subcanalesConHorario(g).some((s) => s.id === id));
  if (mios.length > 0) {
    usos.push({
      tipo: 'grupos',
      items: mios.map((g) => ({
        nombre: g.name,
        grupoId: g.id,
        detalle: subcanalesConHorario(g)
          .filter((s) => s.id === id)
          .map((s) => (s.sub === 'chat' ? 'Web Chat' : 'WhatsApp'))
          .join(' · '),
      })),
    });
  }
  const ejemplo = EJEMPLOS[id] ?? {};
  for (const tipo of TIPOS_DE_USO.filter((t): t is Exclude<TipoDeUso, 'grupos'> => t !== 'grupos')) {
    const nombres = ejemplo[tipo];
    if (nombres?.length) usos.push({ tipo, items: nombres.map((nombre) => ({ nombre })) });
  }
  return usos;
}
