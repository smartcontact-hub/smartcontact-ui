import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectButtonModule } from 'primeng/selectbutton';

import {
  ScButtonComponent as ButtonComponent,
  ScChipComponent as ChipComponent,
  ScDatepickerComponent as DatepickerComponent,
  ScMultiSelectComponent as MultiSelectComponent,
  ScSearchComponent as SearchComponent,
  type ScDatepickerPreset,
} from '@smartcontact-hub/components';

import {
  AGENT_OPTIONS,
  GROUP_OPTIONS,
  SERVICE_OPTIONS,
} from '../../data/conversation-filter-options';
import {
  EMPTY_FILTERS,
  type MemoryConversationFilters,
} from '../../data/conversation-filters.types';
import { LanguageService } from '../../../../core/services/language.service';
import { TypeFilterButtonComponent } from '../type-filter-button/type-filter-button.component';
import { injectLangChange } from '@core/utils/lang-change';

type QuickView = 'all' | 'pending' | 'failed';

/** Una dimensión de filtro activa, pintada como etiqueta quitable bajo la barra. */
interface ActiveChip {
  readonly key: ChipKey;
  readonly label: string;
}

type ChipKey =
  | 'query'
  | 'services'
  | 'dateRange'
  | 'groups'
  | 'agents'
  | 'aiCategories'
  | 'types'
  | 'channels'
  | 'directions'
  | 'rules'
  | 'multirec';

/**
 * Barra de filtros de Conversaciones (rehecha 2026-09-14), en tres franjas:
 *
 *   1. Vistas rápidas (Todas · Sin transcribir · Fallidas) y el recuento.
 *   2. Buscador (origen, destino o ID), Servicios, Fecha (rango con atajos), Grupos ACD,
 *      Agentes, Categorías IA y «Más filtros».
 *   3. Solo con filtros: una etiqueta quitable por filtro activo y «Limpiar filtros».
 *
 * El filtrado es reactivo, sin botón de buscar: cada cambio filtra la tabla al momento.
 */
