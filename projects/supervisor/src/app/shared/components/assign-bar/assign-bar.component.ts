import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScSearchComponent as SearchComponent,
  ScSelectButtonComponent as SelectbuttonComponent,
} from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';

export type AssignFilter = 'all' | 'assigned' | 'unassigned';

const FILTROS: readonly AssignFilter[] = ['all', 'assigned', 'unassigned'];

/**
 * La barra de toda tabla de asignar (DD-243): el filtro del conjunto primero, el buscador después llenando lo que queda,
 * y la cifra de asignados al final. El filtro dice QUÉ se ve y el buscador busca dentro de eso, como las vistas de las
 * listas de Polaris, Stripe o Linear; las tablas sin filtro empiezan por el buscador (`sc-list-page`).
 *
 * La usan la ficha de grupo (sus agentes), la de agente (sus grupos), Equipos, Agendas y Plantillas: un solo sitio para
 * el orden, los tamaños y los textos. Solo pinta: el filtro y la búsqueda los aplica la tabla.
 */
@Component({
  selector: 'sc-assign-bar',
  imports: [SearchComponent, SelectbuttonComponent, TranslateModule],
  template: `
    <sc-selectbutton
      size="sm"
      [options]="options()"
      optionValue="value"
      [allowEmpty]="false"
      [value]="filter()"
      (valueChange)="filter.set($any($event))"
      [ariaLabel]="filterLabel()"
    />
    <sc-search
      class="assign-bar__search"
      [placeholder]="placeholder()"
      [clearAriaLabel]="'labels.clear_search' | translate"
      [value]="query()"
      (valueChange)="query.set($event)"
    />
    @if (count() !== null) {
      <span class="assign-bar__count sc-text-caption-regular" role="status">{{ countLabel() }}</span>
    }
  `,
  styles: `
    /* De borde a borde de la tabla (DD-176): el buscador llena lo que dejan el filtro y la cifra. */
    :host {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--sc-spacing-0-5);
    }
    /* Quien la usa puede bajar la base del buscador (el panel rápido, 10rem). */
    .assign-bar__search {
      flex: 1 1 var(--assign-bar-search-basis, var(--sc-spacing-18));
      min-width: 0;
    }
    .assign-bar__count {
      margin-inline-start: auto;
      color: var(--sc-text-secondary);
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignBarComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  readonly filter = model.required<AssignFilter>();
  readonly query = model('');
  /** «Buscar agentes…», «Buscar grupos…»: ya traducido. */
  readonly placeholder = input.required<string>();
  /** El nombre del filtro para el lector de pantalla, ya traducido. */
  readonly filterLabel = input.required<string>();
  /** Cuántos hay asignados; `null` lo calla (ninguna tabla de asignar lo hace hoy). */
  readonly count = input<number | null>(null);

  protected readonly options = computed(() => {
    this.lang();
    return FILTROS.map((value) => ({ value, label: this.translate.instant(`common.assign_bar.${value}`) }));
  });

  protected readonly countLabel = computed(() => {
    this.lang();
    const count = this.count() ?? 0;
    return this.translate.instant(count === 1 ? 'common.assign_bar.count_one' : 'common.assign_bar.count_other', { count });
  });
}
