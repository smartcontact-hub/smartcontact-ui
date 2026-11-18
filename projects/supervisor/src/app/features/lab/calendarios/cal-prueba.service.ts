import { DestroyRef, DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { type Correccion, corregir, type Mision } from './cal-misiones';
import { activarDiscovery } from './cal-modo';
import { CalStore } from './cal-store';

export type Variante = 'A' | 'B';

export interface Sesion {
  readonly participante: string;
  readonly variante: Variante;
  readonly mision: Mision;
  readonly inicio: number;
  readonly fin: number | null;
  readonly clics: number;
  readonly saltos: number;
  readonly ayudas: number;
  readonly resultado: Correccion | null;
}

const CLAVE = 'sc-cal-prueba-sesiones-v1';

function leer<T>(clave: string, defecto: T): T {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? (JSON.parse(crudo) as T) : defecto;
  } catch {
    return defecto;
  }
}

function escribir(clave: string, valor: unknown): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* Sin almacenamiento, la prueba sigue en memoria. */
  }
}

/** «2:05». */
export const reloj = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * PROTOTIPO DE DISCOVERY: el modo prueba. Quien modera elige la variante (A separado, B junto) y la misión, pulsa
 * «Empezar» y la persona trabaja; se cuentan los clics (fuera de esta barra), los saltos de pantalla y las veces que
 * pide ayuda. Al terminar se corrige lo que ha montado contra lo que pedía la misión, día a día.
 */
@Injectable({ providedIn: 'root' })
export class CalPruebaService {
  private readonly store = inject(CalStore);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  readonly variante = signal<Variante>(leer<Variante>(`${CLAVE}-variante`, 'A'));
  readonly mision = signal<Mision>(leer<Mision>(`${CLAVE}-mision`, 1));
  readonly participante = signal(leer(`${CLAVE}-participante`, ''));
  readonly activa = signal<Sesion | null>(leer<Sesion | null>(`${CLAVE}-activa`, null));
  readonly historial = signal<readonly Sesion[]>(leer<Sesion[]>(CLAVE, []));
  /** La última terminada, para enseñar su resultado. */
  readonly ultima = signal<Sesion | null>(null);
  readonly ahora = signal(Date.now());

  constructor() {
    effect(() => escribir(`${CLAVE}-variante`, this.variante()));
    effect(() => escribir(`${CLAVE}-mision`, this.mision()));
    effect(() => escribir(`${CLAVE}-participante`, this.participante()));
    effect(() => escribir(`${CLAVE}-activa`, this.activa()));
    effect(() => escribir(CLAVE, this.historial()));

    const contar = (ev: Event): void => {
      if (!this.activa()) return;
      const t = ev.target as Element | null;
      if (t?.closest?.('[data-prueba]')) return;
      this.activa.update((s) => (s ? { ...s, clics: s.clics + 1 } : s));
    };
    this.document.addEventListener('click', contar, true);
    const tic = setInterval(() => this.activa() && this.ahora.set(Date.now()), 1000);
    const nav = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.activa.update((s) => (s ? { ...s, saltos: s.saltos + 1 } : s));
    });
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('click', contar, true);
      clearInterval(tic);
      nav.unsubscribe();
    });
  }

  empezar(): void {
    activarDiscovery();
    this.store.reiniciar(this.mision());
    this.ultima.set(null);
    // El salto a Repositorios suma uno: se empieza en -1 para que la cuenta sea la de la persona.
    this.activa.set({
      participante: this.participante().trim(),
      variante: this.variante(),
      mision: this.mision(),
      inicio: Date.now(),
      fin: null,
      clics: 0,
      saltos: -1,
      ayudas: 0,
      resultado: null,
    });
    this.ahora.set(Date.now());
    void this.router.navigateByUrl('/admin/repositorios');
  }

  pedirAyuda(): void {
    this.activa.update((s) => (s ? { ...s, ayudas: s.ayudas + 1 } : s));
  }

  terminar(): void {
    const s = this.activa();
    if (!s) return;
    const hecha: Sesion = { ...s, saltos: Math.max(0, s.saltos), fin: Date.now(), resultado: corregir(s.mision, this.store.estado()) };
    this.historial.update((h) => [...h, hecha]);
    this.activa.set(null);
    this.ultima.set(hecha);
  }

  cancelar(): void {
    this.activa.set(null);
  }

  /** Corrige lo que hay ahora sin parar el reloj (para que quien modera mire cómo va). */
  corregirAhora(): Correccion {
    return corregir(this.mision(), this.store.estado());
  }

  borrarHistorial(): void {
    this.historial.set([]);
  }

  /** El historial en CSV, para pegarlo en una hoja. */
  csv(): string {
    const filas = this.historial().map((s) =>
      [
        s.participante,
        s.variante,
        s.mision,
        new Date(s.inicio).toISOString(),
        Math.round(((s.fin ?? s.inicio) - s.inicio) / 1000),
        s.clics,
        s.saltos,
        s.ayudas,
        s.resultado?.bien ?? '',
        s.resultado?.total ?? '',
      ].join(';'),
    );
    return ['participante;variante;mision;inicio;segundos;clics;saltos;ayudas;bien;total', ...filas].join('\n');
  }
}
