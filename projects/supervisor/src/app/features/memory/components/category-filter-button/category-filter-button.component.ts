import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PopoverModule } from 'primeng/popover';

import { IconComponent } from '@shared/components';

/**
 * CategoryFilterButton + popover · Memory iter 8.
 *
 * Réplica del par `CategoryFilterButton.tsx` + `CategoryFilterPanel.tsx`
 * del prototipo React. Botón trigger con icono Tag + badge count
 * cuando hay categorías seleccionadas, + `<p-popover>` con lista
 * scrollable de checkboxes + footer "Seleccionar / Deseleccionar todo".
 *
 * Modelo:
 *   - `available`: catálogo de categorías IA disponibles (derivado del
 *     mock por el store).
 *   - `selected`: subset activo. Vacío = sin filtro.
 */
@Component({
  selector: 'sc-memory-category-filter-button',
  imports: [IconComponent, PopoverModule, TranslateModule],
  templateUrl: './category-filter-button.component.html',
  styleUrl: './category-filter-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFilterButtonComponent {
  readonly available = input.required<readonly string[]>();
  readonly selected = model.required<readonly string[]>();

  protected readonly tagIcon = 'label';

  protected readonly hasActive = computed(() => this.selected().length > 0);
  protected readonly allSelected = computed(
    () => this.available().length > 0 && this.selected().length === this.available().length,
  );

  protected isChecked(cat: string): boolean {
    return this.selected().includes(cat);
  }

  protected toggle(cat: string): void {
    const curr = this.selected();
    if (curr.includes(cat)) {
      this.selected.set(curr.filter((c) => c !== cat));
    } else {
      this.selected.set([...curr, cat]);
    }
  }

  protected toggleAll(): void {
    if (this.allSelected()) {
      this.selected.set([]);
    } else {
      this.selected.set([...this.available()]);
    }
  }

  protected clearAll(): void {
    this.selected.set([]);
  }
}
