import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

/** Las siete dimensiones que la guía enseña a validar. */
type DimId =
  | 'tamano'
  | 'letra'
  | 'fondo'
  | 'borde'
  | 'esquinas'
  | 'aire'
  | 'sombra';

/** Cómo hay que resolver un token para poder compararlo con un valor computado. */
type TipoToken = 'color' | 'largo' | 'sombra' | 'crudo';

/** Una propiedad del catálogo: en qué dimensión cae y si tiene sentido preguntarse su origen. */
interface PropDef {
  readonly k: string;
  readonly dim: DimId;
  readonly juzga: boolean;
}

/** Una de las siete dimensiones, con lo que se escribe en el buscador para verla. */
interface Dim {
  readonly id: DimId;
  readonly n: string;
  readonly titulo: string;
  readonly filtro: string;
  readonly pista: string;
}

/** Un elemento inspeccionable de la escena. En la ronda 3 hay dos, y ahí está la trampa. */
interface Parte {
  readonly id: string;
  readonly nombre: string;
  readonly selector: string;
}

/** Una ronda: qué se inspecciona, de cuántas piezas se compone y qué mira cada misión. */
interface Ronda {
  readonly id: string;
  readonly n: number;
  readonly titulo: string;
  readonly sub: string;
  readonly partes: readonly Parte[];
  /** Qué pieza mira cada dimensión. En la ronda 3 la tipografía mira el TEXTO, no la caja. */
  readonly mira: Readonly<Record<DimId, string>>;
  /** Pistas que esta ronda cuenta distinto a la general. */
  readonly pistas?: Partial<Record<DimId, string>>;
}

/** Una fila del panel: la propiedad, su valor REAL y de dónde sale (si se puede saber). */
interface Fila {
  readonly k: string;
  readonly v: string;
  readonly juzga: boolean;
  readonly token: string | null;
  /** El mismo valor releído con el tema oscuro puesto. Solo cuando el algodón está encendido. */
  readonly vOscuro?: string;
}

/** El tipo de pregunta que toca, resuelto en vivo a partir de lo que se ha leído. */
type Clase = 'origen' | 'tamano' | 'sombra';

/** La pregunta de la misión activa, ya resuelta contra las lecturas. */
interface Pregunta {
  readonly clase: Clase;
  readonly enunciado: string;
  readonly opciones: readonly [string, string];
  readonly correcta: 0 | 1;
  /**
   * TODAS las propiedades a pelo del bloque, no solo la primera: si el botón lleva los cuatro
   * paddings escritos a mano, señalar cualquiera de los cuatro es acertar.
   */
  readonly culpables: readonly string[];
  /** Lo que se cuenta al revelar, medido, no escrito. */
  readonly porque: string;
}

/** En qué punto del bucle está la misión abierta. */
type Fase = 'preguntando' | 'localizando' | 'resuelta';

/** Un token candidato a ser el origen de un valor, y cómo hay que resolverlo para comparar. */
interface Candidato {
  readonly token: string;
  readonly tipo: TipoToken;
}

/**
 * Simulador «Practícalo aquí» de la guía de validación.
 *
 * La guía enseña a mirar; esto obliga a practicarlo. Dos cosas lo sostienen:
 *
 * 1. **Ningún número está escrito.** Todo sale de `getComputedStyle` sobre elementos vivos que
 *    renderiza este mismo componente, así que no se puede desfasar: si cambia el sistema,
 *    cambia lo que se lee. El veredicto «¿sale de una variable?» se resuelve comparando el
 *    valor contra los `--sc-*` candidatos RESUELTOS en el documento (un probe invisible al que
 *    se le asigna `var(--sc-x)` y se le lee el computado), que es la técnica que la guía explica.
 * 2. **La persona decide antes de ver la respuesta.** Juzga la dimensión entera («¿sale todo de
 *    variables?») y, si dice que no, tiene que SEÑALAR cuál falla. Antes el panel enseñaba el
 *    veredicto de entrada, así que la única pregunta que la guía existe para enseñar se
 *    contestaba sola.
 *
 * El oráculo compara VALORES, así que un valor a pelo que coincidiera con el de un token se
 * daría por bueno. Por eso los defectos plantados usan valores verificados sin coincidencia
 * entre los 1013 `--sc-*` del sistema (medido 2026-09-04): `#cdd4e0`, `#f2f5fb`, `5px`, `9px`,
 * `13px` y el `19.6px` que sale de un `line-height: 1.4`. El `#c6ccd6` que llevaba antes el
 * borde del chip NO valía: es `--sc-text-disabled` y `--sc-color-slate-300`, y solo pasaba
 * porque esos dos no estaban en la lista de candidatos.
 *
 * Vive aparte de `ValidarComponent` por el presupuesto de estilos de Angular
 * (`anyComponentStyle`, 14 kB de aviso / 18 kB de error en `angular.json`): la guía ya estaba
 * rozando el techo. El presupuesto es POR componente, así que separarlo lo resuelve de raíz en
 * vez de subir el número. El precio es duplicar el cartón del inspector (`.dt*`, `.prop*`), que
 * en la guía es de otro componente y por encapsulación no cruza.
 */
