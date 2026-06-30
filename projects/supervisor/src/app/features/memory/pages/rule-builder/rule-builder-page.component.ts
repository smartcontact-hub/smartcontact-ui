import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

import { TOAST_LIFE } from '@core/utils/toast-life';
import { DirtyAware } from '@core/guards';
import { IconComponent } from '@shared/components';
import { ScInputTextComponent as InputTextComponent } from '@smartcontact-hub/components';
import { ScMultiSelectComponent as MultiSelectComponent } from '@smartcontact-hub/components';
import { ScSelectComponent as SelectComponent } from '@smartcontact-hub/components';
import { ScToggleSwitchComponent as ToggleSwitchComponent } from '@smartcontact-hub/components';

import { RuleConditionBuilderComponent } from '../../components/rule-condition-builder/rule-condition-builder.component';
import { ConditionResolverService } from '../../data/condition-resolver.service';
import {
  type ConditionTree,
  deriveLegacyScope,
  deriveTreeFromLegacy,
  emptyConditionTree,
} from '../../data/condition.types';
import type { Direction, Rule, RuleType } from '../../data/rule.types';
import { CategoriesStore } from '../../state/categories.store';
import { RulesStore } from '../../state/rules.store';

/**
 * Constructor de reglas Memory · iter 9c-1.
 *
 * Réplica de `Memory/docs/specs/rule-constructor-update.md` para tipo
 * Recording (resto de tipos en iter 9c-2).
 *
 * Bloques verticales apilados:
 *   1. Metadatos (nombre + descripción + active toggle).
 *   2. Alcance (3 dimensiones AND, OR dentro): Servicios + Grupos +
 *      Agentes. Microcopy "Desde repositorio de X" + enlace "Ver
 *      repositorio" + chips con contador para grupos/agentes.
 *   3. Grabación: Dirección + Filtrar por horario.
 *
 * Rutas:
 *   - `/conversaciones/reglas/nueva?type=recording` — nueva regla vacía.
 *   - `/conversaciones/reglas/:id` — edit.
 *
 * Bloque Transcripción + Análisis IA + tipos
 * Classification/Transcription quedan para iter 9c-2.
 */
