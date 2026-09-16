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
} from '@features/admin/groups/data/groups-data';
import { GroupDefaultsStore } from '@features/admin/groups/state/group-defaults.store';

import {
  ScButtonComponent as ButtonComponent,
  ScDividerComponent as DividerComponent,
  ScInputNumberComponent as InputNumberComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectButtonComponent as SelectButtonComponent,
  ScSelectComponent as SelectComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { stableStringify } from '../../../shared/utils/form-dirty-state';

/**
 * Grupos defaults page — `/config/aed/grupos`. Con lo que nace cada grupo nuevo.
 *
 * Hasta el 2026-09-16 esta página tenía sus propias listas, que no casaban con la ficha de grupo ni con Voice:
 * estrategias que no existen («Round robin», «Distribución equitativa»), códecs de audio como «Voz», una cola
 * FIFO/LIFO, «Urgente» en vez de «Máxima» y una apertura de ficha Automática/Manual/Ninguna. Ahora usa los mismos
 * campos, opciones y palabras que la ficha (`groups-data.ts`), y lo que guarda lo lee la ficha al crear
 * (`GroupDefaultsStore`). Estrategias según SISMAC-1975 en COA.
 *
 * Mantiene el patrón LISTA DE AJUSTES (nombre a la izquierda, control a la derecha) y el guardado único en la TopBar.
 */
@Component({
  selector: 'sc-aed-grupos-page',
  imports: [
    ButtonComponent,
    DividerComponent,
    InputNumberComponent,
    SectionCardComponent,
    SelectButtonComponent,
    SelectComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './aed-grupos-page.component.html',
  styleUrls: ['./aed-defaults-page.component.scss', './aed-grupos-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AedGruposPageComponent implements DirtyAware {
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
        summary: this.translate.instant('config.aed.subpages.grupos.toast.saved'),
        life: TOAST_LIFE.success,
      });
    }, 600);
  }
}
