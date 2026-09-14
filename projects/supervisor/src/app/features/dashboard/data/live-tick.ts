import type { DashboardMonitor, DashboardWidget } from './dashboard.types';

/**
 * Un «latido» de los datos de demostración: lo que cambiaría entre dos refrescos de un contact
 * center real. Los totales del día solo suben; lo que está pasando AHORA (en curso, en espera,
 * disponibles) sube o baja un poco. El original refresca intenciones y tipificaciones cada 60 s
 * (medido el 2026-09-14); aquí el latido es más corto para que la demo se vea viva.
 */
export function liveTick(monitor: DashboardMonitor, random: () => number = Math.random): DashboardMonitor {
  const step = (max: number) => Math.floor(random() * (max + 1));
  const drift = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value + Math.round((random() - 0.5) * 3)));

  const tickWidget = (w: DashboardWidget): DashboardWidget => {
    switch (w.kind) {
      case 'kpi-trend': {
        const value = drift(w.value, 0, w.value + 5);
        return { ...w, value, trend: [...w.trend.slice(1), value] };
      }
      case 'kpi-simple':
        return w.unit === 'percent' ? { ...w, value: drift(w.value, 0, 100) } : { ...w, value: w.value + step(1) };
      case 'agents-state':
        return { ...w, value: drift(w.value, 0, w.total) };
      case 'agents-table': {
        const lucky = Math.floor(random() * w.rows.length);
        return {
          ...w,
          rows: w.rows.map((r, i) =>
            i === lucky && r.presence === 'available'
              ? { ...r, conversations: r.conversations + 1, attended: r.attended + 1 }
              : r,
          ),
        };
      }
      case 'group-panel': {
        const newOnes = step(2);
        const lost = random() < 0.2 ? 1 : 0;
        return {
          ...w,
          onHold: drift(w.onHold, 0, 12),
          inProgress: drift(w.inProgress, 0, 40),
          available: drift(w.available, 0, w.connected),
          total: w.total + newOnes + lost,
          attended: w.attended + newOnes,
          notAttended: w.notAttended + lost,
          abandoned: w.abandoned + lost,
        };
      }
      case 'ranked-list': {
        const lucky = Math.floor(random() * w.items.length);
        return { ...w, items: w.items.map((it, i) => (i === lucky ? { ...it, total: it.total + step(2) } : it)) };
      }
    }
  };

  return {
    ...monitor,
    boxes: monitor.boxes.map((box) => ({
      ...box,
      slots: box.slots.map((slot) => (slot ? tickWidget(slot) : slot)),
    })),
  };
}
