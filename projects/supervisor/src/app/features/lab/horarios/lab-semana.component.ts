import { TooltipModule } from 'primeng/tooltip';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ScButtonComponent } from '@smartcontact-hub/components';

import { HorarioFranjasComponent } from '@features/admin/repositories/components/horario/horario-franjas.component';
import type { Franja, Semana } from '@features/admin/repositories/state/horarios.core.mjs';
import { T } from './lab-textos';

/** Un tramo de la semana: unos días (lunes = 0) que comparten las mismas franjas. */
export interface Tramo {
  readonly dias: readonly number[];
  readonly franjas: readonly Franja[];
}

export const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const NOMBRES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const clave = (franjas: readonly Franja[]): string => franjas.map((f) => f.join('-')).join(',');

/** La semana en tramos: cada juego de franjas distinto, con los días que lo llevan (aunque no sean seguidos). */
export function tramosDe(semana: Semana): Tramo[] {
  const porClave = new Map<string, Tramo>();
  semana.forEach((franjas, dia) => {
    if (franjas.length === 0) return;
    const k = clave(franjas);
    const t = porClave.get(k);
    porClave.set(k, t ? { ...t, dias: [...t.dias, dia] } : { dias: [dia], franjas });
  });
  return [...porClave.values()];
}

/** Los tramos de vuelta a una semana. Un día sin tramo queda cerrado. */
export function semanaDe(tramos: readonly Tramo[]): Semana {
  const semana: Franja[][] = Array.from({ length: 7 }, () => []);
  for (const t of tramos) for (const d of t.dias) semana[d] = [...t.franjas];
  return semana;
}

/**
 * La semana habitual como reglas de Aircall/Talkdesk: cada tramo son unos días marcados en bolitas (L M X J V S D) y sus
 * franjas. No hay «copiar»: para que el martes tenga las horas del lunes se marca la M en el tramo del lunes. Un día solo
 * puede estar en un tramo: marcarlo en otro lo mueve. Los días sin tramo, cerrados, se dicen debajo.
 */
