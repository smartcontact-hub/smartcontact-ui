import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MeterGroupModule } from 'primeng/metergroup';
import type { MeterItem } from 'primeng/types/metergroup';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { AnimateOnChangeDirective } from '@core/directives';
import { injectLangChange } from '@core/utils/lang-change';
import { ChannelIconComponent, SummaryKpiComponent } from '@shared/components';
import type { GroupAgentLink } from '@features/admin/services/group-agent-links.types';

import { CHANNEL_LABEL_KEYS, type GroupChannel } from '../../data/groups-data';

/** Cómo reparte una familia de canales: Teléfono, o Chat (Web Chat y WhatsApp comparten estrategia). */
export interface GroupSummaryRouting {
  readonly family: 'phone' | 'chat';
  readonly text: string;
}

/** Un número por el que el grupo sale o recibe: el teléfono saliente y el de WhatsApp. */
export interface GroupSummaryOutbound {
  readonly channel: 'phone' | 'whatsapp';
  readonly number: string;
}

interface ChannelRow {
  readonly channel: GroupChannel;
  readonly count: number;
  readonly meter: MeterItem[];
}

/**
 * EL RESUMEN DE LA FICHA DE GRUPO, en su columna a la derecha, fija al hacer scroll: el «impacto
 * estimado» del constructor de reglas (DD-53), a la vista siempre mientras tocas lo que lo mueve.
 * Bajo el índice, en el carril sin scroll de Contact Center, se cortaba en portátiles (DD-121 §3).
 * La visión de producto de grupos (2026-09-25) pide ver de un vistazo las estrategias, el teléfono
 * saliente y el WhatsApp; aquí van, con los agentes y los recursos.
 *
 * Los agentes son un widget (`sc-summary-kpi`, DD-126): los que atienden sobre los asignados, con la cifra
 * que cuenta y el anillo nativo que se llena. Debajo, cada canal con su barra `p-metergroup` nativa, la del
 * panel de grupo del Dashboard, y sus cifras con `scAnimateOnChange` + `.animate-sc-bump` (solo `transform`,
 * y nada con movimiento reducido). El grupo se lee igual en su panel de supervisión y en su ficha.
 *
 * Cada cifra contesta una pregunta de verdad, y ninguna es decorativa: una tarjeta que no puede
 * decir nada (Salida en un grupo solo de chat web) no se pinta.
 *   · Agentes activos: cuántos atienden de los asignados (los demás, en pausa), y cuántos cada canal.
 *     Un canal activo sin nadie que lo atienda sale en aviso, con icono y texto (el color solo no
 *     basta, WCAG 1.4.1).
 *   · Reparto: la estrategia de cada familia de canales.
 *   · Salida: el teléfono saliente y el número de WhatsApp.
 *   · Recursos: cuántos le llegan desde Repositorios.
 */
@Component({
  selector: 'sc-group-summary',
  imports: [TranslateModule, MeterGroupModule, ScIconComponent, ChannelIconComponent, AnimateOnChangeDirective, SummaryKpiComponent],
  templateUrl: './group-summary.component.html',
  styleUrl: './group-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupSummaryComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  /** Los canales del grupo, en el orden canónico. */
  readonly channels = input.required<readonly GroupChannel[]>();
  readonly links = input.required<readonly GroupAgentLink[]>();
  readonly routing = input<readonly GroupSummaryRouting[]>([]);
  readonly outbound = input<readonly GroupSummaryOutbound[]>([]);
  readonly resourceCount = input(0);
  /** Claves de lo que falta para poder guardar (nombre, canales). Vacío = nada. */
  readonly missing = input<readonly string[]>([]);

  protected readonly channelKeys = CHANNEL_LABEL_KEYS;

  protected readonly total = computed(() => this.links().length);
  protected readonly paused = computed(() => this.links().filter((l) => !l.active).length);

  /**
   * Quién atiende cada canal: los agentes HABILITADOS que lo tienen marcado. Uno en pausa no
   * atiende, así que no cuenta; la línea «N en pausa» de arriba dice por qué las cifras no suman.
   * La barra es esa cifra sobre el total del grupo, del mismo color para los cuatro canales, como
   * sus glifos en las listas (decisión de producto, 2026-09-16: el canal lo dice la forma). El de
   * acento y no el primario: el azul de los botones pesaba más que las cifras que acompaña.
   */
  protected readonly channelRows = computed<readonly ChannelRow[]>(() => {
    const total = this.total();
    const active = this.links().filter((l) => l.active);
    return this.channels().map((channel) => {
      const count = active.filter((l) => l.channels.includes(channel)).length;
      const value = total > 0 ? Math.round((count / total) * 100) : 0;
      return { channel, count, meter: [{ label: channel, value, color: 'var(--sc-bg-accent)' }] };
    });
  });

  protected readonly missingText = computed(() => {
    this.lang();
    const items = this.missing().map((key) => this.translate.instant(key));
    return items.length > 0 ? this.translate.instant('groups.form.summary.missing', { items: items.join(' · ') }) : '';
  });

  protected familyKey(family: GroupSummaryRouting['family']): string {
    return family === 'phone' ? 'groups.channel.phone' : 'groups.channel.chat_family';
  }
}
