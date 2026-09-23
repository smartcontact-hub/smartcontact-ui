import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectLangChange } from '@core/utils/lang-change';
import { TOAST_LIFE } from '@core/utils/toast-life';
import {
  DEFAULT_STRATEGY_OPTIONS,
  GROUP_PRIORITIES,
  GroupAdvanced,
  GroupDefaults,
  PRIORITY_LABEL_KEYS,
  VOICE_OPTIONS,
} from '../data/groups-data';
import { GroupDefaultsStore } from '../state/group-defaults.store';

import {
  ScButtonComponent as ButtonComponent,
  ScDividerComponent as DividerComponent,
  ScInputNumberComponent as InputNumberComponent,
  ScSelectButtonComponent as SelectButtonComponent,
  ScSelectComponent as SelectComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { stableStringify } from '@shared/utils/form-dirty-state';

/**
 * Valores por defecto de los grupos — `/admin/grupos/valores-por-defecto`. Con esto nace cada grupo nuevo.
 *
 * Vive con Grupos, en Administración, y no en Configuración del AED (Rafa, 2026-09-18): quien crea y edita grupos
 * es quien decide con qué nacen, y así los dos sitios hablan de lo mismo con las mismas palabras. La página de
 * Configuración se queda como estaba.
 *
 * Mismos campos, opciones y frases que la ficha (`groups-data.ts`), y lo que guarda lo lee la ficha al crear
 * (`GroupDefaultsStore`). Estrategias según SISMAC-1975 en COA.
 *
 * Patrón LISTA DE AJUSTES (nombre a la izquierda, control a la derecha) y guardado único en la TopBar, como
 * Configuración del AED.
 */
@Component({
  selector: 'sc-group-defaults-page',
  imports: [
    ButtonComponent,
    DividerComponent,
    InputNumberComponent,
    SelectButtonComponent,
    SelectComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './group-defaults-page.component.html',
  styleUrl: './group-defaults-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupDefaultsPageComponent implements DirtyAware {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly store = inject(GroupDefaultsStore);

  protected readonly strategyOptions = DEFAULT_STRATEGY_OPTIONS;
  protected readonly priorities = GROUP_PRIORITIES;
  protected readonly priorityKeys: Readonly<Record<string, string>> = PRIORITY_LABEL_KEYS;
  protected readonly voiceOptions = VOICE_OPTIONS;

  protected readonly queueSizeOptions = computed(() => {
    this.lang();
    return [
      { label: this.translate.instant('groups.form.advanced.queue_fixed'), value: 'fixed' },
      { label: this.translate.instant('groups.form.advanced.queue_per_agent'), value: 'per_agent' },
    ];
  });

  protected readonly cardOpeningOptions = computed(() => {
    this.lang();
    return [
      { label: this.translate.instant('groups.form.advanced.card_embedded'), value: 'embedded' },
      { label: this.translate.instant('groups.form.advanced.card_new_window'), value: 'new_window' },
    ];
  });

  protected readonly form = signal<GroupDefaults>(structuredClone(this.store.defaults()));
  protected readonly saving = signal(false);

  /** Dirty real = el form difiere de lo guardado (deshacer cambios → no deja guardar). */
  protected readonly dirty = computed(
    () => stableStringify(this.form()) !== stableStringify(this.store.defaults()),
  );
  protected readonly canSave = computed(() => this.dirty() && !this.saving());
  /** Público para el `formDirtyGuard` (canDeactivate) — confirma al salir con cambios. */
  readonly formDirty = this.dirty;

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected setField<K extends 'strategy' | 'priority' | 'voice'>(key: K, value: unknown): void {
    if (typeof value === 'string') this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected setAdvanced<K extends keyof GroupAdvanced>(key: K, value: GroupAdvanced[K]): void {
    this.form.update((f) => ({ ...f, advanced: { ...f.advanced, [key]: value } }));
  }

  protected setAdvancedNumber(
    key: 'queueSize' | 'maxQueueWaitSec' | 'transferSec' | 'serviceLevelSec' | 'wrapUpSec' | 'cardHeight',
    value: number | null,
  ): void {
    if (value !== null && Number.isFinite(value) && value >= 0) this.setAdvanced(key, value);
  }

  protected cancel(): void {
    this.form.set(structuredClone(this.store.defaults()));
  }

  protected save(): void {
    if (!this.canSave()) return;
    this.saving.set(true);
    setTimeout(() => {
      this.store.save(structuredClone(this.form()));
      this.saving.set(false);
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('groups.defaults.toast_saved'),
        life: TOAST_LIFE.success,
      });
    }, 600);
  }
}
