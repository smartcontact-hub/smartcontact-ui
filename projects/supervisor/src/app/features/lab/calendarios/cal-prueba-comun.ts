import { type EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';

import { pruebaEnCurso } from '@core/prueba/prueba-arranque';
import { registrarPrueba } from '@core/prueba/prueba-ganchos';
import { corregirFestivo, FESTIVOS } from './cal-misiones';
import { activarDiscovery } from './cal-modo';
import { CalPruebaService, type Variante } from './cal-prueba.service';
import { CalStore } from './cal-store';

const esFestivo = (m: string): m is keyof typeof FESTIVOS => m in FESTIVOS;

/**
 * PROTOTIPO DE DISCOVERY: Horarios enchufado al modo prueba común (DD-256, prueba «horarios»).
 *
 * - La versión llega en la dirección (`?variante=A` separado, `?variante=B` junto) y manda sobre la que se eligió antes.
 * - Con una prueba en curso se enciende el modo discovery, para que Repositorios lleve a los Calendarios del prototipo.
 * - `reiniciar` deja los datos de partida de la tarea del festivo; `comprobar` corrige la gemela que tocó
 *   (`festivo-1`, 28 de enero; `festivo-2`, 7 de octubre), mire la versión que mire, porque las dos guardan en el mismo sitio.
 */
export function provideCalPruebaComun(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const v = new URLSearchParams(window.location.search).get('variante')?.toUpperCase();
    if (v === 'A' || v === 'B') inject(CalPruebaService).variante.set(v as Variante);
    if (pruebaEnCurso()) activarDiscovery();

    const store = inject(CalStore);
    // Un calendario cargado de periodos y días especiales, para ver cómo aguanta la pantalla. Nunca durante una prueba.
    if (new URLSearchParams(window.location.search).has('estres') && !pruebaEnCurso()) store.estresar();
    registrarPrueba({
      reiniciar: () => {
        activarDiscovery();
        store.reiniciar(1);
      },
      comprobar: (mision) => {
        if (!esFestivo(mision)) return { bien: 0, total: 0, titular: `Misión desconocida: ${mision}` };
        const { bien, total, titular } = corregirFestivo(FESTIVOS[mision], store.estado());
        return { bien, total, titular };
      },
    });
  });
}
