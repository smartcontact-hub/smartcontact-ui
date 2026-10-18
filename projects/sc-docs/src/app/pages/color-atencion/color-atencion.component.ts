import { LocationStrategy } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ScSelectButtonComponent, ScTagComponent } from '@smartcontact-hub/components';

import { PIEZAS_TOTAL } from './muestra/muestra.component';
import {
  BANDOS,
  CAMINO,
  CANDIDATOS,
  CARPETA,
  DALTONISMO_REFERENCIA,
  DECISIONES,
  HALLAZGOS,
  LECTORES,
  PANTALLAS,
  REGLAS,
  VEREDICTO,
  type Candidato,
} from './color-atencion.data';

interface Opcion {
  readonly label: string;
  readonly value: string;
}

/**
 * Lab · Color de atención. El estudio de qué color podría llevar el botón principal del Supervisor, cómo quedaría en el
 * resto de la interfaz y qué implica en los tokens. Es una PROPUESTA: nada de aquí está aplicado. Salió del barrido del
 * texto de acento del 2026-10-18 y de la comparación con 17 sistemas de diseño; las reglas viven también en el cuaderno
 * del producto.
 *
 * Cuatro bloques que se tocan: la tabla de candidatos (medidos), la muestra en vivo (un iframe que se mide solo), las
 * pantallas reales (capturas con antes y después) y las implicaciones en tokens.
 */
@Component({
  selector: 'app-color-atencion',
  imports: [ScSelectButtonComponent, ScTagComponent],
  templateUrl: './color-atencion.component.html',
  styleUrl: './color-atencion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorAtencionComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly locationStrategy = inject(LocationStrategy);

  protected readonly candidatos = CANDIDATOS;
  protected readonly veredicto = VEREDICTO;
  protected readonly referencia = DALTONISMO_REFERENCIA;
  protected readonly bandos = BANDOS;
  protected readonly hallazgos = HALLAZGOS;
  protected readonly lectores = LECTORES;
  protected readonly totalLectores = LECTORES.reduce((n, l) => n + l.cuantos, 0);
  protected readonly camino = CAMINO;
  protected readonly decisiones = DECISIONES;
  protected readonly reglas = REGLAS;
  protected readonly presentacion = `${CARPETA}/`;
  protected readonly piezas = PIEZAS_TOTAL;

  /* ── La muestra en vivo ── */
  protected readonly opcionesCandidato: readonly Opcion[] = CANDIDATOS.map((c) => ({ label: c.nombre, value: c.id }));
  protected readonly opcionesAlcance: readonly Opcion[] = [
    { label: 'Solo el botón', value: 'boton' },
    { label: 'Toda la variable', value: 'variable' },
  ];
  protected readonly opcionesTema: readonly Opcion[] = [
    { label: 'Claro', value: 'claro' },
    { label: 'Oscuro', value: 'oscuro' },
  ];
  protected readonly opcionesAcento: readonly Opcion[] = [
    { label: 'Acento como hoy', value: '0' },
    { label: 'Acento del mismo color', value: '1' },
  ];

  protected readonly muestraC = signal<unknown>('cian-400');
  protected readonly muestraAlcance = signal<unknown>('boton');
  protected readonly muestraTema = signal<unknown>('claro');
  protected readonly muestraAcento = signal<unknown>('0');
  protected readonly altoMuestra = signal(720);

  /** Cambiar los mandos solo cambia el hash del iframe: el router de dentro navega sin recargar la doc entera. */
  protected readonly muestraSrc = computed(() => {
    const tree = this.router.createUrlTree(['/color-de-atencion/muestra'], {
      queryParams: {
        solo: 1,
        c: this.muestraC(),
        alcance: this.muestraAlcance(),
        tema: this.muestraTema(),
        acento: this.muestraAcento(),
      },
    });
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(tree)),
    );
  });

  /* ── Las pantallas reales ── */
  protected readonly opcionesCaptura: readonly Opcion[] = CANDIDATOS.filter((c) => c.capturas && c.id !== 'hoy').map(
    (c) => ({ label: c.nombre, value: c.id }),
  );
  protected readonly opcionesPantalla: readonly Opcion[] = PANTALLAS.map((p) => ({ label: p.label, value: p.id }));

  protected readonly capC = signal<unknown>('cian-700');
  protected readonly capPantalla = signal<unknown>('alta');
  protected readonly capTema = signal<unknown>('claro');
  /** Arranca al 20 %: la barra lateral queda en «hoy» y los dos botones de la pantalla, ya con el candidato. */
  protected readonly corte = signal(20);

  /** En oscuro, el azul ya es el botón de hoy (DD-81): no hay captura aparte, las dos mitades son la misma. */
  protected readonly capIgual = computed(() => this.capC() === 'azul' && this.capTema() === 'oscuro');
  protected readonly capAntes = computed(() => `${CARPETA}/img/sup-${this.capPantalla()}-hoy-${this.capTema()}.jpg`);
  protected readonly capDespues = computed(() =>
    this.capIgual() ? this.capAntes() : `${CARPETA}/img/sup-${this.capPantalla()}-${this.capC()}-${this.capTema()}.jpg`,
  );
  protected readonly capCandidato = computed(() => CANDIDATOS.find((c) => c.id === this.capC()) ?? CANDIDATOS[0]);

  constructor() {
    const alRecibir = (e: MessageEvent): void => {
      if (e.origin !== location.origin || e.data?.tipo !== 'color-atencion-alto') return;
      const alto = Number(e.data.alto);
      if (Number.isFinite(alto) && alto > 0) this.altoMuestra.set(Math.ceil(alto));
    };
    window.addEventListener('message', alRecibir);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('message', alRecibir));
  }

  /** El índice de arriba baja a su sección sin tocar la URL: la doc enruta por hash y un ancla la rompería. */
  protected ir(id: string): void {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  protected paso(p: string): string {
    return `var(--sc-color-${p})`;
  }

  protected fmt(n: number, decimales = 2): string {
    return n.toFixed(decimales).replace('.', ',');
  }

  protected pasa(n: number, umbral: number): boolean {
    return n >= umbral;
  }

  /** Por encima de la referencia, separado; por debajo, se confunde más que éxito y aviso entre sí; por debajo de 0,05, igual. */
  protected nivelDaltonismo(c: Candidato): 'bien' | 'justo' | 'mal' | 'neutro' {
    const v = c.daltonismo.valor;
    if (v === null) return 'neutro';
    if (v >= this.referencia) return 'bien';
    return v >= 0.05 ? 'justo' : 'mal';
  }

  protected alCortar(e: Event): void {
    this.corte.set(Number((e.target as HTMLInputElement).value));
  }
}
