import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { MenuItem } from 'primeng/api';
import { MenuModule, type Menu } from 'primeng/menu';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';
import type { Group } from '@features/admin/groups/data/groups-data';
import { GroupsStore } from '@features/admin/groups/state/groups.store';

import { idDeGrupoDeLaDemo } from '../../data/demo-entities';

let agentsMenuIdCounter = 0;

/**
 * «Agentes», en la cabecera del widget «Grupos»: abre el panel rápido de agentes del grupo que vigila, o, si vigila
 * varios, un menú para elegir cuál (DD-168). Va en el hueco `[scWidgetAction]` de la tarjeta, que no sabe de grupos.
 *
 * Los grupos salen de los nombres que guarda el widget: nombre → id de la demo → el grupo de hoy en `GroupsStore`.
 * Uno borrado en Administración no sale, y sin ninguno no hay botón. El latido de 8 s rehace el widget pero no su
 * lista de nombres, así que este `computed` no se rehace con él: un menú rehecho en cada ciclo perdía el primer clic
 * (como le pasaba al menú de fila del listado).
 *
 * Con varios grupos, el botón abre SU menú: `ariaHasPopup`, `ariaExpanded` y `ariaControls` lo dicen (DD-171), igual
 * que el ⋮ de la tarjeta. Con uno solo, el clic abre directamente el panel que vigila la página (otro componente,
 * lejos en el DOM): no es un popup que este botón controle, así que no lleva `ariaHasPopup`.
 */
@Component({
  selector: 'sc-dashboard-agents-action',
  imports: [TranslateModule, MenuModule, ButtonComponent],
  templateUrl: './agents-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentsActionComponent {
  private readonly groupsStore = inject(GroupsStore);
  private readonly translate = inject(TranslateService);
  /** Los textos del menú salen de `instant()`: se recalculan al cambiar de idioma. */
  private readonly lang = injectLangChange();

  /** Los nombres que vigila el widget, tal como los guarda. */
  readonly entities = input.required<readonly string[]>();
  /** Se ha elegido un grupo: la página abre su panel. */
  readonly open = output<Group>();

  protected readonly groups = computed<readonly Group[]>(() =>
    this.entities().flatMap((nombre) => {
      const id = idDeGrupoDeLaDemo(nombre);
      const group = id === undefined ? undefined : this.groupsStore.getGroup(id);
      return group ? [group] : [];
    }),
  );

  /** Con un grupo dice cuál, porque abre su panel; con varios, abre el menú que los nombra. */
  protected readonly ariaLabel = computed(() => {
    this.lang();
    const groups = this.groups();
    return groups.length === 1
      ? this.translate.instant('dashboard.assign_agents.aria_one', { name: groups[0].name })
      : this.translate.instant('dashboard.assign_agents.aria');
  });

  protected readonly menuItems = computed<MenuItem[]>(() => {
    this.lang();
    return [
      {
        label: this.translate.instant('dashboard.assign_agents.menu'),
        items: this.groups().map((group) => ({ label: group.name, command: () => this.pick(group) })),
      },
    ];
  });

  /** Id del `p-menu`, para `aria-controls`: solo hay menú (y solo lo necesita) con varios grupos. */
  protected readonly menuId = `sc-dashboard-agents-menu-${++agentsMenuIdCounter}`;

  /** Si el botón abre SU menú (varios grupos) o nada propio (uno solo, abre el panel directamente). */
  protected readonly ariaHasPopup = computed<'menu' | null>(() => (this.groups().length > 1 ? 'menu' : null));

  /** Si el menú está abierto, solo relevante cuando `ariaHasPopup` lo es. */
  protected readonly menuOpen = signal(false);

  /** El botón que abrió el menú: el foco vuelve a él antes de abrir el panel. */
  private trigger: HTMLElement | null = null;

  protected onClick(event: MouseEvent, menu: Menu): void {
    const groups = this.groups();
    if (groups.length === 1) {
      this.open.emit(groups[0]);
      return;
    }
    this.trigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    menu.toggle(event);
  }

  /**
   * El menú se lleva el foco a su lista, que desaparece al elegir. Se devuelve al botón antes de abrir el panel, que
   * recuerda lo que tenía el foco al abrirse y lo devuelve al cerrar.
   */
  private pick(group: Group): void {
    this.trigger?.focus();
    this.open.emit(group);
  }
}
