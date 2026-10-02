import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectLangChange } from '@core/utils/lang-change';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { ChannelIconComponent } from '@shared/components';
import { stableStringify } from '@shared/utils/form-dirty-state';
import {
  CHANNEL_LABEL_KEYS,
  DEFAULT_CHAT_STRATEGY_OPTIONS,
  DEFAULT_STRATEGY_OPTIONS,
  GROUP_PRIORITIES,
  GroupAdvanced,
  GroupDefaults,
  PRIORITY_LABEL_KEYS,
  VOICE_OPTIONS,
  type ChannelQueue,
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

/**
 * Contact Center › Grupos — `/config/aed/grupos`. Con esto nace cada grupo nuevo (DD-135).
 *
 * En el ORDEN y con las PALABRAS de la ficha de grupo (visión de producto de grupos, 2026-09-25): General, las
 * reglas comunes, un bloque por canal con su distribución y su cola, y la ficha de cliente de Recursos. Solo lo que
 * tiene sentido como valor de partida: el nombre, los canales, los números o los mensajes son de cada grupo.
 *
 * Hasta el 2026-09-29 esto vivía en «Valores por defecto», un botón del listado de grupos, y esta página era la
 * réplica de la maqueta (Figma Supervisor 1:12676), con multiselecciones y códecs que no guardaban nada. Contact
 * Center es donde el superadmin lo tiene todo; producto recorta qué ve cada rol.
 *
 * Mismos campos, opciones y frases que la ficha (`groups-data.ts`), y lo que guarda lo lee la ficha al crear
 * (`GroupDefaultsStore`). Estrategias según SISMAC-1975 en COA. Patrón LISTA DE AJUSTES (nombre a la izquierda,
 * control a la derecha) y guardado único en la TopBar.
 */
@Component({
  selector: 'sc-aed-grupos-page',
  imports: [
    ButtonComponent,
    ChannelIconComponent,
    DividerComponent,
    InputNumberComponent,
    NgTemplateOutlet,
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
  protected readonly chatStrategyOptions = DEFAULT_CHAT_STRATEGY_OPTIONS;
  protected readonly channelKeys = CHANNEL_LABEL_KEYS;
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

  protected setField<K extends 'strategy' | 'chatStrategy' | 'priority' | 'voice'>(key: K, value: unknown): void {
    if (typeof value === 'string') this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected setAdvanced<K extends keyof GroupAdvanced>(key: K, value: GroupAdvanced[K]): void {
    this.form.update((f) => ({ ...f, advanced: { ...f.advanced, [key]: value } }));
  }

  protected setAdvancedNumber(key: 'wrapUpSec' | 'cardHeight', value: number | null): void {
    if (value !== null && Number.isFinite(value) && value >= 0) this.setAdvanced(key, value);
  }

  /** La cola de UN canal: Teléfono y Chat tienen cada uno la suya, como en la ficha. */
  protected setQueue<K extends keyof ChannelQueue>(channel: 'phone' | 'chat', key: K, value: ChannelQueue[K]): void {
    const field = channel === 'phone' ? 'phoneQueue' : 'chatQueue';
    this.form.update((f) => ({ ...f, [field]: { ...f[field], [key]: value } }));
  }

  protected setQueueNumber(
    channel: 'phone' | 'chat',
    key: 'queueSize' | 'maxQueueWaitSec' | 'transferSec' | 'serviceLevelSec',
    value: number | null,
  ): void {
    if (value !== null && Number.isFinite(value) && value >= 0) this.setQueue(channel, key, value);
  }

  protected setCloseOnInactivity(value: boolean): void {
    this.form.update((f) => ({ ...f, chat: { ...f.chat, closeOnInactivity: value } }));
  }

  protected setInactivityMinutes(value: number | null): void {
    if (value !== null && Number.isFinite(value) && value >= 1) {
      this.form.update((f) => ({ ...f, chat: { ...f.chat, inactivityMinutes: value } }));
    }
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