@Component({
  selector: 'app-validar-practica',
  templateUrl: './practica.component.html',
  styleUrl: './practica.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidarPracticaComponent {
  private readonly inyector = inject(Injector);
  private readonly escena = viewChild<ElementRef<HTMLElement>>('escena');
  private readonly buscador =
    viewChild<ElementRef<HTMLInputElement>>('buscador');

  // ── estado ──
  protected readonly rondaIdx = signal(0);
  protected readonly parteActiva = signal('chip');
  protected readonly dimActiva = signal<DimId | null>(null);
  protected readonly filtro = signal('');
  protected readonly filas = signal<readonly Fila[]>([]);
  protected readonly pregunta = signal<Pregunta | null>(null);
  protected readonly fase = signal<Fase>('preguntando');
  protected readonly fallo = signal(false);
  protected readonly oscuro = signal(false);

  /**
   * `ronda/dim` → ¿se acertó? Guardar el RESULTADO y no solo «hecha» es lo que permite volver a
   * una comprobación cerrada y ver el veredicto que fue, no el de la última que tocaste.
   */
  protected readonly resueltas = signal<ReadonlyMap<string, boolean>>(
    new Map<string, boolean>()
  );
  protected readonly racha = signal(0);
  protected readonly mejorRacha = signal(0);
  /** Lo que se escapó, para el informe: `ronda · dimensión`. */
  protected readonly escapadas = signal<readonly string[]>([]);

  protected readonly dims: readonly Dim[] = [
    {
      id: 'tamano',
      n: '1',
      titulo: 'Tamaño',
      filtro: 'width',
      pista:
        'Aquí no se juzga el origen: se lee el comportamiento. Un ancho con decimales suele ' +
        'delatar que lo decide el contenido (Hug); uno redondo y clavado, que está fijado.',
    },
    {
      id: 'letra',
      n: '2',
      titulo: 'Tipografía',
      filtro: 'font',
      pista:
        'Con «font» salen casi todas de golpe. El color del texto se busca aparte.',
    },
    {
      id: 'fondo',
      n: '3',
      titulo: 'Fondo',
      filtro: 'background',
      pista:
        'El relleno de la caja. No es lo mismo que el color del texto, que es «color».',
    },
    {
      id: 'borde',
      n: '4',
      titulo: 'Borde',
      filtro: 'border-top',
      pista:
        'Grosor, estilo y color van por separado. El que se descuadra casi siempre es el color.',
    },
    {
      id: 'esquinas',
      n: '5',
      titulo: 'Esquinas',
      filtro: 'radius',
      pista:
        'Cada esquina tiene la suya. Un valor fuera de la escala (4, 6, 8) canta.',
    },
    {
      id: 'aire',
      n: '6',
      titulo: 'Espaciados',
      filtro: 'padding',
      pista:
        'El aire de DENTRO es padding; la separación entre piezas es gap. La escala del sistema ' +
        'va de 14 en 14 partido: 7, 10.5, 14, 21. Lo que no cae ahí, sospecha.',
    },
    {
      id: 'sombra',
      n: '7',
      titulo: 'Sombra',
      filtro: 'shadow',
      pista:
        '«none» es una respuesta válida: no llevar sombra también se valida.',
    },
  ];

  protected readonly rondas: readonly Ronda[] = [
    {
      id: 'chip',
      n: 1,
      titulo: 'Chip',
      sub: 'Una pieza sola. Empieza por aquí.',
      partes: [{ id: 'chip', nombre: 'el chip', selector: 'span.chip' }],
      mira: {
        tamano: 'chip',
        letra: 'chip',
        fondo: 'chip',
        borde: 'chip',
        esquinas: 'chip',
        aire: 'chip',
        sombra: 'chip',
      },
    },
    {
      id: 'boton',
      n: 2,
      titulo: 'Botón',
      sub: 'Más superficie, más sitios donde esconder un valor a pelo.',
      partes: [{ id: 'boton', nombre: 'el botón', selector: 'button.boton' }],
      mira: {
        tamano: 'boton',
        letra: 'boton',
        fondo: 'boton',
        borde: 'boton',
        esquinas: 'boton',
        aire: 'boton',
        sombra: 'boton',
      },
    },
    {
      id: 'aviso',
      n: 3,
      titulo: 'Aviso',
      sub: 'Dos elementos: la caja y el texto de dentro. Aquí está la trampa de la guía.',
      partes: [
        { id: 'caja', nombre: 'la caja', selector: 'div.aviso' },
        { id: 'texto', nombre: 'el texto', selector: 'p.aviso__t' },
      ],
      mira: {
        tamano: 'caja',
        letra: 'texto',
        fondo: 'caja',
        borde: 'caja',
        esquinas: 'caja',
        aire: 'caja',
        sombra: 'caja',
      },
      pistas: {
        letra:
          'El tamaño de letra bueno es el del TEXTO, no el de la caja que lo envuelve.',
      },
    },
  ];

  /** Lo que enseña el panel, en el orden en que lo enseña «Computed». */
  private static readonly CATALOGO: readonly PropDef[] = [
    { k: 'background-color', dim: 'fondo', juzga: true },
    { k: 'border-bottom-left-radius', dim: 'esquinas', juzga: true },
    { k: 'border-bottom-right-radius', dim: 'esquinas', juzga: true },
    { k: 'border-top-color', dim: 'borde', juzga: true },
    { k: 'border-top-left-radius', dim: 'esquinas', juzga: true },
    { k: 'border-top-right-radius', dim: 'esquinas', juzga: true },
    { k: 'border-top-style', dim: 'borde', juzga: false },
    { k: 'border-top-width', dim: 'borde', juzga: false },
    { k: 'box-shadow', dim: 'sombra', juzga: true },
    { k: 'box-sizing', dim: 'tamano', juzga: false },
    { k: 'color', dim: 'letra', juzga: true },
    { k: 'column-gap', dim: 'aire', juzga: true },
    { k: 'display', dim: 'tamano', juzga: false },
    { k: 'font-family', dim: 'letra', juzga: true },
    { k: 'font-size', dim: 'letra', juzga: true },
    { k: 'font-weight', dim: 'letra', juzga: true },
    { k: 'height', dim: 'tamano', juzga: false },
    { k: 'line-height', dim: 'letra', juzga: true },
    { k: 'padding-bottom', dim: 'aire', juzga: true },
    { k: 'padding-left', dim: 'aire', juzga: true },
    { k: 'padding-right', dim: 'aire', juzga: true },
    { k: 'padding-top', dim: 'aire', juzga: true },
    { k: 'row-gap', dim: 'aire', juzga: true },
    { k: 'width', dim: 'tamano', juzga: false },
  ];

  /** Los `--sc-*` que estas escenas PODRÍAN estar usando. Se resuelven en vivo, no se copian. */
  private static readonly CANDIDATOS: readonly Candidato[] = [
    { token: '--sc-bg-subtle', tipo: 'color' },
    { token: '--sc-bg-surface', tipo: 'color' },
    { token: '--sc-bg-default', tipo: 'color' },
    { token: '--sc-bg-accent', tipo: 'color' },
    { token: '--sc-bg-info-subtle', tipo: 'color' },
    { token: '--sc-text-primary', tipo: 'color' },
    { token: '--sc-text-secondary', tipo: 'color' },
    { token: '--sc-text-on-accent', tipo: 'color' },
    { token: '--sc-border-subtle', tipo: 'color' },
    { token: '--sc-border-default', tipo: 'color' },
    { token: '--sc-border-strong', tipo: 'color' },
    { token: '--sc-border-accent', tipo: 'color' },
    { token: '--sc-border-info-subtle', tipo: 'color' },
    { token: '--sc-font-size-100', tipo: 'largo' },
    { token: '--sc-font-size-200', tipo: 'largo' },
    { token: '--sc-font-size-300', tipo: 'largo' },
    { token: '--sc-line-height-100', tipo: 'largo' },
    { token: '--sc-line-height-200', tipo: 'largo' },
    { token: '--sc-line-height-300', tipo: 'largo' },
    { token: '--sc-spacing-0-5', tipo: 'largo' },
    { token: '--sc-spacing-0-75', tipo: 'largo' },
    { token: '--sc-spacing-1', tipo: 'largo' },
    { token: '--sc-spacing-1-5', tipo: 'largo' },
    { token: '--sc-radius-sm', tipo: 'largo' },
    { token: '--sc-radius-md', tipo: 'largo' },
    { token: '--sc-radius-lg', tipo: 'largo' },
    { token: '--sc-radius-full', tipo: 'largo' },
    { token: '--sc-shadow-xs', tipo: 'sombra' },
    { token: '--sc-shadow-card', tipo: 'sombra' },
    { token: '--sc-font-weight-regular', tipo: 'crudo' },
    { token: '--sc-font-weight-medium', tipo: 'crudo' },
    { token: '--sc-font-weight-semibold', tipo: 'crudo' },
    { token: '--sc-font-family-primary', tipo: 'crudo' },
  ];

  /** Valores que no pueden venir de un token: son palabras, no medidas. */
  private static readonly PALABRAS = new Set([
    'normal',
    'none',
    'auto',
    '0px',
    'rgba(0, 0, 0, 0)',
    'transparent',
  ]);

  protected readonly ronda = computed(() => this.rondas[this.rondaIdx()]);
  /** La pieza que está seleccionada ahora mismo. */
  protected readonly parte = computed(
    () => this.ronda().partes.find((p) => p.id === this.parteActiva()) ?? this.ronda().partes[0],
  );
  protected readonly totalPreguntas = computed(() => this.rondas.length * this.dims.length);

  /** Las filas que sobreviven a lo escrito en el buscador. */
  protected readonly visibles = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    return q ? this.filas().filter((f) => f.k.includes(q)) : this.filas();
  });

  /** Cuántas de las siete de ESTA ronda están resueltas. */
  protected readonly hechasRonda = computed(() => {
    const r = this.ronda().id;
    return this.dims.filter((d) => this.resueltas().has(`${r}/${d.id}`)).length;
  });

  protected readonly aciertos = computed(() => [...this.resueltas().values()].filter(Boolean).length);
  protected readonly rondaCerrada = computed(() => this.hechasRonda() === this.dims.length);
  protected readonly terminado = computed(() => this.resueltas().size === this.totalPreguntas());

  protected readonly puntuacion = computed(() => {
    const hechas = this.resueltas().size;
    return {
      hechas,
      aciertos: this.aciertos(),
      pct: hechas ? Math.round((this.aciertos() / hechas) * 100) : 0,
    };
  });

  /** Lo que se escribiría en «Computed» para acotar esta comprobación. Es sugerencia, no filtro. */
  protected readonly sugerencia = computed(() => {
    const d = this.dimActiva();
    return d ? `prueba con: ${this.dims.find((x) => x.id === d)?.filtro}` : 'Filtrar';
  });

  protected readonly rango = computed(() => {
    const a = this.aciertos();
    if (a === this.totalPreguntas()) return 'Ojo clínico';
    if (a >= 17) return 'Buen ojo';
    if (a >= 11) return 'Vas por buen camino';
    return 'Se te escapan cosas';
  });

  /** ¿La misión abierta mira una pieza distinta de la que hay seleccionada? Esa es la trampa. */
  protected readonly desalineado = computed(() => {
    const d = this.dimActiva();
    return d !== null && this.ronda().mira[d] !== this.parteActiva();
  });

  constructor() {
    // La lista larga de «Computed» desde el primer segundo: si no se ve lo que hay que acotar,
    // el buscador no se entiende.
    this.trasPintar();
  }

  /**
   * Relee el catálogo cuando la escena nueva YA está en el DOM. Con un `setTimeout` valdría,
   * pero el navegador lo estrangula a un segundo en pestañas de fondo; esto se engancha al
   * render de Angular y no depende de temporizadores.
   */
  private trasPintar(): void {
    afterNextRender(() => this.leer(null), { injector: this.inyector });
  }

  // ── el bucle ──

  /** Abre una comprobación: lee la pieza viva y plantea su pregunta, con el veredicto tapado. */
  protected abrir(d: Dim): void {
    this.dimActiva.set(d.id);
    // El buscador se vacía, no se rellena con el término: el término de una dimensión no
    // devuelve todas sus propiedades («font» esconde line-height y color, que hay que juzgar).
    // El término vive en la tarjeta de la comprobación y en el placeholder, como sugerencia.
    this.filtro.set('');
    this.oscuro.set(false);
    this.aplicarOscuro(false);
    const previo = this.resueltas().get(`${this.ronda().id}/${d.id}`);
    this.fase.set(previo === undefined ? 'preguntando' : 'resuelta');
    this.fallo.set(previo === false);
    if (this.desalineado()) {
      this.filas.set([]);
      this.pregunta.set(null);
      return;
    }
    // Se replantea SIEMPRE: si no, al volver a una comprobación cerrada se quedaba en pantalla
    // la pregunta de la anterior.
    this.pregunta.set(this.plantear(d.id, this.leer(d.id)));
    if (previo === undefined) this.buscador()?.nativeElement.focus();
  }

  /** Cambia de pieza inspeccionada. Si había una comprobación abierta, se relee con la nueva. */
  protected seleccionar(p: Parte): void {
    this.parteActiva.set(p.id);
    const d = this.dimActiva();
    if (d) {
      this.abrir(this.dims.find((x) => x.id === d)!);
      return;
    }
    this.leer(null);
  }

  /** Cambia de ronda. El marcador NO se reinicia: es la misma partida. */
  protected irARonda(i: number): void {
    this.rondaIdx.set(i);
    this.parteActiva.set(this.rondas[i].partes[0].id);
    this.dimActiva.set(null);
    this.pregunta.set(null);
    this.filtro.set('');
    this.oscuro.set(false);
    this.aplicarOscuro(false);
    // La escena de la ronda nueva todavía no está en el DOM: se lee cuando ya lo esté.
    this.filas.set([]);
    this.trasPintar();
  }

  /** La respuesta a la pregunta de la misión. */
  protected responder(i: 0 | 1): void {
    const p = this.pregunta();
    if (!p || this.fase() !== 'preguntando') return;
    if (i !== p.correcta) {
      this.cerrar(false);
      return;
    }
    // Acertar «hay algo a pelo» no basta: hay que señalarlo.
    if (p.clase === 'origen' && p.culpables.length) {
      // Se vacía el filtro: si quien juega había acotado la lista y el valor a pelo se quedaba
      // fuera, iba a señalar una fila limpia y a comerse un fallo que no era suyo.
      this.filtro.set('');
      this.fase.set('localizando');
      return;
    }
    this.cerrar(true);
  }

  /** El segundo paso: señalar una fila que esté a pelo. Cualquiera de las que fallan vale. */
  protected senalar(f: Fila): void {
    if (this.fase() !== 'localizando') return;
    this.cerrar(f.juzga && !f.token);
  }

  /** El interruptor del algodón: pone el tema oscuro en la escena y relee. */
  protected algodon(): void {
    const v = !this.oscuro();
    this.oscuro.set(v);
    this.aplicarOscuro(v);
    const d = this.dimActiva();
    if (d) this.leer(d, v);
  }

  /** Vuelve a empezar la partida entera. */
  protected reiniciar(): void {
    this.resueltas.set(new Map());
    this.racha.set(0);
    this.mejorRacha.set(0);
    this.escapadas.set([]);
    this.irARonda(0);
  }

  protected pistaDe(id: DimId): string {
    return (
      this.ronda().pistas?.[id] ??
      this.dims.find((d) => d.id === id)?.pista ??
      ''
    );
  }

  protected tituloDe(id: DimId): string {
    return this.dims.find((d) => d.id === id)?.titulo ?? '';
  }

  protected estaHecha(rondaId: string, dim: DimId): boolean {
    return this.resueltas().has(`${rondaId}/${dim}`);
  }

  /**
   * ¿Este valor es un color? Solo los colores sirven para la prueba del algodón: el tema mueve
   * la paleta, pero `--sc-font-size-200` vale 14px en claro y en oscuro. Sin esta comprobación
   * el panel marcaba «no se movió» sobre una tipografía perfectamente tokenizada, que es
   * justo lo contrario de lo que la prueba quiere enseñar.
   */
  protected esColor(v: string): boolean {
    return v.startsWith('rgb');
  }

  protected escribir(v: string): void {
    this.filtro.set(v);
  }

  /** La pieza que la misión abierta DEBERÍA estar mirando. */
  protected parteEsperada(): Parte | null {
    const d = this.dimActiva();
    if (d === null) return null;
    const id = this.ronda().mira[d];
    return this.ronda().partes.find((p) => p.id === id) ?? null;
  }

  // ── lo que de verdad mide ──

  /** Cierra la misión abierta, apunta el resultado y revela. */
  private cerrar(bien: boolean): void {
    const d = this.dimActiva();
    if (d === null) return;
    const r = this.ronda();
    this.resueltas.update((m) => new Map(m).set(`${r.id}/${d}`, bien));
    this.fallo.set(!bien);
    this.fase.set('resuelta');
    if (bien) {
      this.racha.update((n) => n + 1);
      this.mejorRacha.update((m) => Math.max(m, this.racha()));
      return;
    }
    this.racha.set(0);
    this.escapadas.update((xs) => [
      ...xs,
      `Ronda ${r.n} · ${this.tituloDe(d)}`,
    ]);
  }

  /**
   * Lee la pieza viva y plantea la pregunta que toque. Nada de esto está escrito a mano.
   * Con `dim` a null lee el catálogo ENTERO y no pregunta: es la lista larga de «Computed»,
   * la que hace falta ver para entender por qué existe el buscador.
   */
  private leer(dim: DimId | null, conOscuro = false): readonly Fila[] {
    const el = this.elemento();
    if (!el) return [];
    const cs = getComputedStyle(el);
    const origen = this.mapaDeOrigenes(el);
    const defs = dim
      ? ValidarPracticaComponent.CATALOGO.filter((p) => p.dim === dim)
      : ValidarPracticaComponent.CATALOGO;
    const filas: Fila[] = defs.map(({ k, juzga }) => {
      const v = cs.getPropertyValue(k).trim();
      const juzgable =
        juzga && !ValidarPracticaComponent.PALABRAS.has(v.toLowerCase());
      return {
        k,
        v,
        juzga: juzgable,
        token: juzgable
          ? ValidarPracticaComponent.elige(
              k,
              origen.get(ValidarPracticaComponent.norm(v))
            )
          : null,
        ...(conOscuro ? { vOscuro: v } : {}),
      };
    });
    // En oscuro se conserva el valor claro de la lectura anterior para poder compararlos.
    const salida = conOscuro
      ? ((claras) =>
          filas.map((f) => ({
            ...f,
            v: claras.get(f.k) ?? f.v,
            vOscuro: f.v,
          })))(new Map(this.filas().map((f) => [f.k, f.v])))
      : filas;
    this.filas.set(salida);
    if (dim === null) this.pregunta.set(null);
    return salida;
  }

  /** Traduce las lecturas en la pregunta de esta misión, con su respuesta ya medida. */
  private plantear(dim: DimId, filas: readonly Fila[]): Pregunta {
    const el = this.elemento();
    if (dim === 'tamano' && el) {
      const { crece, porque } = this.mideAncho(el);
      return {
        clase: 'tamano',
        enunciado: '¿El ancho lo decide el contenido?',
        opciones: ['Sí, lo decide el contenido', 'No, lo decide otra cosa'],
        correcta: crece ? 0 : 1,
        culpables: [],
        porque,
      };
    }
    const sombra = filas.find((f) => f.k === 'box-shadow');
    if (dim === 'sombra' && sombra && !sombra.juzga) {
      return {
        clase: 'sombra',
        enunciado: '¿Lleva sombra?',
        opciones: ['No lleva', 'Sí lleva'],
        correcta: 0,
        culpables: [],
        porque: 'El inspector dice «none». No llevar sombra también es un resultado válido.',
      };
    }
    const juzgables = filas.filter((f) => f.juzga);
    const pelo = juzgables.filter((f) => !f.token);
    return {
      clase: 'origen',
      enunciado: '¿Sale todo de variables del sistema?',
      opciones: ['Sí, todo', 'No, hay algo a pelo'],
      correcta: pelo.length ? 1 : 0,
      culpables: pelo.map((f) => f.k),
      porque: !pelo.length
        ? `Las ${juzgables.length} propiedades que se pueden juzgar salen de un --sc-*.`
        : pelo.length === 1
          ? `«${pelo[0].k}» vale ${pelo[0].v} y ese valor no lo da ningún --sc-*: está escrito a mano.`
          : `Hay ${pelo.length} escritos a mano: ${pelo.map((f) => f.k).join(', ')}. Ninguno de esos valores sale de un --sc-*.`,
    };
  }

  /** El elemento vivo que toca inspeccionar, según la pieza seleccionada. */
  private elemento(): HTMLElement | null {
    const escena = this.escena()?.nativeElement;
    return (
      escena?.querySelector<HTMLElement>(
        `[data-parte="${this.parteActiva()}"]`
      ) ?? null
    );
  }

  /**
   * Pone o quita el tema oscuro SOLO en la escena, sin tocar el de la página.
   *
   * Apaga las transiciones mientras dura el cambio, y a propósito: los valores se leen con
   * `getComputedStyle` justo después de poner la clase, y un `transition` en marcha devuelve el
   * color DE SALIDA, no el de llegada. La prueba del algodón diría «no se movió» de algo que sí
   * sale de una variable, que es exactamente lo contrario de lo que enseña. Medido el 2026-09-04.
   */
  private aplicarOscuro(v: boolean): void {
    const escena = this.escena()?.nativeElement;
    if (!escena) return;
    escena.classList.add('sin-fundido');
    escena.classList.toggle('sc-dark', v);
    void escena.offsetWidth; // fuerza el recálculo antes de que nadie lea
    setTimeout(() => escena.classList.remove('sin-fundido'));
  }

  /**
   * Mide el comportamiento del ancho haciendo lo que dice la guía: alargar el texto y mirar si
   * la caja crece. Y distingue las CUATRO formas que la guía nombra, no dos: Hug, Fill, techo
   * (`max-width`) y ancho clavado.
   *
   * El clon se mide dentro de un banco de pruebas ANCHO, no en su hueco real: en un padre
   * estrecho, una caja que sí abraza su contenido se queda en su `min-content` y parecería que
   * no crece. Medido el 2026-09-04 con el hueco a 30px: el chip crecía 4px (una palabra) y el
   * botón, cero, cuando los dos son Hug.
   */
  private mideAncho(el: HTMLElement): { crece: boolean; porque: string } {
    const padre = el.parentElement;
    const ancho = el.getBoundingClientRect().width;
    const pcs = padre ? getComputedStyle(padre) : null;
    const hueco = pcs
      ? padre!.clientWidth -
        parseFloat(pcs.paddingLeft) -
        parseFloat(pcs.paddingRight)
      : 0;
    const banco = document.createElement('div');
    banco.style.cssText =
      'position:absolute;visibility:hidden;pointer-events:none;left:-9999px;top:0;width:3000px';
    const clon = el.cloneNode(true) as HTMLElement;
    clon.removeAttribute('data-parte');
    banco.appendChild(clon);
    (padre ?? document.body).appendChild(banco);
    const base = clon.getBoundingClientRect().width;
    // el mismo gesto que describe la guía: alargar el texto y ver si la caja lo sigue
    clon.appendChild(
      document.createTextNode(' texto mucho mas largo de lo normal')
    );
    const largo = clon.getBoundingClientRect().width;
    banco.remove();
    const crece = largo - base > 1;
    const techo = parseFloat(getComputedStyle(el).maxWidth);
    const px = (n: number) => `${Math.round(n)}px`;
    if (hueco > 0 && Math.abs(hueco - ancho) < 2) {
      return {
        crece: false,
        porque: `No se mueve al alargar el texto y mide justo el hueco de su padre (${px(
          hueco
        )}): eso es Fill, «Fill container» en Figma.`,
      };
    }
    if (crece) {
      return {
        crece: true,
        porque: `Alargando el texto pasa de ${px(base)} a ${px(
          largo
        )}: eso es Hug, «Hug contents» en Figma.`,
      };
    }
    if (Number.isFinite(techo) && Math.abs(techo - ancho) < 2) {
      return {
        crece: false,
        porque: `Crece con el contenido, pero tiene un techo de ${px(
          techo
        )} y ya está pegado a él: en Figma es «Max width».`,
      };
    }
    return {
      crece: false,
      porque:
        'No se mueve al alargar el texto: el ancho está clavado, la «W» con un número de Figma.',
    };
  }

  /**
   * `valor resuelto → todos los tokens que valen eso`, montado con un probe invisible en el MISMO
   * contexto del elemento. Se guardan TODOS y no el primero porque hay empates de verdad: 14px es
   * a la vez `--sc-spacing-1` y `--sc-font-size-200`, y blanco es `--sc-bg-surface` y
   * `--sc-text-on-accent`. Cuál se nombra lo decide `elige()` mirando la propiedad.
   */
  private mapaDeOrigenes(
    el: HTMLElement
  ): ReadonlyMap<string, readonly string[]> {
    const mapa = new Map<string, string[]>();
    const raiz = getComputedStyle(el);
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    el.appendChild(probe);
    for (const { token, tipo } of ValidarPracticaComponent.CANDIDATOS) {
      let valor: string;
      if (tipo === 'crudo') {
        valor = raiz.getPropertyValue(token).trim();
      } else if (tipo === 'color') {
        probe.style.color = `var(${token})`;
        valor = getComputedStyle(probe).color;
      } else if (tipo === 'sombra') {
        probe.style.boxShadow = `var(${token})`;
        valor = getComputedStyle(probe).boxShadow;
      } else {
        probe.style.width = `var(${token})`;
        valor = getComputedStyle(probe).width;
      }
      const clave = ValidarPracticaComponent.norm(valor);
      if (clave && !ValidarPracticaComponent.PALABRAS.has(clave)) {
        mapa.set(clave, [...(mapa.get(clave) ?? []), token]);
      }
    }
    probe.remove();
    return mapa;
  }

  /**
   * De entre los tokens que valen ese valor, el que un desarrollador habría escrito PARA ESA
   * propiedad. Sin esto el panel decía cosas verdaderas pero desorientadoras en una herramienta
   * que enseña: el relleno del aviso salía como `--sc-font-size-200` (14px, empate con
   * `--sc-spacing-1`) y el texto blanco de un botón como `--sc-bg-surface`.
   */
  private static elige(
    prop: string,
    tokens: readonly string[] | undefined
  ): string | null {
    if (!tokens?.length) return null;
    const familia =
      prop === 'color'
        ? '--sc-text-'
        : prop.includes('background')
        ? '--sc-bg-'
        : prop.includes('border') && prop.includes('color')
        ? '--sc-border-'
        : prop.includes('radius')
        ? '--sc-radius-'
        : prop.includes('padding') ||
          prop.includes('gap') ||
          prop.includes('margin')
        ? '--sc-spacing-'
        : prop.includes('shadow')
        ? '--sc-shadow-'
        : `--sc-${prop}-`;
    return tokens.find((t) => t.startsWith(familia)) ?? tokens[0];
  }

  /** Iguala lo que el navegador escribe de dos formas: comillas, mayúsculas y espacios sobran. */
  private static norm(v: string): string {
    return v.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
  }
}
