import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * UNA CELDA SIN DATO (DD-197). A la vista, «—» en el gris suave: en una tabla densa, una celda en blanco parece que no ha
 * cargado, y el guion dice que ahí no hay nada a propósito. Para el lector de pantalla, el guion se oculta y se oye
 * «Sin dato», o lo que diga `texto` cuando el vacío tiene su porqué («No aplica»: el grupo no tiene ese canal).
 *
 *   <sc-celda-vacia />
 *   <sc-celda-vacia [texto]="'common.not_applicable' | translate" />
 *
 * Si el vacío significa algo concreto («Nunca», «Sin asignar», «Todos») o es una cifra (0), no va esto: se escribe.
 */
@Component({
  selector: 'sc-celda-vacia',
  imports: [TranslateModule],
  template: `<span class="celda-vacia" aria-hidden="true">—</span><span class="visually-hidden">{{
    texto() ?? ('common.empty_cell' | translate)
  }}</span>`,
  styles: `
    .celda-vacia {
      color: var(--sc-text-subtle);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CeldaVaciaComponent {
  /** Lo que oye el lector de pantalla en lugar del guion. Sin él, «Sin dato». */
  readonly texto = input<string | null>(null);
}
