import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { nombreDeCopia } from '@shared/utils/copy-name';

import type { Horario, HorarioTipo, Semana } from './horarios.core.mjs';
import { HorariosTipoStore } from './horarios-tipo.store';
import { HorariosStore } from './horarios.store';

/** Dónde se usa un horario: los calendarios que lo tienen como general o en alguno de sus periodos. */
export interface UsoDeHorario {
  readonly calendario: Horario;
  readonly general: boolean;
  readonly periodos: number;
}

/**
 * Los horarios (semanas tipo) y los calendarios que los usan. Un calendario guarda a qué horario apunta (`weekId`) y, como
 * copia, su semana (`week`): así el calendario, su lista y los grupos leen la semana como siempre. Al editar un horario,
 * este servicio pone al día la copia en todos los calendarios que lo usan.
 */
@Injectable({ providedIn: 'root' })
export class HorariosTipoService {
  private readonly tipos = inject(HorariosTipoStore);
  private readonly calendarios = inject(HorariosStore);
  private readonly translate = inject(TranslateService);

  /** Los calendarios guardados que usan ese horario (`salvo` deja fuera el que se está editando). */
  usos(id: number, salvo: number | null = null): readonly UsoDeHorario[] {
    return this.calendarios
      .items()
      .filter((c) => c.id !== salvo)
      .map((c) => ({ calendario: c, general: c.weekId === id, periodos: c.periods.filter((p) => p.weekId === id).length }))
      .filter((u) => u.general || u.periodos > 0);
  }

  /** Cuántos calendarios lo usan. */
  cuantos(id: number): number {
    return this.usos(id).length;
  }

  /** Cambia la semana de un horario y la copia en todos los calendarios que lo usan. */
  actualizarSemana(id: number, week: Semana): void {
    this.tipos.updateItem(id, { week });
    for (const c of this.calendarios.items()) {
      if (c.weekId !== id && !c.periods.some((p) => p.weekId === id)) continue;
      this.calendarios.updateItem(c.id, {
        week: c.weekId === id ? week : c.week,
        periods: c.periods.map((p) => (p.weekId === id ? { ...p, week } : p)),
      });
    }
  }

  /** «Solo en este»: una copia del horario, con otra semana, para el calendario que se está editando. */
  copiar(id: number, week: Semana): HorarioTipo {
    const origen = this.tipos.items().find((t) => t.id === id);
    const nombre = nombreDeCopia(origen?.name ?? (this.translate.instant('repositories.horariosTipo.singular') as string), this.tipos.items().map((t) => t.name));
    return this.tipos.addItem({ name: nombre, description: origen?.description ?? '', week });
  }

  /** Al eliminar horarios, los calendarios que los usaban se quedan con su semana pero ya sin vínculo. */
  soltar(ids: readonly number[]): void {
    const quitar = new Set(ids);
    for (const c of this.calendarios.items()) {
      if ((c.weekId == null || !quitar.has(c.weekId)) && !c.periods.some((p) => p.weekId != null && quitar.has(p.weekId))) continue;
      this.calendarios.updateItem(c.id, {
        weekId: c.weekId != null && quitar.has(c.weekId) ? null : c.weekId,
        periods: c.periods.map((p) => (p.weekId != null && quitar.has(p.weekId) ? { ...p, weekId: null } : p)),
      });
    }
  }

  /** El aviso del diálogo de eliminar, o `null` si nadie lo usa. */
  aviso(ids: readonly number[]): string | null {
    const quitar = new Set(ids);
    const n = this.calendarios.items().filter((c) => (c.weekId != null && quitar.has(c.weekId)) || c.periods.some((p) => p.weekId != null && quitar.has(p.weekId))).length;
    if (n === 0) return null;
    return this.translate.instant(`repositories.horariosTipo.${ids.length > 1 ? 'in_use_bulk' : 'in_use'}${n === 1 ? '_one' : ''}`, { count: n });
  }
}
