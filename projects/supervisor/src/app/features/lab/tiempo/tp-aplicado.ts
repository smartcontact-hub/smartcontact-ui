import { computed, inject, Injectable } from '@angular/core';
import type { LabelColor } from '@smartcontact-hub/components';

import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { subcanalesConHorario } from '@features/admin/repositories/state/horario-uso.service';

import type { NombreDeIcono } from './tp-icono.component';

/**
 * CIERRE DE HORARIOS: dónde se aplica un horario. Antes un horario solo colgaba de una IVR; ahora lo pueden usar un
 * servicio (su IVR), un grupo (su Web Chat), un canal de WhatsApp o un calendario (en uno de sus periodos). Saberlo es
 * lo que evita cambiar un horario que usa otro equipo sin enterarse.
 */
export type TipoDeUso = 'servicio' | 'grupo' | 'whatsapp' | 'calendario';

export interface Uso {
  readonly tipo: TipoDeUso;
  readonly nombre: string;
  /** Por dónde lo usa: «Entrada principal», «Web Chat», «Periodo Verano». */
  readonly detalle: string;
}

export const TIPOS_DE_USO: Readonly<Record<TipoDeUso, { readonly uno: string; readonly varios: string; readonly icono: NombreDeIcono; readonly color: LabelColor }>> = {
  servicio: { uno: 'Servicio', varios: 'Servicios', icono: 'phone', color: 'blue' },
  grupo: { uno: 'Grupo', varios: 'Grupos', icono: 'users', color: 'purple' },
  whatsapp: { uno: 'WhatsApp', varios: 'WhatsApp', icono: 'mensaje', color: 'green' },
  calendario: { uno: 'Calendario', varios: 'Calendarios', icono: 'calendario', color: 'amber' },
};

export const ORDEN_DE_USOS: readonly TipoDeUso[] = ['servicio', 'grupo', 'whatsapp', 'calendario'];

/**
 * DATOS SIMULADOS. Servicios, canales de WhatsApp sueltos y calendarios aún no existen en esta app: se inventan aquí,
 * por id de horario de la semilla, para que la columna y el aviso de guardar se vean con casos de verdad. Los grupos
 * que lo usan en su Web Chat o su WhatsApp salen de los datos reales (`subcanalesConHorario`).
 */
const SIMULADOS: Readonly<Record<number, readonly Uso[]>> = {
  1: [
    { tipo: 'servicio', nombre: 'IVR Atención al cliente', detalle: 'Entrada principal' },
    { tipo: 'servicio', nombre: 'IVR Ventas', detalle: 'Entrada principal' },
    { tipo: 'grupo', nombre: 'Online Support', detalle: 'Teléfono' },
    { tipo: 'calendario', nombre: 'Calendario España', detalle: 'Periodo por defecto' },
  ],
  2: [
    { tipo: 'grupo', nombre: 'Soporte Taller', detalle: 'Teléfono' },
    { tipo: 'calendario', nombre: 'Calendario España', detalle: 'Periodo Verano' },
  ],
  3: [{ tipo: 'grupo', nombre: 'Soporte Taller', detalle: 'Teléfono' }],
  4: [{ tipo: 'servicio', nombre: 'IVR Urgencias', detalle: 'Fuera de horario' }],
  6: [
    { tipo: 'servicio', nombre: 'IVR México', detalle: 'Entrada principal' },
    { tipo: 'whatsapp', nombre: 'WhatsApp Ventas LATAM', detalle: 'Número de ventas' },
    { tipo: 'calendario', nombre: 'Calendario México', detalle: 'Periodo por defecto' },
  ],
  7: [
    { tipo: 'servicio', nombre: 'IVR Urgencias', detalle: 'Desvío 24 h' },
    { tipo: 'grupo', nombre: 'Exclusivo', detalle: 'Teléfono' },
  ],
  9: [{ tipo: 'calendario', nombre: 'Calendario Postventa', detalle: 'Periodo por defecto' }],
};

@Injectable({ providedIn: 'root' })
export class AplicadoEn {
  private readonly grupos = inject(GroupsStore);

  /** Los usos de cada horario: los grupos reales (Web Chat y WhatsApp) y los simulados. */
  private readonly porHorario = computed(() => {
    const m = new Map<number, Uso[]>();
    const poner = (id: number, u: Uso): void => void m.set(id, [...(m.get(id) ?? []), u]);
    for (const g of this.grupos.groups()) {
      for (const s of subcanalesConHorario(g)) {
        poner(s.id, s.sub === 'whatsapp' ? { tipo: 'whatsapp', nombre: `WhatsApp ${g.name}`, detalle: `Canal del grupo ${g.name}` } : { tipo: 'grupo', nombre: g.name, detalle: 'Web Chat' });
      }
    }
    for (const [id, usos] of Object.entries(SIMULADOS)) for (const u of usos) poner(Number(id), u);
    return m;
  });

  de(id: number | null): readonly Uso[] {
    if (id === null) return [];
    const usos = this.porHorario().get(id) ?? [];
    return [...usos].sort((a, b) => ORDEN_DE_USOS.indexOf(a.tipo) - ORDEN_DE_USOS.indexOf(b.tipo) || a.nombre.localeCompare(b.nombre, 'es'));
  }

  /** Por tipo, en su orden, solo los que tienen algo: para listarlos agrupados. */
  agrupados(id: number | null): readonly { readonly tipo: TipoDeUso; readonly titulo: string; readonly usos: readonly Uso[] }[] {
    const usos = this.de(id);
    return ORDEN_DE_USOS.map((tipo) => ({ tipo, titulo: TIPOS_DE_USO[tipo].varios, usos: usos.filter((u) => u.tipo === tipo) })).filter((g) => g.usos.length > 0);
  }
}

/** «4 sitios», «1 sitio». */
export const sitios = (n: number): string => `${n} ${n === 1 ? 'sitio' : 'sitios'}`;
