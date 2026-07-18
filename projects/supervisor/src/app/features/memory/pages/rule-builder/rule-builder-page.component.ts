import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  type TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { TOAST_LIFE } from '@core/utils/toast-life';
import { DirtyAware } from '@core/guards';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';

import { ScInputTextComponent as InputTextComponent } from '@smartcontact-hub/components';
import { ScMultiSelectComponent as MultiSelectComponent } from '@smartcontact-hub/components';
import { ScTextareaComponent as TextareaComponent } from '@smartcontact-hub/components';
import { ScToggleSwitchComponent as ToggleSwitchComponent } from '@smartcontact-hub/components';

import { RuleConditionBuilderComponent } from '../../components/rule-condition-builder/rule-condition-builder.component';
import { ConditionResolverService } from '../../data/condition-resolver.service';
import {
  type ConditionTree,
  deriveLegacyScope,
  deriveTreeFromLegacy,
  describeConditionScope,
  emptyConditionTree,
} from '../../data/condition.types';
import { validateConditionTree } from '../../data/condition-validate';
import {
  conversationMatchesTree,
  hasUnevaluableConditions,
  projectImpact,
} from '../../data/condition-eval';
import type { Rule, RuleType } from '../../data/rule.types';
import { CategoriesStore } from '../../state/categories.store';
import { ConversationsStore } from '../../state/conversations.store';
import { RulesStore } from '../../state/rules.store';

/**
 * Constructor de reglas Memory (tipos transcription/classification — DD-27
 * retiró recording del MVP).
 *
 * Bloques verticales apilados:
 *   1. Metadatos (nombre + active toggle).
 *   2. Alcance: árbol de condiciones campo·operador·valor (Y dentro de un
 *      grupo, O entre grupos) vía `sc-rule-condition-builder`, con preview
 *      de prosa "Se cumple si:" y estimación de impacto en vivo (aside).
 *   3. Análisis IA: toggle resumen+sentimiento; en classification, además
 *      las categorías a detectar.
 *
 * Rutas:
 *   - `/conversaciones/reglas/nueva?type=transcription|classification`.
 *   - `/conversaciones/reglas/:id` — edit.
 */
