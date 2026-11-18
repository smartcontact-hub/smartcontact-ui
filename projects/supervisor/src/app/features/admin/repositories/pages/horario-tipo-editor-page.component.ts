import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, type OnInit, signal, type TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { type ColorDotOption, ScButtonComponent, ScColorDotPickerComponent, ScInputTextComponent, ScSectionCardComponent, ScSubsectionComponent } from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { BreadcrumbService, ResultadoAccionService } from '@core/services';
import { injectLangChange } from '@core/utils/lang-change';
import { ayudaDeObligatorio, ocasionDeAvisar } from '@shared/utils/alta-secciones';
import { nombreDeCopia } from '@shared/utils/copy-name';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { HorarioSemanaComponent } from '../components/horario/horario-semana.component';
import { COLORES_DE_PERIODO, type ColorDePeriodo, type HorarioTipo, validarSemana, type Semana } from '../state/horarios.core.mjs';
import { HorariosTipoService } from '../state/horarios-tipo.service';
import { HorariosTipoStore } from '../state/horarios-tipo.store';

type Borrador = Omit<HorarioTipo, 'id'>;

const LABORABLE = [[540, 1080]] as const;
const VACIO: Borrador = { name: '', description: '', color: 'blue', week: [LABORABLE, LABORABLE, LABORABLE, LABORABLE, LABORABLE, [], []] };
const FALTA_NOMBRE = 'repositories.horarios.errors.name_required';

/**
 * El editor de un horario: una semana tipo, de lunes a domingo, con sus franjas. Se crea una vez y se usa en los calendarios
 * que se quiera; al guardarlo, los cambios llegan a todos los calendarios que lo usan, y la pantalla dice cuáles son.
 */
