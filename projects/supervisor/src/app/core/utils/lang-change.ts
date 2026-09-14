import { inject, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';

/**
 * Idioma activo como señal, que cambia cuando las traducciones del idioma nuevo YA están cargadas
 * (`onLangChange`, no `LanguageService.lang`: esa cambia antes y `translate.instant()` aún devolvería el
 * idioma anterior).
 *
 * Para qué: un `computed()` que resuelve textos con `translate.instant()` (las cabeceras de una tabla) no se
 * entera de un cambio de idioma; el pipe `| translate` sí. LEERLA dentro del computed es lo que lo hace
 * reaccionar. Declararla y no leerla no hace nada: así estuvieron siete listas hasta el 2026-09-14, con las
 * cabeceras congeladas en el idioma de carga y `audit:datatables` en verde (ahora exige la lectura).
 *
 * Llamar en contexto de inyección (un campo o el constructor).
 */
export function injectLangChange(): Signal<string> {
  const translate = inject(TranslateService);
  return toSignal(translate.onLangChange.pipe(map((event) => event.lang)), {
    initialValue: translate.currentLang,
  });
}