@Component({
  selector: 'sc-lab-semana',
  imports: [HorarioFranjasComponent, ScButtonComponent, TooltipModule],
  template: `
    <ol class="tramos" role="list">
      @for (tramo of tramos(); track $index; let i = $index) {
        <li class="tramo" [class.tramo--resaltado]="resaltaTramo() === i">
          <div class="tramo__dias" role="group" [attr.aria-label]="t.diasDelTramo(i)">
            @for (letra of letras; track d; let d = $index) {
              <button
                type="button"
                class="orbe sc-text-caption-semibold"
                [class.orbe--on]="tramo.dias.includes(d)"
                [class.orbe--destello]="diaResaltado() === d"
                [attr.aria-pressed]="tramo.dias.includes(d)"
                [attr.aria-label]="nombres[d]"
                [pTooltip]="nombres[d]" tooltipPosition="top" tooltipEvent="both"
                (click)="alternar(i, d)"
              >{{ letra }}</button>
            }
            <sc-button
              class="tramo__quitar"
              variant="secondary"
              appearance="text"
              size="sm"
              icon="close"
              [ariaLabel]="t.quitarTramo(i)"
              (clicked)="quitar(i)"
            />
          </div>
          <sc-horario-franjas [franjas]="tramo.franjas" [etiqueta]="'tramo ' + (i + 1)" (franjasChange)="ponerFranjas(i, $event)" />
        </li>
      }
    </ol>
    <div class="pie">
      <sc-button variant="secondary" appearance="outlined" size="sm" icon="add" label="Añadir días con otro horario" [disabled]="cerrados().length === 0" (clicked)="anadir()" />
      @if (cerrados().length > 0) {
        <p class="cerrados sc-text-caption-regular">
          Cerrado: {{ cerradosTexto() }}
        </p>
      }
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: var(--sc-spacing-1); }
    .tramos { display: flex; flex-direction: column; gap: var(--sc-spacing-1); margin: 0; padding: 0; list-style: none; }
    .tramo {
      display: flex; flex-direction: column; gap: var(--sc-spacing-0-5);
      padding: var(--sc-spacing-1);
      border: 1px solid var(--sc-border-default); border-radius: var(--sc-radius-md);
      background: var(--sc-bg-surface);
      transition: border-color 150ms ease-out;
    }
    .tramo--resaltado { border-color: var(--sc-border-primary); }
    .tramo__dias { display: flex; align-items: center; gap: var(--sc-spacing-0-25); }
    .tramo__quitar { margin-inline-start: auto; }
    .orbe {
      inline-size: 2rem; block-size: 2rem; padding: 0;
      border: 1px solid var(--sc-border-default); border-radius: var(--sc-radius-full);
      background: var(--sc-bg-surface); color: var(--sc-text-secondary); cursor: pointer;
      transition: background-color 150ms ease-out, transform 150ms ease-out;
      &:hover { background: var(--sc-bg-hover); }
      &:active { transform: scale(0.96); }
      &:focus-visible { outline: 2px solid var(--sc-border-focus); outline-offset: 1px; }
    }
    .orbe--on, .orbe--on:hover { border-color: var(--sc-bg-primary); background: var(--sc-bg-primary); color: var(--sc-text-on-primary); }
    .orbe--destello { outline: 2px solid var(--sc-border-primary); outline-offset: 2px; }
    .pie { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sc-spacing-0-5) var(--sc-spacing-1); }
    .cerrados { margin: 0; color: var(--sc-text-secondary); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabSemanaComponent {
  protected readonly t = T;
  readonly semana = input.required<Semana>();
  /** Un día de la semana a señalar (lo pide el calendario al elegir un día de la semana habitual). */
  readonly diaResaltado = input<number | null>(null);
  readonly semanaChange = output<Semana>();

  protected readonly letras = LETRAS;
  protected readonly nombres = NOMBRES;

  /* Los tramos se guardan aparte de la semana mientras se editan: un tramo recién añadido no tiene días, y la semana no
   * puede representarlo. Se recalculan cuando la semana llega de fuera (deshacer, cargar). */
  private ultimaEmitida: Semana | null = null;
  private borrador: Tramo[] = [];
  protected readonly tramos = computed<Tramo[]>(() => {
    const s = this.semana();
    if (s !== this.ultimaEmitida) this.borrador = tramosDe(s);
    return this.borrador;
  });

  protected readonly resaltaTramo = computed(() => {
    const d = this.diaResaltado();
    return d === null ? -1 : this.tramos().findIndex((t) => t.dias.includes(d));
  });

  protected readonly cerrados = computed(() => {
    const usados = new Set(this.tramos().flatMap((t) => t.dias));
    return [0, 1, 2, 3, 4, 5, 6].filter((d) => !usados.has(d));
  });
  protected readonly cerradosTexto = computed(() => this.cerrados().map((d) => NOMBRES[d]).join(', '));

  private emitir(tramos: Tramo[]): void {
    this.borrador = tramos;
    const semana = semanaDe(tramos);
    this.ultimaEmitida = semana;
    this.semanaChange.emit(semana);
  }

  protected alternar(i: number, dia: number): void {
    const tramos = this.tramos();
    const yaEsta = tramos[i].dias.includes(dia);
    this.emitir(
      tramos.map((t, j) => {
        if (j === i) return { ...t, dias: yaEsta ? t.dias.filter((d) => d !== dia) : [...t.dias, dia].sort() };
        // Un día vive en un solo tramo: marcarlo aquí lo saca del otro.
        return yaEsta ? t : { ...t, dias: t.dias.filter((d) => d !== dia) };
      }),
    );
  }

  protected ponerFranjas(i: number, franjas: readonly Franja[]): void {
    this.emitir(this.tramos().map((t, j) => (j === i ? { ...t, franjas } : t)));
  }

  protected quitar(i: number): void {
    this.emitir(this.tramos().filter((_, j) => j !== i));
  }

  /** El tramo nuevo nace con los días que quedan cerrados y 09:00–14:00: lo normal es que sea el fin de semana. */
  protected anadir(): void {
    this.emitir([...this.tramos(), { dias: this.cerrados(), franjas: [[540, 840]] }]);
  }
}
