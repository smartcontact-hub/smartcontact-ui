import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScButtonComponent, ScMultiSelectComponent, ScSelectButtonComponent, ScSelectComponent } from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';

import type { CodigoDeSemana, Franja, Semana } from '../../state/horarios.core.mjs';
import { HorarioFranjasComponent } from './horario-franjas.component';

export const DIAS_DE_LA_SEMANA = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/**
 * Una semana, de lunes a domingo: cada día abierto o cerrado y, abierto, con sus franjas. Debajo, «Copiar» lleva las
 * franjas de un día a otros. Es la semana habitual de un horario y la de cada periodo.
 */
@Component({
  selector: 'sc-horario-semana',
  imports: [HorarioFranjasComponent, ScButtonComponent, ScMultiSelectComponent, ScSelectButtonComponent, ScSelectComponent, TooltipModule, TranslateModule],
  templateUrl: './horario-semana.component.html',
  styleUrl: './horario-semana.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioSemanaComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  readonly semana = input.required<Semana>();
  /** Lo que le pasa a la semana (`validarSemana`), para decirlo bajo su día; `null` si vale. */
  readonly falta = input<{ readonly dia: number; readonly codigo: CodigoDeSemana } | null>(null);
  /** Distingue los `id` cuando hay dos semanas en pantalla (la habitual y la de un periodo). */
  readonly prefijo = input('semana');
  readonly semanaChange = output<Semana>();

  protected readonly dias = computed(() => {
    this.lang();
    return DIAS_DE_LA_SEMANA.map((clave, indice) => ({
      indice,
      nombre: this.translate.instant(`repositories.horarios.days.${clave}`) as string,
      franjas: this.semana()[indice] ?? [],
    }));
  });

  /** Los días que se atienden (los de los botones marcados) y sus filas con franjas. */
  protected readonly abiertos = computed(() => this.dias().filter((d) => d.franjas.length > 0).map((d) => d.indice));
  protected readonly diasAbiertos = computed(() => this.dias().filter((d) => d.franjas.length > 0));
  protected readonly opcionesDeBoton = computed(() => {
    this.lang();
    return DIAS_DE_LA_SEMANA.map((clave, indice) => ({ value: indice, label: this.translate.instant(`repositories.horarios.days_short.${clave}`) as string }));
  });

  /** Marcar un día lo abre con las franjas del día abierto más cercano; desmarcarlo lo cierra. Todo en un solo cambio. */
  protected elegirDias(valor: unknown): void {
    const marcados = new Set((valor as readonly number[] | null) ?? []);
    const semana = this.semana();
    const nueva = semana.map((franjas, dia) => {
      if (!marcados.has(dia)) return [];
      if (franjas.length > 0) return franjas;
      const vecino = [...Array(6).keys()].map((n) => semana[(dia + 6 - n) % 7] ?? []).find((f) => f.length > 0);
      return vecino ?? ([[540, 1080]] as Franja[]);
    });
    this.semanaChange.emit(nueva);
  }

  protected readonly opcionesDeDia = computed(() => this.dias().map((d) => ({ value: d.indice, label: d.nombre })));
  protected readonly origen = signal(0);
  protected readonly destinos = signal<number[]>([]);
  protected readonly destinosPosibles = computed(() => this.opcionesDeDia().filter((d) => d.value !== this.origen()));

  protected ponerDia(dia: number, franjas: readonly Franja[]): void {
    this.semanaChange.emit(this.semana().map((f, i) => (i === dia ? franjas : f)));
  }

  protected elegirOrigen(valor: unknown): void {
    this.origen.set(Number(valor));
    this.destinos.update((d) => d.filter((x) => x !== this.origen()));
  }

  protected copiar(): void {
    const franjas = this.semana()[this.origen()] ?? [];
    const destinos = new Set(this.destinos());
    this.semanaChange.emit(this.semana().map((f, i) => (destinos.has(i) ? franjas : f)));
    this.destinos.set([]);
  }
}
