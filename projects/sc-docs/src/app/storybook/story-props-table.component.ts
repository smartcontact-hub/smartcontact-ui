import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ContratoMiembro } from './component-api.service';

/**
 * Tabla de API, DERIVADA del contrato que genera `audit:components` del código.
 *
 * Hasta el 2026-09-19 sus filas se escribían a mano en cada demo (`StoryMeta.props`), las 51.
 * Medido entonces: 18 páginas no cuadraban con el código y 73 props de 400 no tenían fila —
 * `sc-button` declaraba 16 miembros y la tabla listaba 10, sin `ariaLabel` ni `iconAriaLabel` en
 * ninguna parte de su página. Ahora no hay dos sitios que puedan desviarse.
 *
 * Tres cosas que la tabla a mano no podía decir y esta sí:
 *   · **De quién es cada prop.** `nativo` = PrimeNG la documenta con ese nombre, así que su
 *     documentación vale tal cual; `nuestro` = la añadimos aquí.
 *   · **La descripción de PrimeNG cuando es suya**, en vez de una paráfrasis peor.
 *   · **Que una prop se apoya en API obsoleta**, que es justo lo que no se ve leyendo el wrapper.
 *
 * Agrupa por clase (entradas · dos sentidos · salidas) porque es como se escriben: un `output` no
 * se pone igual que un `input`, y mezclarlos obligaba a leer el tipo para saber cuál era cuál.
 */
@Component({
  selector: 'app-story-props-table',
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error()) {
      <p class="sb-host__desc">No se ha podido cargar el contrato de la API.</p>
    } @else if (miembros() === null) {
      <p class="sb-host__desc">Cargando la API…</p>
    } @else {
      @for (grupo of grupos(); track grupo.titulo) {
        <p class="sb-host__section-title sc-text-caption-semibold">{{ grupo.titulo }}</p>
        <table class="sb-props">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Default</th>
              <th>Qué hace</th>
            </tr>
          </thead>
          <tbody>
            @for (m of grupo.miembros; track m.nombre) {
              <tr>
                <td>
                  <code>{{ m.nombre }}</code>
                  @if (m.requerido) {
                    <span class="sb-props__marca" title="Obligatorio">obligatorio</span>
                  }
                  @if (m.origen === 'nativo') {
                    <span class="sb-props__marca" title="PrimeNG documenta esta prop con este mismo nombre">PrimeNG</span>
                  }
                </td>
                <td><code>{{ m.tipo }}</code></td>
                <td>
                  @if (m.porDefecto) {
                    <code>{{ m.porDefecto }}</code>
                  } @else {
                    —
                  }
                </td>
                <td>
                  @if (m.nativo?.obsoleta) {
                    <strong>Obsoleta en PrimeNG: {{ m.nativo?.obsoleta }}</strong>
                  }
                  {{ m.descripcion ?? m.nativo?.descripcion ?? '' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    }
  `,
})
export class StoryPropsTableComponent {
  /** El contrato del componente. `null` mientras carga. */
  readonly miembros = input<readonly ContratoMiembro[] | null>(null);
  /** `true` si el contrato no se pudo cargar: se dice, en vez de enseñar una tabla vacía. */
  readonly error = input(false);

  protected readonly grupos = computed(() => {
    const ms = this.miembros() ?? [];
    const de = (clase: ContratoMiembro['clase']) => ms.filter((m) => m.clase === clase);
    return [
      { titulo: 'Entradas', miembros: de('input') },
      { titulo: 'Dos sentidos', miembros: de('model') },
      { titulo: 'Salidas', miembros: de('output') },
    ].filter((g) => g.miembros.length);
  });
}
