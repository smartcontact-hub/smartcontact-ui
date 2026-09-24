import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { MenuModule } from 'primeng/menu';
import type { MenuItem } from 'primeng/api';
import { ScButtonComponent as ButtonComponent, ScPanelComponent as PanelComponent, type ScPanelSeverity } from '@smartcontact-hub/components';
import { ScChipComponent as ChipComponent, ScTagComponent as TagComponent } from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';

import type { WidgetAlert } from '../../data/alerts';
import type { DashboardChannel, DashboardDirection, WidgetFilter } from '../../data/dashboard.types';

const CHANNELS: readonly DashboardChannel[] = ['calls', 'chats', 'emails', 'all'];
const DIRECTIONS: readonly DashboardDirection[] = ['incoming', 'outgoing', 'all'];

/**
 * Chrome común de todo widget: título, lo que vigila y el menú ⋮, sobre `sc-panel` (DD-109).
 *
 * `sc-panel` con `fill` (el cuerpo reparte el alto del hueco), cabecera propia `#header` (el título
 * es un h2 y nombra la región del cuerpo con el `titleId` que da el panel), el ⋮ en `#icons` y el
 * borde de alerta en `severity`. Sin `toggleable`: con él, `p-panel` pondría el mismo id en su botón
 * de colapsar y en el título. El menú replica el del original (medido el 2026-09-14):
 * «Channels and types» con Tipo y Canal de opción única (solo en los widgets que se filtran),
 * «Edit» (abre el asistente con el widget cargado) y «Delete widget».
 *
 * Alerta: borde y etiqueta con el MOTIVO («6 en espera»), no solo color, y con icono distinto
 * para aviso y para crítico.
 *
 * Con un filtro puesto, el original enciende un icono junto al ⋮; aquí un chip que dice CUÁL (un
 * icono solo avisa de que hay algo) y se quita con su ✕, sin volver a abrir el menú.
 *
 * El original concatena TODAS las entidades en el subtítulo (el de Intents medía 57.000 px);
 * aquí salen las dos primeras y cuántas quedan, y el nombre completo en el `title`.
 */
@Component({
  selector: 'sc-dashboard-widget-card',
  imports: [TranslateModule, MenuModule, CdkDragHandle, ButtonComponent, ChipComponent, PanelComponent, TagComponent],
  templateUrl: './widget-card.component.html',
  styleUrl: './widget-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetCardComponent {
  private readonly translate = inject(TranslateService);

  /** Nombre ya resuelto: el que puso el usuario o el del tipo, traducido. */
  readonly title = input.required<string>();
  readonly entities = input<readonly string[]>([]);
  readonly filter = input<WidgetFilter | null>(null);
  readonly alert = input<WidgetAlert | null>(null);
  /** Vista previa del asistente: sin menú ni arrastre. */
  readonly preview = input(false, { transform: booleanAttribute });
  readonly draggable = input(false, { transform: booleanAttribute });

  readonly filterChange = output<WidgetFilter>();
  readonly edit = output<void>();
  readonly remove = output<void>();

  /** Los textos del menú salen de `instant()`: se recalculan al cambiar de idioma. */
  private readonly lang = injectLangChange();

  protected readonly kebabIcon = 'more_vert';

  /** El aviso del panel sigue al nivel de la alerta. */
  protected readonly severity = computed<ScPanelSeverity | null>(() => {
    const level = this.alert()?.level;
    return level === 'danger' ? 'danger' : level === 'warning' ? 'warn' : null;
  });

  protected readonly firstEntities = computed(() => this.entities().slice(0, 2).join(', '));
  protected readonly moreEntities = computed(() => Math.max(0, this.entities().length - 2));
  protected readonly allEntities = computed(() => this.entities().join(', '));

  /** Texto de la etiqueta del filtro activo, o `null` si no filtra nada. */
  protected readonly filterLabel = computed(() => {
    const f = this.filter();
    this.lang();
    if (!f) return null;
    const parts = [
      f.direction !== 'all' ? this.translate.instant(`dashboard.menu.directions.${f.direction}`) : null,
      f.channel !== 'all' ? this.translate.instant(`dashboard.menu.channel.${f.channel}`) : null,
    ].filter((p): p is string => p !== null);
    return parts.length ? parts.join(' · ') : null;
  });

  protected clearFilter(): void {
    this.filterChange.emit({ channel: 'all', direction: 'all' });
  }

  protected readonly menuItems = computed<MenuItem[]>(() => {
    const f = this.filter();
    this.lang();
    const remove: MenuItem = {
      label: this.translate.instant('dashboard.menu.remove'),
      icon: 'sc-icon-font sc-icon-font--delete',
      styleClass: 'sc-menu-item--danger',
      command: () => this.remove.emit(),
    };
    const edit: MenuItem = {
      label: this.translate.instant('common.edit'),
      icon: 'sc-icon-font sc-icon-font--edit',
      command: () => this.edit.emit(),
    };
    if (!f) return [edit, { separator: true }, remove];
    return [
      {
        label: this.translate.instant('dashboard.menu.direction'),
        items: DIRECTIONS.map((d) => ({
          label: this.translate.instant(`dashboard.menu.directions.${d}`),
          ...choiceIcon(f.direction === d),
          command: () => this.filterChange.emit({ ...f, direction: d }),
        })),
      },
      {
        label: this.translate.instant('dashboard.menu.channels'),
        items: CHANNELS.map((c) => ({
          label: this.translate.instant(`dashboard.menu.channel.${c}`),
          ...choiceIcon(f.channel === c),
          command: () => this.filterChange.emit({ ...f, channel: c }),
        })),
      },
      { separator: true },
      edit,
      remove,
    ];
  });
}

/**
 * La opción elegida de un menú de elección única lleva un check; las demás, el mismo check oculto para que los textos
 * no bailen. Antes era el círculo de radio (`radio_button_checked`), que desde 2026-09-24 es el REC rojo de la
 * columna Grabación de Agentes: el mismo glifo no puede decir «elegido» y «se graba».
 */
function choiceIcon(on: boolean): Pick<MenuItem, 'icon' | 'iconStyle'> {
  return { icon: 'sc-icon-font sc-icon-font--check', iconStyle: on ? undefined : { visibility: 'hidden' } };
}
