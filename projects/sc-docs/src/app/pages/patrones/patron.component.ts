import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import { ScIconComponent } from '@smartcontact-hub/icons';
import { ScSkeletonComponent } from '@smartcontact-hub/components';

import { PATRONES } from './patrones-datos';

/**
 * Fundamentos → Patrones → un patrón, en su página (`/fundamentos/patrones/carga`), como los de Primer: el título, lo
 * que se hace y lo que se evita lado a lado, con qué del sistema ya se resuelve y, al pie, el anterior y el siguiente.
 * Los textos son los de siempre (`fundamentos.patterns.principles.<clave>`); lo que cambia es que cada uno se lee solo.
 *
 * El de carga lleva su ejemplo vivo: el único patrón donde un visual enseña más que el texto. Los demás son reglas y se
 * quedan en texto a propósito (meterles un dibujo sería el ruido que esta misma barra combate).
 */
@Component({
  selector: 'app-patron',
  standalone: true,
  imports: [RouterLink, ScIconComponent, ScSkeletonComponent, TranslatePipe],
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
}
