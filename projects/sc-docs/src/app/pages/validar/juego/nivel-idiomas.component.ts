import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';

import { Motor, Resultado } from './juego.types';

interface Opcion {
  readonly label: string;
  readonly ok: boolean;
  readonly porque: string;
}

interface Mision {
  readonly id: 'parejas' | 'eje' | 'fill' | 'tarta' | 'disfraz' | 'unidades';
  readonly titulo: string;
  readonly texto: string;
  readonly opciones: readonly Opcion[];
}

/** Una pareja Figma ↔ CSS del emparejamiento. */
interface Pareja {
  readonly figma: string;
  readonly css: string;
  readonly truco: string;
}

/** Orden fijo en que se barajan las tarjetas de CSS: si estuvieran alineadas no habría juego. */
const BARAJA = [3, 0, 5, 1, 4, 2];

/**
 * Caso 3 · Hablar los dos idiomas.
 *
 * Quien diseña piensa en Hug, Fill, mínimo y el cuadradito de alineación; el navegador lo dice
 * con otras palabras. Este caso las empareja y, sobre todo, deshace dos confusiones que se
 * midieron el 2026-09-05 explicándolo en vivo: que alineación no es tamaño (aunque en el eje
 * vertical `align-items` sí estire), y que `1fr` no es «full resolution» sino una fracción de lo
 * que sobra.
 *
 * El emparejamiento se puntúa por errores, no por una sola respuesta: se da por bueno con un
 * fallo como máximo. Las demás misiones siguen el patrón de una respuesta.
 */
