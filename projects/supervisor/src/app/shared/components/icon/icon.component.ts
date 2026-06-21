import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SC_ICON_SIZE_DEFAULT } from '@shared/utils/icon-size';

/**
 * `<sc-icon>` — icono Material Symbols (Outlined) renderizado por ligadura.
 *
 * `name` es el nombre del símbolo Material (p.ej. `"settings"`, `"delete"`,
 * `"call"`). El font se carga en `index.html`. `size` mapea a font-size en px
 * (default `--sc-icon-size` = 14) y también al eje `opsz` para que el trazo
 * escale como diseñó Google. `fill` / `weight` exponen los ejes FILL y wght.
 *
 * Único proveedor de iconos del SCDS (la migración Lucide→Material cerró en
 * S62 — ya no queda `lucide-angular` en el repo). Para un spinner de carga usar
 * `[spin]="true"` con `name="progress_activity"`. Los iconos de **marca** sin
 * glifo Material (p.ej. GitHub) se resuelven con un `<svg>` inline en el
 * consumer, no aquí.
 */
@Component({
  selector: 'sc-icon',
  template: `{{ name() }}`,
  styleUrl: './icon.component.scss',
  host: {
    class: 'sc-icon material-symbols-outlined',
    'aria-hidden': 'true',
    '[class.sc-icon--spin]': 'spin()',
    '[style.font-size]': 'fontSize()',
    '[style.font-variation-settings]': 'variation()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  /** Nombre del símbolo Material (snake_case, p.ej. `space_dashboard`). */
  readonly name = input.required<string>();
  /**
   * Tamaño en px o `'inherit'`. Default `--sc-icon-size` (14). El numérico
   * mapea a font-size px y alimenta `opsz`. `'inherit'` (DD-24) → el icono
   * *companion* hereda el font-size de su contenedor (`1em`) y rima con el
   * texto adyacente (los `<button>`/inputs ya están reseteados a `font: inherit`).
   */
  readonly size = input<number | 'inherit'>(SC_ICON_SIZE_DEFAULT);
  /** Relleno del glifo (eje FILL 0→1). */
  readonly fill = input<boolean>(false);
  /** Grosor del trazo (eje wght 100→700). */
  readonly weight = input<number>(400);
  /** Gira el glifo en bucle (spinner). Respeta `prefers-reduced-motion`. */
  readonly spin = input<boolean>(false);

  /** `'inherit'` → `1em` (hereda el font-size del contenedor); numérico → px. */
  protected readonly fontSize = computed(() => {
    const s = this.size();
    return s === 'inherit' ? '1em' : `${s}px`;
  });

  /** opsz numérico: el px cuando es numérico; el default del Kit al heredar. */
  protected readonly opticalSize = computed(() => {
    const s = this.size();
    return s === 'inherit' ? SC_ICON_SIZE_DEFAULT : s;
  });

  protected readonly variation = computed(
    () =>
      `'FILL' ${this.fill() ? 1 : 0}, 'wght' ${this.weight()}, 'GRAD' 0, 'opsz' ${this.opticalSize()}`,
  );
}
