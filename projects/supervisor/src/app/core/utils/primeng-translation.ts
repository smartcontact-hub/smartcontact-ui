import type { Translation } from 'primeng/api';

/**
 * Textos internos de PrimeNG (calendario) para el idioma activo.
 *
 * POR QUÉ. Hasta el 2026-09-14 la app no le pasaba idioma a PrimeNG, así que su calendario salía
 * en inglés («September», semana empezando en domingo) dentro de una interfaz en español.
 *
 * Los nombres de meses y días y el primer día de la semana los da el NAVEGADOR (`Intl`) para la
 * etiqueta BCP-47 del idioma: no hay listas de nombres escritas a mano que mantener en cuatro
 * idiomas. Lo que `Intl` no sabe («Hoy», «Limpiar», la cabecera de semana) sale del i18n de la
 * app (`primeng.*`).
 */
export function primengTranslation(locale: string, t: (key: string) => string): Translation {
  const names = (options: Intl.DateTimeFormatOptions, count: number, at: (i: number) => Date) => {
    const fmt = new Intl.DateTimeFormat(locale, options);
    return Array.from({ length: count }, (_, i) => fmt.format(at(i)));
  };
  // 2023-01-01 fue domingo: `i` días después recorre la semana empezando en domingo, que es el
  // orden que espera PrimeNG para `dayNames*`.
  const day = (i: number) => new Date(2023, 0, 1 + i);
  const month = (i: number) => new Date(2023, i, 1);

  return {
    dayNames: names({ weekday: 'long' }, 7, day),
    dayNamesShort: names({ weekday: 'short' }, 7, day),
    dayNamesMin: names({ weekday: 'narrow' }, 7, day),
    monthNames: names({ month: 'long' }, 12, month),
    monthNamesShort: names({ month: 'short' }, 12, month),
    firstDayOfWeek: firstDayOfWeek(locale),
    today: t('primeng.today'),
    clear: t('primeng.clear'),
    weekHeader: t('primeng.week_header'),
  };
}

/** `Intl` numera 1 = lunes … 7 = domingo; PrimeNG, 0 = domingo … 6 = sábado. */
function firstDayOfWeek(locale: string): number {
  try {
    const info = (
      new Intl.Locale(locale) as Intl.Locale & {
        getWeekInfo?: () => { firstDay: number };
        weekInfo?: { firstDay: number };
      }
    );
    const first = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay;
    return first === undefined ? 1 : first % 7;
  } catch {
    return 1;
  }
}
