import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ListboxModule } from 'primeng/listbox';
import {
  ScButtonComponent as ButtonComponent,
  ScDialogComponent as DialogComponent,
  ScInputTextComponent as InputTextComponent,
  ScSelectComponent as SelectComponent,
} from '@smartcontact-hub/components';
import { SC_ICON_SIZE_LG, ScIconComponent as IconComponent } from '@smartcontact-hub/icons';

import { injectLangChange } from '@core/utils/lang-change';

import { buildWidget } from '../../data/build-widget';
import { MONITOR_NAME_MAX, type DashboardWidget } from '../../data/dashboard.types';
import { DEMO_ENTITIES } from '../../data/demo-entities';
import {
  CATEGORY_ICON,
  categoryKey,
  typeDescriptionKey,
  typeTitleKey,
  WIDGET_CATEGORIES,
  WIDGET_TYPES,
  widgetType,
  type WidgetCategory,
  type WidgetSize,
} from '../../data/widget-catalog';
import { WidgetCardComponent } from '../widget-card/widget-card.component';
import { WidgetViewComponent } from '../widget-view/widget-view.component';

/**
 * Asistente para crear o editar un widget.
 *
 * Es el del Supervisor real (recorrido con Playwright el 2026-09-14) con su mismo orden: categoría,
 * qué vigilar, tipo de widget y nombre, y a la derecha la vista previa en vivo con la descripción
 * del tipo. Dos diferencias a propósito: solo se ofrecen los tipos que CABEN en el hueco (el
 * original los lista todos y los grandes no se pintan desde un hueco pequeño), y la vista previa
 * es el mismo componente que queda en el tablero.
 */
@Component({
  selector: 'sc-dashboard-widget-assistant',
  imports: [
    FormsModule,
    TranslateModule,
    ListboxModule,
    ButtonComponent,
    DialogComponent,
    IconComponent,
    InputTextComponent,
    SelectComponent,
    WidgetCardComponent,
    WidgetViewComponent,
  ],
  templateUrl: './widget-assistant.component.html',
  styleUrl: './widget-assistant.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetAssistantComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  readonly visible = model(false);
  /** Tamaño del hueco que se está llenando. */
  readonly size = input.required<WidgetSize>();
  /** Widget a editar; `null` = crear uno nuevo. */
  readonly editing = input<DashboardWidget | null>(null);

  readonly saved = output<DashboardWidget>();

  protected readonly categories = WIDGET_CATEGORIES;
  protected readonly categoryIcon = CATEGORY_ICON;
  protected readonly categoryKey = categoryKey;
  protected readonly iconSize = SC_ICON_SIZE_LG;
  protected readonly nameMax = MONITOR_NAME_MAX * 2;

  protected readonly category = signal<WidgetCategory>('services');
  protected readonly selected = signal<ReadonlySet<string>>(new Set());
  protected readonly typeId = signal<string | null>(null);
  protected readonly name = signal('');

  protected readonly entities = computed(() => DEMO_ENTITIES[this.category()]);
  protected readonly entityOptions = computed(() => this.entities().map((e) => ({ label: e, value: e })));
  protected readonly selectedList = computed(() => this.entities().filter((e) => this.selected().has(e)));

  /** Tipos de la categoría que caben en el hueco. */
  protected readonly typeOptions = computed(() => {
    this.lang();
    return WIDGET_TYPES.filter((t) => t.category === this.category() && t.size === this.size()).map((t) => ({
      label: this.translate.instant(typeTitleKey(t.id)),
      value: t.id,
    }));
  });

  /** Categorías sin ningún tipo de este tamaño: se ven, pero atenuadas. */
  protected readonly emptyCategories = computed(
    () => new Set(WIDGET_CATEGORIES.filter((c) => !WIDGET_TYPES.some((t) => t.category === c && t.size === this.size()))),
  );

  protected readonly defaultName = computed(() => {
    this.lang();
    const id = this.typeId();
    return id ? this.translate.instant(typeTitleKey(id)) : '';
  });
  protected readonly description = computed(() => {
    this.lang();
    const id = this.typeId();
    return id ? this.translate.instant(typeDescriptionKey(id)) : '';
  });

  protected readonly preview = computed<DashboardWidget | null>(() => {
    const id = this.typeId();
    const entities = this.entities().filter((e) => this.selected().has(e));
    if (!id || !entities.length) return null;
    const edit = this.editing();
    return buildWidget(id, {
      id: edit?.id ?? 'preview',
      entities,
      title: this.name().trim() || null,
      filter: edit?.type === id ? edit.filter : null,
    });
  });

  protected readonly canSave = computed(() => this.preview() !== null);

  constructor() {
    // Al abrir: si se edita, carga el widget; si se crea, empieza en la primera categoría con sitio.
    effect(() => {
      if (!this.visible()) return;
      const edit = this.editing();
      untracked(() => {
        if (edit) {
          const def = widgetType(edit.type);
          this.category.set(def.category);
          this.selected.set(new Set(edit.entities));
          this.typeId.set(edit.type);
          this.name.set(edit.title ?? '');
        } else {
          this.pickCategory(WIDGET_CATEGORIES.find((c) => !this.emptyCategories().has(c)) ?? 'services');
          this.name.set('');
        }
      });
    });
  }

  protected pickCategory(category: WidgetCategory): void {
    this.category.set(category);
    // Como el original: al cambiar de categoría, todo marcado y el primer tipo que cabe.
    this.selected.set(new Set(DEMO_ENTITIES[category]));
    this.typeId.set(this.typeOptions()[0]?.value ?? null);
  }

  protected setSelected(values: readonly string[] | null): void {
    this.selected.set(new Set(values ?? []));
  }

  protected close(): void {
    this.visible.set(false);
  }

  protected save(): void {
    const widget = this.preview();
    if (!widget) return;
    const edit = this.editing();
    this.saved.emit(edit ? widget : { ...widget, id: `widget-${crypto.randomUUID().slice(0, 8)}` });
    this.visible.set(false);
  }
}
