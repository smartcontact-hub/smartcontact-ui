import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import {
  ENTIDADES_CHIP,
  FAVORITOS,
  PREDETERMINADOS,
} from '../../data/reports.data';
import { ReportSelectionDialogComponent } from '../../components/report-selection-dialog/report-selection-dialog.component';

/**
 * Landing de Informes — réplica de `statssm/#/private/initial-view`.
 *
 * La pantalla real es la ilustración a la izquierda y tres bloques apilados a
 * la derecha (Favoritos · Predeterminados · Histórico), con un carril de 70 px
 * a la derecha del todo que sólo lleva el engranaje arriba y el botón `+`
 * abajo.
 *
 * **Traducción de unidades**: el original dimensiona TODO con `vw`/`vh`
 * porque vive dentro de un iframe, donde el viewport ES la caja del iframe.
 * Aquí se usa `cqw`/`cqh` sobre un contenedor de tamaño (`container-type:
 * size`), que es la equivalencia exacta: 2vw → 2cqw. Así la réplica se
 * comporta igual dentro del área de contenido del supervisor.
 *
 * Métrica medida @1460×792 — ver `docs/informes-datareports.md`.
 */
@Component({
  selector: 'sc-data-reports-page',
  imports: [ReportSelectionDialogComponent],
  templateUrl: './data-reports.page.html',
  styleUrl: './data-reports.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataReportsPage {
  private readonly router = inject(Router);

  protected readonly favoritos = FAVORITOS;
  protected readonly predeterminados = PREDETERMINADOS;
  protected readonly entidades = ENTIDADES_CHIP;

  /** Diálogo "Informes de Estadísticas", el que abre el botón `+`. */
  protected readonly selectorAbierto = signal(false);

  /* Los dos buscadores filtran de verdad — en la real también. */
  protected readonly filtroFavoritos = signal('');
  protected readonly filtroPredeterminados = signal('');

  protected readonly favoritosVisibles = computed(() => {
    const q = this.filtroFavoritos().trim().toLowerCase();
    if (!q) return this.favoritos;
    return this.favoritos.filter((f) =>
      [f.nombre, f.descripcion, f.subcategoria, f.categoria].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  });

  protected readonly predeterminadosVisibles = computed(() => {
    const q = this.filtroPredeterminados().trim().toLowerCase();
    if (!q) return this.predeterminados;
    return this.predeterminados.filter((p) =>
      [p.nombre, p.categoria, p.subcategoria, p.descripcion].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  });

  protected buscar(destino: 'fav' | 'pre', ev: Event): void {
    const valor = (ev.target as HTMLInputElement).value;
    if (destino === 'fav') this.filtroFavoritos.set(valor);
    else this.filtroPredeterminados.set(valor);
  }

  /** Elegir un informe del diálogo lleva al constructor, como en la real. */
  protected abrirConstructor(tipo: string): void {
    this.selectorAbierto.set(false);
    void this.router.navigate(['/informes', 'constructor', tipo]);
  }
}
