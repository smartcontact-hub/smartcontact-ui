import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { injectLangChange } from '@core/utils/lang-change';
import { ChannelIconComponent } from '@shared/components';
import {
  CHANNEL_LABEL_KEYS,
  DEFAULT_CHAT_STRATEGY_OPTIONS,
  DEFAULT_STRATEGY_OPTIONS,
  GROUP_PRIORITIES,
  GroupAdvanced,
  GroupDefaults,
  PRIORITY_LABEL_KEYS,
  VOICE_OPTIONS,
  groupDurationOptions,
  validQueueSize,
  type ChannelQueue,
} from '@features/admin/groups/data/groups-data';
import { GroupDefaultsStore } from '@features/admin/groups/state/group-defaults.store';

import {
  ScDividerComponent as DividerComponent,
  ScInputNumberComponent as InputNumberComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectButtonComponent as SelectButtonComponent,
  ScSelectComponent as SelectComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { ContactCenterBorradorService } from './contact-center-borrador.service';

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
 * control a la derecha). Se guarda con las otras dos secciones, con el «Guardar» de la barra (DD-211 §7).
 */
@Component({
  selector: 'sc-aed-grupos-page',
  imports: [
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
export class AedGruposPageComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly store = inject(GroupDefaultsStore);

  protected readonly strategyOptions = DEFAULT_STRATEGY_OPTIONS;
  protected readonly chatStrategyOptions = DEFAULT_CHAT_STRATEGY_OPTIONS;
  protected readonly channelKeys = CHANNEL_LABEL_KEYS;
  protected readonly priorities = GROUP_PRIORITIES;
  protected readonly priorityKeys: Readonly<Record<string, string>> = PRIORITY_LABEL_KEYS;
  protected readonly voiceOptions = VOICE_OPTIONS;

  protected durationOptions(value: number) {
    this.lang();
    return groupDurationOptions(value, this.translate.currentLang || 'es');
  }

  protected queueSizeError(queue: ChannelQueue): string | undefined {
    return validQueueSize(queue) ? undefined : this.translate.instant(queue.queueSizeType === 'per_agent'
      ? 'groups.form.advanced.queue_variable_error' : 'groups.form.advanced.queue_integer_error');
  }

  protected setQueueType(channel: 'phone' | 'chat', value: unknown): void {
    if (value !== 'fixed' && value !== 'per_agent') return;
    const field = channel === 'phone' ? 'phoneQueue' : 'chatQueue';
    this.form.update(f => ({ ...f, [field]: { ...f[field], queueSizeType: value,
      queueSize: value === 'per_agent' && f[field].queueSizeType !== value ? 2 : f[field].queueSize } }));
  }

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

  /** Su parte del borrador de Contact Center (DD-211 §7). Con un tamaño de cola que no vale, no se guarda. */
  protected readonly form = inject(ContactCenterBorradorService).parte<GroupDefaults>('grupos', {
    inicial: () => this.store.defaults(),
    persistir: (valor) => this.store.save(valor),
    valido: (valor) => validQueueSize(valor.phoneQueue) && validQueueSize(valor.chatQueue),
  });

  protected setField<K extends 'strategy' | 'chatStrategy' | 'priority' | 'voice'>(key: K, value: unknown): void {
    if (typeof value === 'string') this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected setAdvanced<K extends keyof GroupAdvanced>(key: K, value: GroupAdvanced[K]): void {
    this.form.update((f) => ({ ...f, advanced: { ...f.advanced, [key]: value } }));
  }

  protected setAdvancedNumber(key: 'wrapUpSec' | 'cardHeight', value: unknown): void {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) this.setAdvanced(key, value);
  }

  /** La cola de UN canal: Teléfono y Chat tienen cada uno la suya, como en la ficha. */
  protected setQueue<K extends keyof ChannelQueue>(channel: 'phone' | 'chat', key: K, value: ChannelQueue[K]): void {
    const field = channel === 'phone' ? 'phoneQueue' : 'chatQueue';
    this.form.update((f) => ({ ...f, [field]: { ...f[field], [key]: value } }));
  }

  protected setQueueNumber(
    channel: 'phone' | 'chat',
    key: 'queueSize' | 'maxQueueWaitSec' | 'transferSec' | 'serviceLevelSec',
    value: unknown,
  ): void {
    if (typeof value === 'number' && Number.isFinite(value)) this.setQueue(channel, key, value);
  }

  protected setCloseOnInactivity(value: boolean): void {
    this.form.update((f) => ({ ...f, chat: { ...f.chat, closeOnInactivity: value } }));
  }

  protected setInactivityMinutes(value: unknown): void {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
      this.form.update((f) => ({ ...f, chat: { ...f.chat, inactivityMinutes: value } }));
    }
  }
}
