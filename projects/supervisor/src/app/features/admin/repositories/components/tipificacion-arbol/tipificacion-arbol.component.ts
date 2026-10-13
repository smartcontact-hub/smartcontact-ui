import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ScDialogComponent as DialogComponent } from '@smartcontact-hub/components';

import { totalDeOpciones, type Tipificacion } from '../../state/tipificaciones.core.mjs';

/**
 * QUÉ TIENE UNA TIPIFICACIÓN, visto desde donde se asigna (revisión de tipificaciones del 2026-10-09): en la ficha de
 * grupo no vale con ver su nombre, hay que ver qué hay detrás (la propuesta de producto: nombre, descripción, sus tres
 * niveles y «Editar en Repositorios»). Un diálogo con su nombre y su descripción arriba, y el árbol con LAS MISMAS
 * columnas que su editor (`tipificacion-niveles`): una por nivel, con todas las ramas a la vez, no solo la elegida.
 * Solo lectura: las opciones son texto, no cajas, porque aquí no se escriben. Se edita en su ficha, en Repositorios.
 */
@Component({
  selector: 'sc-tipificacion-arbol',
  imports: [DialogComponent, NgTemplateOutlet, RouterLink, TranslateModule],
  template: `
    @let t = tipificacion();
    <sc-dialog
      [visible]="visible()"
      [title]="t.name"
      [subtitle]="t.description || null"
      width="min(56rem, 92vw)"
      [dismissableMask]="true"
      [closeAriaLabel]="'common.close' | translate"
      (cancelled)="cerrar.emit()"
    >
      <p class="mapa__dato sc-text-caption-regular">
        {{ (t.levels === 1 ? 'repositories.tipificaciones.levels_count_one' : 'repositories.tipificaciones.levels_count') | translate: { count: t.levels } }},
        {{ (total() === 1 ? 'repositories.tipificaciones.options_count_one' : 'repositories.tipificaciones.options_count') | translate: { count: total() } }}
      </p>
      <div class="mapa" [style.--niveles]="t.levels">
        <div class="mapa__cabeza">
          @for (nivel of columnas(); track nivel) {
            <span class="sc-text-body-semibold">{{ 'repositories.tipificaciones.level_title.' + (nivel + 1) | translate }}</span>
          }
        </div>
        @for (opcion of t.options; track opcion.id) {
          <div class="mapa__rama">
            <ng-container *ngTemplateOutlet="rama; context: { $implicit: opcion, nivel: 0 }" />
          </div>
        }
      </div>

      <div modal-actions class="mapa__pie">
        <a class="mapa__editar sc-text-caption-semibold" [routerLink]="['/admin/tipificaciones/editar', t.id]" [queryParams]="{ seccion: 'categorias' }">
          {{ 'repositories.tipificaciones.map_edit' | translate }}
        </a>
      </div>
    </sc-dialog>

    <ng-template #rama let-opcion let-nivel="nivel">
      <div class="rama">
        <span class="rama__opcion sc-text-body-regular">{{ opcion.label }}</span>
        @if (nivel < tipificacion().levels - 1) {
          <div class="rama__hijas">
            @for (hija of opcion.children; track hija.id) {
              <ng-container *ngTemplateOutlet="rama; context: { $implicit: hija, nivel: nivel + 1 }" />
            }
          </div>
        }
      </div>
    </ng-template>
  `,
  styles: `
    .mapa__dato {
      margin: 0 0 var(--sc-spacing-1);
      color: var(--sc-text-secondary);
    }
    /* La rejilla del editor: una columna por nivel; cada rama hereda las columnas con subgrid, sin hueco propio. */
    .mapa {
      display: grid;
      grid-template-columns: repeat(var(--niveles), minmax(0, 1fr));
      column-gap: var(--sc-spacing-1);
      max-height: 60vh;
      overflow-y: auto;
    }
    .mapa__cabeza,
    .mapa__rama,
    .rama {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: subgrid;
      align-items: start;
    }
    .mapa__cabeza {
      position: sticky;
      top: 0;
      padding-block-end: var(--sc-spacing-0-5);
      background: var(--sc-bg-surface);
      color: var(--sc-text-primary);
    }
    .mapa__rama {
      border-block-start: 1px solid var(--sc-border-subtle);
      padding-block: var(--sc-spacing-0-5);
    }
    .rama__opcion {
      grid-column: 1;
      color: var(--sc-text-primary);
      overflow-wrap: anywhere;
    }
    .rama__hijas {
      grid-column: 2 / -1;
      display: grid;
      grid-template-columns: subgrid;
      row-gap: var(--sc-spacing-0-25);
    }
    /* Las hojas, juntas (3,5); las ramas que tienen hojas debajo, a 14 una de otra: se lee dónde acaba cada una. */
    .rama__hijas:has(> .rama > .rama__hijas) {
      row-gap: var(--sc-spacing-1);
    }
    .mapa__pie {
      display: flex;
      flex: 1;
    }
    /* Como «Gestionar en Repositorios» de Recursos: el mismo enlace para ir al mismo sitio. */
    .mapa__editar {
      color: var(--sc-text-link);
      text-decoration: underline;
      text-underline-offset: var(--sc-spacing-0-125);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipificacionArbolComponent {
  readonly tipificacion = input.required<Tipificacion>();
  readonly visible = input(false);
  readonly cerrar = output<void>();
  protected readonly total = computed(() => totalDeOpciones(this.tipificacion().options));
  protected readonly columnas = computed(() => Array.from({ length: this.tipificacion().levels }, (_, i) => i));
}
