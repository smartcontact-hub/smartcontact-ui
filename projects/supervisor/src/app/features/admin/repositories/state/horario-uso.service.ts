import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { type ChatSubchannel, type Group, resolveGroup } from '@features/admin/groups/data/groups-data';
import { GroupsStore } from '@features/admin/groups/state/groups.store';

import { HorariosStore } from './horarios.store';

/** Los subcanales de un grupo que atienden con un horario de verdad: Web Chat activo y WhatsApp activo y con número. */
export function subcanalesConHorario(g: Group): readonly { readonly sub: ChatSubchannel; readonly id: number }[] {
  const ids = g.chat?.attendanceScheduleIds ?? {};
  const activos: ChatSubchannel[] = [];
  if (g.channels.includes('chat')) activos.push('chat');
  if (g.channels.includes('whatsapp') && resolveGroup(g).advanced.whatsappNumber) activos.push('whatsapp');
  return activos.flatMap((sub) => (typeof ids[sub] === 'number' ? [{ sub, id: ids[sub]! }] : []));
}

/**
 * DÓNDE SE USA UN HORARIO, AL BORRARLO (DD-252), como `TipificacionUsoService`. Lo eligen los grupos para su Web Chat y su
 * WhatsApp (DD-152). Borrarlo sin más dejaba a esos grupos apuntando a un id que el siguiente horario creado heredaba
 * (los ids son el máximo más uno): el horario nuevo quedaba puesto en grupos que nunca lo eligieron. El diálogo de
 * eliminar dice a cuántos grupos afecta y qué les pasa, y al eliminarlo esos grupos vuelven a «Siempre».
 */
@Injectable({ providedIn: 'root' })
export class HorarioUsoService {
  private readonly groupsStore = inject(GroupsStore);
  private readonly translate = inject(TranslateService);

  /** Los grupos que atienden con alguno de ellos (solo los subcanales que lo usan de verdad). */
  grupos(ids: ReadonlySet<number>): readonly Group[] {
    return this.groupsStore.groups().filter((g) => subcanalesConHorario(g).some((s) => ids.has(s.id)));
  }

  /** El aviso del diálogo de eliminar, o `null` si no lo usa nadie. */
  aviso(ids: readonly number[]): string | null {
    const n = this.grupos(new Set(ids)).length;
    if (n === 0) return null;
    const clave = ids.length > 1 ? 'in_use_bulk' : 'in_use';
    return this.translate.instant(`repositories.horarios.${clave}${n === 1 ? '_one' : ''}`, { count: n });
  }

  /** Al eliminarlos, los grupos que los tenían (en cualquier subcanal, activo o no) vuelven a «Siempre». */
  soltar(ids: readonly number[]): void {
    const quitar = new Set(ids);
    for (const g of this.groupsStore.groups()) {
      const actuales = g.chat?.attendanceScheduleIds;
      if (!actuales || !Object.values(actuales).some((id) => typeof id === 'number' && quitar.has(id))) continue;
      const limpios = Object.fromEntries(Object.entries(actuales).map(([sub, id]) => [sub, typeof id === 'number' && quitar.has(id) ? null : id]));
      this.groupsStore.updateGroup(g.id, { chat: { ...g.chat, attendanceScheduleIds: limpios } });
    }
  }
}

/**
 * DÓNDE SE APLICA UN CALENDARIO DE FESTIVOS, AL BORRARLO (DD-252): en los horarios que lo tienen en «Festivos que
 * aplica». Al eliminarlo se quita de ellos, por la misma razón que un horario: el id lo heredaría el siguiente.
 */
@Injectable({ providedIn: 'root' })
export class FestivosUsoService {
  private readonly horariosStore = inject(HorariosStore);
  private readonly translate = inject(TranslateService);

  aviso(ids: readonly number[]): string | null {
    const quitar = new Set(ids);
    const n = this.horariosStore.items().filter((h) => h.holidayCalendarIds.some((id) => quitar.has(id))).length;
    if (n === 0) return null;
    const clave = ids.length > 1 ? 'in_use_bulk' : 'in_use';
    return this.translate.instant(`repositories.festivos.${clave}${n === 1 ? '_one' : ''}`, { count: n });
  }

  soltar(ids: readonly number[]): void {
    const quitar = new Set(ids);
    for (const h of this.horariosStore.items()) {
      if (!h.holidayCalendarIds.some((id) => quitar.has(id))) continue;
      this.horariosStore.updateItem(h.id, { holidayCalendarIds: h.holidayCalendarIds.filter((id) => !quitar.has(id)) });
    }
  }
}
