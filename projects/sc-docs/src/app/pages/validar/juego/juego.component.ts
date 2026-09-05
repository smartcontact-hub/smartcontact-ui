import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ValidarPracticaComponent } from '../practica.component';
import { estaDesbloqueado } from '../validar-gate';
import { CasoId, Resultado } from './juego.types';
import { NivelAnchoComponent } from './nivel-ancho.component';
import { NivelIdiomasComponent } from './nivel-idiomas.component';
import { NivelInspectorComponent } from './nivel-inspector.component';
import { NivelTrucosComponent } from './nivel-trucos.component';

/** Un caso del mapa. */
interface Caso {
  readonly id: CasoId;
  readonly n: number;
  readonly titulo: string;
  readonly sub: string;
  readonly misiones: number;
}

/** Lo que se guarda entre visitas. */
interface Guardado {
  readonly progreso: Partial<Record<CasoId, Resultado>>;
  readonly mejorRacha: number;
}

/** El aviso flotante tras cada respuesta. */
interface Aviso {
  readonly ok: boolean;
  readonly texto: string;
}

const STORAGE = 'sc-detective-v1';

/**
 * «Detective de píxeles»: el juego de la guía de validación.
 *
 * La guía enseña a mirar el inspector; esto obliga a practicarlo, en cinco casos que salen de
 * situaciones reales (el de «El ancho congelado» es el Contact Center del Supervisor, medido el
 * 2026-09-05 con la persona que iba a jugarlo delante). Está pensado para quien NO programa: en
 * cada misión se elige, se ve si era eso y, sobre todo, se lee el porqué.
 *
 * Este componente es el shell: portada, mapa de casos, marcador, racha, celebración y diploma. La
 * mecánica de cada caso vive en su propio componente (`nivel-*.component.*`), y el cuarto es el
 * simulador de tokens que ya existía (`practica.component.*`), que se conserva tal cual porque
 * sus lecturas son REALES (`getComputedStyle`) y costó siete defectos afinarlo.
 *
 * El progreso se guarda en `localStorage`: quien vuelve a la semana siguiente sigue donde estaba.
 * Si el almacenamiento falla (modo privado), se juega igual y no se guarda, sin más.
 */
