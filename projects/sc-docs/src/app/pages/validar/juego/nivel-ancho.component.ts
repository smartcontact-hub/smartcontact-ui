import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';

import { Motor, Resultado } from './juego.types';

/** Las tres formas de escribir la segunda columna que se pueden probar en el caso. */
type Regla = 'congelada' | 'suelo' | 'fija';

interface Opcion {
  readonly label: string;
  readonly ok: boolean;
  readonly porque: string;
}

interface Mision {
  readonly id: 'victima' | 'culpable' | 'leer' | 'arreglar' | 'hueco' | 'zoom';
  readonly titulo: string;
  readonly texto: string;
  readonly opciones: readonly Opcion[];
}

/** Una línea del árbol de Elements: la pieza y su alto (el ancho se calcula en vivo). */
interface Pieza {
  readonly id: 'main' | 'container' | 'grid' | 'nav' | 'card';
  readonly nombre: string;
  readonly sangria: number;
  readonly alto: number;
}

/** Una caja pintada en la página de mentira, en % del ancho de la ventana. */
interface Caja {
  readonly id: string;
  readonly left: number;
  readonly width: number;
}

/* Las medidas del caso real (Contact Center del Supervisor, medido el 2026-09-05). */
const SIDEBAR = 80;
const PAD = 28;
const RAIL = 235;
const GAP = 28;
const CARD_CONGELADA = 881;
const SUELO = 500;
const TOPE = 1200;

/**
 * Caso 2 · El ancho congelado.
 *
 * Es un caso REAL: la pantalla de Contact Center del Supervisor tenía la tarjeta de contenido
 * clavada a 881px con `minmax(55.0625rem, 55.0625rem)`, así que a 1920 sobraban 668px vacíos a
 * la derecha y por debajo de 1280 aparecía scroll horizontal. Se encontró el 2026-09-05 con la
 * persona que iba a jugar esto delante, y las seis misiones son los seis pasos que dio.
 *
 * La página de mentira NO es una captura: se calcula. Cada caja se dibuja a partir del ancho de
 * ventana del deslizador y de la regla elegida, con las mismas cuentas que hace el navegador
 * (sidebar + padding + rail + gap + tarjeta). Así, cuando se cambia la regla o se estrecha la
 * ventana, la página responde igual que respondió la real, y el «no cambia» de la víctima es un
 * hecho que se ve, no una afirmación que se cree.
 */
