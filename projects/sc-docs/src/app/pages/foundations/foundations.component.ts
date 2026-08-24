import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ScIconComponent } from '@smartcontact-hub/icons';

import { ScClipboardService } from '../../../../../ui-smartcontact/src/public-api';

interface ScaleStep {
  token: string;
  px: number;
}

interface ColorFamily {
  name: string;
  token: string;
  steps: number[];
}

/** Lo que la tarjeta de un swatch enseña. Se calcula del valor RESUELTO. */
interface SwatchInfo {
  token: string;
  hex: string;
  hsl: string;
}

/**
 * Muestra las fundaciones del DS leyendo los tokens reales (`var(--sc-*)`):
 * la rampa de escala 14-base y las familias primitivas de color. Lo que se ve
 * aquí es lo que el navegador resuelve — sin valores duplicados en la página.
 *
 * Los swatches abren una tarjeta al pasar por encima (o al recibir foco) con el
 * token, el hex y el HSL, y cada línea se copia al pulsarla. Los tres valores
 * salen de `getComputedStyle`, NO de una tabla escrita a mano: si mañana cambia
 * la primitiva, la tarjeta cambia sola. Eso es justo lo que hace fiable a esta
 * página, y por eso no se cachea el hex en el `.ts`.
 */
@Component({
  selector: 'app-foundations',
  imports: [ScIconComponent],
  templateUrl: './foundations.component.html',
  styleUrl: './foundations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationsComponent {
  private readonly clipboard = inject(ScClipboardService);

  readonly scaleSteps: ScaleStep[] = [
    { token: '--sc-scale-0-25', px: 3.5 },
    { token: '--sc-scale-0-5', px: 7 },
    { token: '--sc-scale-0-75', px: 10.5 },
    { token: '--sc-scale-1', px: 14 },
    { token: '--sc-scale-1-5', px: 21 },
    { token: '--sc-scale-2', px: 28 },
    { token: '--sc-scale-3', px: 42 },
    { token: '--sc-scale-4', px: 56 },
  ];

  readonly colorFamilies: ColorFamily[] = [
    { name: 'Blue (marca)', token: 'blue', steps: [50, 100, 300, 500, 700, 900] },
    { name: 'Slate (neutros)', token: 'slate', steps: [50, 100, 300, 500, 700, 900] },
    { name: 'Sky (info)', token: 'sky', steps: [50, 100, 300, 500, 700, 900] },
    { name: 'Green (success)', token: 'green', steps: [50, 100, 300, 500, 700, 900] },
    { name: 'Amber (warning)', token: 'amber', steps: [50, 100, 300, 500, 700, 900] },
    { name: 'Red (danger)', token: 'red', steps: [50, 100, 300, 500, 700, 900] },
  ];

  /** Token del último valor copiado + qué campo, para el feedback («Copiado»). */
  protected readonly copiado = signal<string | null>(null);
  /** Cache por token: resolver es barato, pero esto corre en cada detección. */
  private readonly cache = new Map<string, SwatchInfo>();

  protected info(family: string, step: number): SwatchInfo {
    const token = `--sc-color-${family}-${step}`;
    const yaEsta = this.cache.get(token);
    if (yaEsta) return yaEsta;

    const crudo = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    const hex = this.aHex(crudo);
    const calculado: SwatchInfo = { token, hex, hsl: this.aHsl(hex) };
    this.cache.set(token, calculado);
    return calculado;
  }

  protected async copiar(valor: string, marca: string, evento: Event): Promise<void> {
    evento.stopPropagation();
    const ok = await this.clipboard.copy(valor);
    if (!ok) return;
    this.copiado.set(marca);
    setTimeout(() => this.copiado.set(null), 1600);
  }

  /** Normaliza a `#rrggbb`. La capa 1 escribe hex, pero no lo damos por hecho:
   *  si alguien mete un `rgb()` la tarjeta debe seguir diciendo la verdad. */
  private aHex(valor: string): string {
    if (valor.startsWith('#')) return valor.length === 4
      ? '#' + [...valor.slice(1)].map((c) => c + c).join('')
      : valor.slice(0, 7).toLowerCase();
    const n = valor.match(/\d+(\.\d+)?/g);
    if (!n || n.length < 3) return valor;
    return (
      '#' +
      n
        .slice(0, 3)
        .map((v) => Math.round(Number(v)).toString(16).padStart(2, '0'))
        .join('')
    );
  }

  private aHsl(hex: string): string {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    if ([r, g, b].some((c) => Number.isNaN(c))) return '—';
    const max = Math.max(r!, g!, b!);
    const min = Math.min(r!, g!, b!);
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g! - b!) / d) % 6;
      else if (max === g) h = (b! - r!) / d + 2;
      else h = (r! - g!) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
  }
}
