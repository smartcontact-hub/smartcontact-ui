import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import { ScIconComponent } from '@smartcontact-hub/icons';

import { partirEnFrase } from '../../storybook/texto-ficha.component';
import { EscenaPatronComponent, PATRONES_CON_ESCENA } from './escena-patron.component';
import { PATRONES } from './patrones-datos';

/**
 * Fundamentos → Patrones → un patrón, en su página (`/fundamentos/patrones/carga`), como los de Primer: el título, lo
 * que se hace y lo que se evita lado a lado, con qué del sistema ya se resuelve y, al pie, el anterior y el siguiente.
 * Cada lado se dice en una frase (`doShort`, `dontShort`) y «Ya en el sistema» en la primera de la suya: la regla
 * entera (`apply`, `avoid`, `have`, la que cuadra con AGENTS.md) queda plegada debajo, y entera en la ficha para agentes.
 *
 * Encima de cada lado, su escena (`escena-patron.component.ts`): el «haz» y el «evita» dibujados con componentes de
 * verdad, como Primer ilustra cada pauta. El dibujo calca la regla y no añade nada que ella no diga.
 */
@Component({
  selector: 'app-patron',
  standalone: true,
  imports: [EscenaPatronComponent, RouterLink, ScIconComponent, TranslatePipe],
  templateUrl: './patron.component.html',
  styleUrl: './patron.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatronComponent {
  private readonly ruta = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('ruta') ?? '')), {
    initialValue: '',
  });

  private readonly indice = computed(() => PATRONES.findIndex((p) => p.ruta === this.ruta()));
  protected readonly patron = computed(() => PATRONES[this.indice()] ?? null);
  protected readonly anterior = computed(() => (this.indice() > 0 ? PATRONES[this.indice() - 1] : null));
  protected readonly siguiente = computed(() => PATRONES[this.indice() + 1] ?? null);
  /** Si su «haz» y su «evita» llevan dibujo (`escena-patron.component.ts`). */
  protected readonly conEscena = computed(() => PATRONES_CON_ESCENA.has(this.patron()?.clave ?? ''));

  /** La primera frase de un texto: lo que se ve de «Ya en el sistema»; el resto, en «La regla entera». */
  protected primeraFrase(texto: string): string {
    return partirEnFrase(texto).resumen;
  }
}
