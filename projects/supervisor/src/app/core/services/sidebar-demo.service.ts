import { Injectable, signal } from '@angular/core';

/**
 * Fuerza el sidebar real a su ancho desplegado desde fuera, sin tocar su propio hover/foco.
 * Por defecto `false`: ninguna pantalla real lo toca, así que el sidebar se comporta exactamente
 * igual que hoy. Solo lo escribe `lab/tabla` para simular el ancho dentro del shell de verdad.
 */
@Injectable({ providedIn: 'root' })
export class SidebarDemoService {
  readonly forcedExpanded = signal(false);
}
