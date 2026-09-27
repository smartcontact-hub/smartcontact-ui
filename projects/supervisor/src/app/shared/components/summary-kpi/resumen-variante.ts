import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

/** Las superficies que se comparan: A, neutra con elevación; B, con el tinte de marca. */
export type ResumenVariante = 'a' | 'b';

/**
 * PROTOTIPO para comparar, no para fundir: `?resumen=a|b` enseña el resumen como widget con esa superficie;
 * sin el parámetro, el resumen de hoy. Así la misma vista previa sirve para ver las tres cosas, y las e2e
 * siguen midiendo el de hoy. `?cuenta=cambio` apaga la cuenta al abrir (solo cuenta al cambiar), para
 * comparar los dos movimientos.
 */
@Injectable({ providedIn: 'root' })
export class ResumenVarianteService {
  private readonly router = inject(Router);
  private readonly params = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.parseUrl(this.router.url).queryParamMap),
    ),
    { initialValue: this.router.parseUrl(this.router.url).queryParamMap },
  );

  variante(): ResumenVariante | null {
    const v = this.params().get('resumen');
    return v === 'a' || v === 'b' ? v : null;
  }

  /** Si la cifra cuenta también al abrir la ficha (por defecto) o solo al cambiar. */
  cuentaAlAbrir(): boolean {
    return this.params().get('cuenta') !== 'cambio';
  }
}
