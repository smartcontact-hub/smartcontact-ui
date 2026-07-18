import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

import { IconComponent } from '@shared/components';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import { ScInputTextComponent as InputTextComponent } from '@smartcontact-hub/components';
import { ScDialogComponent as DialogComponent } from '@smartcontact-hub/components';
import { ScSelectComponent as SelectComponent } from '@smartcontact-hub/components';
import { ScToggleSwitchComponent as ToggleSwitchComponent } from '@smartcontact-hub/components';

import type { Category } from '../../data/category.types';
import type { Rule } from '../../data/rule.types';
import { CategoriesStore } from '../../state/categories.store';
import { RulesStore } from '../../state/rules.store';

/**
 * CategoryFormModal · Crear + Editar categorías IA · iter 11b + 11c + S49 §10 #13.
 *
 * Unifica `CreateCategoryPanel` + `EditCategoryPanel` del prototipo
 * React en modal SCDS.
 *
 * Features:
 *  - **Templates predefinidos** (S39, iter 11c): 4 plantillas (Queja,
 *    Intención de baja, Competencia, Incidencia) seleccionables vía
 *    dialog secundario que prellena name + description.
 *  - **CategoryRuleLinking bidireccional** (S49 §10 #13): réplica del
 *    React `CategoryRuleLinking.tsx`. 4 variantes según estado:
 *      A. linkedRules=0 + reglas=0 → empty state + CTA "Crear regla"
 *      B. linkedRules=0 + reglas>0 → alert "no activa" + selector
 *      C. linkedRules>0 + alguna activa → success + lista[unlink] + "añadir otra"
 *      D. linkedRules>0 + todas inactivas → muted + lista[unlink] + "añadir otra"
 *    Fuente de verdad: `Rule.categorias[]`. Link/unlink en `RulesStore`.
 *
 * Campos:
 *  - Name (required, min 3 chars, unique).
 *  - Description (required, min 10 chars).
 *  - Group (opcional, free text — ej. "Atención al Cliente", "Ventas").
 *  - isActive toggle.
 */

type CategoryTemplateId = 'complaint' | 'churn' | 'competitor' | 'incident';

interface CategoryTemplate {
  readonly id: CategoryTemplateId;
  readonly icon: string;
  readonly title: string;
  readonly hint: string;
  readonly name: string;
  readonly description: string;
}

const CATEGORY_TEMPLATES: readonly CategoryTemplate[] = [
  {
    id: 'complaint',
    icon: 'error',
    title: 'Queja',
    hint: 'Cliente expresa insatisfacción',
    name: 'Queja',
    description:
      'Llamadas donde los clientes expresan insatisfacción, frustración o presentan quejas sobre el servicio, productos o experiencias vividas. Incluye reclamaciones formales y expresiones de descontento.',
  },
  {
    id: 'churn',
    icon: 'warning',
    title: 'Intención de baja',
    hint: 'Cliente quiere cancelar servicio',
    name: 'Intención de baja',
    description:
      'Llamadas donde el cliente manifiesta su deseo de cancelar el servicio, darse de baja o terminar la relación comercial. Incluye amenazas de baja y solicitudes formales de cancelación.',
  },
  {
    id: 'competitor',
    icon: 'business',
    title: 'Competencia',
    hint: 'Menciona otras empresas',
    name: 'Competencia',
    description:
      'Llamadas donde se mencionan empresas competidoras, comparaciones de precios o servicios, ofertas de la competencia o intención de cambiar de proveedor por una alternativa del mercado.',
  },
  {
    id: 'incident',
    icon: 'build',
    title: 'Incidencia',
    hint: 'Reporta problemas técnicos',
    name: 'Incidencia',
    description:
      'Llamadas reportando problemas técnicos, fallos en el servicio, averías, errores en sistemas o cualquier situación que requiera intervención técnica o resolución de incidentes.',
  },
];

