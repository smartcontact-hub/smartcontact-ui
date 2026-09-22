import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { ScCheckboxComponent, type TriState, triStateOf } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { motherCount, type PermissionMother } from '../admin-lab.model';

export interface MotherToggle {
  readonly mother: PermissionMother;
  readonly next: boolean;
}

export interface ChildToggle {
  readonly mother: PermissionMother;
  readonly childId: string;
  readonly next: boolean;
}

/**
 * Casillas de permisos con madre e hijas — la MISMA pieza que ya pinta el formulario de
 * usuario (`.checkbox-grid` + `.checkbox-stack` + `.checkbox-row`, `_forms.scss`). No hay
 * componente nuevo ni caja nueva: lo que este laboratorio propone es una REGLA, no un
 * dibujo, y por eso se dibuja igual que hoy.
 *
 * Lo que cambia, y es todo (B12, medido en Telegram):
 *   · apagar la madre apaga las hijas DE VERDAD, en vez de dejar su valor guardado debajo;
 *   · las hijas siguen visibles y PULSABLES con la madre apagada — hoy salen `[disabled]`,
 *     que es lo que hace creer que su valor se fue cuando sigue ahí;
 *   · reencender la madre las enciende TODAS, incluida la que estaba apagada a mano: no
 *     recuerda nada, así lo que se ve es siempre lo que se guarda;
 *   · la madre lleva su contador vivo («3/3»), que es lo que deja leer el estado sin contar.
 *
 * `modoHoy` reproduce la grieta a propósito para poder verla al lado. El componente no
 * decide: sube el gesto y `toggleMother` / `toggleChild` del modelo aplican la regla, así
 * que la regla vive en un sitio y se puede probar sin pintar.
 *
 * B18 · lo bloqueado se ve Y se anuncia: en Telegram el permiso del propietario sale
 * deshabilitado con opacidad 1 y el único indicio es el cursor. Aquí lleva su candado y su
 * motivo escrito, que es la parte que faltaba.
 */
@Component({
  selector: 'app-permission-checks',
  imports: [ScCheckboxComponent, ScIconComponent],
  templateUrl: './permission-checks.component.html',
  styleUrl: './permission-checks.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionChecksComponent {
  readonly nodes = input.required<readonly PermissionMother[]>();
  readonly granted = input.required<ReadonlySet<string>>();
  /** Con el fallo de hoy puesto, las hijas vuelven a salir deshabilitadas bajo la madre. */
  readonly modoHoy = input(false, { transform: booleanAttribute });

  readonly motherToggled = output<MotherToggle>();
  readonly childToggled = output<ChildToggle>();

  protected count(mother: PermissionMother): string | null {
    return motherCount(mother, this.granted());
  }

  /** Tri-estado de la madre: información, no un tercer valor que se guarde. */
  protected motherState(mother: PermissionMother): TriState {
    const granted = this.granted();
    const children = mother.children ?? [];
    if (children.length === 0) return granted.has(mother.id) ? 'all' : 'none';
    if (!granted.has(mother.id)) return 'none';
    return triStateOf(children.filter((c) => granted.has(c.id)).length, children.length);
  }

  protected childState(childId: string): TriState {
    return this.granted().has(childId) ? 'all' : 'none';
  }

  protected onMother(mother: PermissionMother, next: boolean): void {
    if (mother.lockedReason) return;
    this.motherToggled.emit({ mother, next });
  }

  protected onChild(mother: PermissionMother, childId: string, next: boolean): void {
    this.childToggled.emit({ mother, childId, next });
  }
}
