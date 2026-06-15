import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ScIconComponent } from '../../../../../ui-smartcontact-icons/src/public-api';

/** Una fila de la escala tipográfica: un step y su valor. */
interface TypeRow {
  step: string; // '300'
  token: string; // --sc-font-size-300
  px: number; // 16
  rem: string; // '1'
  sample: string; // texto de muestra
}

interface LineHeightRow {
  step: string;
  token: string;
  px: number;
  rem: string;
}

const rem = (px: number): string => `${+(px / 16).toFixed(4)}`;

/**
 * Foundations → Tipografía.
 *
 * Escala tipográfica de SCDS: 8 tamaños redondos + 7 line-heights, step-named
 * (mismo idioma que el Kit Pro de Figma y el repo de los devs), en rem (root 16)
 * y desacoplada de la escala de espaciado (`--sc-scale`). Las muestras se renderizan
 * con los tokens reales (`var(--sc-font-size-*)`), así que reflejan producción.
 */
@Component({
  selector: 'app-foundations-type',
  standalone: true,
  imports: [RouterLink, ScIconComponent],
  templateUrl: './foundations-type.component.html',
  styleUrl: './foundations-type.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationsTypeComponent {
  protected readonly arrowLeftIcon = 'arrow_back';
  protected readonly typeIcon = 'text_fields';

  /** Font-size: 8 tamaños redondos, step-named, en rem. */
  protected readonly sizes: TypeRow[] = [
    { step: '100', px: 12, sample: 'Micro-labels, captions, metadatos de tabla' },
    { step: '200', px: 14, sample: 'Cuerpo denso y ayudas de formulario' },
    { step: '300', px: 16, sample: 'Cuerpo base y etiquetas' },
    { step: '400', px: 18, sample: 'Cuerpo destacado' },
    { step: '450', px: 20, sample: 'Subtítulos' },
    { step: '500', px: 24, sample: 'Títulos de sección' },
    { step: '650', px: 32, sample: 'Encabezados de página' },
    { step: '800', px: 48, sample: 'Display' },
  ].map((s) => ({ ...s, token: `--sc-font-size-${s.step}`, rem: rem(s.px) }));

  /** Line-height: 7 valores, step-named, en rem. */
  protected readonly lineHeights: LineHeightRow[] = [
    { step: '100', px: 18 },
    { step: '200', px: 20 },
    { step: '300', px: 24 },
    { step: '450', px: 28 },
    { step: '500', px: 36 },
    { step: '650', px: 40 },
    { step: '800', px: 58 },
  ].map((l) => ({ ...l, token: `--sc-line-height-${l.step}`, rem: rem(l.px) }));
}
