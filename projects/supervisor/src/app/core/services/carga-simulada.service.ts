import { inject, Injectable, InjectionToken, signal, type Signal } from '@angular/core';

/**
 * CARGA SIMULADA: la espera que tendría una pantalla con servidor, para que se vea su esqueleto.
 *
 * El Supervisor no tiene backend: sus datos viven en el navegador y llegan al instante, así que el estado de carga no
 * se veía nunca. Con esto, la primera vez que se abre una pantalla en la pestaña sus datos «tardan» 1,5 s, dentro de la
 * franja de 1 a 3 s en la que DD-188 pide esqueleto. Al volver ya están, como en una app que guarda lo que pidió.
 *
 *   ?latencia=0   sin espera
 *   ?latencia=1   con espera, aunque la abra un navegador automático
 *
 * Sin espera en las pruebas: un navegador automático (`navigator.webdriver`, el de Playwright) no la tiene salvo con
 * `?latencia=1`, y TestBed tampoco, porque la enciende `app.config` y no este servicio.
 */
export const ESPERA_SIMULADA_MS = new InjectionToken<number>('ESPERA_SIMULADA_MS', { factory: () => 0 });

const ESPERA_DE_LA_DEMO_MS = 1500;

/** La espera de la demo, leída una vez al arrancar: manda la dirección; si no dice nada, un robot no espera. */
export function esperaDeLaDemo(): number {
  if (typeof window === 'undefined') return 0;
  const pedida = new URLSearchParams(window.location.search).get('latencia');
  if (pedida === '0') return 0;
  if (pedida === '1') return ESPERA_DE_LA_DEMO_MS;
  return navigator.webdriver ? 0 : ESPERA_DE_LA_DEMO_MS;
}

@Injectable({ providedIn: 'root' })
export class CargaSimuladaService {
  private readonly espera = inject(ESPERA_SIMULADA_MS);
  private readonly pedidas = new Set<string>();

  /** `true` mientras «llegan» los datos de `clave`, y solo la primera vez que se piden en la pestaña. */
  primeraVez(clave: string): Signal<boolean> {
    if (!this.espera || this.pedidas.has(clave)) return signal(false).asReadonly();
    this.pedidas.add(clave);
    const cargando = signal(true);
    setTimeout(() => cargando.set(false), this.espera);
    return cargando.asReadonly();
  }
}
