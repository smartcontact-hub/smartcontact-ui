import { Injectable, signal } from '@angular/core';

/**
 * Timers VIVOS del dashboard (como la web real): Active work time y Current status
 * time cuentan hacia arriba cada segundo. Semillas = valores capturados del sitio.
 */
@Injectable({ providedIn: 'root' })
export class AgTimersService {
  private activeSec = 24 * 60 + 29; // 00:24:29
  private statusSec = 4 * 60 + 18; //  00:04:18

  readonly active = signal(this.fmt(this.activeSec));
  readonly status = signal(this.fmt(this.statusSec));

  constructor() {
    setInterval(() => {
      this.activeSec += 1;
      this.statusSec += 1;
      this.active.set(this.fmt(this.activeSec));
      this.status.set(this.fmt(this.statusSec));
    }, 1000);
  }

  private fmt(total: number): string {
    const h = Math.floor(total / 3600);
    const m = Math.floor(total / 60) % 60;
    const s = total % 60;
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
  }
}
