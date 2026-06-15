import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

import { TOAST_LIFE } from '@core/utils/toast-life';
import { IconComponent } from '@shared/components';

import { COUNTRY_PREFIXES, type CountryPrefix } from '../data/country-prefixes';

/**
 * Numeración especial section — country-prefix multiselect with
 * search, chips and a dirty-only save bar.
 *
 * Lifted out of the old AedPageComponent so it can sit inside Sistema
 * as one of the 5 cross-cutting prefs sections (the rest live as
 * inline blocks). Dropping the page chrome means the host paints
 * nothing — Sistema's own `.page` and `.card` are the visual frame.
 *
 * Per DD#45: AED is now the inner-shell hub for Servicio/Agentes/Grupos
 * defaults, so the country picker no longer fits there conceptually.
 */
@Component({
  selector: 'sc-numeracion-especial-section',
  imports: [ButtonModule, IconComponent, TranslateModule],
  templateUrl: './numeracion-especial-section.component.html',
  styleUrl: './numeracion-especial-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumeracionEspecialSectionComponent {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  protected readonly hashIcon = 'tag';
  protected readonly infoIcon = 'info';
  protected readonly searchIcon = 'search';
  protected readonly closeIcon = 'close';
  protected readonly saveIcon = 'save';

  protected readonly countries = COUNTRY_PREFIXES;

  protected readonly selectedCodes = signal<ReadonlySet<string>>(new Set());
  protected readonly searchQuery = signal('');
  protected readonly dirty = signal(false);
  protected readonly saving = signal(false);

  protected readonly filtered = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.countries;
    return this.countries.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.prefix.includes(query) ||
        c.code.toLowerCase().includes(query),
    );
  });

  protected readonly selectedCountries = computed(() => {
    const codes = this.selectedCodes();
    if (codes.size === 0) return [] as readonly CountryPrefix[];
    return this.countries.filter((c) => codes.has(c.code));
  });

  protected isSelected(code: string): boolean {
    return this.selectedCodes().has(code);
  }

  protected toggle(code: string): void {
    this.selectedCodes.update((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    this.dirty.set(true);
  }

  protected remove(code: string, event?: MouseEvent): void {
    event?.stopPropagation();
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
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant(
          count === 1 ? 'config.aed.toast.saved_one' : 'config.aed.toast.saved_many',
          { count },
        ),
        life: TOAST_LIFE.success,
      });
    }, 600);
  }

  protected onSearchKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (this.searchQuery()) {
      this.searchQuery.set('');
    } else {
      (event.target as HTMLInputElement).blur();
    }
  }
}
