import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

/** Una propiedad que el simulador lee. `juzga` = si tiene sentido preguntarse de dónde sale. */
interface Prop {
  readonly k: string;
  readonly juzga: boolean;
}

/** Una de las siete misiones: qué se busca, con qué se filtra y qué propiedades lo prueban. */
interface Mision {
  readonly id: string;
  readonly n: string;
  readonly titulo: string;
  readonly filtro: string;
  readonly pista: string;
  readonly props: readonly Prop[];
}

/** Una lectura del inspector de mentira: la propiedad, su valor REAL y de dónde sale. */
interface Lectura {
  readonly k: string;
  readonly v: string;
  readonly juzga: boolean;
  readonly token: string | null;
}

/** Token candidato a ser el origen de un valor, y cómo hay que resolverlo para comparar. */
interface Candidato {
  readonly token: string;
  readonly tipo: 'color' | 'largo' | 'crudo';
}

/**
 * Simulador «Practícalo aquí» de la guía de validación.
 *
 * La guía enseña a mirar; esto deja practicarlo sin salir de la página. La gracia es que los
 * números NO están escritos: se leen con `getComputedStyle` del chip real que renderiza este
 * mismo componente, así que no se pueden desfasar. Y el veredicto «¿sale de una variable?» se
 * resuelve comparando el valor contra los `--sc-*` candidatos RESUELTOS en el documento (un
 * probe invisible al que se le asigna `var(--sc-x)` y se le lee el computado), que es
 * exactamente la técnica que la guía explica más arriba.
 *
 * Vive aparte de `ValidarComponent` por el presupuesto de estilos de Angular
 * (`anyComponentStyle`, 14 kB de aviso / 18 kB de error en `angular.json`): la guía ya estaba
 * rozando el techo y meterle el simulador la dejaba a 1,6 kB de romper el build. El presupuesto
 * es POR componente, así que separarlo lo resuelve de raíz en vez de subir el número. El precio
 * es duplicar el cartón del inspector (`.dt*`, `.prop*`), que en la guía es de otro componente
 * y por encapsulación no cruza.
 */