@Component({
  selector: 'sc-memory-rule-builder-page',
  imports: [
    ButtonComponent,
    FormsModule,
    IconComponent,
    InputTextComponent,
    MultiSelectComponent,
    RouterLink,
    RuleConditionBuilderComponent,
    TextareaComponent,
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
  private readonly conversations = inject(ConversationsStore);
  private readonly topBarSlot = inject(TopBarSlotService);
  private readonly destroyRef = inject(DestroyRef);

  /** Acciones primarias (Cancelar / Crear) proyectadas a la TopBar — suben del
   *  dock inferior, que desaparece: guardar deja de vivir lejos de la
   *  navegación (feedback del recorrido del 1-jul). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  /** Catálogo de categorías IA para el selector — solo activas + sólo
   *  visible en `type: 'classification'`. Spec S49 §10 #13. */
  protected readonly categoryOptions = computed(() =>
    this.categoriesStore.activeCategories().map((c) => ({ value: c.id, label: c.name })),
  );

  protected readonly externalIcon = 'open_in_new';
  protected readonly sparklesIcon = 'auto_awesome';

  protected readonly ruleId = signal<number | null>(null);
  protected readonly ruleType = signal<RuleType>('transcription');
  protected readonly isEditMode = computed(() => this.ruleId() !== null);

  // Form state
  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly active = signal(true);
  protected readonly conditionTree = signal<ConditionTree>(emptyConditionTree());

  /** Descripción en vivo del alcance ("Se cumple si…") — se pinta encima del
   *  bloque 02 con campos/valores en negrita y conectores Y/O como badges. */
  protected readonly scopeDescription = computed(() =>
    describeConditionScope(this.conditionTree(), (ref) => this.resolver.label(ref)),
  );

  protected readonly aiAnalysis = signal(false);
  // Categorías IA (solo classification + aiAnalysis ON) · S49 §10 #13
  protected readonly categorias = signal<readonly string[]>([]);

  /** El usuario ya pulsó guardar → revela los errores que esperan al envío
   *  (nombre corto + "falta elegir un valor"), sin acusar mientras construye. */
  protected readonly submitted = signal(false);

  protected readonly nameInvalid = computed(() => this.name().trim().length < 3);
  /** Errores objetivos del árbol (condición incompleta / rango inválido) —
   *  bloquean guardar. Duplicados y contradicciones son `warning`: avisan en el
   *  builder pero NO bloquean (pueden ser intencionales). */
  private readonly conditionIssues = computed(() => validateConditionTree(this.conditionTree()));
  protected readonly condBlocking = computed(() =>
    this.conditionIssues().some((i) => i.severity === 'error'),
  );
  /** Condiciones sin terminar (campo vacío) — guía proactiva sutil, sin acusar. */
  protected readonly unfinishedCount = computed(
    () => this.conditionIssues().filter((i) => i.code === 'incomplete').length,
  );
  // En EDITAR exige cambio neto (formDirty); en crear basta con que sea válido.
  protected readonly canSave = computed(
    () => !this.nameInvalid() && !this.condBlocking() && (!this.isEditMode() || this.formDirty()),
  );

  /* ── Estimación de procesado (impacto en vivo; se pinta en el dock del footer,
   *  siempre visible junto a la acción). Resuelve membresía de grupos al vuelo;
   *  servicio/dirección/duración exactos, grupo/agente vía puente demo. ── */
  protected readonly impactTotal = computed(() => this.conversations.conversations().length);
  protected readonly impactCount = computed(() => {
    const ctx = { memberAgentIds: (id: number) => this.resolver.memberAgentIds(id) };
    return this.conversations
      .conversations()
      .filter((c) => conversationMatchesTree(c, this.conditionTree(), ctx)).length;
  });
  protected readonly hasUnevaluable = computed(() =>
    hasUnevaluableConditions(this.conditionTree()),
  );
  protected readonly estimate = computed(() => projectImpact(this.impactCount(), this.impactTotal()));

  /*
   * Dirección del último cambio en el estimado mensual.
   *
   * La cifra se recalcula en vivo mientras construyes condiciones, así que
   * puede decir algo más que su valor: si lo que acabas de tocar AMPLIÓ o
   * REDUJO el alcance de la regla. Eso es lo que responde al construir un
   * filtro — "¿me he pasado de restrictivo?" — y hasta ahora había que
   * recordar el número anterior de cabeza.
   *
   * Arranca en `null` a propósito: al abrir la página no ha variado nada
   * todavía, y pintar una flecha ahí sería inventarse una comparación.
   */
  protected readonly monthTrend = signal<'up' | 'down' | null>(null);
  private lastPerMonth: number | null = null;
  /** % del tráfico que toca la regla → barra de proporción (amplia vs quirúrgica). */
  protected readonly impactPct = computed(() => {
    const total = this.impactTotal();
    return total ? Math.round((this.impactCount() / total) * 100) : 0;
  });
  /** Pista honesta: evaluable, sin errores y NINGUNA conversación casa. */
  protected readonly showEmptyImpact = computed(
    () =>
      this.conditionTree().groups.some((g) => g.conditions.length > 0) &&
      this.impactTotal() > 0 &&
      this.impactCount() === 0 &&
      !this.hasUnevaluable() &&
      !this.condBlocking(),
  );
  protected fmt(n: number): string {
    return n.toLocaleString('es-ES');
  }

  /** JSON snapshot of every editable field — feeds the unsaved-changes guard. */
  private buildSnapshot(): string {
    return JSON.stringify({
      name: this.name(),
      description: this.description(),
      active: this.active(),
      conditionTree: this.conditionTree(),
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
      if (typeParam === 'transcription' || typeParam === 'classification') {
        this.ruleType.set(typeParam);
      }
      // Cross-link desde el modal de categoría (`?categoria=<id>`): preselecciona
      // esa categoría a detectar — la vinculación se deriva de `Rule.categorias`
      // al guardar. Solo si existe y está activa (el multiselect solo lista
      // activas). `untracked`: no añadir el store de categorías como dep del efecto.
      const catParam = this.route.snapshot.queryParamMap.get('categoria');
      if (catParam && typeParam === 'classification') {
        const cat = untracked(() => this.categoriesStore.getCategory(catParam));
        if (cat?.isActive) {
          this.aiAnalysis.set(true);
          this.categorias.set([catParam]);
        }
      }
      // New rule: capture the baseline AFTER the preselección — so arriving from
      // the cross-link doesn't mark the fresh form as dirty.
      this.pristine.set(untracked(() => this.buildSnapshot()));
    });

    // Compara el estimado mensual con el de antes para saber si el último
    // cambio amplió o redujo el alcance. `untracked` en la escritura: el
    // efecto depende de `estimate()` y de nada más — si leyera su propia
    // señal, se re-dispararía solo.
    effect(() => {
      const next = this.estimate().perMonth;
      untracked(() => {
        const prev = this.lastPerMonth;
        if (prev !== null && next !== prev) {
          this.monthTrend.set(next > prev ? 'up' : 'down');
        }
        this.lastPerMonth = next;
      });
    });

    // Solo las ACCIONES suben a la TopBar. La identidad de la página la da el
    // breadcrumb declarado en `memory.routes.ts` (Ola 1), como en los tres
    // formularios hermanos de admin — antes esta página se lo saltaba
    // proyectando su propia cabecera al lead.
    afterNextRender(() => {
      const actions = this.topbarActions();
      if (actions) this.topBarSlot.setActions(actions);
    });
    this.destroyRef.onDestroy(() => {
      this.topBarSlot.clearActions();
    });
  }

  private loadFromRule(rule: Rule): void {
    this.ruleType.set(rule.type);
    this.name.set(rule.name);
    this.description.set(rule.description ?? '');
    this.active.set(rule.active);
    this.conditionTree.set(rule.conditionTree ?? deriveTreeFromLegacy(rule));
    this.aiAnalysis.set(rule.aiAnalysis ?? false);
    this.categorias.set(rule.categorias ?? []);
    // Loaded values are the clean baseline for the unsaved-changes guard.
    this.pristine.set(untracked(() => this.buildSnapshot()));
  }

  /*
   * R6 aquí es una VARIANTE deliberada, no un despiste: el botón está siempre
   * activo y la validación se revela al INTENTO de guardar. Los formularios de
   * admin hacen lo contrario (botón deshabilitado con su motivo).
   *
   * No se unifican, y el criterio es la longitud del formulario. En admin caben
   * dos campos en pantalla: un botón gris con su motivo te lleva directo a lo
   * que falta. Aquí lo que bloquea puede estar tres secciones más abajo, dentro
   * de un árbol de condiciones — un botón gris te dejaría cazando. Pulsar y que
   * te lo cuente todo de golpe es más barato.
   *
   * Petición explícita de Rafa, además: "botón siempre activo, valida en click".
   * Si alguien viene a 'converger' esto con admin, esto es lo que rompería.
   */
  protected onSave(): void {
    this.submitted.set(true);
    if (!this.canSave()) return;
    // El árbol es la fuente de verdad del alcance; derivamos los campos planos
    // para alimentar el resumen del listado sin recalcular el árbol cada vez.
    const scope = deriveLegacyScope(this.conditionTree(), this.resolver);
    const base: Omit<Rule, 'id' | 'lastModified'> = {
      type: this.ruleType(),
      name: this.name().trim(),
      description: this.description().trim() || undefined,
      servicios: scope.servicios,
      grupos: scope.grupos,
      agentes: scope.agentes,
      conditionTree: this.conditionTree(),
      recording: false,
      transcripcion: this.ruleType() === 'transcription',
      clasificacion: this.ruleType() === 'classification',
      active: this.active(),
      aiAnalysis: this.aiAnalysis(),
      // Solo persistimos categorías si la regla es classification + aiAnalysis;
      // si el usuario cambia el tipo o desactiva el toggle quedan limpias.
      categorias:
        this.ruleType() === 'classification' && this.aiAnalysis() ? this.categorias() : [],
    };

    if (this.isEditMode()) {
      this.rulesStore.updateRule(this.ruleId()!, base);
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('memory.rules.builder.updated_toast'),
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
