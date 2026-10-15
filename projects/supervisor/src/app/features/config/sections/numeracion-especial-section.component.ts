import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ListboxModule } from 'primeng/listbox';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScChipComponent as ChipComponent, ScMessageComponent } from '@smartcontact-hub/components';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import {
  ScDividerComponent as DividerComponent,
  ScSectionCardComponent as SectionCardComponent,
} from '@smartcontact-hub/components';


import { COUNTRY_PREFIXES, type CountryPrefix } from '../data/country-prefixes';
import { ResultadoAccionService } from '@core/services';

/**
 * Numeración especial section — country-prefix multiselect with
 * search, chips and a dirty-only save bar.
 *
 * Lifted out of the old AedPageComponent so it can sit inside Sistema
 * as one of the 5 cross-cutting prefs sections (the rest live as
 * inline blocks). Dropping the page chrome means the host paints
 * nothing — Sistema's `.page` es el marco, y la caja la pone
 * `sc-section-card surface="card"` (antes era un `.card` a mano, 2026-09-10).
 *
 * Per DD#45: AED is now the inner-shell hub for Servicio/Agentes/Grupos
 * defaults, so the country picker no longer fits there conceptually.
 */
@Component({
  selector: 'sc-numeracion-especial-section',
  imports: [
    ChipComponent,
    FormsModule,
    ListboxModule,
    ButtonComponent,
    IconComponent,
    SectionCardComponent,
    DividerComponent,
    TranslateModule,
    ScMessageComponent,
  ],
  templateUrl: './numeracion-especial-section.component.html',
  styleUrl: './numeracion-especial-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumeracionEspecialSectionComponent {
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);

  protected readonly hashIcon = 'tag';
  protected readonly infoIcon = 'info';
  protected readonly saveIcon = 'save';

  /** Copia mutable: `p-listbox` pide un array, no uno de solo lectura. */
  protected readonly countries: CountryPrefix[] = [...COUNTRY_PREFIXES];

  protected readonly selectedCodes = signal<ReadonlySet<string>>(new Set());
  protected readonly dirty = signal(false);
  /** Lo guardado, junto a los botones de la sección (DD-191); se va con el siguiente cambio. */
  protected readonly guardadoAviso = signal<string | null>(null);
  private readonly limpiaAviso = effect(() => {
    if (this.dirty()) this.guardadoAviso.set(null);
  });
  protected readonly saving = signal(false);

  protected readonly selectedCountries = computed(() => {
    const codes = this.selectedCodes();
    if (codes.size === 0) return [] as readonly CountryPrefix[];
    return this.countries.filter((c) => codes.has(c.code));
  });

  /** El valor del listbox: los códigos marcados, en el orden de la lista. */
  protected readonly selectedList = computed(() => this.selectedCountries().map((c) => c.code));

  protected setSelected(codes: readonly string[] | null): void {
    this.selectedCodes.set(new Set(codes ?? []));
    this.dirty.set(true);
  }

  protected remove(code: string): void {
    this.selectedCodes.update((current) => {
      const next = new Set(current);
      next.delete(code);
      return next;
    });
    this.dirty.set(true);
  }

  protected discard(): void {
    this.selectedCodes.set(new Set());
    this.dirty.set(false);
  }

  protected save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.dirty.set(false);
      const count = this.selectedCodes().size;
      this.guardadoAviso.set(
        this.translate.instant(count === 1 ? 'config.aed.toast.saved_one' : 'config.aed.toast.saved_many', { count }),
      );
    }, 600);
  }
}
