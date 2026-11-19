import type { Group } from '@features/admin/groups/data/groups-data';

import { subcanalesConHorario } from './horario-uso.service';

/** Los sitios donde se usa un horario, en el orden en que se enseñan. */
export type TipoDeUso = 'grupos' | 'calendarios';
export const TIPOS_DE_USO: readonly TipoDeUso[] = ['grupos', 'calendarios'];

/** El icono (Material Symbols) de cada sitio. */
export const ICONO_DE_USO: Readonly<Record<TipoDeUso, string>> = { grupos: 'groups', calendarios: 'calendar_month' };

/** La clave de traducción de cada sitio (`repositories.horarios.uses.<clave>`). */
export const CLAVE_DE_USO: Readonly<Record<TipoDeUso, string>> = { grupos: 'groups', calendarios: 'calendars' };

export interface ItemDeUso {
  readonly nombre: string;
  /** Etiquetas del sitio: los canales de un grupo, el ámbito de un calendario. */
  readonly etiquetas: readonly string[];
  readonly grupoId?: number;
}

export interface UsoDeHorario {
  readonly tipo: TipoDeUso;
  readonly items: readonly ItemDeUso[];
}

/**
 * Datos de EJEMPLO para estresar la pantalla: el modelo aún no guarda estos vínculos, así que cada horario recibe, por su id,
 * una lista inventada de grupos y de calendarios (de 2 a 9 de cada), para ver cómo se reflejan cuando un horario se usa en muchos
 * sitios. Los grupos reales (los que lo tienen en un canal) van delante.
 */
const GRUPOS = [
  'Atención al cliente', 'Soporte técnico', 'Ventas', 'Postventa', 'Reclamaciones', 'Facturación', 'Retención', 'Cobros',
  'Seguros', 'Onboarding', 'Empresas', 'Particulares', 'VIP', 'Back office', 'Incidencias', 'Logística',
];
const CANALES = ['Web Chat', 'WhatsApp', 'Email', 'Voz', 'SMS', 'Telegram'];
const CALENDARIOS: readonly (readonly [string, string])[] = [
  ['Calendario laboral España', 'España'], ['Calendario Barcelona', 'Cataluña'], ['Calendario Madrid', 'Madrid'],
  ['Calendario México', 'México'], ['Calendario Colombia', 'Colombia'], ['Calendario de guardias', 'Interno'],
  ['Calendario de verano', 'Estacional'], ['Calendario de festivos', 'Festivos'], ['Calendario de campañas', 'Marketing'],
  ['Calendario Portugal', 'Portugal'],
];

function ejemplo(id: number): { grupos: ItemDeUso[]; calendarios: ItemDeUso[] } {
  const nGrupos = 2 + ((id * 5) % 8);
  const nCal = 2 + ((id * 3) % 5);
  return {
    grupos: Array.from({ length: nGrupos }, (_, k) => ({
      nombre: GRUPOS[(id * 3 + k * 5) % GRUPOS.length],
      etiquetas: CANALES.filter((_, c) => (c + k + id) % 3 !== 0).slice(0, 1 + ((k + id) % 3)),
    })),
    calendarios: Array.from({ length: nCal }, (_, k) => {
      const [nombre, ambito] = CALENDARIOS[(id + k * 3) % CALENDARIOS.length];
      return { nombre, etiquetas: [ambito] };
    }),
  };
}

/** Dónde se usa un horario: los grupos de verdad (con el canal) y los demás sitios (calendarios), de ejemplo. Solo los sitios que lo usan. */
export function usosDelHorario(id: number | null, grupos: readonly Group[]): readonly UsoDeHorario[] {
  if (id === null) return [];
  const mios = grupos.filter((g) => subcanalesConHorario(g).some((s) => s.id === id));
  const reales: ItemDeUso[] = mios.map((g) => ({
    nombre: g.name,
    grupoId: g.id,
    etiquetas: subcanalesConHorario(g)
      .filter((s) => s.id === id)
      .map((s) => (s.sub === 'chat' ? 'Web Chat' : 'WhatsApp')),
  }));
  const ej = ejemplo(id);
  const nombresReales = new Set(reales.map((r) => r.nombre));
  return [
    { tipo: 'grupos', items: [...reales, ...ej.grupos.filter((g) => !nombresReales.has(g.nombre))] },
    { tipo: 'calendarios', items: ej.calendarios },
  ];
}