@Component({
  selector: 'sc-memory-rule-builder-page',
  imports: [
    ButtonModule,
    FormsModule,
    IconComponent,
    InputTextComponent,
    MultiSelectComponent,
    RouterLink,
    RuleConditionBuilderComponent,
    SelectComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './rule-builder-page.component.html',
  styleUrl: './rule-builder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleBuilderPageComponent implements DirtyAware {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rulesStore = inject(RulesStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly resolver = inject(ConditionResolverService);

  /** Catálogo de categorías IA para el selector — solo activas + sólo
   *  visible en `type: 'classification'`. Spec S49 §10 #13. */
  protected readonly categoryOptions = computed(() =>
    this.categoriesStore.activeCategories().map((c) => ({ value: c.id, label: c.name })),
  );

  protected readonly backIcon = 'arrow_back';
  protected readonly externalIcon = 'open_in_new';
  protected readonly micIcon = 'mic';
  protected readonly fileTextIcon = 'description';
  protected readonly sparklesIcon = 'auto_awesome';
  protected readonly alertIcon = 'warning';
  protected readonly trashIcon = 'delete';

  protected readonly directionOptions = [
    { value: 'all' as Direction, labelKey: 'memory.rules.builder.direction.all' },
    { value: 'inbound' as Direction, labelKey: 'memory.rules.builder.direction.inbound' },
    { value: 'outbound' as Direction, labelKey: 'memory.rules.builder.direction.outbound' },
  ];

  protected readonly durationUnitOptions = [
    { value: 'seconds', labelKey: 'memory.rules.builder.duration_unit.seconds' },
    { value: 'minutes', labelKey: 'memory.rules.builder.duration_unit.minutes' },
  ];

  protected readonly ruleId = signal<number | null>(null);
  protected readonly ruleType = signal<RuleType>('recording');
  protected readonly isEditMode = computed(() => this.ruleId() !== null);
  protected readonly isDraft = signal(false);

  // Form state
  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly active = signal(true);
  protected readonly conditionTree = signal<ConditionTree>(emptyConditionTree());
  protected readonly direction = signal<Direction>('all');
  protected readonly filterBySchedule = signal(false);
  protected readonly scheduleFrom = signal('09:00');
  protected readonly scheduleTo = signal('18:00');
  // Transcripción (iter 9c-2)
  protected readonly durationMin = signal(30);
  protected readonly durationUnit = signal<'seconds' | 'minutes'>('seconds');
  protected readonly aiAnalysis = signal(false);
  // Categorías IA (solo classification + aiAnalysis ON) · S49 §10 #13
  protected readonly categorias = signal<readonly string[]>([]);

  protected readonly nameInvalid = computed(() => this.name().trim().length < 3);
  protected readonly canSave = computed(() => !this.nameInvalid());

  /** JSON snapshot of every editable field — feeds the unsaved-changes guard. */
  private buildSnapshot(): string {
    return JSON.stringify({
      name: this.name(),
      description: this.description(),
      active: this.active(),
      conditionTree: this.conditionTree(),
      direction: this.direction(),
      filterBySchedule: this.filterBySchedule(),
      scheduleFrom: this.scheduleFrom(),
      scheduleTo: this.scheduleTo(),
      durationMin: this.durationMin(),
      durationUnit: this.durationUnit(),
      aiAnalysis: this.aiAnalysis(),
      categorias: this.categorias(),
    });
  }

  /** Original (saved/initial) state — `formDirty` compares against this. */
  private readonly pristine = signal('');
  /**
   * Public for `formDirtyGuard` (canDeactivate): the rule-builder is the only
   * editor that previously lost edits silently on navigation. Now it confirms
   * with the shared discard dialog, like the admin forms and AED config.
   */
  readonly formDirty = computed(() => this.buildSnapshot() !== this.pristine());

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.paramMap.get('id');
      if (idParam) {
        const id = Number(idParam);
        const rule = this.rulesStore.getRule(id);
        if (rule) {
          this.loadFromRule(rule);
          this.ruleId.set(id);
          return;
        }
        // Id no encontrado → volver al listado
        this.router.navigate(['/conversaciones/reglas']);
        return;
      }
      const typeParam = this.route.snapshot.queryParamMap.get('type') as RuleType | null;
      if (
        typeParam === 'recording' ||
        typeParam === 'transcription' ||
        typeParam === 'classification'
      ) {
        this.ruleType.set(typeParam);
      }
      // New rule: capture the blank baseline so the guard only fires after edits.
      this.pristine.set(untracked(() => this.buildSnapshot()));
    });
  }

  private loadFromRule(rule: Rule): void {
    this.ruleType.set(rule.type);
    this.isDraft.set(!!rule.isDraft);
    this.name.set(rule.name);
    this.description.set(rule.description ?? '');
    this.active.set(rule.active);
    this.conditionTree.set(rule.conditionTree ?? deriveTreeFromLegacy(rule));
    this.direction.set(rule.direction ?? 'all');
    this.filterBySchedule.set(rule.schedule?.enabled ?? false);
    this.scheduleFrom.set(rule.schedule?.from ?? '09:00');
    this.scheduleTo.set(rule.schedule?.to ?? '18:00');
    // Transcripción
    const durMin = rule.durationMin ?? 30;
    if (durMin >= 60 && durMin % 60 === 0) {
      this.durationMin.set(durMin / 60);
      this.durationUnit.set('minutes');
    } else {
      this.durationMin.set(durMin);
      this.durationUnit.set('seconds');
    }
    this.aiAnalysis.set(rule.aiAnalysis ?? false);
    this.categorias.set(rule.categorias ?? []);
    // Loaded values are the clean baseline for the unsaved-changes guard.
    this.pristine.set(untracked(() => this.buildSnapshot()));
  }

  protected onSave(): void {
    if (!this.canSave()) return;
    // El árbol es la fuente de verdad del alcance; derivamos los campos planos
    // para que listado y detección de conflictos sigan funcionando sin cambios.
    const scope = deriveLegacyScope(this.conditionTree(), this.resolver);
    const base: Omit<Rule, 'id' | 'lastModified' | 'priority'> = {
      type: this.ruleType(),
      name: this.name().trim(),
      description: this.description().trim() || undefined,
      servicios: scope.servicios,
      grupos: scope.grupos,
      agentes: scope.agentes,
      conditionTree: this.conditionTree(),
      recording: this.ruleType() === 'recording',
      transcripcion: this.ruleType() === 'transcription',
      clasificacion: this.ruleType() === 'classification',
      active: this.active(),
      direction: this.direction(),
      schedule: {
        enabled: this.filterBySchedule(),
        from: this.scheduleFrom(),
        to: this.scheduleTo(),
      },
      durationMin: this.durationUnit() === 'minutes' ? this.durationMin() * 60 : this.durationMin(),
      aiAnalysis: this.aiAnalysis(),
      // Solo persistimos categorías si la regla es classification + aiAnalysis;
      // si el usuario cambia el tipo o desactiva el toggle quedan limpias.
      categorias:
        this.ruleType() === 'classification' && this.aiAnalysis() ? this.categorias() : [],
    };

    if (this.isEditMode()) {
      // Si era borrador → guardar retira el flag (spec line 130-139).
      const patch = this.isDraft() ? { ...base, isDraft: false } : base;
      this.rulesStore.updateRule(this.ruleId()!, patch);
      const summaryKey = this.isDraft()
        ? 'memory.rules.builder.draft_ready_toast'
        : 'memory.rules.builder.updated_toast';
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant(summaryKey),
        life: TOAST_LIFE.success,
      });
    } else {
      this.rulesStore.addRule(base);
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('memory.rules.builder.created_toast'),
        life: TOAST_LIFE.success,
      });
    }
    // Just saved → the current form IS the clean state; don't prompt on the way out.
    this.pristine.set(this.buildSnapshot());
    this.router.navigate(['/conversaciones/reglas']);
  }

  protected onDiscardDraft(): void {
    const id = this.ruleId();
    if (id === null || !this.isDraft()) return;
    this.rulesStore.deleteRule(id);
    this.messages.add({
      severity: 'info',
      summary: this.translate.instant('memory.rules.builder.discarded_toast'),
      life: TOAST_LIFE.info,
    });
    // Discarding the draft is an explicit exit — skip the dirty guard prompt.
    this.pristine.set(this.buildSnapshot());
    this.router.navigate(['/conversaciones/reglas']);
  }

  protected onCancel(): void {
    this.router.navigate(['/conversaciones/reglas']);
  }

  protected setName(v: string): void {
    this.name.set(v);
  }

  protected setDescription(v: string): void {
    this.description.set(v);
  }

  protected setCategorias(v: unknown[] | readonly string[]): void {
    this.categorias.set((v ?? []) as readonly string[]);
  }
}
