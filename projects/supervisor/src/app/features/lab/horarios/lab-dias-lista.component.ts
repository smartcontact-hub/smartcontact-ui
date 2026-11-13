import { ChangeDetectionStrategy, Component, computed, inject, input, model, output, signal } from '@angular/core';
import { ScButtonComponent, ScInputTextComponent, ScToggleSwitchComponent } from '@smartcontact-hub/components';

import { ResultadoAccionService } from '@core/services';
import type { Festivo } from '@features/admin/repositories/state/festivos.store';
import { siguienteId } from '@features/admin/repositories/state/horarios.core.mjs';

import { LabImportarListaComponent } from './lab-importar-lista.component';
import { T } from './lab-textos';

const fmt = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const fmtSinAnio = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' });

/**
 * LABORATORIO: los días de una lista de festivos, editables en su fila (nombre, «Cada año», quitar) y con «Importar
 * festivos oficiales» a mano. La misma pieza vive en la página de la lista y en el panel que se abre desde un horario:
 * la lista se toca igual esté uno donde esté.
 */
@Component({
  selector: 'sc-lab-dias-lista',
  imports: [LabImportarListaComponent, ScButtonComponent, ScInputTextComponent, ScToggleSwitchComponent],
  template: `
    <div class="cab">
      <h2 class="cab__titulo sc-text-body-semibold">Días de la lista</h2>
      <span class="cab__n sc-text-caption-regular">{{ days().length }}</span>
      <span class="cab__hueco"></span>
      @if (days().length > 1) {
        <sc-button variant="secondary" appearance="text" size="sm" label="Quitar todos" (clicked)="quitarTodos()" />
      }
      <sc-button variant="primary" size="sm" icon="upload" label="Importar festivos oficiales" (clicked)="importando.set(true)" />
    </div>

    <div class="cuerpo">
      @if (filas().length === 0) {
        <div class="vacio">
          <p class="sc-text-body-semibold">Esta lista está vacía</p>
          <p class="sc-text-caption-regular">
            Dos formas de llenarla: <strong>Importar festivos oficiales</strong> de tu país o región de una vez, o
            {{ conCalendario() ? 'pulsar días en el calendario y «Añadir como festivo».' : 'abrir la lista y marcarlos en su calendario.' }}
          </p>
          <sc-button variant="primary" size="sm" icon="upload" label="Importar festivos oficiales" (clicked)="importando.set(true)" />
        </div>
      } @else {
        <ul class="filas" role="list">
          @for (d of filas(); track d.id) {
            @if (d.id === primerPasado()) {
              <li class="separa sc-text-caption-semibold" role="presentation">Ya pasados</li>
            }
            <li class="fila" [class.fila--nueva]="d.id === nuevo()" [class.fila--pasada]="d.pasado" (mouseenter)="resaltar.emit(d.fecha)" (mouseleave)="resaltar.emit(null)">
              @if (conCalendario()) {
                <button type="button" class="fila__fecha sc-text-body-regular" [attr.aria-label]="t.verEnCalendario(d.texto)" (click)="ver.emit(d.fecha)">{{ d.texto }}</button>
              } @else {
                <span class="fila__fecha sc-text-body-regular">{{ d.texto }}</span>
              }
              <sc-inputtext class="fila__nombre" size="sm" fluid [ariaLabel]="t.nombreFestivo" [placeholder]="t.nombreFestivo" [value]="d.name" (valueChange)="cambiar(d.id, { name: $event })" />
              <label class="fila__cada sc-text-caption-regular">
                <sc-toggleswitch [checked]="d.yearly" [ariaLabel]="t.cadaAnio(d.name || t.nombreFestivo)" (checkedChange)="cambiar(d.id, { yearly: $event })" />
                Cada año
              </label>
              <sc-button variant="secondary" appearance="text" size="sm" icon="close" [ariaLabel]="t.quitar(d.name || d.texto)" (clicked)="quitar(d.id)" />
            </li>
          }
        </ul>
      }
    </div>

    @if (importando()) {
      <sc-lab-importar-lista [soloDias]="true" (elegidos)="importados($event)" (cerrado)="importando.set(false)" />
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: var(--sc-spacing-1); min-block-size: 0; }
    .cab { display: flex; align-items: center; gap: var(--sc-spacing-0-75); }
    .cab__titulo { margin: 0; }
    .cab__n { color: var(--sc-text-secondary); }
    .cab__hueco { flex: 1; }
    .cuerpo { flex: 1; min-block-size: 0; overflow: auto; }
    .vacio { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--sc-spacing-0-5); block-size: 100%; padding: var(--sc-spacing-2); text-align: center; }
    .vacio p { max-inline-size: 32rem; margin: 0; color: var(--sc-text-secondary); }
    .vacio p.sc-text-body-semibold { color: var(--sc-text-primary); }
    .filas { margin: 0; padding: 0; list-style: none; }
    .fila { display: grid; grid-template-columns: 9rem minmax(0, 1fr) auto auto; align-items: center; gap: var(--sc-spacing-1); padding: var(--sc-spacing-0-125) var(--sc-spacing-0-5); border-block-end: 1px solid var(--sc-border-default); }
    .separa { padding: var(--sc-spacing-1) var(--sc-spacing-0-5) var(--sc-spacing-0-25); border-block-end: 1px solid var(--sc-border-default); color: var(--sc-text-secondary); }
    .fila:last-child { border-block-end: 0; }
    .fila:hover { background: var(--sc-bg-secondary-subtle); }
    .fila--nueva { background: var(--sc-bg-primary-subtle); }
    .fila--pasada .fila__fecha { color: var(--sc-text-secondary); }
    .fila__fecha { padding: 0; border: 0; background: none; color: var(--sc-text-primary); text-align: start; text-transform: capitalize; }
    button.fila__fecha { cursor: pointer; }
    button.fila__fecha:hover { text-decoration: underline; }
    .fila__nombre ::ng-deep input:not(:hover, :focus) { border-color: transparent; background: transparent; }
    .fila__cada { display: flex; align-items: center; gap: var(--sc-spacing-0-5); color: var(--sc-text-secondary); white-space: nowrap; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabDiasListaComponent {
  private readonly resultado = inject(ResultadoAccionService);
  protected readonly t = T;

  readonly days = model.required<readonly Festivo[]>();
  /** El año que se mira, para fechar los que se repiten cada año. */
  readonly anio = input.required<number>();
  readonly hoy = input.required<string>();
  /** El día recién añadido desde el calendario: su fila se marca. */
  readonly nuevo = input<number | null>(null);
  /** Con calendario al lado, la fecha lo lleva a ese día; en el panel no hay calendario. */
  readonly conCalendario = input(true);
  readonly ver = output<string>();
  readonly resaltar = output<string | null>();

  protected readonly importando = signal(false);

  /** Por fecha en el año que se mira; los de años pasados, al final y apagados. */
  protected readonly filas = computed(() =>
    this.days()
      .map((d) => {
        const fecha = d.yearly ? `${this.anio()}${d.date.slice(4)}` : d.date;
        return { ...d, fecha, texto: (d.yearly ? fmtSinAnio : fmt).format(new Date(`${fecha}T12:00:00`)), pasado: !d.yearly && d.date < this.hoy() };
      })
      .sort((a, b) => Number(a.pasado) - Number(b.pasado) || a.fecha.localeCompare(b.fecha)),
  );

  protected readonly primerPasado = computed(() => this.filas().find((f) => f.pasado)?.id ?? null);

  protected cambiar(id: number, cambios: Partial<Festivo>): void {
    this.days.update((ds) => ds.map((d) => (d.id === id ? { ...d, ...cambios } : d)));
  }

  protected quitar(id: number): void {
    const d = this.days().find((x) => x.id === id);
    this.days.update((ds) => ds.filter((x) => x.id !== id));
    if (d) this.resultado.contar(`«${d.name || 'Festivo'}» quitado: «Deshacer» lo recupera`);
  }

  protected quitarTodos(): void {
    const n = this.days().length;
    this.days.set([]);
    this.resultado.contar(`${n} días quitados: «Deshacer» los recupera`);
  }

  /** Lo oficial se suma, sin repetir fechas. */
  protected importados(elegidos: readonly Omit<Festivo, 'id'>[]): void {
    const tiene = (f: string): boolean => this.days().some((d) => (d.yearly ? d.date.slice(5) === f.slice(5) : d.date === f));
    const nuevos = elegidos.filter((d) => !tiene(d.date));
    this.days.update((ds) => {
      let out = [...ds];
      for (const d of nuevos) out = [...out, { ...d, id: siguienteId(out) }];
      return out;
    });
    this.importando.set(false);
    this.resultado.contar(nuevos.length === 0 ? 'Ya los tenía todos' : `${nuevos.length} festivos añadidos`);
  }
}
