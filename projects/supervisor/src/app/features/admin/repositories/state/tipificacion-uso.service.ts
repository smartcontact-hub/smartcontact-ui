import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { LanguageService } from '@core/services/language.service';
import { type Group, resolveGroup } from '@features/admin/groups/data/groups-data';
import { GroupsStore } from '@features/admin/groups/state/groups.store';

/** Hasta cuántos grupos se nombran en el aviso; los demás, «y N más». */
const NOMBRADOS = 3;

/**
 * DÓNDE SE USA UNA TIPIFICACIÓN, AL BORRARLA (revisión de tipificaciones, 2026-10-09). La elige cada grupo en su
 * Postconversación (DD-187 §6), así que borrarla deja a esos grupos sin la suya. El diálogo de eliminar lo dice con sus
 * nombres («La usan 3 grupos: Ventas, Soporte y Postventa»), en la lista y en la ficha; y al eliminarla, esos grupos
 * dejan de tipificar, en vez de quedarse apuntando a una que ya no existe.
 */
@Injectable({ providedIn: 'root' })
export class TipificacionUsoService {
  private readonly groupsStore = inject(GroupsStore);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  /** Los grupos que tipifican con alguna de ellas. */
  grupos(ids: ReadonlySet<number>): readonly Group[] {
    return this.groupsStore.groups().filter((g) => {
      const id = resolveGroup(g).wrapUp.typificationId;
      return id !== null && ids.has(id);
    });
  }

  /** El aviso del diálogo de eliminar, o `null` si no la usa nadie. `varias`: el lote. */
  aviso(ids: ReadonlySet<number>, varias = false): string | null {
    const grupos = this.grupos(ids);
    if (grupos.length === 0) return null;
    const clave = `repositories.tipificaciones.in_use${varias ? '_bulk' : ''}${grupos.length === 1 ? '_one' : ''}`;
    return this.translate.instant(clave, { count: grupos.length, groups: this.nombres(grupos.map((g) => g.name)) });
  }

  /** Al eliminarlas, los grupos que las usaban dejan de tipificar hasta que elijan otra. */
  soltar(ids: ReadonlySet<number>): void {
    for (const g of this.grupos(ids)) {
      this.groupsStore.updateGroup(g.id, { wrapUp: { ...resolveGroup(g).wrapUp, classify: false, typificationId: null } });
    }
  }

  /** «Ventas, Soporte y Postventa», o «Ventas, Soporte, Postventa y 2 más», con la conjunción del idioma. */
  private nombres(todos: readonly string[]): string {
    const lista = new Intl.ListFormat(this.language.locale(), { type: 'conjunction' });
    if (todos.length <= NOMBRADOS + 1) return lista.format(todos);
    const mas = this.translate.instant('repositories.tipificaciones.and_more', { count: todos.length - NOMBRADOS });
    return lista.format([...todos.slice(0, NOMBRADOS), mas]);
  }
}
