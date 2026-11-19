import { ChangeDetectionStrategy, Component, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ScButtonComponent, ScTagComponent, ScTextareaComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import {
  csvDeResultados,
  ENSAYO,
  exito,
  informe,
  informeEnTexto,
  leerResultados,
  limpio,
  META,
  numeroDe,
  ordenDeVersiones,
  pSignos,
  UMBRAL,
  veredicto,
  type Gravedad,
  type PasoResultado,
  type Resultado,
} from './prueba.core.mjs';
import { ESTADO_PRUEBA, pruebaPorId, type PlanDePrueba } from './pruebas.data';

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

/** «5,5» y «83 %». */
const coma = (n: number): string => n.toLocaleString('es-ES', { maximumFractionDigits: 1 });
const pct = (n: number): string => `${Math.round(n * 100)} %`;

const GRAVEDAD: Record<Gravedad, { texto: string; severidad: 'danger' | 'warn' | 'secondary' }> = {
  alta: { texto: 'Grave', severidad: 'danger' },
  media: { texto: 'Importante', severidad: 'warn' },
  baja: { texto: 'Menor', severidad: 'secondary' },
};

/** Los accionables que se enseñan de entrada: el resto, en el informe que se copia. */
const ARREGLOS_A_LA_VISTA = 3;

/**
 * LA SALA DE UNA PRUEBA CON PERSONAS (DD-256), en el Lab. Sirve para cualquier prueba de `pruebas.data.ts`: no sabe
 * nada de Horarios. Lo mínimo que hace falta, en el orden en que se usa:
 *
 *   · el marcador: las versiones, cada una con su enlace, y en cuanto llegan resultados, cuánto se resuelve en cada
 *     una y quién gana;
 *   · las personas: un punto por persona que copia su enlace al pulsarlo y se rellena cuando llega su código;
 *   · la caja de los códigos, que los coge sola al pegarlos;
 *   · qué arreglar: los tres accionables más graves, con la cifra que los sostiene.
 *
 * Lo demás (las métricas con su sigla, persona a persona, la tarea y la regla) va plegado en «Todo el detalle», y el
 * informe entero se copia o se descarga en CSV para seguir trabajando con él. El veredicto y los accionables los
 * calcula `prueba.core.mjs`: esta página no decide nada, lo enseña.
 */
@Component({
  selector: 'app-prueba-control',
  imports: [RouterLink, ScButtonComponent, ScIconComponent, ScTagComponent, ScTextareaComponent],
  templateUrl: './prueba-control.component.html',
  styleUrl: './prueba-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PruebaControlComponent {
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);

  protected readonly plan = computed(() => pruebaPorId(this.params()?.get('id')));
  protected readonly estado = ESTADO_PRUEBA;
  protected readonly gravedad = GRAVEDAD;
  protected readonly tiempo = tiempo;
  protected readonly coma = coma;

  /** Lo que se ha ido pegando, por prueba. Si se cambia de prueba sin salir de la página, se carga la otra. */
  protected readonly resultados = linkedSignal<Resultado[]>(() => cargar(this.plan()?.id));
  protected readonly pegado = signal('');
  protected readonly aviso = signal('');
  /** El texto se queda mientras el aviso se va, para que no se encoja vacío al desvanecerse. */
  protected readonly avisoVisible = signal(false);
  protected readonly copiado = signal<string | null>(null);
  protected readonly arrastrando = signal(false);

  constructor() {
    effect(() => {
      const p = this.plan();
      if (p) guardar(p.id, this.resultados());
    });
  }

  private readonly personasReales = computed(() => this.resultados().filter((r) => r.participante !== ENSAYO));

  protected readonly veredicto = computed(() => {
    const p = this.plan();
    return p ? veredicto(p, this.personasReales()) : null;
  });

  protected readonly informe = computed(() => {
    const p = this.plan();
    return p ? informe(p, this.resultados()) : null;
  });

  /**
   * El marcador: cada versión con su letra, su enlace y, si ya hay datos, cuánto se resuelve bien y sin ayuda. Con una
   * sola versión no hay con qué compararla, y el marcador pasa a ser cada tarea frente a la meta.
   */
  protected readonly marcador = computed(() => {
    const p = this.plan();
    const v = this.veredicto();
    const inf = this.informe();
    if (!p || !v) return [];
    if (v.tareas) {
      return v.tareas.map((t, i) => {
        const m = inf?.tareas.find((x) => x.id === t.id)?.versiones[0] ?? null;
        return {
          id: t.id,
          letra: String(i + 1),
          nombre: t.titulo,
          url: p.versiones[0].url,
          limpias: t.limpias,
          intentos: t.intentos,
          proporcion: t.intentos ? t.limpias / t.intentos : 0,
          seq: m?.seq ?? null,
          tot: m?.tot ?? null,
          gana: t.cumple,
          sello: 'Cumple',
        };
      });
    }
    const unaTarea = inf?.tareas.length === 1 ? inf.tareas[0] : null;
    return p.versiones.map((ver, i) => {
      const r = v.resumen.find((x) => x.id === ver.id);
      const m = unaTarea?.versiones.find((x) => x.id === ver.id) ?? null;
      const intentos = r?.intentos ?? 0;
      return {
        id: ver.id,
        letra: ver.id.length <= 2 ? ver.id : String.fromCharCode(65 + i),
        nombre: ver.nombre,
        url: ver.url,
        limpias: r?.limpias ?? 0,
        intentos,
        proporcion: intentos ? (r?.limpias ?? 0) / intentos : 0,
        seq: m?.seq ?? null,
        tot: m?.tot ?? null,
        gana: v.ganadora === ver.id,
        sello: 'Gana',
      };
    });
  });

  /** Un punto por persona: copia su enlace al pulsarlo y se rellena cuando llega su código. */
  protected readonly personas = computed(() => {
    const p = this.plan();
    if (!p) return [];
    const recibidos = new Set(this.resultados().map((r) => r.participante));
    return Array.from({ length: p.personas }, (_, i) => {
      const quien = `P${i + 1}`;
      return { quien, orden: this.ordenEnNombres(p, quien), enlace: this.enlace(p, quien), recibido: recibidos.has(quien) };
    });
  });

  protected readonly recibidas = computed(() => this.personas().filter((f) => f.recibido).length);

  protected readonly enlaceEnsayo = computed(() => {
    const p = this.plan();
    return p ? this.enlace(p, ENSAYO) : '';
  });

  protected readonly arreglos = computed(() => (this.informe()?.hallazgos ?? []).slice(0, ARREGLOS_A_LA_VISTA));
  protected readonly arreglosDeMas = computed(() =>
    Math.max(0, (this.informe()?.hallazgos.length ?? 0) - ARREGLOS_A_LA_VISTA),
  );

  /** Las métricas con su sigla, por tarea: filas = métrica, columnas = versión. */
  protected readonly tablas = computed(() =>
    (this.informe()?.tareas ?? []).map((t) => ({
      titulo: t.titulo,
      versiones: t.versiones.map((m) => m.nombre),
      filas: [
        {
          sigla: 'TSR',
          nombre: 'Task Success Rate: bien y sin ayuda (con ayuda cuenta como fallo), con su intervalo del 95 %',
          valores: t.versiones.map((m) =>
            m.tsr ? `${m.tsr.exitos} de ${m.n} (${pct(m.tsr.ic[0])}–${pct(m.tsr.ic[1])})` : '—',
          ),
        },
        {
          sigla: 'ToT',
          nombre: 'Time on Task: media geométrica del tiempo de lo que salió bien',
          valores: t.versiones.map((m) => (m.tot === null ? '—' : tiempo(m.tot * 1000))),
        },
        {
          sigla: 'SEQ',
          nombre: 'Single Ease Question: facilidad de 1 a 7; la media del sector es 5,5',
          valores: t.versiones.map((m) => (m.seq === null ? '—' : coma(m.seq))),
        },
        {
          sigla: 'FCS',
          nombre: 'First Click Success: primer clic igual al del ensayo',
          valores: t.versiones.map((m) => (m.fcs ? pct(m.fcs.pct) : '—')),
        },
        {
          sigla: 'Lostness',
          nombre: 'Lostness: 0 es ir derecho; más de 0,4, perderse. Sale del ensayo',
          valores: t.versiones.map((m) => (m.lostness === null ? '—' : coma(m.lostness))),
        },
        {
          sigla: 'Ayuda',
          nombre: 'Intentos en los que pidieron ayuda',
          valores: t.versiones.map((m) => (m.ayuda === null ? '—' : pct(m.ayuda))),
        },
        {
          sigla: 'Clics en vacío',
          nombre: 'Clics en algo que no hace nada',
          valores: t.versiones.map((m) => String(m.enVacio)),
        },
        {
          sigla: 'Preferencia',
          nombre: 'Personas que se quedarían con ella',
          valores: t.versiones.map((m) => String(m.preferida)),
        },
      ],
    })),
  );

  /** Lo de cada persona, paso a paso: para entender el porqué de una cifra. */
  protected readonly detalle = computed(() => {
    const p = this.plan();
    if (!p) return [];
    const nombre = (id: string | null | undefined): string | null =>
      id ? (p.versiones.find((v) => v.id === id)?.nombre ?? id) : null;
    return this.resultados().map((r) => ({
      quien: r.participante,
      esEnsayo: r.participante === ENSAYO,
      orden: this.ordenEnNombres(p, r.participante),
      prefiere: r.preferencia
        ? r.preferencia.version
          ? `prefiere ${nombre(r.preferencia.version)}`
          : 'le da igual'
        : null,
      porque: r.preferencia?.porque ?? '',
      pasos: r.pasos.map((paso) => this.pasoLegible(paso, nombre(paso.version) ?? paso.version)),
    }));
  });

  /** Con una sola versión: la meta de cada tarea, en porcentaje. */
  protected readonly porcentajeMeta = computed(() => `${Math.round((this.plan()?.meta ?? META) * 100)} %`);

  /** Lo que hace falta para que una diferencia cuente con las personas de esta prueba, sacado de la propia regla. */
  protected readonly hacenFalta = computed(() => {
    const n = this.plan()?.personas ?? 0;
    if (this.plan()?.versiones.length === 1) {
      const meta = this.plan()?.meta ?? META;
      return `Con ${n} personas, cumple desde ${Math.ceil(meta * n - 1e-9)} de ${n} en cada tarea.`;
    }
    const pares: string[] = [];
    for (let b = 0; b < n; b++) {
      let a = b + 1;
      while (a + b <= n && pSignos(a, b) >= UMBRAL) a++;
      if (a + b > n) break;
      pares.push(`${a} a ${b}`);
    }
    return pares.length
      ? `Con ${n} personas, una diferencia cuenta desde ${pares.join(' o ')}, sin contar a quien le sale igual en todas; si no, es empate y decide lo que visteis.`
      : `Con ${n} personas ninguna diferencia llega a contar: decide lo que visteis.`;
  });

  /** Coge los códigos en cuanto se pegan: no hace falta ningún botón. */
  protected alEscribir(texto: string): void {
    this.pegado.set(texto);
    const leidos = leerResultados(texto);
    // Se vacía en el turno siguiente: si no, la caja pasaría de '' a '' y se quedaría con el texto pegado a la vista.
    if (leidos.length) this.incorporar(leidos, () => setTimeout(() => this.pegado.set('')));
    else if (texto.includes('SCP1')) this.avisar('Ese código viene cortado: pide que lo copien otra vez');
  }

  /** Los `.json` que descarga cada persona en la última pantalla, por si el código no cabe en el chat. */
  protected async subir(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    await this.leerFicheros(Array.from(input.files ?? []));
    input.value = '';
  }

  protected async soltar(ev: DragEvent): Promise<void> {
    ev.preventDefault();
    this.arrastrando.set(false);
    await this.leerFicheros(Array.from(ev.dataTransfer?.files ?? []));
  }

  protected sobre(ev: DragEvent, dentro: boolean): void {
    ev.preventDefault();
    this.arrastrando.set(dentro);
  }

  protected quitar(quien: string): void {
    this.resultados.update((rs) => rs.filter((r) => r.participante !== quien));
    this.avisar(`Quitado: ${quien === ENSAYO ? 'el ensayo' : quien}`);
  }

  protected async copiar(texto: string, clave: string, aviso: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      this.copiado.set(clave);
      this.avisar(aviso);
      setTimeout(() => this.copiado.update((c) => (c === clave ? null : c)), 1600);
    } catch {
      this.avisar('No se pudo copiar: el navegador no deja usar el portapapeles');
    }
  }

  protected copiarTodos(): void {
    const texto = this.personas()
      .map((f) => `${f.quien}: ${f.enlace}`)
      .join('\n');
    void this.copiar(texto, 'todos', 'Copiados los enlaces de todas las personas');
  }

  protected copiarInforme(): void {
    const p = this.plan();
    const inf = this.informe();
    const v = this.veredicto();
    if (p && inf && v) void this.copiar(informeEnTexto(p, inf, v), 'informe', 'Informe copiado, listo para pegar');
  }

  protected descargarCsv(): void {
    const p = this.plan();
    if (!p) return;
    const datos = new Blob([`\uFEFF${csvDeResultados(p, this.resultados())}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(datos);
    a.download = `prueba-${p.id}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private temporizador: ReturnType<typeof setTimeout> | undefined;

  /** El aviso sale abajo y se va solo: confirma lo que acabas de hacer sin quedarse ocupando sitio. */
  private avisar(texto: string): void {
    this.aviso.set(texto);
    this.avisoVisible.set(true);
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.avisoVisible.set(false), 3200);
  }

  private async leerFicheros(ficheros: File[]): Promise<void> {
    if (!ficheros.length) return;
    const textos = await Promise.all(ficheros.map((f) => f.text()));
    this.incorporar(textos.flatMap((t) => leerResultados(t)));
  }

  private incorporar(leidos: Resultado[], alAnadir?: () => void): void {
    const p = this.plan();
    if (!p) return;
    const propios = leidos.filter((r) => r.prueba === p.id);
    if (!propios.length) {
      this.avisar(
        leidos.length
          ? `Ese código es de otra prueba («${leidos[0].prueba}»): pégalo en la suya`
          : 'No encuentro ningún código en lo que has pegado: empiezan por SCP1',
      );
      return;
    }
    this.resultados.update((rs) => juntar(rs, propios));
    alAnadir?.();
    const quienes = propios.map((r) => (r.participante === ENSAYO ? 'el ensayo' : r.participante));
    this.avisar(`Añadido: ${quienes.join(', ')}`);
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
    const resultado: { texto: string; severidad: 'success' | 'danger' | 'warn' | 'secondary' } =
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
      resultado,
      falta:
        paso.comprobacion && paso.comprobacion.bien < paso.comprobacion.total
          ? (paso.comprobacion.titular ?? null)
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