@Component({
  selector: 'sc-memory-conversation-filters',
  imports: [
    ButtonComponent,
    ChipComponent,
    DatepickerComponent,
    FormsModule,
    MultiSelectComponent,
    SearchComponent,
    SelectButtonModule,
    TranslateModule,
    TypeFilterButtonComponent,
  ],
  templateUrl: './conversation-filters.component.html',
  styleUrl: './conversation-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationFiltersComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly language = inject(LanguageService);

  readonly filters = model.required<MemoryConversationFilters>();
  readonly availableAiCategories = input.required<readonly string[]>();
  /** Nº de conversaciones que pasan el filtro. */
  readonly filteredCount = input<number>(0);

  protected readonly serviceOptions = SERVICE_OPTIONS;
  protected readonly groupOptions = GROUP_OPTIONS;
  protected readonly agentOptions = AGENT_OPTIONS;

  /** Las categorías IA llegan como texto; el desplegable del DS quiere `{ label, value }`. */
  protected readonly categoryOptions = computed(() =>
    this.availableAiCategories().map((c) => ({ label: c, value: c })),
  );

  // ─── Vistas rápidas ────────────────────────────────────────────────
  protected readonly quickView = computed<QuickView>(() => {
    const s = this.filters().status;
    if (s.onlyFailed) return 'failed';
    if (s.onlyPending) return 'pending';
    return 'all';
  });

  /** `label` va ya traducido porque PrimeNG lo usa como nombre accesible de cada botón: sin
   *  `optionLabel` anunciaba «[object Object]» (medido en el DOM, 2026-09-14).
   *  SIN número a propósito (2026-09-14): al cambiar de datos de demo el ancho de cada vista
   *  cambiaba con su cifra y la fila saltaba, y el recuento ya lo dice «N conversaciones». */
  protected readonly quickViewOptions = computed(() => {
    this.lang(); // textos al día al cambiar de idioma (ver `injectLangChange`)
    const t = (k: string) => this.translate.instant(`memory.conversations.views.${k}`);
    return [
      { value: 'all' as const, label: t('all') },
      { value: 'pending' as const, label: t('pending') },
      { value: 'failed' as const, label: t('failed') },
    ];
  });

  protected setQuickView(view: QuickView | string | number | null | undefined): void {
    if (view !== 'all' && view !== 'pending' && view !== 'failed') return;
    this.filters.update((f) => ({
      ...f,
      status: { onlyFailed: view === 'failed', onlyPending: view === 'pending' },
    }));
  }

  // ─── Fecha: atajos del calendario ──────────────────────────────────
  protected readonly datePresets = computed<readonly ScDatepickerPreset[]>(() => {
    this.lang(); // textos al día al cambiar de idioma (ver `injectLangChange`)
    const t = (k: string) => this.translate.instant(`memory.conversations.filters.date_presets.${k}`);
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d;
    };
    return [
      { label: t('today'), resolve: () => [daysAgo(0), daysAgo(0)] },
      { label: t('yesterday'), resolve: () => [daysAgo(1), daysAgo(1)] },
      { label: t('last_7'), resolve: () => [daysAgo(6), daysAgo(0)] },
      // Sin «Últimos 30 días» a propósito: en el Supervisor real `getTranscriptions` responde 503
      // por encima de ~416-663 resultados y todo sale «sin transcribir» (Jira, 2026-09-09). Un
      // atajo de un clic a un rango ancho invitaría justo a esa búsqueda.
    ];
  });

  // ─── Etiquetas de filtros activos ──────────────────────────────────
  protected readonly chips = computed<readonly ActiveChip[]>(() => {
    this.lang(); // textos al día al cambiar de idioma (ver `injectLangChange`)
    const f = this.filters();
    const t = (k: string) => this.translate.instant(k);
    const chip = (key: ChipKey, nameKey: string, value: string): ActiveChip => ({
      key,
      label: `${t(nameKey)}: ${value}`,
    });
    /** Hasta dos valores con nombre; a partir de ahí, el primero y cuántos más. */
    const list = (values: readonly string[]) =>
      values.length <= 2 ? values.join(', ') : `${values[0]} +${values.length - 1}`;
    const on = <K extends string>(group: Record<K, boolean>, prefix: string) =>
      (Object.keys(group) as K[]).filter((k) => group[k]).map((k) => t(`${prefix}.${k}`));
    const out: ActiveChip[] = [];

    if (f.query) out.push(chip('query', 'memory.conversations.filters.search_chip', `«${f.query}»`));
    if (f.services.length) out.push(chip('services', 'memory.conversations.filters.services_label', list(f.services)));
    if (f.dateRange?.[0]) out.push(chip('dateRange', 'memory.conversations.filters.date_label', this.formatRange(f.dateRange)));
    if (f.groups.length) out.push(chip('groups', 'memory.conversations.filters.groups_label', list(f.groups)));
    if (f.agents.length) out.push(chip('agents', 'memory.conversations.filters.agents_label', list(f.agents)));
    if (f.aiCategories.length) out.push(chip('aiCategories', 'memory.category_filter.label', list(f.aiCategories)));
    // Tipo, canal y dirección filtran cuando NO están todos marcados: se nombra lo que queda.
    for (const [key, group, prefix, nameKey] of [
      ['types', f.types, 'memory.type_filter.types', 'memory.type_filter.groups.type'],
      ['channels', f.channels, 'memory.type_filter.channels', 'memory.type_filter.groups.channel'],
      ['directions', f.directions, 'memory.type_filter.directions', 'memory.type_filter.groups.direction'],
    ] as const) {
      const kept = on(group as Record<string, boolean>, prefix);
      if (kept.length < Object.keys(group).length) out.push(chip(key, nameKey, kept.length ? list(kept) : '—'));
    }
    // Procesamiento y multigrabación filtran cuando hay ALGUNO marcado.
    const rules = on(f.rules, 'memory.type_filter.rules');
    if (rules.length) out.push(chip('rules', 'memory.type_filter.groups.rules', list(rules)));
    const multirec = on(f.multirec, 'memory.type_filter.multirec');
    if (multirec.length) out.push(chip('multirec', 'memory.type_filter.groups.multirec', list(multirec)));
    return out;
  });

  protected removeChip(key: ChipKey): void {
    this.filters.update((f) => ({ ...f, [key]: EMPTY_FILTERS[key] }));
  }

  /** «Limpiar filtros» vacía la barra y las etiquetas; la vista rápida elegida se queda. */
  protected onReset(): void {
    this.filters.update((f) => ({ ...EMPTY_FILTERS, status: f.status }));
  }

  private formatRange(range: readonly (Date | null)[]): string {
    const fmt = new Intl.DateTimeFormat(this.language.locale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const [start, end] = range;
    if (!start) return '';
    if (!end || start.toDateString() === end.toDateString()) return fmt.format(start);
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  }

  /** Ids de los rótulos ocultos: únicos por instancia, por si la barra se pinta dos veces. */
  private static nextId = 0;
  protected readonly ids = (() => {
    const n = ConversationFiltersComponent.nextId++;
    return {
      services: `conv-filter-${n}-services`,
      date: `conv-filter-${n}-date`,
      groups: `conv-filter-${n}-groups`,
      agents: `conv-filter-${n}-agents`,
      categories: `conv-filter-${n}-categories`,
      views: `conv-filter-${n}-views`,
    };
  })();

  protected setServices(services: readonly string[] | unknown[]): void {
    this.filters.update((f) => ({ ...f, services: (services ?? []) as readonly string[] }));
  }

  protected setGroups(groups: readonly string[] | unknown[]): void {
    this.filters.update((f) => ({ ...f, groups: (groups ?? []) as readonly string[] }));
  }

  protected setAgents(agents: readonly string[] | unknown[]): void {
    this.filters.update((f) => ({ ...f, agents: (agents ?? []) as readonly string[] }));
  }

  protected setDateRange(dateRange: readonly (Date | null)[] | null): void {
    this.filters.update((f) => ({ ...f, dateRange }));
  }

  protected setQuery(query: string): void {
    this.filters.update((f) => ({ ...f, query }));
  }

  protected onAiCategoriesChange(next: readonly string[]): void {
    this.filters.update((f) => ({ ...f, aiCategories: next }));
  }
}