@Component({
  selector: 'app-nivel-ancho',
  templateUrl: './nivel-ancho.component.html',
  styleUrl: './nivel-ancho.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NivelAnchoComponent {
  readonly tiro = output<boolean>();
  readonly cerrado = output<Resultado>();

  protected readonly motor = new Motor(6);
  protected readonly elegida = signal<number | null>(null);

  // ── la escena ──
  protected readonly vp = signal(1460);
  protected readonly regla = signal<Regla>('congelada');
  protected readonly centrado = signal(false);
  /** Si ya se ha movido el deslizador: la primera misión no se puede contestar sin mirar. */
  protected readonly tocado = signal(false);
  protected readonly hover = signal<Pieza['id'] | null>(null);

  protected readonly piezas: readonly Pieza[] = [
    { id: 'main', nombre: 'main.sc-workspace-main', sangria: 0, alto: 716 },
    { id: 'container', nombre: 'div.sc-container', sangria: 1, alto: 1326 },
    { id: 'grid', nombre: 'div.content-grid', sangria: 2, alto: 1280 },
    { id: 'nav', nombre: 'aside.settings-nav', sangria: 3, alto: 253 },
    { id: 'card', nombre: 'section.settings-card', sangria: 3, alto: 1280 },
  ];

  /** Las migas del pie del panel, para la misión del padre. */
  protected readonly migas = [
    'div.sc-container',
    'app-contact-center-landing',
    'div.content-grid',
    'section.settings-card',
  ];

  protected readonly reglas: readonly { id: Regla; css: string; nota: string }[] = [
    {
      id: 'congelada',
      css: 'minmax(55.0625rem, 55.0625rem)',
      nota: 'La original: mínimo y máximo iguales.',
    },
    { id: 'suelo', css: 'minmax(500px, 1fr)', nota: 'Un suelo de 500 y el resto del sitio.' },
    { id: 'fija', css: '500px', nota: 'Un número y ya.' },
  ];

  protected readonly misiones: readonly Mision[] = [
    {
      id: 'victima',
      titulo: 'Encuentra la víctima',
      texto:
        'Mueve el deslizador para estrechar y ensanchar la ventana, y mira los números del árbol. ' +
        'Todas las piezas cambian de ancho menos una. <strong>Pincha su línea.</strong>',
      opciones: [
        {
          label: 'main.sc-workspace-main',
          ok: false,
          porque:
            'Esa cambia con la ventana, o sea que está haciendo su trabajo. Buscas la que se queda ' +
            'clavada en el mismo número mientras todo lo demás se mueve.',
        },
        {
          label: 'div.sc-container',
          ok: false,
          porque: 'Esa se adapta: es inocente. La víctima es la que no se mueve del 881.',
        },
        {
          label: 'div.content-grid',
          ok: false,
          porque:
            'Esa también cambia. Ojo: va a ser el culpable, pero no la víctima. La víctima es la ' +
            'que no se mueve: section.settings-card, siempre en 881.',
        },
        {
          label: 'aside.settings-nav',
          ok: false,
          porque:
            'El menú es fijo a propósito (235) y está bien que lo sea. La tarjeta de contenido es la ' +
            'que debería acompañar a la ventana y no lo hace: section.settings-card, siempre 881.',
        },
        {
          label: 'section.settings-card',
          ok: true,
          porque:
            'Siempre 881, midas lo que midas. Ancho grande: se queda pequeña y sobra hueco. Ancho ' +
            'pequeño: no encoge y aparece scroll. Esa es la víctima. Y ojo: la víctima casi nunca ' +
            'es la culpable.',
        },
      ],
    },
    {
      id: 'culpable',
      titulo: 'Sube un escalón',
      texto:
        'El ancho de una pieza casi nunca lo decide ella: lo decide quien la contiene. En la barra ' +
        'de abajo del panel está el camino. <strong>Pincha al padre de la víctima.</strong>',
      opciones: [
        {
          label: 'div.sc-container',
          ok: false,
          porque:
            'Está dos escalones por encima. El padre es el de justo a la izquierda de la víctima en ' +
            'la barra: div.content-grid.',
        },
        {
          label: 'app-contact-center-landing',
          ok: false,
          porque:
            'Ese es el abuelo. El padre es el de justo a la izquierda de la víctima: ' +
            'div.content-grid.',
        },
        {
          label: 'div.content-grid',
          ok: true,
          porque:
            'El de justo a la izquierda de la víctima en la barra. Él se adapta perfectamente, pero ' +
            'es quien le da la orden a la tarjeta. Ahora toca leer qué orden.',
        },
        {
          label: 'section.settings-card',
          ok: false,
          porque:
            'Esa es la víctima. Su ancho no está escrito en ella: se lo impone su padre, el de justo ' +
            'a la izquierda en la barra, div.content-grid.',
        },
      ],
    },
    {
      id: 'leer',
      titulo: 'Lee la orden',
      texto:
        'Con div.content-grid seleccionado, en Styles aparece esto. La línea marcada es la que ' +
        'reparte las columnas. ¿Qué le está diciendo a la tarjeta?',
      opciones: [
        {
          label: 'Mide al menos 881, y crece si hay sitio',
          ok: false,
          porque:
            'Eso sería minmax(881px, 1fr). Aquí el segundo valor también es 881: mínimo y máximo ' +
            'son el mismo número, así que no puede crecer. Es «mides exactamente 881».',
        },
        {
          label: 'Mide exactamente 881, siempre',
          ok: true,
          porque:
            'minmax es «mínimo y máximo». 55.0625rem son 881px, y está puesto en los dos sitios: ' +
            '«no bajes de 881, no pases de 881». Un mínimo que además es máximo es una medida fija.',
        },
        {
          label: 'Mide como máximo 881, y encoge si hace falta',
          ok: false,
          porque:
            'Eso sería minmax(0, 881px). Aquí el primer valor también es 881, así que tampoco ' +
            'puede encoger. Mínimo y máximo iguales: medida fija.',
        },
      ],
    },
    {
      id: 'arreglar',
      titulo: 'Cámbialo y mira',
      texto:
        'Prueba las tres formas de escribir la segunda columna: la página de arriba responde al ' +
        'momento. Mueve el deslizador con cada una y quédate con la que hace que la tarjeta ' +
        '<strong>acompañe a la ventana sin bajar de 500</strong>.',
      opciones: [
        {
          label: 'minmax(55.0625rem, 55.0625rem)',
          ok: false,
          porque:
            'Es la original: clavada en 881. Ni crece ni encoge. La que acompaña a la ventana es ' +
            'minmax(500px, 1fr): un suelo y, a partir de ahí, todo el sitio que quede.',
        },
        {
          label: 'minmax(500px, 1fr)',
          ok: true,
          porque:
            'Un suelo de 500 («no bajes de aquí») y 1fr («llévate lo que sobre»). En Figma: mínimo ' +
            '+ Fill container. Exactamente lo que pedía el diseño. Probado en la página real: nada ' +
            'se rompe.',
        },
        {
          label: '500px',
          ok: false,
          porque:
            'Otra medida fija, solo que más pequeña: la tarjeta se queda en 500 aunque haya 1000 de ' +
            'sitio. Lo que acompaña a la ventana es minmax(500px, 1fr).',
        },
      ],
    },
    {
      id: 'hueco',
      titulo: 'El hueco de la derecha',
      texto:
        'Hemos vuelto a la regla original y puesto la ventana a 1920, el monitor de tu compañero. ' +
        'La tarjeta mide 881 y el marco casi 1800. ¿Dónde cae el sitio que sobra?',
      opciones: [
        {
          label: 'Todo a la derecha',
          ok: true,
          porque:
            'Las columnas se colocan desde la izquierda, y nadie ha dicho que se centre el bloque. ' +
            'Lo que sobra (más de 600px) se queda al final, a la derecha. Marca la casilla de abajo ' +
            'para ver la otra opción: centrar el bloque con un tope de ancho.',
        },
        {
          label: 'Repartido a los dos lados',
          ok: false,
          porque:
            'Eso pasaría con margin-inline: auto («céntrame en el sitio que haya»), pero aquí no ' +
            'está. Sin esa orden, las columnas se apilan desde la izquierda y el sobrante cae todo a ' +
            'la derecha. Marca la casilla de abajo para ver la diferencia.',
        },
        {
          label: 'No sobra hueco',
          ok: false,
          porque:
            'Sobra, y mucho: el marco mide casi 1800 y las columnas suman 1144. Más de 600px ' +
            'vacíos, todos a la derecha, porque las columnas se apilan desde la izquierda.',
        },
      ],
    },
    {
      id: 'zoom',
      titulo: 'El zoom también cuenta',
      texto:
        'Tu compañero tiene un monitor de 1920 pero lleva el navegador con <strong>zoom al ' +
        '150%</strong>. ¿Cuánto mide su ventana para la página?',
      opciones: [
        {
          label: '1920, el zoom no cambia eso',
          ok: false,
          porque:
            'El zoom sí cambia eso: al 150% cada píxel de la página ocupa 1,5 de pantalla, así que ' +
            'caben menos. 1920 ÷ 1,5 = 1280. Con la regla original le quedan 28px de margen: al ' +
            '175% ya le sale scroll.',
        },
        {
          label: '1280',
          ok: true,
          porque:
            '1920 ÷ 1,5 = 1280. Justo en el límite: con la regla original (sidebar 80 + padding 56 + ' +
            'menú 235 + separación 28 + tarjeta 881 = 1280) le quedan 0 de margen a la tarjeta y ' +
            '28 al marco. Al 175% (1097) ya le sale scroll horizontal. Mira el deslizador: lo ' +
            'hemos puesto ahí.',
        },
        {
          label: '2880',
          ok: false,
          porque:
            'Al revés: el zoom hace la página más grande, así que cabe MENOS ventana, no más. ' +
            '1920 ÷ 1,5 = 1280, justo el límite de la regla original.',
        },
      ],
    },
  ];

  protected readonly mision = computed(() => this.misiones[this.motor.idx()]);
  protected readonly correcta = computed(() => this.mision().opciones.findIndex((o) => o.ok));
  protected readonly elegidaOpcion = computed(() => {
    const i = this.elegida();
    return i === null ? null : this.mision().opciones[i];
  });

  /**
   * Las cuentas del navegador, en píxeles reales. Con `centrado`, el bloque entero (menú + tarjeta)
   * se capa a 1200 y se centra, que es lo que hace la versión de referencia del DS.
   */
  protected readonly l = computed(() => {
    const vp = this.vp();
    const workspace = vp - SIDEBAR;
    const interior = workspace - 2 * PAD;
    const gridBox = this.centrado() ? Math.min(interior, TOPE - 2 * PAD) : interior;
    const margen = this.centrado() ? (interior - gridBox) / 2 : 0;
    const disponible = gridBox - RAIL - GAP;
    const regla = this.regla();
    const card =
      regla === 'congelada'
        ? CARD_CONGELADA
        : regla === 'suelo'
          ? Math.max(SUELO, disponible)
          : SUELO;
    const hueco = gridBox - RAIL - GAP - card;
    return {
      workspace,
      gridBox,
      card,
      hueco: Math.max(0, hueco),
      desborda: Math.max(0, -hueco),
      margen,
      gridLeft: SIDEBAR + PAD + margen,
    };
  });

  /** El ancho vivo de cada línea del árbol. */
  protected readonly anchos = computed<Record<Pieza['id'], number>>(() => {
    const l = this.l();
    return {
      main: l.workspace,
      container: l.workspace,
      grid: l.gridBox,
      nav: RAIL,
      card: l.card,
    };
  });

  /** Las cajas de la página de mentira, en % del ancho de la ventana. */
  protected readonly cajas = computed<readonly Caja[]>(() => {
    const vp = this.vp();
    const l = this.l();
    const pct = (px: number) => (px / vp) * 100;
    const navLeft = l.gridLeft;
    const cardLeft = navLeft + RAIL + GAP;
    return [
      { id: 'sidebar', left: 0, width: pct(SIDEBAR) },
      { id: 'main', left: pct(SIDEBAR), width: pct(l.workspace) },
      { id: 'container', left: pct(SIDEBAR), width: pct(l.workspace) },
      { id: 'grid', left: pct(l.gridLeft), width: pct(l.gridBox) },
      { id: 'nav', left: pct(navLeft), width: pct(RAIL) },
      { id: 'gap', left: pct(navLeft + RAIL), width: pct(GAP) },
      { id: 'card', left: pct(cardLeft), width: pct(l.card) },
      ...(l.hueco > 0 ? [{ id: 'hueco', left: pct(cardLeft + l.card), width: pct(l.hueco) }] : []),
    ];
  });

  protected readonly reglaCss = computed(() => this.reglas.find((r) => r.id === this.regla())!.css);

  // ── la escena ──

  protected mover(v: number): void {
    this.vp.set(v);
    this.tocado.set(true);
  }

  protected previsualizar(r: Regla): void {
    if (this.motor.contestada()) return;
    this.regla.set(r);
  }

  protected alternarCentrado(): void {
    this.centrado.update((v) => !v);
  }

  // ── el bucle ──

  protected elegir(i: number): void {
    const m = this.mision();
    if (m.id === 'victima' && !this.tocado()) return;
    const ok = m.opciones[i].ok;
    if (!this.motor.responder(ok)) return;
    this.elegida.set(i);
    if (m.id === 'zoom') this.vp.set(1280);
    this.tiro.emit(ok);
    if (this.motor.terminado()) this.cerrado.emit(this.motor.resultado());
  }

  /** La misión de arreglar se confirma con la regla que esté puesta, no eligiendo de una lista. */
  protected confirmarRegla(): void {
    const i = this.reglas.findIndex((r) => r.id === this.regla());
    this.elegir(i);
  }

  protected siguiente(): void {
    this.motor.siguiente();
    this.preparar();
  }

  protected ir(i: number): void {
    this.motor.ir(i);
    this.preparar();
  }

  protected repetir(): void {
    this.motor.reiniciar();
    this.tocado.set(false);
    this.vp.set(1460);
    this.regla.set('congelada');
    this.centrado.set(false);
    this.preparar();
  }

  /** Trocitos del nombre para pintar la línea como Chrome: etiqueta y clase por separado. */
  protected etiqueta(p: Pieza): string {
    return p.nombre.split('.')[0];
  }

  protected claseDe(p: Pieza): string {
    return p.nombre.split('.')[1];
  }

  protected altoDe(id: Pieza['id']): number {
    return this.piezas.find((p) => p.id === id)?.alto ?? 0;
  }

  protected clase(i: number): string {
    if (!this.motor.contestada()) return '';
    if (i === this.correcta()) return 'es-bien';
    if (i === this.elegida()) return 'es-mal';
    return '';
  }

  protected claseRegla(r: Regla): string {
    const i = this.reglas.findIndex((x) => x.id === r);
    if (!this.motor.contestada()) return this.regla() === r ? 'es-on' : '';
    return this.clase(i);
  }

  /** Deja la escena como la necesita la misión que se abre. */
  private preparar(): void {
    this.elegida.set(null);
    const id = this.mision().id;
    if (id === 'hueco') {
      this.regla.set('congelada');
      this.centrado.set(false);
      this.vp.set(1920);
    } else if (id === 'arreglar' && !this.motor.contestada()) {
      this.regla.set('congelada');
      this.centrado.set(false);
    } else if (id === 'zoom' && this.motor.contestada()) {
      this.vp.set(1280);
    }
  }
}
