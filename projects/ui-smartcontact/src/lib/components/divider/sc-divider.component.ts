import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DividerModule } from 'primeng/divider';

export type ScDividerLayout = 'horizontal' | 'vertical';
export type ScDividerType = 'solid' | 'dashed' | 'dotted';
export type ScDividerAlign = 'left' | 'center' | 'right' | 'top' | 'bottom';

/**
 * Separador de contenidos. Wrapper fino sobre `<p-divider>` — heredamos las
 * variantes completas del Kit Pro (`❖ divider`, set 302:11810) sin reinventar
 * HTML: orientación (horizontal/vertical), trazo (solid/dashed/dotted),
 * alineación del contenido y proyección de texto/icono/botón en medio.
 *
 * Estilo 100% por tokens vía `sc-preset.ts` (divider.*): borde gray-200,
 * margin 14 / content-padding 7 (escala 14-base, diverge del 16/8 de Aura).
 * Light + dark salen solos por los tokens semánticos.
 *
 * Uso básico (lo más común, separador horizontal sólido):
 *   <sc-divider />
 * Con contenido en medio:
 *   <sc-divider align="center"><span>o</span></sc-divider>
 *
 * Figma reference: `❖ divider` node 302:11810 (canvas 6738:49734) del Smart
 * Contact Prime kit. Cocinado S69 para promover el divisor a primitiva SCDS
 * Figma-connected (cubre todas las variantes del Kit vía `<p-divider>`); las
 * páginas config migraron de `<hr class="divider">` in-page. El consumer actual
 * (config Contact Center) usa horizontal-solid; vertical/dashed/contenido quedan
 * disponibles 1:1 para cuando un diseño los pida.
 */
@Component({
  selector: 'sc-divider',
  standalone: true,
  imports: [DividerModule],
  templateUrl: './sc-divider.component.html',
  styleUrl: './sc-divider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScDividerComponent {
  /** Orientación. Default `horizontal` (el caso dominante). */
  readonly layout = input<ScDividerLayout>('horizontal');
  /** Estilo de trazo. Default `solid`. */
  readonly type = input<ScDividerType>('solid');
  /**
   * Alineación del contenido proyectado (solo aplica con contenido). Horizontal
   * admite left/center/right; vertical top/center/bottom. `null` = default PrimeNG.
   */
  readonly align = input<ScDividerAlign | null>(null);
}