@Component({
  selector: 'sc-memory-category-form-modal',
  imports: [
    ButtonComponent,
    FormsModule,
    IconComponent,
    InputTextComponent,
    DialogComponent,
    RouterLink,
    SelectComponent,
    ToggleSwitchComponent,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './category-form-modal.component.html',
  styleUrl: './category-form-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormModalComponent {
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly rulesStore = inject(RulesStore);

  readonly visible = input<boolean>(false);
  readonly category = input<Category | null>(null);

  readonly closed = output<void>();
  readonly saved = output<Category>();

  protected readonly tagsIcon = 'label';
  protected readonly externalIcon = 'open_in_new';
  protected readonly layoutTemplateIcon = 'dashboard';
  protected readonly alertIcon = 'warning';
  protected readonly checkIcon = 'check';
  protected readonly infoIcon = 'info';
  protected readonly fileTextIcon = 'description';
  protected readonly plusIcon = 'add';
  protected readonly xIcon = 'close';

  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly group = signal('');
  protected readonly isActive = signal(true);

  protected readonly isEditMode = computed(() => this.category() !== null);

  protected readonly templatesDialogVisible = signal(false);
  protected readonly templates: readonly CategoryTemplate[] = CATEGORY_TEMPLATES;

  protected readonly nameError = computed<string | null>(() => {
    const trimmed = this.name().trim();
    if (trimmed.length === 0) return null;
    if (trimmed.length < 3) return 'memory.categories.form.name_error_short';
    if (this.categoriesStore.isNameTaken(trimmed, this.category()?.id)) {
      return 'memory.categories.form.name_error_duplicate';
    }
    return null;
  });

  protected readonly canSave = computed(() => {
    const trimmedName = this.name().trim();
    const trimmedDesc = this.description().trim();
    return (
      trimmedName.length >= 3 &&
      !this.categoriesStore.isNameTaken(trimmedName, this.category()?.id) &&
      trimmedDesc.length >= 10
    );
  });

  // ─── Vinculación con reglas (S49 §10 #13) ───────────────────────────

  /** Reglas que referencian esta categoría. Derivado de `Rule.categorias`. */
  protected readonly linkedRules = computed<readonly Rule[]>(() => {
    const cat = this.category();
    if (!cat) return [];
    return this.rulesStore.rulesUsingCategory(cat.id);
  });

  protected readonly hasActiveRules = computed(() => this.linkedRules().some((r) => r.active));

  protected readonly allRulesInactive = computed(() => {
    const linked = this.linkedRules();
    return linked.length > 0 && !linked.some((r) => r.active);
  });

  /** Reglas disponibles para añadir (todas menos las ya vinculadas). */
  protected readonly availableRules = computed<readonly Rule[]>(() => {
    const linkedIds = new Set(this.linkedRules().map((r) => r.id));
    return this.rulesStore.rules().filter((r) => !linkedIds.has(r.id));
  });

  protected readonly availableRuleOptions = computed(() =>
    this.availableRules().map((r) => ({
      value: r.id,
      label: r.name,
      hint: this.formatRuleHint(r),
    })),
  );

  protected readonly hasAnyRules = computed(() => this.rulesStore.rules().length > 0);

  /** Estado UI del selector "Añadir a regla existente". Se resetea al cerrar. */
  protected readonly selectedRuleToAdd = signal<number | null>(null);

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const c = this.category();
      if (c) {
        this.name.set(c.name);
        this.description.set(c.description);
        this.group.set(c.group ?? '');
        this.isActive.set(c.isActive);
      } else {
        this.name.set('');
        this.description.set('');
        this.group.set('');
        this.isActive.set(true);
      }
      this.selectedRuleToAdd.set(null);
    });
  }

  protected setName(v: string): void {
    this.name.set(v);
  }

  protected setDescription(v: string): void {
    this.description.set(v);
  }

  protected setGroup(v: string): void {
    this.group.set(v);
  }

  protected onCancel(): void {
    this.closed.emit();
  }

  protected openTemplatesDialog(): void {
    this.templatesDialogVisible.set(true);
  }

  protected closeTemplatesDialog(): void {
    this.templatesDialogVisible.set(false);
  }

  protected selectTemplate(t: CategoryTemplate): void {
    this.name.set(t.name);
    this.description.set(t.description);
    this.templatesDialogVisible.set(false);
  }

  protected onSave(): void {
    if (!this.canSave()) return;
    const base = {
      name: this.name().trim(),
      description: this.description().trim(),
      group: this.group().trim() || undefined,
      isActive: this.isActive(),
    };

    const editing = this.category();
    if (editing) {
      this.categoriesStore.updateCategory(editing.id, base);
      const updated = this.categoriesStore.getCategory(editing.id)!;
      this.saved.emit(updated);
    } else {
      const created = this.categoriesStore.addCategory(base);
      this.saved.emit(created);
    }
  }

  // ─── Link / Unlink reglas ────────────────────────────────────────────

  protected onAddRule(ruleId: number | null): void {
    const cat = this.category();
    if (!cat || ruleId === null) return;
    this.rulesStore.linkCategoryToRule(ruleId, cat.id);
    // Reset del selector para que vuelva al placeholder.
    this.selectedRuleToAdd.set(null);
  }

  protected onUnlinkRule(ruleId: number): void {
    const cat = this.category();
    if (!cat) return;
    this.rulesStore.unlinkCategoryFromRule(ruleId, cat.id);
  }

  private formatRuleHint(rule: Rule): string {
    const services = rule.servicios.slice(0, 2).join(', ');
    const extra = rule.servicios.length > 2 ? ` +${rule.servicios.length - 2}` : '';
    const catCount = rule.categorias?.length ?? 0;
    return `${services}${extra} · ${catCount} cat.`;
  }
}
