import { ChangeDetectionStrategy, Component, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ScButtonComponent, ScIconTileComponent, ScTagComponent, ScTextareaComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import {
  exito,
  leerResultados,
  limpio,
  numeroDe,
  ordenDeVersiones,
  pSignos,
  UMBRAL,
  veredicto,
  type PasoResultado,
  type Resultado,
} from './prueba.core.mjs';
import { ESTADO_PRUEBA, pruebaPorId, type EstadoPrueba, type PlanDePrueba } from './pruebas.data';

/** El participante del ensayo: quien modera la hace antes que nadie, y su resultado se ve pero no cuenta. */
const ENSAYO = 'ensayo';

/** Lo que se ha pegado de cada prueba, en ESTE navegador: los códigos no van al repo (es público). */
const claveDe = (id: string): string => `sc-prueba-resultados-${id}`;

function cargar(id: string | undefined): Resultado[] {
  if (!id) return [];
  try {
    const crudo = globalThis.localStorage?.getItem(claveDe(id));
    const leidos: unknown = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(leidos) ? (leidos as Resultado[]) : [];
  } catch {
    return [];
  }
}

function guardar(id: string, resultados: readonly Resultado[]): void {
  try {
    globalThis.localStorage?.setItem(claveDe(id), JSON.stringify(resultados));
  } catch {
    // Ventana privada o datos bloqueados: lo pegado vale mientras la página siga abierta.
  }
}

/** Una persona, una vez: si manda el código dos veces, vale el último. Por orden: P1, P2… y el ensayo al final. */
function juntar(antes: readonly Resultado[], nuevos: readonly Resultado[]): Resultado[] {
  const porPersona = new Map(antes.map((r) => [r.participante, r]));
  for (const r of nuevos) porPersona.set(r.participante, r);
  const orden = (r: Resultado): number => (r.participante === ENSAYO ? Infinity : numeroDe(r.participante));
  return [...porPersona.values()].sort((a, b) => orden(a) - orden(b));
}

/** «45 s», «1 min 20 s». */
function tiempo(ms: number | null): string {
  if (ms === null) return '—';
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ''}`;
}

const SEVERIDAD: Record<EstadoPrueba, 'secondary' | 'warn' | 'success'> = {
  preparada: 'secondary',
  'en-curso': 'warn',
  decidida: 'success',
};

/**
 * LA SALA DE CONTROL DE UNA PRUEBA CON USUARIOS (DD-256), en el Lab: los enlaces de cada persona, lo que hace quien
 * modera y el veredicto con lo que van mandando. El orden de la página es el de la prueba: mandar, acompañar, pegar.
 *
 * El veredicto lo da `prueba.core.mjs` con la regla de siempre (éxito sin ayuda, facilidad, tiempo, preferencia; y
 * solo cuenta si casi todas las personas apuntan al mismo lado). Esta página no decide nada: lo enseña.
 */
@Component({
  selector: 'app-prueba-control',
  imports: [RouterLink, ScButtonComponent, ScIconComponent, ScIconTileComponent, ScTagComponent, ScTextareaComponent],
  templateUrl: './prueba-control.component.html',
  styleUrl: './prueba-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PruebaControlComponent {
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);

  protected readonly plan = computed(() => pruebaPorId(this.params()?.get('id')));
  protected readonly estado = ESTADO_PRUEBA;
  protected readonly severidad = SEVERIDAD;
  protected readonly ensayo = ENSAYO;
  protected readonly tiempo = tiempo;
  protected readonly ordinales = ['primera', 'segunda', 'tercera', 'cuarta'];
  /** «5,5»: la mediana de la facilidad puede caer entre dos. */
  protected readonly num = (n: number): string => n.toLocaleString('es-ES', { maximumFractionDigits: 1 });

  /**
   * Lo que hace falta para que una diferencia cuente con las personas de esta prueba, sacado de la propia regla: con 6,
   * «5 a 0»; con 8, «5 a 0 o 7 a 1». A quien le sale igual en las dos no cuenta.
   */
  protected readonly hacenFalta = computed(() => {
    const n = this.plan()?.personas ?? 0;
    const pares: string[] = [];
    for (let b = 0; b < n; b++) {
      let a = b + 1;
      while (a + b <= n && pSignos(a, b) >= UMBRAL) a++;
      if (a + b > n) break;
      pares.push(`${a} a ${b}`);
    }
    const base = 'Con tan pocas personas, una diferencia solo cuenta si casi todas apuntan al mismo lado';
    return pares.length
      ? `${base}: con ${n}, al menos ${pares.join(' o ')}, sin contar a quien le sale igual en las dos.`
      : `${base}, y con ${n} no llega a contar ninguna.`;
  });

  /** Lo que se ha ido pegando, por prueba. Si se cambia de prueba sin salir de la página, se carga la otra. */
  protected readonly resultados = linkedSignal<Resultado[]>(() => cargar(this.plan()?.id));
  protected readonly pegado = signal('');
  protected readonly aviso = signal('');
  protected readonly copiado = signal<string | null>(null);

  constructor() {
    effect(() => {
      const p = this.plan();
      if (p) guardar(p.id, this.resultados());
    });
  }

  /** El enlace de cada persona, con el orden en que le tocan las versiones (cambia de una a otra a propósito). */
  protected readonly personas = computed(() => {
    const p = this.plan();
    if (!p) return [];
    const recibidos = new Set(this.resultados().map((r) => r.participante));
    return Array.from({ length: p.personas }, (_, i) => {
      const quien = `P${i + 1}`;
      return { quien, orden: this.ordenEnNombres(p, quien), enlace: this.enlace(p, quien), recibido: recibidos.has(quien) };
    });
  });

  protected readonly enlaceEnsayo = computed(() => {
    const p = this.plan();
    return p ? this.enlace(p, ENSAYO) : '';
  });

  /** Lo que dicen los datos. El ensayo se ve abajo, pero no cuenta. */
  protected readonly veredicto = computed(() => {
    const p = this.plan();
    return p ? veredicto(p, this.resultados().filter((r) => r.participante !== ENSAYO)) : null;
  });

  /** Lo de cada persona, paso a paso: para entender el porqué de una cifra, no para contarlo otra vez. */
  protected readonly detalle = computed(() => {
    const p = this.plan();
    if (!p) return [];
    const nombre = (id: string | null | undefined): string | null =>
      id ? (p.versiones.find((v) => v.id === id)?.nombre ?? id) : null;
    return this.resultados().map((r) => ({
      quien: r.participante,
      esEnsayo: r.participante === ENSAYO,
      orden: this.ordenEnNombres(p, r.participante),
      prefiere: r.preferencia ? (nombre(r.preferencia.version) ?? 'Le da igual') : null,
      porque: r.preferencia?.porque ?? '',
      pasos: r.pasos.map((paso) => this.pasoLegible(paso, nombre(paso.version) ?? paso.version)),
    }));
  });

  protected anadirPegado(): void {
    this.incorporar(leerResultados(this.pegado()), () => this.pegado.set(''));
  }

  /** Los `.json` que descarga cada persona en la última pantalla, por si el código no cabe en el chat. */
  protected async subir(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const ficheros = Array.from(input.files ?? []);
    const textos = await Promise.all(ficheros.map((f) => f.text()));
    input.value = '';
    this.incorporar(textos.flatMap((t) => leerResultados(t)));
  }

  protected quitar(quien: string): void {
    this.resultados.update((rs) => rs.filter((r) => r.participante !== quien));
    this.aviso.set(`Quitado: ${quien}.`);
  }

  protected async copiar(texto: string, clave: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      this.copiado.set(clave);
      setTimeout(() => this.copiado.update((c) => (c === clave ? null : c)), 2000);
    } catch {
      // Sin portapapeles: el enlace se ve entero en la fila y se puede seleccionar.
    }
  }

  protected copiarTodos(): void {
    const texto = this.personas()
      .map((f) => `${f.quien}: ${f.enlace}`)
      .join('\n');
    void this.copiar(texto, 'todos');
  }

  private incorporar(leidos: Resultado[], alAnadir?: () => void): void {
    const p = this.plan();
    if (!p) return;
    const propios = leidos.filter((r) => r.prueba === p.id);
    if (!propios.length) {
      this.aviso.set(
        leidos.length
          ? `Ese código es de otra prueba («${leidos[0].prueba}»). Pégalo en la suya.`
          : 'No encuentro ningún código en lo que has pegado. Empieza por SCP1.',
      );
      return;
    }
    this.resultados.update((rs) => juntar(rs, propios));
    alAnadir?.();
    this.aviso.set(`Añadido: ${propios.map((r) => r.participante).join(', ')}.`);
  }

  private enlace(p: PlanDePrueba, quien: string): string {
    return `${location.origin}${location.pathname}#/prueba/${p.id}/${quien}`;
  }

  private ordenEnNombres(p: PlanDePrueba, quien: string): string {
    return ordenDeVersiones(p, quien)
      .map((id) => p.versiones.find((v) => v.id === id)?.nombre ?? id)
      .join(' → ');
  }

  private pasoLegible(paso: PasoResultado, nombre: string) {
    const ok = exito(paso);
    const sinAyuda = limpio(paso);
    const veredicto: { texto: string; severidad: 'success' | 'danger' | 'warn' | 'secondary' } =
      ok === null
        ? { texto: 'Sin corregir', severidad: 'secondary' }
        : !ok
          ? { texto: paso.moderador === 'medias' ? 'A medias' : 'Mal', severidad: 'danger' }
          : sinAyuda
            ? { texto: 'Bien', severidad: 'success' }
            : { texto: 'Bien, con ayuda', severidad: 'warn' };
    return {
      nombre,
      mision: paso.mision,
      veredicto,
      comprobacion: paso.comprobacion
        ? (paso.comprobacion.titular ?? `${paso.comprobacion.bien} de ${paso.comprobacion.total} comprobaciones`)
        : null,
      tiempo: tiempo(paso.ms),
      clics: paso.clics,
      primerClic: paso.primerClic,
      enVacio: paso.enVacio,
      pantallas: paso.pantallas,
      ayudas: paso.ayudas.map((a) => `a los ${tiempo(a.ms)}, en ${a.pantalla}`),
      facilidad: paso.facilidad,
    };
  }
}
