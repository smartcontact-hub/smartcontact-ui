import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  type TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { StepperModule } from 'primeng/stepper';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent } from '@smartcontact-hub/components';

import type { PasoAlta } from '@shared/utils/alta-pasos';

/**
 * EL ALTA, EN PASOS (DD-137): el Stepper vertical de primeng.dev tal cual (DD-113), con las secciones del índice de
 * la ficha. Cada paso abre su sección debajo y, al dejarlo completo, lleva ✓. La edición sigue con el índice (DD-122).
 *
 * Lo nativo, sin tocar: `p-stepper` › `p-step-item` › `p-step` + `p-step-panel`, con el contenido en `#content`;
 * sus pestañas (`role="tab"`), su teclado y su plegado. Lo único que se le ajusta es el fondo del panel, por `dt`
 * de esta instancia: el del preset es el de una caja, y en oscuro pintaba una franja sobre el lienzo.
 *
 * El ✓ va en el título nativo del paso, proyectado, con su texto oculto «completado»: una cabecera propia perdería
 * la pestaña y el teclado del nativo. El número lo sigue pintando el nativo.
 *
 * Cada paso abierto lleva su título de nivel 2, oculto porque ya lo dice su pestaña: la sección, sin su cabecera, no
 * tiene el suyo, y el alta saltaba de h1 a h3. Con él los títulos van como al editar, y el panel se llama así (el
 * nativo le pone `aria-controls` en vez de `aria-labelledby`, y se quedaba sin nombre).
 *
 * «Siguiente» y «Atrás» son atajos al paso de al lado, y llevan el foco a su pestaña. Si la ficha no deja pasar (la
 * puerta de General del grupo, DD-121), el paso no cambia y el foco lo pone la ficha donde falte algo. «Crear …»
 * sigue siendo la única acción que crea, arriba (DD-122 §6), y el último paso solo lleva «Atrás».
 */
@Component({
  selector: 'sc-alta-pasos',
  imports: [NgTemplateOutlet, TranslateModule, StepperModule, ScIconComponent, ScButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-stepper
      class="alta-pasos"
      [value]="abierto()"
      [dt]="pasosDt"
      [attr.aria-label]="'common.steps_aria' | translate"
      (valueChange)="onValue($event)"
    >
      @for (paso of pasos(); track paso.id) {
        <p-step-item [value]="paso.value">
          <p-step [disabled]="paso.disabled">
            {{ paso.labelKey | translate }}
            @if (paso.hecho) {
              <sc-icon class="alta-pasos__hecho" name="check_circle" size="inherit" [weight]="500" aria-hidden="true" />
              <span class="visually-hidden">{{ 'common.step_done' | translate }}</span>
            }
          </p-step>
          <p-step-panel [attr.aria-labelledby]="idTitulo(paso.value)">
            <ng-template #content>
              <h2 class="visually-hidden" [id]="idTitulo(paso.value)">{{ paso.labelKey | translate }}</h2>
              <ng-container *ngTemplateOutlet="secciones()[paso.id] ?? null" />
              <div class="alta-pasos__acciones">
                @if (paso.value > 1) {
                  <sc-button
                    size="sm"
                    variant="secondary"
                    appearance="outlined"
                    icon="arrow_back"
                    [label]="'common.back' | translate"
                    (clicked)="pedir(anterior)"
                  />
                }
                @if (paso.value < pasos().length) {
                  <sc-button
                    size="sm"
                    variant="secondary"
                    appearance="outlined"
                    icon="arrow_forward"
                    iconPosition="right"
                    [label]="'common.next' | translate"
                    (clicked)="pedir(siguiente)"
                  />
                }
              </div>
            </ng-template>
          </p-step-panel>
        </p-step-item>
      }
    </p-stepper>
  `,
  styles: `
    :host {
      display: block;
    }

    /* El ✓ del paso dejado completo, en el verde de éxito y a 500, el peso del título del paso (medido: el nativo lo
     * pinta a 500). Centrado con el texto: con «middle» caía 1,7 px por debajo, y con -0,125em queda a 0,25 px, sin
     * crecer la línea. Entra como un icono que cambia de estado: escala, opacidad y desenfoque, con la curva
     * enfática; con menos movimiento lo apaga la regla global. Medido el 2026-10-01. */
    .alta-pasos__hecho {
      margin-inline-start: var(--sc-spacing-0-375);
      color: var(--sc-text-success);
      vertical-align: -0.125em;
      animation: alta-pasos-hecho 300ms var(--sc-easing-emphasized);
    }

    @keyframes alta-pasos-hecho {
      from {
        opacity: 0;
        transform: scale(0.25);
        filter: blur(4px);
      }
    }

    /* «Atrás» a la izquierda y «Siguiente» a la derecha, bajo la sección: 28 por encima, el aire entre grupos, y 28
     * hasta el paso siguiente (estos 21 más los 7 que pone el nativo entre pasos). Medido el 2026-09-29. */
    .alta-pasos__acciones {
      display: flex;
      justify-content: space-between;
      gap: var(--sc-spacing-1);
      padding-block: var(--sc-spacing-2) var(--sc-spacing-1-5);
    }

    .alta-pasos__acciones > :only-child:last-child {
      margin-inline-start: auto;
    }
  `,
})
export class AltaPasosComponent {
  private static instancias = 0;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Los pasos, en el orden del índice (`pasosDeAlta`). */
  readonly pasos = input.required<readonly PasoAlta[]>();
  /** El número del paso abierto. */
  readonly abierto = input.required<number>();
  /** El cuerpo de cada paso, por la sección que es: la misma plantilla que pinta la edición junto al índice. */
  readonly secciones = input.required<Readonly<Record<string, TemplateRef<unknown>>>>();

  /** Una pestaña pulsada (o con el teclado): la sección que pide abrir. */
  readonly paso = output<string>();
  readonly siguiente = output<void>();
  readonly anterior = output<void>();

  /** Prefijo de los ids de esta instancia: los títulos de los pasos no pueden repetirse en la página. */
  private readonly idBase = `alta-pasos-${++AltaPasosComponent.instancias}`;

  /** El panel es transparente: el lienzo de la página es su fondo. */
  protected readonly pasosDt = { steppanel: { background: 'transparent' } };

  /** El paso desde el que se pidió «Siguiente» o «Atrás». Si el abierto cambia, el foco va a su pestaña; si la
   *  ficha no deja pasar, no cambia y no se toca el foco. */
  private focoPedidoDesde: number | null = null;

  constructor() {
    effect(() => {
      const abierto = this.abierto();
      const desde = this.focoPedidoDesde;
      if (desde === null || abierto === desde) return;
      this.focoPedidoDesde = null;
      afterNextRender(
        () => {
          const pestanas = this.host.nativeElement.querySelectorAll<HTMLElement>('[role="tab"]');
          pestanas[abierto - 1]?.focus();
        },
        { injector: this.injector },
      );
    });
  }

  /** El id del título del paso: el panel lo usa de nombre. */
  protected idTitulo(value: number): string {
    return `${this.idBase}-titulo-${value}`;
  }

  protected onValue(value: number | undefined): void {
    // Una pestaña pulsada ya tiene el foco: el nativo lo deja en ella.
    this.focoPedidoDesde = null;
    const id = value ? this.pasos()[value - 1]?.id : undefined;
    if (id && value !== this.abierto()) this.paso.emit(id);
  }

  protected pedir(salida: { emit(): void }): void {
    this.focoPedidoDesde = this.abierto();
    salida.emit();
  }
}
