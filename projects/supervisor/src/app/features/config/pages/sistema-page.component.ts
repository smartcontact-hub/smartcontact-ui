import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  DOCUMENT,
} from '@angular/core';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

import {
  ConfirmHostService,
  LanguageService,
  ThemeService,
  type AppLanguage,
  type ThemeMode,
} from '@core/services';
import { PageHeaderService } from '@core/services';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { IconComponent } from '@shared/components';
import { ScToggleSwitchComponent as ToggleSwitchComponent } from '@smartcontact-hub/components';
import { AgentsStore } from '@features/admin/agents/state/agents.store';

import { NumeracionEspecialSectionComponent } from '../sections/numeracion-especial-section.component';

interface ThemeOption {
  readonly value: ThemeMode;
  readonly labelKey: string;
  readonly icon: string;
}

interface LanguageOption {
  readonly value: AppLanguage;
  readonly labelKey: string;
  readonly flag: string;
}

interface RegenerationResult {
  readonly count: number;
  readonly timestamp: string;
}

const CONFIRM_PHRASE = 'REGENERAR';

/* All app data lives bajo `sc-*` (post-S47 namespace normalization). El
 * factory reset borra los stores de admin y repositorios pero PRESERVA
 * preferencias UX (theme, language, column prefs, migration marker).
 *
 * Whitelist explícita en vez de prefix match: tras la normalization todo
 * vive bajo `sc-*`, así que un prefix match borraría también theme + idioma.
 * La whitelist es cero-ambigüedad y reportable.
 */
const APP_DATA_PRESERVE_KEYS: ReadonlySet<string> = new Set([
  'sc-theme',
  'sc-language',
  'sc-storage-migration-v1',
]);
/** Sufijos que preservamos (column prefs admin list-pages `sc-X-columns-vN`). */
const APP_DATA_PRESERVE_SUFFIXES: readonly string[] = ['-columns-v1', '-columns-v2'];
const APP_DATA_PREFIX = 'sc-';

/**
 * Sistema page (`/config/sistema`).
 *
 * Single home for cross-cutting client-side preferences:
 *   1. **Apariencia** — three-state theme picker bound to {@link ThemeService}.
 *   2. **Datos** — factory-reset for the `smartcontact_*` localStorage stores.
 *      Prototype-only; gets removed when the real backend lands.
 *   3. **Políticas de contraseñas** — cosmetic policy panel migrated
 *      from the old Seguridad page. No backing storage yet.
 *   4. **Regeneración masiva** — gated bulk credential reset, also
 *      migrated from Seguridad. Behind a typed-confirmation gate
 *      ("REGENERAR") and a collapsed accordion so it isn't reachable
 *      by accident.
 *
 * Seguridad page (`/config/seguridad`) was emptied in this same change
 * — the route now hosts a minimal placeholder under the new settings
 * shell. See DD#44.
 */
