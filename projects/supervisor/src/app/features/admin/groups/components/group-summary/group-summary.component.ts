import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MeterGroupModule } from 'primeng/metergroup';
import type { MeterItem } from 'primeng/types/metergroup';
import {
  ScFactRowComponent as FactRowComponent,
  ScIconTileComponent as IconTileComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { AnimateOnChangeDirective } from '@core/directives';
import { ChannelIconComponent, SummaryKpiComponent, SummaryStatusComponent, type ResourceRow } from '@shared/components';
import type { GroupAgentLink } from '@features/admin/services/group-agent-links.types';
import { familiesOf } from '@features/admin/services/group-channels.core.mjs';

import {
  CHANNEL_LABEL_KEYS,
  DEFAULT_STRATEGY_OPTIONS,
  FAMILY_LABEL_KEYS,
  OUTBOUND_LABEL_KEYS,
  PHONE_STRATEGY_HELP_KEYS,
  type ChannelFamily,
  type GroupChannel,
} from '../../data/groups-data';

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

/** Las secciones de la ficha a las que lleva el resumen (DD-146). */
export type GroupSummarySeccion = 'agentes' | 'distribucion' | 'recursos';

/**
 * Adónde lleva lo que se pulsa en el resumen: una sección y, dentro de Distribución y colas, el bloque de un canal
 * (las filas de Distribución) o un número (las de Salida). La ficha lo traduce a su sección y a su ancla.
 */
export interface GroupSummaryDestino {
  readonly seccion: GroupSummarySeccion;
  readonly canal?: 'phone' | 'chat';
  readonly salida?: 'phone' | 'whatsapp';
}

interface ChannelRow {
  readonly channel: ChannelFamily;
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
 *   · Agentes habilitados: cuántos atienden de los asignados (los demás, deshabilitados), y cuántos cada canal.
 *     Un canal activo sin nadie que lo atienda sale en aviso, con icono y texto (el color solo no
 *     basta, WCAG 1.4.1).
 *   · Distribución: la estrategia de cada familia de canales.
 *   · Salida: el teléfono saliente y el número de WhatsApp.
 *   · Recursos: cuántos le llegan desde Repositorios.
 *
 * Y lleva a donde se arregla lo que dice (DD-146): el rótulo de cada tarjeta, a su sección; cada fila de
 * Distribución, al bloque de su canal; cada fila de Salida, a su número. Son enlaces de verdad, con la dirección de
 * la sección, y la ficha resuelve el clic en su sitio (en el alta, sin tocar la dirección y con General de puerta).
 *
 * Distribución y Salida, además, abren un panel rápido (revisión de diseño, 2026-10-11, sobre el prototipo del
 * encargo): uno abierto a la vez, como el original. El de Teléfono en Distribución trae las tres estrategias que
 * no piden nada más (`DEFAULT_STRATEGY_OPTIONS`, SISMAC-1975), con la misma frase de ayuda que el campo real
 * (`PHONE_STRATEGY_HELP_KEYS`, DD-133): elegir una la aplica al momento (`cambiarReparto`). Las otras tres
 * (Niveles, Ring All, Agente exclusivo) necesitan algo más y se quedan en Distribución y colas, donde ya lleva
 * el enlace de la fila; Chat no tiene esta ayuda documentada, así que se queda solo con su enlace. El de Salida
 * lleva los recursos de verdad del grupo (`resourceRows`, DD-164: agendas y plantillas, con su nombre y su dato,
 * las mismas filas que ya pinta Recursos) — nunca los «Línea principal» / «Guion de atención» fijos del
 * prototipo: ese grupo puede no tener ni uno ni el otro, y esto no inventa contenido.
 *
 * El rótulo dice «Distribución», no «Reparto» (nombre antiguo del 2026-10-11, corregido el mismo día): la
 * sección a la que lleva se llama «Distribución y colas» y su propia cabecera dentro dice «Distribución»; dos
 * palabras para lo mismo confundían más de lo que ahorraban letras. `cambiarReparto` se queda con su nombre: es
 * un identificador interno, no lo lee nadie en pantalla.
 */
@Component({
  selector: 'sc-group-summary',
  imports: [
    TranslateModule,
    MeterGroupModule,
    ScIconComponent,
    FactRowComponent,
    IconTileComponent,
    ChannelIconComponent,
    AnimateOnChangeDirective,
    SummaryKpiComponent,
    SummaryStatusComponent,
  ],
  templateUrl: './group-summary.component.html',
  styleUrl: './group-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupSummaryComponent {
  /** Los canales del grupo, en el orden canónico. */
  readonly channels = input.required<readonly GroupChannel[]>();
  readonly links = input.required<readonly GroupAgentLink[]>();
  readonly routing = input<readonly GroupSummaryRouting[]>([]);
  readonly outbound = input<readonly GroupSummaryOutbound[]>([]);
  readonly resourceCount = input(0);
  /** Los recursos de verdad del grupo, para el panel rápido de Salida: agendas y plantillas, ya resueltos
   *  (DD-164). Sin ellos, el panel se queda solo con «Ver recursos». */
  readonly resourceRows = input<readonly ResourceRow[]>([]);
  /** Claves de lo que falta para poder crear (nombre, canales). Vacío = nada. */
  readonly missing = input<readonly string[]>([]);
  /** Es un alta: el estado está siempre, y dice «Listo para crear» cuando `ready`. */
  readonly creating = input(false);
  /** El botón «Crear grupo» está encendido. */
  readonly ready = input(false);
  /** La dirección de cada sección a la que lleva el resumen, como la escribe el índice. */
  readonly hrefs = input.required<Readonly<Record<GroupSummarySeccion, string>>>();
  /** Se pulsó algo del resumen, sin teclas: la ficha va a su sitio. */
  readonly ir = output<GroupSummaryDestino>();
  /** Se eligió una estrategia de teléfono en el selector rápido: la ficha la aplica al campo real. */
  readonly cambiarReparto = output<string>();

  protected readonly channelKeys = CHANNEL_LABEL_KEYS;
  protected readonly familyKeys = FAMILY_LABEL_KEYS;
  /** El nombre de cada fila de Salida es el del campo real al que lleva («Teléfono saliente», «Número
   *  WhatsApp»), no el genérico del canal: el mismo criterio que igualó «Reparto» con «Distribución». */
  protected readonly outboundKeys = OUTBOUND_LABEL_KEYS;
  /** Las tres estrategias de teléfono que el selector rápido puede poner sin pedir nada más. */
  protected readonly quickStrategyOptions = DEFAULT_STRATEGY_OPTIONS;
  /** Qué panel rápido está abierto: uno a la vez, como el prototipo del encargo. */
  protected readonly expandedQuick = signal<'reparto' | 'salida' | null>(null);
  /** La barra de cada canal va en la cifra destacada (DD-161): su pista, translúcida en el color claro de la tarjeta. */
  protected readonly meterDt = { meters: { background: 'color-mix(in srgb, var(--sc-text-inverse) 25%, transparent)' } };

  protected readonly total = computed(() => this.links().length);
  protected readonly disabled = computed(() => this.links().filter((l) => !l.active).length);

  /**
   * Quién atiende cada familia (Teléfono, Chat y Email, DD-147): los agentes HABILITADOS que la tienen
   * marcada. Uno deshabilitado no atiende, así que no cuenta; la línea «N deshabilitados» de arriba dice por qué
   * las cifras no suman. La barra es esa cifra sobre el total del grupo, del mismo color para las tres,
   * como sus glifos en las listas (decisión de producto, 2026-09-16: el canal lo dice la forma). El de
   * acento y no el primario: el azul de los botones pesaba más que las cifras que acompaña.
   */
  protected readonly channelRows = computed<readonly ChannelRow[]>(() => {
    const total = this.total();
    const active = this.links().filter((l) => l.active);
    return familiesOf(this.channels()).map((channel) => {
      const count = active.filter((l) => l.channels.includes(channel)).length;
      const value = total > 0 ? Math.round((count / total) * 100) : 0;
      return { channel, count, meter: [{ label: channel, value, color: 'var(--sc-text-inverse)' }] };
    });
  });

  protected familyKey(family: GroupSummaryRouting['family']): string {
    return FAMILY_LABEL_KEYS[family];
  }

  protected quickStrategyHelpKey(valor: string): string | null {
    return PHONE_STRATEGY_HELP_KEYS[valor] ?? null;
  }

  protected toggleQuick(panel: 'reparto' | 'salida'): void {
    this.expandedQuick.update((actual) => (actual === panel ? null : panel));
  }

  protected elegirQuickStrategy(valor: string): void {
    this.cambiarReparto.emit(valor);
    this.expandedQuick.set(null);
  }

  /** Un clic sin teclas va al sitio en la ficha; con Cmd, Ctrl, Mayús o el botón central, el navegador abre la dirección. */
  protected pulsar(evento: MouseEvent, destino: GroupSummaryDestino): void {
    if (evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    this.ir.emit(destino);
  }
}