@Component({
  selector: 'app-validar-practica',
  templateUrl: './practica.component.html',
  styleUrl: './practica.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidarPracticaComponent {
  private readonly chip = viewChild<ElementRef<HTMLElement>>('chip');

  protected readonly misionActiva = signal<string | null>(null);
  protected readonly lecturas = signal<readonly Lectura[]>([]);
  protected readonly hechas = signal<ReadonlySet<string>>(new Set<string>());
  protected readonly progreso = computed(() => this.hechas().size);

  protected readonly misiones: readonly Mision[] = [
    {
      id: 'tamano',
      n: '1',
      titulo: 'Tamaño',
      filtro: 'el dibujo de cajas',
      pista:
        'Este no se busca escribiendo: sale del dibujo de arriba del panel. Y fíjate en que ' +
        'el ancho lleva decimales: esa es la señal de que lo decide el contenido (Hug), no un ' +
        'número fijo. El alto sí es redondo porque sale de sumar letra y aire.',
      props: [
        { k: 'width', juzga: false },
        { k: 'height', juzga: false },
      ],
    },
    {
      id: 'letra',
      n: '2',
      titulo: 'Tipografía',
      filtro: 'font',
      pista: 'Con «font» salen casi todas de golpe. El color del texto se busca aparte.',
      props: [
        { k: 'font-family', juzga: true },
        { k: 'font-size', juzga: true },
        { k: 'line-height', juzga: true },
        { k: 'font-weight', juzga: true },
        { k: 'color', juzga: true },
      ],
    },
    {
      id: 'fondo',
      n: '3',
      titulo: 'Fondo',
      filtro: 'background',
      pista: 'El relleno de la caja. No es lo mismo que el color del texto, que es «color».',
      props: [{ k: 'background-color', juzga: true }],
    },
    {
      id: 'borde',
      n: '4',
      titulo: 'Borde',
      filtro: 'border-w',
      pista: 'Grosor, estilo y color van por separado. Aquí hay uno que no cuadra.',
      props: [
        { k: 'border-top-width', juzga: false },
        { k: 'border-top-style', juzga: false },
        { k: 'border-top-color', juzga: true },
      ],
    },
    {
      id: 'esquinas',
      n: '5',
      titulo: 'Esquinas',
      filtro: 'radius',
      pista: 'Cada esquina tiene la suya; casi siempre valen las cuatro lo mismo.',
      props: [{ k: 'border-top-left-radius', juzga: true }],
    },
    {
      id: 'aire',
      n: '6',
      titulo: 'Espaciados',
      filtro: 'padding',
      pista: 'El aire de DENTRO es padding; la separación entre piezas es gap.',
      props: [
        { k: 'padding-top', juzga: true },
        { k: 'padding-left', juzga: true },
        { k: 'column-gap', juzga: true },
      ],
    },
    {
      id: 'sombra',
      n: '7',
      titulo: 'Sombra',
      filtro: 'shadow',
      pista: '«none» es una respuesta válida: no llevar sombra también se valida.',
      props: [{ k: 'box-shadow', juzga: false }],
    },
  ];

  /** Los `--sc-*` que este chip PODRÍA estar usando. Se resuelven en vivo, no se copian. */
  private static readonly CANDIDATOS: readonly Candidato[] = [
    { token: '--sc-bg-subtle', tipo: 'color' },
    { token: '--sc-bg-surface', tipo: 'color' },
    { token: '--sc-bg-default', tipo: 'color' },
    { token: '--sc-text-primary', tipo: 'color' },
    { token: '--sc-text-secondary', tipo: 'color' },
    { token: '--sc-border-subtle', tipo: 'color' },
    { token: '--sc-border-default', tipo: 'color' },
    { token: '--sc-border-strong', tipo: 'color' },
    { token: '--sc-font-size-100', tipo: 'largo' },
    { token: '--sc-font-size-200', tipo: 'largo' },
    { token: '--sc-font-size-300', tipo: 'largo' },
    { token: '--sc-line-height-100', tipo: 'largo' },
    { token: '--sc-line-height-200', tipo: 'largo' },
    { token: '--sc-line-height-300', tipo: 'largo' },
    { token: '--sc-spacing-0-5', tipo: 'largo' },
    { token: '--sc-spacing-0-75', tipo: 'largo' },
    { token: '--sc-spacing-1', tipo: 'largo' },
    { token: '--sc-radius-sm', tipo: 'largo' },
    { token: '--sc-radius-md', tipo: 'largo' },
    { token: '--sc-radius-full', tipo: 'largo' },
    { token: '--sc-font-weight-regular', tipo: 'crudo' },
    { token: '--sc-font-weight-semibold', tipo: 'crudo' },
    { token: '--sc-font-family-primary', tipo: 'crudo' },
  ];

  /** Lanza una misión: lee del chip real y deja el panel como lo dejaría el inspector. */
  protected inspeccionar(m: Mision): void {
    const el = this.chip()?.nativeElement;
    if (!el) return;
    const cs = getComputedStyle(el);
    const origen = this.mapaDeOrigenes(el);
    this.lecturas.set(
      m.props.map(({ k, juzga }) => {
        const v = cs.getPropertyValue(k).trim();
        return {
          k,
          v,
          juzga,
          token: juzga ? (origen.get(ValidarPracticaComponent.norm(v)) ?? null) : null,
        };
      }),
    );
    this.misionActiva.set(m.id);
    this.hechas.update((hechas) => new Set(hechas).add(m.id));
  }

  /** Vuelve a empezar, para enseñárselo a otra persona sin recargar. */
  protected reiniciar(): void {
    this.misionActiva.set(null);
    this.lecturas.set([]);
    this.hechas.set(new Set());
  }

  /** Lo que se escribiría en el buscador de «Computed» para esa misión. */
  protected misionFiltro(id: string): string {
    return this.misiones.find((m) => m.id === id)?.filtro ?? '';
  }

  /** La trampa de esa misión. Se lee DESPUÉS de mirar, no antes. */
  protected misionPista(id: string): string {
    return this.misiones.find((m) => m.id === id)?.pista ?? '';
  }

  /** `valor resuelto → token`, montado con un probe invisible en el MISMO contexto del chip. */
  private mapaDeOrigenes(el: HTMLElement): ReadonlyMap<string, string> {
    const mapa = new Map<string, string>();
    const raiz = getComputedStyle(document.documentElement);
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
      } else {
        probe.style.width = `var(${token})`;
        valor = getComputedStyle(probe).width;
      }
      const clave = ValidarPracticaComponent.norm(valor);
      // El primero gana: si dos tokens resuelven al mismo px, el veredicto nombra uno y no
      // miente (el valor SÍ sale de una variable), pero puede haber empate.
      if (clave && !mapa.has(clave)) mapa.set(clave, token);
    }
    probe.remove();
    return mapa;
  }

  /** Iguala lo que el navegador escribe de dos formas: comillas, mayúsculas y espacios sobran. */
  private static norm(v: string): string {
    return v
      .toLowerCase()
      .replace(/["']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
