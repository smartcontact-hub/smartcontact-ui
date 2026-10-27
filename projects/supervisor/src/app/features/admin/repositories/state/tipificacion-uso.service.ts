import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { type Group, resolveGroup } from '@features/admin/groups/data/groups-data';
import { GroupsStore } from '@features/admin/groups/state/groups.store';

/**
 * DÓNDE SE USA UNA TIPIFICACIÓN, AL BORRARLA (revisión de tipificaciones, 2026-10-09). La elige cada grupo en su
 * Postconversación (DD-187 §6), así que borrarla deja a esos grupos sin la suya. El diálogo de eliminar lo dice con su
 * cifra («La usan 3 grupos»), en la lista y en la ficha; y al eliminarla, esos grupos dejan de tipificar, en vez de quedarse apuntando a una que ya no existe.
 */
@Injectable({ providedIn: 'root' })
export class TipificacionUsoService {
  private readonly groupsStore = inject(GroupsStore);
  private readonly translate = inject(TranslateService);

  /** Los grupos que tipifican con alguna de ellas. */
  grupos(ids: ReadonlySet<number>): readonly Group[] {
    return this.groupsStore.groups().filter((g) => {
      const id = resolveGroup(g).wrapUp.typificationId;
      return id !== null && ids.has(id);
    });
  }

  /** El aviso del diálogo de eliminar, o `null` si no la usa nadie: cuántos grupos, sin nombrarlos. */
  aviso(id: number): string | null {
    const grupos = this.grupos(new Set([id]));
    if (grupos.length === 0) return null;
    return this.translate.instant(`repositories.tipificaciones.in_use${grupos.length === 1 ? '_one' : ''}`, { count: grupos.length });
  }

  /** Lo mismo para varias a la vez, en plural: cuántos grupos usan alguna de ellas, o `null` si no las usa nadie. */
  avisoVarias(ids: readonly number[]): string | null {
    const grupos = this.grupos(new Set(ids));
    if (grupos.length === 0) return null;
    return this.translate.instant(`repositories.tipificaciones.in_use_bulk${grupos.length === 1 ? '_one' : ''}`, { count: grupos.length });
  }

  /** Al eliminarlas, los grupos que las usaban dejan de tipificar hasta que elijan otra. */
  soltar(ids: ReadonlySet<number>): void {
    for (const g of this.grupos(ids)) {
      this.groupsStore.updateGroup(g.id, { wrapUp: { ...resolveGroup(g).wrapUp, classify: false, typificationId: null } });
    }
  }
}