@Component({
  selector: 'app-nivel-idiomas',
  templateUrl: './nivel-idiomas.component.html',
  styleUrl: './nivel-idiomas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NivelIdiomasComponent {
  readonly tiro = output<boolean>();
  readonly cerrado = output<Resultado>();

  protected readonly motor = new Motor(6);
  protected readonly elegida = signal<number | null>(null);

  // ── emparejamiento ──
  protected readonly parejas: readonly Pareja[] = [
    {
      figma: 'Hug contents',
      css: 'no escribas nada',
      truco: 'Abrazar el contenido es el estado natural de una caja. Si no dices nada, hace Hug.',
    },
    {
      figma: 'Fill container',
      css: '1fr',
      truco: 'En una rejilla, 1fr. En una fila, flex: 1. Los dos dicen «llévate lo que sobre».',
    },
    {
      figma: 'Fixed (W con un número)',
      css: 'width: 881px',
      truco: 'Si ves un número en px, es fixed. Da igual cómo esté escrito alrededor.',
    },
    {
      figma: 'Min width',
      css: 'min-width: 500px',
      truco: 'Un suelo. También es el PRIMER valor de un minmax(a, b).',
    },
    {
      figma: 'Alineación vertical (arriba / centro / abajo)',
      css: 'align-items',
      truco: 'align = vertical, mientras la fila sea horizontal. Si el auto-layout es vertical, se intercambian.',
    },
    {
      figma: 'Alineación horizontal (izq / centro / der)',
      css: 'justify-content',
      truco: 'Viene de «justificar» un texto: reparte a lo largo del renglón, o sea en horizontal.',
    },
  ];
  protected readonly baraja = BARAJA;
  protected readonly selFigma = signal<number | null>(null);
  protected readonly emparejadas = signal<ReadonlySet<number>>(new Set());
  protected readonly errores = signal(0);
  /** El par que acaba de fallar, para sacudirlo un instante. */
  protected readonly fallida = signal<readonly [number, number] | null>(null);

  // ── demo del eje ──
  protected readonly alineadoArriba = signal(true);
  protected readonly tocadoEje = signal(false);

  protected readonly misiones: readonly Mision[] = [
    {
      id: 'parejas',
      titulo: 'Empareja los dos idiomas',
      texto:
        'A la izquierda, cómo lo dices en Figma. A la derecha, cómo lo dice el navegador. Pincha ' +
        'uno de cada lado. Se da por bueno con <strong>un fallo como máximo</strong>.',
      opciones: [],
    },
    {
      id: 'eje',
      titulo: '¿En qué eje se mueve?',
      texto:
        'La fila de abajo tiene un menú bajito y una tarjeta alta, y lleva <code>align-items: ' +
        'start</code>. <strong>Desmarca la casilla</strong> y mira hacia dónde se mueve el menú.',
      opciones: [
        {
          label: 'Hacia abajo: se estira en vertical',
          ok: true,
          porque:
            'align-items manda en el eje vertical (mientras la fila sea horizontal). Al quitar el ' +
            '«start», el menú vuelve a su valor por defecto, que es estirarse hasta igualar a la ' +
            'pieza más alta. No hay que aprenderlo: lo has visto moverse hacia abajo.',
        },
        {
          label: 'Hacia la derecha: se ensancha en horizontal',
          ok: false,
          porque:
            'Se ha estirado hacia ABAJO. align-items manda en el eje vertical; el horizontal lo ' +
            'lleva justify-content. Regla para no dudar: quita la casilla y mira hacia dónde va.',
        },
      ],
    },
    {
      id: 'fill',
      titulo: 'Ponle nombre en Figma',
      texto:
        'Cuando has quitado la casilla, el menú se ha estirado hasta medir lo mismo que la tarjeta. ' +
        '¿Cómo se llama eso en Figma?',
      opciones: [
        {
          label: 'Fill container',
          ok: true,
          porque:
            'Estirarse para llenar el hueco del padre es Fill container. En una fila, el valor por ' +
            'defecto de align-items es stretch, que es exactamente eso. Y «start» es ponerle Hug y ' +
            'anclarlo arriba.',
        },
        {
          label: 'Hug contents',
          ok: false,
          porque:
            'Hug es lo contrario: medir lo que mide el contenido. Eso era lo que hacía CON la ' +
            'casilla marcada (align-items: start). Al quitarla se estira hasta llenar: Fill container.',
        },
        {
          label: 'Fixed',
          ok: false,
          porque:
            'Fixed sería un número clavado. Aquí el menú ha crecido hasta igualar a la tarjeta, o ' +
            'sea que depende del hueco: eso es Fill container.',
        },
      ],
    },
    {
      id: 'tarta',
      titulo: 'Repartir lo que sobra',
      texto:
        'Un marco de 1321. Primero se colocan las cosas fijas: menú 235 y separación 28. Sobran ' +
        '1058. Si las dos columnas siguientes van a <code>1fr 2fr</code>, ¿cuánto se lleva la ' +
        'segunda?',
      opciones: [
        {
          label: 'Un tercio',
          ok: false,
          porque:
            'Un tercio es lo que se lleva la PRIMERA (1fr de 3fr en total). fr es una fracción de lo ' +
            'que sobra: 1fr 2fr son tres trozos, uno para la primera y dos para la segunda.',
        },
        {
          label: 'Dos tercios',
          ok: true,
          porque:
            'fr es «fracción de lo que sobra». 1fr 2fr son tres trozos: uno y dos. La segunda se ' +
            'lleva 2 de 3, unos 705 de los 1058. Y con una sola columna a 1fr, se lo lleva todo: por ' +
            'eso 1fr a solas es Fill container.',
        },
        {
          label: 'La mitad',
          ok: false,
          porque:
            'La mitad sería 1fr 1fr. Con 1fr 2fr hay tres trozos en total y la segunda se lleva dos: ' +
            'dos tercios. fr no es un tamaño, es una parte del sobrante.',
        },
      ],
    },
    {
      id: 'disfraz',
      titulo: 'El disfraz',
      texto:
        'En una regla ves <code>minmax(881px, 881px)</code>. Parece que hay un mínimo. ¿Qué es en ' +
        'realidad?',
      opciones: [
        {
          label: 'Un Fixed disfrazado',
          ok: true,
          porque:
            'minmax es mínimo y máximo. Si los dos son el mismo número, no hay margen: es una ' +
            'medida fija con otro nombre. Es justo lo que congeló la tarjeta del caso 2.',
        },
        {
          label: 'Un mínimo de 881',
          ok: false,
          porque:
            'Hay un mínimo, sí, pero también un MÁXIMO de 881. Con los dos iguales no puede ni ' +
            'crecer ni encoger: es un Fixed disfrazado. Un mínimo de verdad sería minmax(881px, 1fr).',
        },
        {
          label: 'Un Fill con suelo',
          ok: false,
          porque:
            'Fill con suelo sería minmax(881px, 1fr): el 1fr es lo que deja crecer. Con 881 en los ' +
            'dos sitios no crece nada: es un Fixed disfrazado.',
        },
      ],
    },
    {
      id: 'unidades',
      titulo: 'rem y px',
      texto:
        'La regla está escrita en rem y tú quieres probar un mínimo de 500 píxeles en Styles. ¿Qué ' +
        'haces?',
      opciones: [
        {
          label: 'Escribo 500px tal cual',
          ok: true,
          porque:
            'CSS mezcla rem y px sin problema: 14.6875rem minmax(500px, 1fr) es válido y equivale a ' +
            'ponerlo todo en rem. Si algún día necesitas convertir, divide entre 16 (500 ÷ 16 = 31.25). ' +
            'Tus devs escriben rem porque crece con la letra del navegador (accesibilidad) y porque la ' +
            'escala del sistema está en rem; para probar en el panel, px y a correr.',
        },
        {
          label: 'Tengo que convertirlo a rem o el navegador lo ignora',
          ok: false,
          porque:
            'No hace falta: CSS mezcla rem y px sin problema. Puedes escribir 500px al lado de un ' +
            '14.6875rem y funciona igual. Si quieres convertir, divide entre 16 (500 ÷ 16 = 31.25rem), ' +
            'pero para probar, px.',
        },
        {
          label: 'Escribo 500, sin unidad',
          ok: false,
          porque:
            'Sin unidad el navegador no sabe qué es y descarta la línea. Escribe 500px tal cual: ' +
            'CSS mezcla rem y px sin problema. El rem lo usan tus devs por accesibilidad (crece con ' +
            'la letra del navegador), pero para probar en el panel, px.',
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
  protected readonly parejasHechas = computed(() => this.emparejadas().size);
  protected readonly porqueParejas = computed(() =>
    this.motor.estado()
      ? `Las seis, con ${this.errores()} fallo${this.errores() === 1 ? '' : 's'}. Debajo tienes el truco de cada pareja: es la chuleta.`
      : `${this.errores()} fallos. No pasa nada: debajo tienes el truco de cada pareja. Léelos y repite el caso cuando quieras.`,
  );

  // ── emparejamiento ──

  protected elegirFigma(i: number): void {
    if (this.motor.contestada() || this.emparejadas().has(i)) return;
    this.selFigma.set(i);
  }

  protected elegirCss(i: number): void {
    const f = this.selFigma();
    if (this.motor.contestada() || f === null || this.emparejadas().has(i)) return;
    if (f === i) {
      this.emparejadas.update((s) => new Set([...s, i]));
      this.selFigma.set(null);
      if (this.emparejadas().size === this.parejas.length) {
        const ok = this.errores() <= 1;
        this.motor.responder(ok);
        this.tiro.emit(ok);
        this.comprobarCierre();
      }
      return;
    }
    this.errores.update((n) => n + 1);
    this.fallida.set([f, i]);
    this.selFigma.set(null);
    setTimeout(() => this.fallida.set(null), 450);
  }

  protected estaFallida(lado: 0 | 1, i: number): boolean {
    const f = this.fallida();
    return f !== null && f[lado] === i;
  }

  // ── demo del eje ──

  protected alternarEje(): void {
    this.alineadoArriba.update((v) => !v);
    this.tocadoEje.set(true);
  }

  // ── el bucle ──

  protected elegir(i: number): void {
    const m = this.mision();
    if (m.id === 'eje' && !this.tocadoEje()) return;
    const ok = m.opciones[i].ok;
    if (!this.motor.responder(ok)) return;
    this.elegida.set(i);
    this.tiro.emit(ok);
    this.comprobarCierre();
  }

  protected siguiente(): void {
    this.motor.siguiente();
    this.elegida.set(null);
  }

  protected ir(i: number): void {
    this.motor.ir(i);
    this.elegida.set(null);
  }

  protected repetir(): void {
    this.motor.reiniciar();
    this.elegida.set(null);
    this.selFigma.set(null);
    this.emparejadas.set(new Set());
    this.errores.set(0);
    this.alineadoArriba.set(true);
    this.tocadoEje.set(false);
  }

  protected clase(i: number): string {
    if (!this.motor.contestada()) return '';
    if (i === this.correcta()) return 'es-bien';
    if (i === this.elegida()) return 'es-mal';
    return '';
  }

  private comprobarCierre(): void {
    if (this.motor.terminado()) this.cerrado.emit(this.motor.resultado());
  }
}
