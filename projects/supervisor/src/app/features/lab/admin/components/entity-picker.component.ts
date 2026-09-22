import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ScCheckboxComponent, ScChipComponent, ScSearchComponent } from '@smartcontact-hub/components';

export interface PickItem {
  readonly id: string;
  readonly name: string;
  /** La segunda línea: correo, puesto, descripción — lo que distingue a dos homónimos. */
  readonly sub: string;
}

/**
 * Elegir a quién se vincula: personas para un grupo, o grupos para una persona.
 *
 * MISMO MOLDE PARA LOS DOS (B4). Eso es lo que de verdad se adopta de Telegram y WhatsApp:
 * no los pasos, sino que una pieza sirva para objetos distintos cambiando rótulos y lista
 * (Telegram reutiliza literalmente la pantalla cambiando «Continue To Group Info» por
 * «Continue To Channel Info»).
 *
 * Dibujado con lo que ya hay: `sc-search` del DS y las filas de casilla de `_forms.scss`
 * (`.checkbox-grid` + `.checkbox-row`), las mismas que pinta la sección «Acceso» del
 * formulario de usuario. Lo ÚNICO que este laboratorio añade son las fichas (B5): un
 * `sc-chip` del DS por elegido, con su botón de quitar, para saber a quién llevas sin
 * recorrer la lista. Hoy eso hay que leerlo en la tabla.
 *
 * El hueco de las fichas existe vacío a propósito: si apareciera al elegir, la lista de
 * abajo daría un salto (UX 7, estabilidad visual).
 */
@Component({
  selector: 'app-entity-picker',
  imports: [ScCheckboxComponent, ScChipComponent, ScSearchComponent],
  templateUrl: './entity-picker.component.html',
  styleUrl: './entity-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityPickerComponent {
  private readonly translate = inject(TranslateService);

  readonly items = input.required<readonly PickItem[]>();
  readonly selected = input.required<ReadonlySet<string>>();
  readonly searchPlaceholder = input('');
  /** Qué se dice cuando todavía no hay nada elegido. */
  readonly emptyHint = input('');

  readonly toggled = output<string>();

  protected readonly query = signal('');

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.items();
    return this.items().filter(
      (i) => i.name.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q),
    );
  });

  /** Las fichas van en el orden en que se eligieron, no en el de la lista. */
  protected readonly chips = computed(() => {
    const byId = new Map(this.items().map((i) => [i.id, i]));
    return [...this.selected()].map((id) => byId.get(id)).filter((i): i is PickItem => !!i);
  });

  /** Cuántas filas esconde el filtro. Solo se dice cuando de verdad esconde algo. */
  protected readonly hidden = computed(() => this.items().length - this.visible().length);

  protected isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  /** Lo lee un lector de pantalla, así que va por i18n aunque el resto del copy no. */
  protected removeLabel(name: string): string {
    return this.translate.instant('lab.admin.remove_aria', { name });
  }

  protected toggle(id: string): void {
    this.toggled.emit(id);
  }
}
