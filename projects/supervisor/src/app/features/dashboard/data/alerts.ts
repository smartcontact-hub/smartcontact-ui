import type { DashboardWidget } from './dashboard.types';

export type AlertLevel = 'warning' | 'danger';

export interface WidgetAlert {
  readonly level: AlertLevel;
  /** Clave i18n del motivo, con sus parámetros: «5 en espera», «Nivel de servicio al 58 %». */
  readonly reasonKey: string;
  readonly params: Readonly<Record<string, number>>;
  /** Forma corta para una tarjeta estrecha («6», «58 %»): la cifra, sin la frase. */
  readonly shortKey: string;
}

/*
 * Umbrales de alerta. El Supervisor real no avisa de nada: hay que leer cada cifra. Estos cortes
 * son los habituales de un contact center y viven aquí juntos para cambiarlos en un sitio; si
 * producto tiene los suyos (o se hacen configurables por widget), se sustituyen aquí.
 */
export const ALERT_THRESHOLDS = {
  /** Conversaciones en espera. */
  onHold: { warning: 5, danger: 8 },
  /** Nivel de servicio o de atención, en %: por DEBAJO de estos valores. */
  level: { warning: 80, danger: 60 },
  /** Proporción de agentes disponibles sobre conectados: por DEBAJO. */
  availableRatio: { warning: 0.3 },
} as const;

const worst = (alerts: (WidgetAlert | null)[]): WidgetAlert | null =>
  alerts.filter((a): a is WidgetAlert => a !== null).sort((a, b) => (a.level === b.level ? 0 : a.level === 'danger' ? -1 : 1))[0] ??
  null;

function onHoldAlert(value: number): WidgetAlert | null {
  const t = ALERT_THRESHOLDS.onHold;
  if (value >= t.danger) return { level: 'danger', reasonKey: 'dashboard.alerts.on_hold', params: { n: value }, shortKey: 'dashboard.alerts.short_count' };
  if (value >= t.warning) return { level: 'warning', reasonKey: 'dashboard.alerts.on_hold', params: { n: value }, shortKey: 'dashboard.alerts.short_count' };
  return null;
}

function levelAlert(value: number, reasonKey: string): WidgetAlert | null {
  const t = ALERT_THRESHOLDS.level;
  if (value < t.danger) return { level: 'danger', reasonKey, params: { n: value }, shortKey: 'dashboard.alerts.short_percent' };
  if (value < t.warning) return { level: 'warning', reasonKey, params: { n: value }, shortKey: 'dashboard.alerts.short_percent' };
  return null;
}

/** La alerta más grave de un widget, ya filtrado (lo que el supervisor está viendo), o `null`. */
export function alertFor(widget: DashboardWidget): WidgetAlert | null {
  switch (widget.type) {
    case 'groups-on-hold':
      return widget.kind === 'kpi-trend' ? onHoldAlert(widget.value) : null;
    case 'groups-service-level':
      return widget.kind === 'kpi-simple' ? levelAlert(widget.value, 'dashboard.alerts.service_level') : null;
    case 'groups':
      return widget.kind === 'group-panel'
        ? worst([
            onHoldAlert(widget.onHold),
            levelAlert(widget.serviceLevel, 'dashboard.alerts.service_level'),
            levelAlert(widget.attentionLevel, 'dashboard.alerts.attention_level'),
          ])
        : null;
    case 'agents-available':
      if (widget.kind !== 'agents-state' || !widget.total) return null;
      if (widget.value === 0) return { level: 'danger', reasonKey: 'dashboard.alerts.no_available', params: { n: 0 }, shortKey: 'dashboard.alerts.short_count' };
      return widget.value / widget.total < ALERT_THRESHOLDS.availableRatio.warning
        ? { level: 'warning', reasonKey: 'dashboard.alerts.few_available', params: { n: widget.value }, shortKey: 'dashboard.alerts.short_count' }
        : null;
    default:
      return null;
  }
}