@Component({
  selector: 'sc-sistema-page',
  imports: [
    ButtonModule,
    IconComponent,
    NumeracionEspecialSectionComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './sistema-page.component.html',
  styleUrl: './sistema-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaPageComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly language = inject(LanguageService);
  private readonly confirm = inject(ConfirmHostService);
  private readonly translate = inject(TranslateService);
  private readonly doc = inject(DOCUMENT);
  private readonly messages = inject(MessageService);
  private readonly agentsStore = inject(AgentsStore);
  private readonly pageHeader = inject(PageHeaderService);

  constructor() {
    this.pageHeader.set({
      titleKey: 'config.sistema.heading',
      subtitleKey: 'config.sistema.subtitle',
      entityKey: 'config.sidebar.title',
      icon: 'settings',
    });
  }

  protected readonly settingsIcon = 'settings';
  protected readonly resetIcon = 'rotate_left';
  protected readonly shieldIcon = 'shield';
  protected readonly keyIcon = 'key';
  protected readonly searchIcon = 'search';
  protected readonly closeIcon = 'close';
  protected readonly alertIcon = 'warning';
  protected readonly infoIcon = 'info';
  protected readonly chevronDown = 'expand_more';
  protected readonly chevronRight = 'chevron_right';
  protected readonly downloadIcon = 'download';
  protected readonly checkIcon = 'check';

  protected readonly themeOptions: readonly ThemeOption[] = [
    { value: 'light', labelKey: 'config.sistema.appearance.theme_light', icon: 'light_mode' },
    { value: 'dark', labelKey: 'config.sistema.appearance.theme_dark', icon: 'dark_mode' },
    {
      value: 'system',
      labelKey: 'config.sistema.appearance.theme_system',
      icon: 'desktop_windows',
    },
  ];

  protected readonly globeIcon = 'public';

  protected readonly languageOptions: readonly LanguageOption[] = [
    { value: 'es', labelKey: 'config.sistema.language.es', flag: '🇪🇸' },
    { value: 'en', labelKey: 'config.sistema.language.en', flag: '🇬🇧' },
    { value: 'fr', labelKey: 'config.sistema.language.fr', flag: '🇫🇷' },
    { value: 'pt', labelKey: 'config.sistema.language.pt', flag: '🇵🇹' },
  ];

  protected readonly confirmPhraseToken = CONFIRM_PHRASE;

  protected readonly regenOpen = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly selectedIds = signal<ReadonlySet<number>>(new Set());
  protected readonly confirmText = signal('');
  protected readonly processing = signal(false);
  protected readonly result = signal<RegenerationResult | null>(null);

  protected readonly activeAgents = computed(() =>
    this.agentsStore.agents().filter((a) => a.status === 'active'),
  );

  protected readonly filteredAgents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const all = this.activeAgents();
    if (!query) return all;
    return all.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.code.toLowerCase().includes(query) ||
        a.extension.includes(query) ||
        (a.email?.toLowerCase().includes(query) ?? false),
    );
  });

  protected readonly allFilteredSelected = computed(() => {
    const filtered = this.filteredAgents();
    if (filtered.length === 0) return false;
    const selected = this.selectedIds();
    return filtered.every((a) => selected.has(a.id));
  });

  protected readonly canExecute = computed(
    () =>
      this.selectedIds().size > 0 && this.confirmText() === CONFIRM_PHRASE && !this.processing(),
  );

  protected select(mode: ThemeMode): void {
    this.theme.set(mode);
  }

  protected async resetData(): Promise<void> {
    const accepted = await this.confirm.request({
      title: this.translate.instant('config.sistema.data.confirm_title'),
      body: this.translate.instant('config.sistema.data.confirm_body'),
      acceptLabel: this.translate.instant('config.sistema.data.reset_button'),
      rejectLabel: this.translate.instant('common.cancel'),
      acceptTone: 'danger',
    });
    if (!accepted) return;

    const storage = this.doc.defaultView?.localStorage;
    if (!storage) return;

    const toRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key || !key.startsWith(APP_DATA_PREFIX)) continue;
      if (APP_DATA_PRESERVE_KEYS.has(key)) continue;
      if (APP_DATA_PRESERVE_SUFFIXES.some((suffix) => key.endsWith(suffix))) continue;
      toRemove.push(key);
    }
    for (const key of toRemove) storage.removeItem(key);

    /* Force a fresh boot so every store reads its defaults. A signal
     * reset on the in-memory store wouldn't repopulate the defaults
     * already replaced by the user — the seed lives in the factory. */
    this.doc.defaultView?.location.reload();
  }

  protected toggleAccordion(): void {
    this.regenOpen.update((v) => !v);
  }

  protected toggleAll(): void {
    const filtered = this.filteredAgents();
    const allSelected = this.allFilteredSelected();
    this.selectedIds.update((current) => {
      const next = new Set(current);
      for (const agent of filtered) {
        if (allSelected) next.delete(agent.id);
        else next.add(agent.id);
      }
      return next;
    });
  }

  protected toggleOne(id: number): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected onConfirmInput(value: string): void {
    this.confirmText.set(value.toUpperCase());
  }

  protected onSearchKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (this.searchQuery()) {
      this.searchQuery.set('');
    } else {
      (event.target as HTMLInputElement).blur();
    }
  }

  protected regenerate(): void {
    if (!this.canExecute()) return;
    this.processing.set(true);
    const count = this.selectedIds().size;

    setTimeout(() => {
      this.result.set({
        count,
        timestamp: this.formatTimestamp(new Date()),
      });
      this.processing.set(false);
      this.selectedIds.set(new Set());
      this.confirmText.set('');
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant(
          count === 1
            ? 'config.seguridad.toast.regenerated_one'
            : 'config.seguridad.toast.regenerated_many',
          { count },
        ),
        life: TOAST_LIFE.success,
      });
    }, 1500);
  }

  protected downloadCsv(): void {
    const result = this.result();
    if (!result) return;

    const header = ['Código', 'Nombre', 'Email', 'Contraseña temporal'].join(',');
    const sample = this.agentsStore.agents().slice(0, result.count);
    const rows = sample.map((a) => {
      const tempPwd = `tmp_${Math.random().toString(36).slice(2, 10)}`;
      return [a.code, JSON.stringify(a.name), a.email ?? '', tempPwd].join(',');
    });
    const csv = [header, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credenciales_temporales_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('config.seguridad.toast.csv_downloaded'),
      life: TOAST_LIFE.success,
    });
  }

  private formatTimestamp(date: Date): string {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
