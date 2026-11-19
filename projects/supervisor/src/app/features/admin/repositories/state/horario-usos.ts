import type { Group } from '@features/admin/groups/data/groups-data';

import { subcanalesConHorario } from './horario-uso.service';

/** Los sitios donde se usa un horario, en el orden en que se enseñan. */
export type TipoDeUso = 'grupos' | 'vui' | 'buzones' | 'agendas' | 'equipos' | 'campanas';
export const TIPOS_DE_USO: readonly TipoDeUso[] = ['grupos', 'vui', 'buzones', 'agendas', 'equipos', 'campanas'];

/** La clave de traducción de cada sitio (`repositories.horarios.uses.<clave>`). */
export const CLAVE_DE_USO: Readonly<Record<TipoDeUso, string>> = { grupos: 'groups', vui: 'vui', buzones: 'mailboxes', agendas: 'agendas', equipos: 'teams', campanas: 'campaigns' };

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
  1: { vui: ['Atención telefónica', 'Menú principal'], buzones: ['soporte@', 'info@'], agendas: ['Citas de oficina'], equipos: ['Soporte N1', 'Soporte N2', 'Comercial'], campanas: ['Bienvenida a clientes'] },
  2: { buzones: ['soporte@'], equipos: ['Soporte N1'] },
  3: { equipos: ['Soporte N2'] },
  4: { vui: ['Urgencias nocturnas'], equipos: ['Guardias'] },
  5: { buzones: ['guardia@'], campanas: ['Promo de fin de semana'] },
  6: { vui: ['Atención LATAM'], agendas: ['Citas LATAM'], equipos: ['Equipo LATAM'] },
  7: { vui: ['Urgencias'], equipos: ['Guardias'] },
  8: { agendas: ['Citas de verano'], campanas: ['Campaña de verano', 'Rebajas'] },
  9: { vui: ['Postventa'], buzones: ['postventa@'], agendas: ['Revisiones'], equipos: ['Postventa'], campanas: ['Encuesta de satisfacción'] },
};

/** Dónde se usa un horario: los grupos de verdad (con el canal) y los demás sitios, de ejemplo. Solo los sitios que lo usan. */
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