@Component({
  selector: 'app-validar-juego',
  imports: [
    RouterLink,
    NivelInspectorComponent,
    NivelAnchoComponent,
    NivelIdiomasComponent,
    NivelTrucosComponent,
    ValidarPracticaComponent,
  ],
  templateUrl: './juego.component.html',
  styleUrl: './juego.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JuegoComponent {
  private readonly router = inject(Router);
  private avisoTimer: ReturnType<typeof setTimeout> | null = null;
  private celebraTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly casos: readonly Caso[] = [
    {
      id: 'inspector',
      n: 1,
      titulo: 'Abrir el inspector',
      sub: 'Dónde hacer clic, qué pestaña mirar y qué número leer.',
      misiones: 6,
    },
    {
      id: 'ancho',
      n: 2,
      titulo: 'El ancho congelado',
      sub: 'Un caso real: la tarjeta que no crecía ni encogía. Encuentra quién lo decide.',
      misiones: 6,
    },
    {
      id: 'idiomas',
      n: 3,
      titulo: 'Hablar los dos idiomas',
      sub: 'Figma dice Hug y Fill; el navegador lo dice de otra forma. Emparéjalos.',
      misiones: 6,
    },
    {
      id: 'puntos',
      n: 4,
      titulo: 'Los siete puntos',
      sub: 'Juzgar un componente entero: ¿sale todo de variables o hay algo a pelo?',
      misiones: 21,
    },
    {
      id: 'trucos',
      n: 5,
      titulo: 'Trucos del oficio',
      sub: 'Lo que ahorra media hora cada vez que abres el inspector.',
      misiones: 6,
    },
  ];

  protected readonly caso = signal<CasoId | null>(null);
  protected readonly progreso = signal<Partial<Record<CasoId, Resultado>>>({});
  protected readonly racha = signal(0);
  protected readonly mejorRacha = signal(0);
  protected readonly aviso = signal<Aviso | null>(null);
  protected readonly celebra = signal(false);
  /** El resultado del caso abierto, si ya se cerró en esta visita. */
  protected readonly cierre = signal<Resultado | null>(null);
  /** Aciertos del caso abierto que aún no se ha cerrado: el marcador no puede quedarse quieto. */
  protected readonly enCurso = signal(0);

  /** Índices para pintar el confeti; el color y el desfase salen del índice en el CSS. */
  protected readonly piezas = Array.from({ length: 28 }, (_, i) => i);

  protected readonly casoActual = computed(() => this.casos.find((c) => c.id === this.caso()) ?? null);
  protected readonly totalMisiones = computed(() => this.casos.reduce((n, c) => n + c.misiones, 0));
  protected readonly totalAciertos = computed(() =>
    Object.values(this.progreso()).reduce((n, r) => n + (r?.aciertos ?? 0), 0),
  );
  /**
   * Lo que enseña el HUD: los casos cerrados MÁS lo que se lleva del abierto. Si el abierto ya se
   * había cerrado antes y se está repitiendo, su resultado guardado se aparta mientras dura la
   * repetición: si no, se sumarían los dos.
   */
  protected readonly marcadorVivo = computed(() => {
    const abierto = this.caso();
    const cerrado = this.cierre();
    const guardado = abierto && !cerrado ? (this.progreso()[abierto]?.aciertos ?? 0) : 0;
    return this.totalAciertos() - guardado + (cerrado ? 0 : this.enCurso());
  });
  protected readonly hechos = computed(() => Object.keys(this.progreso()).length);
  protected readonly todoHecho = computed(() => this.hechos() === this.casos.length);
  protected readonly hayProgreso = computed(() => this.hechos() > 0 || this.mejorRacha() > 0);

  protected readonly siguienteCaso = computed(() => {
    const actual = this.casoActual();
    if (!actual) return null;
    // el siguiente que quede sin cerrar, empezando por el de después
    const orden = [...this.casos.slice(actual.n), ...this.casos.slice(0, actual.n - 1)];
    return orden.find((c) => !this.progreso()[c.id]) ?? null;
  });

  protected readonly rango = computed(() => {
    const pct = this.totalAciertos() / this.totalMisiones();
    if (pct >= 0.95) return 'Detective de píxeles';
    if (pct >= 0.75) return 'Inspector con oficio';
    if (pct >= 0.5) return 'Aprendiz con buen ojo';
    return 'Vuelve a la escena';
  });

  constructor() {
    if (!estaDesbloqueado()) {
      void this.router.navigateByUrl('/validar');
      return;
    }
    const g = this.cargar();
    this.progreso.set(g.progreso);
    this.mejorRacha.set(g.mejorRacha);
    effect(() => this.guardar({ progreso: this.progreso(), mejorRacha: this.mejorRacha() }));
  }

  // ── navegación ──

  protected abrir(id: CasoId): void {
    this.caso.set(id);
    this.cierre.set(null);
    this.racha.set(0);
    this.enCurso.set(0);
    window.scrollTo({ top: 0 });
  }

  protected volver(): void {
    this.caso.set(null);
    this.cierre.set(null);
    this.enCurso.set(0);
    window.scrollTo({ top: 0 });
  }

  protected reiniciarTodo(): void {
    this.progreso.set({});
    this.mejorRacha.set(0);
    this.racha.set(0);
    this.cierre.set(null);
  }

  // ── lo que devuelven los casos ──

  /** Cada respuesta: alimenta la racha y el aviso flotante. */
  protected tiro(ok: boolean): void {
    if (ok) {
      this.enCurso.update((n) => n + 1);
      this.racha.update((n) => n + 1);
      this.mejorRacha.update((m) => Math.max(m, this.racha()));
    } else {
      this.racha.set(0);
    }
    const bien = ['Bien visto', 'Eso es', 'Ojo de lince', 'Ahí está', 'Exacto'];
    const mal = ['No era eso', 'Casi', 'Mira el porqué', 'Esa no'];
    const lista = ok ? bien : mal;
    const texto = lista[(this.totalAciertos() + this.racha()) % lista.length];
    this.aviso.set({ ok, texto: ok && this.racha() >= 3 ? `${texto} · racha de ${this.racha()}` : texto });
    if (this.avisoTimer) clearTimeout(this.avisoTimer);
    this.avisoTimer = setTimeout(() => this.aviso.set(null), 1400);
  }

  /** Un caso terminado: se apunta, se celebra y se ofrece el siguiente. */
  protected cerrar(id: CasoId, r: Resultado): void {
    this.progreso.update((p) => ({ ...p, [id]: r }));
    this.cierre.set(r);
    this.enCurso.set(0);
    this.celebra.set(true);
    if (this.celebraTimer) clearTimeout(this.celebraTimer);
    this.celebraTimer = setTimeout(() => this.celebra.set(false), 2200);
  }

  // ── presentación ──

  protected estrellas(r: Resultado | undefined): number {
    if (!r) return 0;
    const pct = r.aciertos / r.total;
    return pct === 1 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0;
  }

  protected resultadoDe(id: CasoId): Resultado | undefined {
    return this.progreso()[id];
  }

  // ── persistencia ──

  private cargar(): Guardado {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return { progreso: {}, mejorRacha: 0 };
      const g = JSON.parse(raw) as Partial<Guardado>;
      return {
        progreso: g.progreso && typeof g.progreso === 'object' ? g.progreso : {},
        mejorRacha: typeof g.mejorRacha === 'number' ? g.mejorRacha : 0,
      };
    } catch {
      return { progreso: {}, mejorRacha: 0 };
    }
  }

  private guardar(g: Guardado): void {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(g));
    } catch {
      /* sin almacenamiento se juega igual; solo no se recuerda */
    }
  }
}
