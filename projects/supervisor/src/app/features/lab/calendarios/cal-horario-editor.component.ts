import { ChangeDetectionStrategy, Component, computed, inject, signal, type TemplateRef, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ScButtonComponent, ScInputTextComponent, ScSectionCardComponent, ScTagComponent } from '@smartcontact-hub/components';

import { type DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { ResultadoAccionService } from '@core/services/resultado-accion.service';
import { CalImpactoDialogoComponent } from './cal-impacto-dialogo.component';
import { type Calendario, type Horario, minutosDeLaSemana, type Semana, usosDe } from './cal-modelo';
import { CalSemanaComponent } from './cal-semana.component';
import { CalStore } from './cal-store';

const VACIA: Semana = Array.from({ length: 7 }, () => []);
const OFICINA: Semana = [0, 1, 2, 3, 4].map(() => [[540, 1080] as const]).concat([[], []]) as Semana;

/**
 * PROTOTIPO DE DISCOVERY: el editor de un horario (una semana tipo), en su página. En el camino A se llega aquí desde
 * un calendario («Crear horario» o «Editar»), y al guardar se vuelve a él con el horario puesto (`volver`, `para`).
 */
@Component({
  selector: 'sc-cal-horario-editor',
  imports: [CalImpactoDialogoComponent, CalSemanaComponent, ScButtonComponent, ScInputTextComponent, ScSectionCardComponent, ScTagComponent, TooltipModule],
  template: `
    <ng-template #acciones>
      @if (volver()) {
        <sc-button variant="secondary" appearance="outlined" label="Volver sin guardar" (clicked)="irse()" />
      }
      <sc-button
        variant="primary"
        [disabled]="!!motivo()"
        [pTooltip]="motivo() ?? ''" tooltipPosition="bottom" tooltipEvent="both"
        [label]="esNuevo() ? 'Crear horario' : 'Guardar'"
        (clicked)="guardar()"
      />
    </ng-template>

    <div class="page">
      <div class="page__inner">
        <h1 class="page__heading sc-text-title-semibold">{{ nombre().trim() || 'Nuevo horario' }}</h1>
        @if (volver()) {
          <p class="aviso sc-text-body-regular">Al guardarlo vuelves al calendario con este horario puesto.</p>
        }

        <sc-section-card titleKey="Datos" surface="subtle" icon="tune">
          <div class="field">
            <sc-inputtext inputId="horario-nombre" fluid required label="Nombre" placeholder="Por ejemplo, Jornada completa" [value]="nombre()" (valueChange)="nombre.set($event)" />
          </div>
        </sc-section-card>

        <sc-section-card titleKey="La semana" hintKey="Marca los días que comparten horas y pon sus franjas." surface="subtle" icon="schedule">
          <sc-cal-semana role="group" aria-label="La semana" editable [semana]="semana()" (semanaChange)="semana.set($event)" />
        </sc-section-card>

        <sc-section-card titleKey="Dónde se usa" surface="subtle" icon="calendar_month">
          @if (usos().length) {
            <div class="usos">
              @for (c of usos(); track c.id) {
                <sc-tag severity="secondary" [value]="c.nombre" />
              }
            </div>
          } @else {
            <p class="sc-text-body-regular vacio">Aún no lo usa ningún calendario. Se elige en cada calendario, para todo el año o para un periodo.</p>
          }
        </sc-section-card>
      </div>
    </div>

    @if (impacto()) {
      <sc-cal-impacto-dialogo [nombreHorario]="nombre()" [usos]="usos()" [desde]="desde()" (elegido)="confirmar($event)" (cancelado)="impacto.set(false)" />
    }
  `,
  styles: `
    :host { display: block; height: 100%; background: var(--sc-bg-canvas); overflow-y: auto; }
    .page__inner { max-inline-size: 52rem; }
    .aviso { margin: 0 0 var(--sc-spacing-1); color: var(--sc-text-secondary); }
    .usos { display: flex; flex-wrap: wrap; gap: var(--sc-spacing-0-5); }
    .vacio { margin: 0; color: var(--sc-text-secondary); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalHorarioEditorComponent implements DirtyAware {
  private readonly store = inject(CalStore);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly acciones = viewChild<TemplateRef<unknown>>('acciones');

  private readonly params = toSignal(this.ruta.paramMap, { initialValue: this.ruta.snapshot.paramMap });
  private readonly query = toSignal(this.ruta.queryParamMap, { initialValue: this.ruta.snapshot.queryParamMap });
  private readonly id = computed(() => Number(this.params().get('id') ?? 0));
  protected readonly esNuevo = computed(() => this.id() === 0);
  protected readonly volver = computed(() => this.query().get('volver'));
  private readonly para = computed(() => this.query().get('para') ?? 'base');
  /** El calendario desde el que se llega (para ofrecer «solo en este»). */
  protected readonly desde = computed<Calendario | null>(() => {
    const m = /\/calendarios\/editar\/(\d+)/.exec(this.volver() ?? '');
    return m ? (this.store.calendario(Number(m[1])) ?? null) : null;
  });

  private readonly original: Horario;
  protected readonly nombre = signal('');
  protected readonly semana = signal<Semana>(VACIA);
  protected readonly impacto = signal(false);
  private readonly guardando = signal(false);

  protected readonly usos = computed(() => (this.esNuevo() ? [] : usosDe(this.store.estado(), this.id())));
  protected readonly motivo = computed(() => {
    if (!this.nombre().trim()) return 'Ponle un nombre';
    if (minutosDeLaSemana(this.semana()) === 0) return 'Marca al menos un día abierto';
    return null;
  });

  readonly formDirty = computed(
    () => !this.guardando() && (this.nombre() !== this.original.nombre || JSON.stringify(this.semana()) !== JSON.stringify(this.original.semana)),
  );

  constructor() {
    useTopbarActions(this.acciones);
    const h = this.store.horario(Number(this.ruta.snapshot.paramMap.get('id') ?? 0));
    this.original = h ?? { id: 0, nombre: '', semana: OFICINA };
    this.nombre.set(this.original.nombre);
    this.semana.set(this.original.semana);
  }

  protected guardar(): void {
    if (this.motivo()) return;
    if (!this.esNuevo() && this.usos().length > 1) return this.impacto.set(true);
    this.confirmar('todos');
  }

  protected confirmar(donde: 'todos' | 'solo'): void {
    this.impacto.set(false);
    const borrador: Horario = { id: this.id(), nombre: this.nombre().trim(), semana: this.semana() };
    let hecho: Horario;
    const desde = this.desde();
    if (donde === 'solo' && desde) {
      hecho = this.store.copiarHorario(borrador);
      this.store.cambiarHorarioEn(desde.id, this.id(), hecho.id);
      this.resultado.contar(`Horario «${hecho.nombre}» creado para «${desde.nombre}»`);
    } else {
      hecho = this.store.guardarHorario(borrador);
      this.resultado.contar(this.esNuevo() ? `Horario «${hecho.nombre}» creado` : `Horario «${hecho.nombre}» guardado`);
    }
    this.guardando.set(true);
    const volver = this.volver();
    if (volver) void this.router.navigateByUrl(`${volver}?horario=${hecho.id}&para=${this.para()}`);
    else void this.router.navigateByUrl('/admin/semanas');
  }

  protected irse(): void {
    this.guardando.set(true);
    void this.router.navigateByUrl(this.volver() ?? '/admin/semanas');
  }
}
