import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ScTagComponent } from '@smartcontact-hub/components';

import { EstadoComponente } from './component-api.service';

/**
 * El estado de un componente (DD-190), como Primer: una etiqueta y, con `explicado`, la frase que
 * dice por qué. «Listo» en verde, «Experimental» en ámbar y «Retirado» en gris: el color dice si se
 * puede usar sin más, con cuidado o nunca en una pantalla nueva, y la palabra lo dice sin color.
 */
@Component({
  selector: 'app-estado-componente',
  imports: [ScTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (estado(); as e) {
      <span class="estado">
        <sc-tag [value]="etiqueta()" [severity]="severidad()" />
        @if (explicado()) {
          <span class="estado__motivo sc-text-body-regular">{{ motivo() }}</span>
        }
      </span>
    }
  `,
  styles: `
    .estado {
      display: inline-flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: var(--sc-spacing-0-5);
    }
    .estado__motivo {
      color: var(--sc-text-secondary);
    }
  `,
})
export class EstadoComponenteComponent {
  readonly estado = input<EstadoComponente | null>(null);
  /** Con la frase del motivo al lado (la cabecera de la ficha); sin ella, solo la etiqueta (el índice). */
  readonly explicado = input(false, { transform: booleanAttribute });

  protected readonly etiqueta = computed(() => ({ ready: 'Listo', experimental: 'Experimental', deprecated: 'Retirado' })[this.estado()?.estado ?? 'ready']);

  protected readonly severidad = computed(() => ({ ready: 'success', experimental: 'warn', deprecated: 'secondary' }) [this.estado()?.estado ?? 'ready'] as 'success' | 'warn' | 'secondary');

  protected readonly motivo = computed(() => {
    const e = this.estado();
    if (!e) return '';
    if (e.estado === 'ready') return 'Tiene maestro en el Kit y página de demo.';
    if (e.estado === 'deprecated') return `No lo uses en pantallas nuevas. ${primeraFrase(e.retirado ?? '')}`.trim();
    const falta = e.faltas.map((f) => (f === 'kit' ? 'maestro en el Kit' : 'página de demo')).join(' ni ');
    return `Sin ${falta}.`;
  });
}

/** La primera frase de un texto, para que el motivo de un retirado quepa en una línea. */
function primeraFrase(texto: string): string {
  const m = /^(.+?[.!?])(\s|$)/.exec(texto.trim());
  return m ? m[1] : texto.trim();
}
