import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ScButtonComponent, ScDrawerComponent, ScInputTextComponent } from '@smartcontact-hub/components';

import { ResultadoAccionService } from '@core/services';
import { type CalendarioDeFestivos, type Festivo, FestivosStore } from '@features/admin/repositories/state/festivos.store';
import { HorariosStore } from '@features/admin/repositories/state/horarios.store';

import { LabDiasListaComponent } from './lab-dias-lista.component';
import { T } from './lab-textos';

/**
 * LABORATORIO: una lista de festivos abierta desde un horario, en un panel lateral para no perder el horario de vista.
 * Es la lista compartida, no una copia: el pie dice a cuántos horarios afecta guardar, y «Dejar de aplicar» la suelta
 * solo de este horario. Los días se tocan con la misma pieza que en la página de la lista.
 */
@Component({
  selector: 'sc-lab-lista-panel',
  imports: [LabDiasListaComponent, ScButtonComponent, ScDrawerComponent, ScInputTextComponent],
  template: `
    <sc-drawer position="right" width="44rem" [visible]="!!lista()" [header]="lista()?.name ?? ''" (visibleChange)="!$event && cerrar()">
      @if (lista(); as l) {
        <div class="panel">
          <p class="aviso sc-text-caption-regular">
            Lista compartida de Tiempo: {{ usos() === 1 ? 'solo la aplica este horario.' : 'la aplican ' + usos() + ' horarios, y lo que cambies aquí cambia en todos.' }}
          </p>
          <sc-inputtext inputId="lab-panel-nombre" fluid label="Nombre" [value]="nombre()" (valueChange)="nombre.set($event)" />
          <sc-lab-dias-lista class="dias" [days]="dias()" (daysChange)="dias.set($event)" [anio]="anio()" [hoy]="hoy()" [conCalendario]="false" />
          <div class="pie">
            <sc-button variant="secondary" appearance="text" size="sm" label="Dejar de aplicar aquí" (clicked)="dejar.emit(l.id)" />
            <sc-button variant="secondary" appearance="text" size="sm" icon="open_in_new" label="Abrir con calendario" (clicked)="abrirEnTiempo(l.id)" />
            <span class="pie__hueco"></span>
            <sc-button variant="secondary" appearance="outlined" label="Cancelar" (clicked)="cerrar()" />
            <sc-button variant="primary" [disabled]="!cambiada()" [label]="usos() > 1 ? 'Guardar en ' + usos() + ' horarios' : 'Guardar'" (clicked)="guardar(l)" />
          </div>
        </div>
      }
    </sc-drawer>
  `,
  styles: `
    .panel { display: flex; flex-direction: column; gap: var(--sc-spacing-1-5); block-size: 100%; }
    .aviso { margin: 0; padding: var(--sc-spacing-0-75) var(--sc-spacing-1); border-radius: var(--sc-radius-md); background: var(--sc-bg-secondary-subtle); color: var(--sc-text-secondary); }
    .dias { flex: 1; min-block-size: 0; }
    .pie { display: flex; align-items: center; gap: var(--sc-spacing-0-75); padding-block-start: var(--sc-spacing-1); border-block-start: 1px solid var(--sc-border-default); }
    .pie__hueco { flex: 1; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabListaPanelComponent {
  private readonly store = inject(FestivosStore);
  private readonly horarios = inject(HorariosStore);
  private readonly router = inject(Router);
  private readonly resultado = inject(ResultadoAccionService);
  protected readonly t = T;

  readonly lista = input<CalendarioDeFestivos | null>(null);
  readonly anio = input.required<number>();
  readonly hoy = input.required<string>();
  readonly cerrado = output<void>();
  /** Soltar la lista de este horario (lo hace el editor del horario, en su borrador). */
  readonly dejar = output<number>();

  protected readonly nombre = signal('');
  protected readonly dias = signal<readonly Festivo[]>([]);

  constructor() {
    effect(() => {
      const l = this.lista();
      untracked(() => {
        this.nombre.set(l?.name ?? '');
        this.dias.set(l?.days ?? []);
      });
    });
  }

  protected readonly usos = computed(() => {
    const l = this.lista();
    return l ? Math.max(1, this.horarios.items().filter((h) => h.holidayCalendarIds.includes(l.id)).length) : 0;
  });

  protected readonly cambiada = computed(() => {
    const l = this.lista();
    return !!l && (this.nombre().trim() !== l.name || JSON.stringify(this.dias()) !== JSON.stringify(l.days));
  });

  protected guardar(l: CalendarioDeFestivos): void {
    const name = this.nombre().trim() || l.name;
    this.store.updateItem(l.id, { name, days: this.dias().map((d) => ({ ...d, name: d.name.trim() || 'Festivo' })) });
    this.resultado.contar(`«${name}» guardada`);
    this.cerrado.emit();
  }

  protected cerrar(): void {
    this.cerrado.emit();
  }

  protected abrirEnTiempo(id: number): void {
    void this.router.navigateByUrl(`/lab/horarios/festivos/editar/${id}`);
  }
}
