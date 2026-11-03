import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CabeceraComponent } from '../../shared/cabecera.component';

interface PasoEscala {
  readonly token: string;
  readonly px: number;
}

/**
 * Fundamentos → Espaciado: la escala 14-base y la regla que la usa, la agrupación 7, 14 y 28.
 *
 * La tabla vivía en «Escala y color», que mezclaba dos materias; aquí está sola, como el «Spacing» de Primer. Las barras
 * se pintan con `var(--sc-scale-*)`, así que miden lo que el navegador resuelve y no un número copiado. La muestra de
 * agrupación usa los alias `--sc-spacing-*` de verdad: si cambiara la escala, la muestra cambiaría con ella.
 */
@Component({
  selector: 'app-espaciado',
  standalone: true,
  imports: [CabeceraComponent, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-cabecera
      arte="espaciado"
      [titulo]="'fundamentos.spacing.title' | translate"
      [entradilla]="'fundamentos.spacing.lead' | translate"
      [nota]="'fundamentos.spacing.note' | translate"
    />

    <h2>{{ 'fundamentos.spacing.scaleTitle' | translate }}</h2>
    <table class="scale-table sc-text-body-regular">
      <thead>
        <tr>
          <th scope="col">{{ 'fundamentos.spacing.thToken' | translate }}</th>
          <th scope="col">{{ 'fundamentos.spacing.thAlias' | translate }}</th>
          <th scope="col">{{ 'fundamentos.spacing.thPx' | translate }}</th>
          <th scope="col"><span class="oculto">{{ 'fundamentos.spacing.thBar' | translate }}</span></th>
        </tr>
      </thead>
      <tbody>
        @for (paso of pasos; track paso.token) {
          <tr>
            <td><code>{{ paso.token }}</code></td>
            <td><code>{{ alias(paso.token) }}</code></td>
            <td class="num">{{ paso.px }}</td>
            <td><span class="scale-bar" [style.width]="'var(' + paso.token + ')'"></span></td>
          </tr>
        }
      </tbody>
    </table>

    <h2>{{ 'fundamentos.spacing.groupTitle' | translate }}</h2>
    <p class="texto sc-text-body-regular">{{ 'fundamentos.spacing.groupLead' | translate }}</p>

    <!-- Un formulario de muestra con sus huecos pintados: 7 entre etiqueta y control, 14 entre campos, 28 entre grupos
         y antes del botón. Es un dibujo, no un formulario: para el lector de pantalla, una imagen con su descripción. -->
    <div class="muestra" role="img" [attr.aria-label]="'fundamentos.spacing.demoAria' | translate">
      <span class="m-etq sc-text-body-semibold">{{ 'fundamentos.spacing.demoName' | translate }}</span>
      <span class="m-hueco m-hueco--7"><span class="m-franja"></span><span class="m-cifra sc-text-caption-regular">{{ 'fundamentos.spacing.gap7' | translate }}</span></span>
      <span class="m-ctl"></span>
      <span class="m-hueco m-hueco--14"><span class="m-franja"></span><span class="m-cifra sc-text-caption-regular">{{ 'fundamentos.spacing.gap14' | translate }}</span></span>
      <span class="m-etq sc-text-body-semibold">{{ 'fundamentos.spacing.demoSurname' | translate }}</span>
      <span class="m-hueco m-hueco--7"><span class="m-franja"></span></span>
      <span class="m-ctl"></span>
      <span class="m-hueco m-hueco--28"><span class="m-franja"></span><span class="m-cifra sc-text-caption-regular">{{ 'fundamentos.spacing.gap28' | translate }}</span></span>
      <span class="m-etq sc-text-body-semibold">{{ 'fundamentos.spacing.demoPhone' | translate }}</span>
      <span class="m-hueco m-hueco--7"><span class="m-franja"></span></span>
      <span class="m-ctl"></span>
      <span class="m-hueco m-hueco--28"><span class="m-franja"></span></span>
      <span class="m-boton sc-text-body-semibold">{{ 'fundamentos.spacing.demoSave' | translate }}</span>
    </div>

    <p class="texto sc-text-body-regular">
      <a routerLink="/fundamentos/patrones/agrupacion">{{ 'fundamentos.spacing.groupMore' | translate }}</a>
    </p>
  `,
  styles: `
    :host {
      display: block;
      max-width: 720px;
      padding-bottom: var(--sc-spacing-5);
    }

    h2 {
      margin: var(--sc-spacing-2) 0 var(--sc-spacing-0-75);
      font-size: var(--sc-font-size-h3);
      line-height: var(--sc-line-height-h3);
      font-weight: var(--sc-font-weight-h3);
      color: var(--sc-text-primary);
    }

    .texto {
      margin: 0 0 var(--sc-spacing-1);
      color: var(--sc-text-secondary);

      a {
        color: var(--sc-text-link);
      }
    }

    code {
      font-family: var(--sc-font-family-mono);
    }

    .scale-table {
      border-collapse: collapse;

      th,
      td {
        padding: var(--sc-spacing-0-25) var(--sc-spacing-1);
        border-bottom: 1px solid var(--sc-border-default);
        text-align: left;
      }

      th {
        color: var(--sc-text-subtle);
        font-weight: var(--sc-font-weight-semibold);
      }

      .num {
        font-variant-numeric: tabular-nums;
      }
    }

    .scale-bar {
      display: inline-block;
      height: var(--sc-spacing-0-5);
      background: var(--sc-bg-primary);
      border-radius: var(--sc-radius-xs);
    }

    /* La muestra: una columna de formulario y, a su derecha, la cifra de cada hueco. */
    .muestra {
      display: flex;
      flex-direction: column;
      width: fit-content;
      max-width: 100%;
      margin: var(--sc-spacing-1) 0 var(--sc-spacing-1-5);
      padding: var(--sc-spacing-1-25);
      border: 1px solid var(--sc-border-default);
      border-radius: var(--sc-radius-lg);
    }

    .m-etq {
      color: var(--sc-text-primary);
    }

    .m-ctl {
      height: var(--sc-spacing-2-5);
      max-width: 14rem;
      border: 1px solid var(--sc-border-strong);
      border-radius: var(--sc-radius-md);
      background: var(--sc-bg-surface);
    }

    .m-boton {
      align-self: flex-start;
      padding: var(--sc-spacing-0-5) var(--sc-spacing-1);
      border-radius: var(--sc-radius-md);
      background: var(--sc-bg-primary);
      color: var(--sc-text-on-primary);
    }

    /* El hueco, pintado: una franja del alto del token y su cifra al lado, fuera de la columna del formulario. La fila
       mide lo que el token; la cifra, más alta que 7, sobresale centrada sin empujar nada. */
    .m-hueco {
      display: grid;
      grid-template-columns: 14rem auto;
      column-gap: var(--sc-spacing-0-75);
      align-items: center;

      &--7 {
        height: var(--sc-spacing-0-5);
      }

      &--14 {
        height: var(--sc-spacing-1);
      }

      &--28 {
        height: var(--sc-spacing-2);
      }
    }

    .m-franja {
      align-self: stretch;
      background: var(--sc-bg-info-subtle);
    }

    .m-cifra {
      color: var(--sc-text-info);
      white-space: nowrap;
    }

    .oculto {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
})
export class EspaciadoComponent {
  protected readonly pasos: readonly PasoEscala[] = [
    { token: '--sc-scale-0-25', px: 3.5 },
    { token: '--sc-scale-0-5', px: 7 },
    { token: '--sc-scale-0-75', px: 10.5 },
    { token: '--sc-scale-1', px: 14 },
    { token: '--sc-scale-1-5', px: 21 },
    { token: '--sc-scale-2', px: 28 },
    { token: '--sc-scale-3', px: 42 },
    { token: '--sc-scale-4', px: 56 },
  ];

  /** `--sc-scale-1` → `--sc-spacing-1`: el alias que se escribe en un componente. */
  protected alias(token: string): string {
    return token.replace('--sc-scale-', '--sc-spacing-');
  }
}