@Component({
  selector: 'sc-horario-tipo-editor-page',
  imports: [HorarioSemanaComponent, RouterLink, ScButtonComponent, ScColorDotPickerComponent, ScInputTextComponent, ScSectionCardComponent, ScSubsectionComponent, TranslateModule],
  template: `
    <ng-template #topbarActions>
      @if (formDirty()) {
        <sc-button variant="secondary" appearance="outlined" [label]="'common.undo' | translate" (clicked)="discard()" />
      }
      <sc-button variant="primary" [disabled]="!canSave()" [label]="(mode() === 'create' ? 'repositories.horariosTipo.create_submit' : 'common.save') | translate" (clicked)="save()" />
    </ng-template>

    <div class="page">
      <div class="page__inner page__inner--list">
        <h1 class="page__heading sc-text-title-semibold">{{ form().name.trim() || ('repositories.horariosTipo.create_title' | translate) }}</h1>

        <!-- Todo en una vista, sin desplazarse: a la izquierda lo que se configura (datos y semana); a la derecha, dónde se usa. -->
        <div class="cuerpo">
          <div class="cuerpo__izq">
        <sc-section-card titleKey="repositories.horariosTipo.x.section_general" surface="subtle" icon="tune">
          <sc-subsection>
            <div class="bloque">
              <!-- Nombre y descripción, uno al lado del otro. -->
              <div class="par">
              <sc-inputtext
                inputId="horario-tipo-nombre"
                fluid
                required
                [label]="'repositories.columns.name' | translate"
                [placeholder]="'repositories.horariosTipo.name_placeholder' | translate"
                [value]="form().name"
                [helperText]="faltaElNombre() && !ocasion.acusa(FALTA_NOMBRE) ? ayuda() : undefined"
                [error]="faltaElNombre() && ocasion.acusa(FALTA_NOMBRE) ? ('repositories.horarios.errors.name_required' | translate) : undefined"
                (valueChange)="update('name', $event)"
              />
              <sc-inputtext
                inputId="horario-tipo-descripcion"
                fluid
                [label]="'repositories.columns.description' | translate"
                [placeholder]="'repositories.placeholders.description' | translate"
                [value]="form().description"
                (valueChange)="update('description', $event)"
              />
              </div>
              <!-- El color del horario, de los del DS: es el del texto de sus horas en la lista y en los calendarios. -->
              <div class="campo-color">
                <span class="sc-text-caption-semibold">{{ 'repositories.horariosTipo.x.color' | translate }}</span>
                <sc-color-dot-picker [options]="colores()" [value]="form().color ?? 'blue'" (valueChange)="update('color', $any($event))" [ariaLabel]="'repositories.horariosTipo.x.color' | translate" />
              </div>
            </div>
          </sc-subsection>
        </sc-section-card>

        <sc-section-card titleKey="repositories.horarios.section_week" surface="subtle" icon="view_week">
          <sc-subsection>
            <div class="bloque">
              <sc-horario-semana prefijo="horario-tipo" [semana]="form().week" [falta]="faltaDeSemana()" (semanaChange)="update('week', $event)" />
            </div>
          </sc-subsection>
        </sc-section-card>

          </div>
          <div class="cuerpo__der">
        <sc-section-card titleKey="repositories.horariosTipo.x.section_uses" surface="subtle" icon="calendar_month">
          <sc-subsection>
            <div class="bloque">
              @if (usos().length === 0) {
                <p class="sc-text-body-regular nota">{{ 'repositories.horariosTipo.x.uses_none' | translate }}</p>
              } @else {
                <p class="sc-text-body-regular nota">{{ 'repositories.horariosTipo.x.uses_note' | translate: { count: usos().length } }}</p>
                <ul class="usos" role="list">
                  @for (u of usos(); track u.calendario.id) {
                    <li class="sc-text-body-regular">
                      <a [routerLink]="['/admin/horarios/editar', u.calendario.id]">{{ u.calendario.name }}</a>
                      <span class="usos__como sc-text-caption-regular">{{ usoComo(u.general, u.periodos) }}</span>
                    </li>
                  }
                </ul>
              }
            </div>
          </sc-subsection>
        </sc-section-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      background: var(--sc-bg-canvas);
    }

    .cuerpo {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 19rem;
      gap: var(--sc-spacing-1);
      align-items: start;

      @media (max-width: 1099px) {
        grid-template-columns: 1fr;
      }
    }

    .cuerpo__izq,
    .cuerpo__der {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-1);
    }

    .bloque {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-1);
    }

    .par {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--sc-spacing-1);
      align-items: start;

      @media (max-width: 40rem) {
        grid-template-columns: 1fr;
      }
    }

    .campo-color {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-5);
    }

    .nota {
      margin: 0;
      color: var(--sc-text-secondary);
    }

    .usos {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-5);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .usos a {
      color: var(--sc-text-link);
    }

    .usos__como {
      margin-inline-start: var(--sc-spacing-0-75);
      color: var(--sc-text-secondary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioTipoEditorPageComponent implements DirtyAware, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(HorariosTipoStore);
  private readonly servicio = inject(HorariosTipoService);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lang = injectLangChange();

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly FALTA_NOMBRE = FALTA_NOMBRE;
  protected readonly mode = signal<'create' | 'edit'>('create');
  private horarioId: number | null = null;
  private readonly idActual = signal<number | null>(null);

  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly nombreGuardado = signal<string | null>(null);
  private readonly migaConNombre = effect(() => this.breadcrumbs.nombrar(this.route, this.mode() === 'edit' ? this.nombreGuardado() : null));
  private readonly sinMiga = inject(DestroyRef).onDestroy(() => this.breadcrumbs.nombrar(this.route, null));

  protected readonly form = signal<Borrador>(VACIO);
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;

  /** Los colores del DS en el orden de la etiqueta; el punto lleva el color del texto que tendrá. */
  protected readonly colores = computed<readonly ColorDotOption[]>(() => {
    this.lang();
    return (['gray', 'red', 'orange', 'amber', 'brown', 'green', 'teal', 'blue', 'purple', 'black'] as const).map((c) => ({
      value: c,
      label: this.translate.instant(`labels.color.${c}`) as string,
      color: c === 'black' ? 'var(--sc-cmp-tag-contrast-background)' : `var(--sc-label-${c}-text)`,
    }));
  });

  protected readonly faltaDeSemana = computed(() => validarSemana(this.form().week));
  protected readonly faltaElNombre = computed(() => !this.form().name.trim());
  protected readonly ocasion = ocasionDeAvisar({
    editando: () => this.mode() === 'edit',
    cambios: () => this.formDirty(),
    faltas: computed(() => [...(this.faltaElNombre() ? [FALTA_NOMBRE] : []), ...(this.faltaDeSemana() ? ['semana'] : [])]),
  });
  protected readonly ayuda = computed(() => {
    this.lang();
    return ayudaDeObligatorio(this.translate.instant(FALTA_NOMBRE));
  });
  protected readonly canSave = computed(() => !this.faltaElNombre() && !this.faltaDeSemana() && (this.mode() === 'create' || this.formDirty()));

  /** Los calendarios que lo usan: lo que cambie aquí les llega a todos. */
  protected readonly usos = computed(() => {
    const id = this.idActual();
    return id === null ? [] : this.servicio.usos(id);
  });

  protected usoComo(general: boolean, periodos: number): string {
    this.lang();
    const partes = [
      ...(general ? [this.translate.instant('repositories.horariosTipo.x.uses_general') as string] : []),
      ...(periodos > 0 ? [this.translate.instant('repositories.horariosTipo.x.uses_periods', { count: periodos }) as string] : []),
    ];
    return partes.join(' · ');
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => this.cargar(p.get('id')));
  }

  private cargar(raw: string | null): void {
    this.ocasion.olvidar();
    if (raw === null) {
      this.mode.set('create');
      this.horarioId = null;
      this.idActual.set(null);
      this.nombreGuardado.set(null);
      // Un horario nuevo estrena un color que no tenga otro, si queda alguno.
      const usados = new Set(this.store.items().map((h) => h.color));
      this.form.set({ ...VACIO, color: (COLORES_DE_PERIODO.find((c) => c !== 'black' && !usados.has(c)) ?? 'blue') as ColorDePeriodo });
      const seed = this.route.snapshot.queryParamMap.get('seedFromId');
      const origen = seed ? this.store.items().find((h) => h.id === Number(seed)) : undefined;
      if (origen) {
        const { id: _id, ...datos } = origen;
        this.form.set({ ...datos, name: nombreDeCopia(origen.name, this.store.items().map((h) => h.name)) });
      }
      this.dirtyState.markPristine();
      return;
    }
    const horario = this.store.items().find((h) => h.id === Number(raw));
    if (!horario) {
      void this.router.navigateByUrl('/admin/horarios-tipo', { replaceUrl: true });
      return;
    }
    this.mode.set('edit');
    this.horarioId = horario.id;
    this.idActual.set(horario.id);
    this.nombreGuardado.set(horario.name);
    const { id: _id, ...datos } = horario;
    this.form.set(datos);
    this.dirtyState.markPristine();
  }

  protected update<K extends keyof Borrador>(key: K, value: Borrador[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected save(): void {
    if (this.faltaElNombre() || this.faltaDeSemana()) {
      this.ocasion.intentar();
      if (this.faltaElNombre()) document.getElementById('horario-tipo-nombre')?.focus();
      return;
    }
    if (!this.canSave()) return;
    this.ocasion.olvidar();
    const f = this.form();
    const draft: Borrador = { ...f, name: f.name.trim(), description: f.description.trim() };
    if (this.mode() === 'create') {
      const creado = this.store.addItem(draft);
      this.dirtyState.markPristine();
      const texto = this.translate.instant('repositories.horariosTipo.toasts.created', { name: creado.name });
      void this.router.navigateByUrl(`/admin/horarios-tipo/editar/${creado.id}`, { replaceUrl: true }).then(() => this.resultado.contar(texto));
      return;
    }
    // La semana nueva llega, además, a todos los calendarios que usan este horario.
    this.store.updateItem(this.horarioId!, { name: draft.name, description: draft.description, color: draft.color });
    this.servicio.actualizarSemana(this.horarioId!, draft.week as Semana);
    this.nombreGuardado.set(draft.name);
    this.form.set(draft);
    this.dirtyState.markPristine();
    this.resultado.contar(this.translate.instant('repositories.horariosTipo.toasts.updated', { name: draft.name }));
  }

  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
    this.ocasion.olvidar();
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.formDirty()) event.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.save();
    }
  }
}
