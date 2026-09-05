import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';

import { Motor, Resultado } from './juego.types';

interface Opcion {
  readonly label: string;
  readonly ok: boolean;
  /** Lo que se cuenta al elegir ESTA opción: acertando o no, se aprende algo concreto. */
  readonly porque: string;
}

interface Mision {
  readonly id: 'donde' | 'menu' | 'pestana' | 'etiqueta' | 'quien' | 'deshacer';
  readonly titulo: string;
  readonly texto: string;
  readonly opciones: readonly Opcion[];
}

/**
 * Caso 1 · Abrir el inspector.
 *
 * Seis gestos que hay que tener automatizados antes de poder medir nada: dónde se hace clic
 * derecho, qué opción del menú, qué pestaña, qué número de la etiqueta es el ancho, cuándo mirar
 * Styles y cuándo Computed, y cómo se deshace todo. Cada misión se responde pinchando en la propia
 * escena (el menú, las pestañas, la etiqueta), no en una lista aparte: el gesto que se entrena es
 * el mismo que luego hay que hacer en Chrome.
 *
 * El «porqué» va por OPCIÓN, no por misión: quien falla se lleva la explicación de su error
 * concreto, que es lo que corrige el hábito.
 */
@Component({
  selector: 'app-nivel-inspector',
  templateUrl: './nivel-inspector.component.html',
  styleUrl: './nivel-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NivelInspectorComponent {
  readonly tiro = output<boolean>();
  readonly cerrado = output<Resultado>();

  protected readonly motor = new Motor(6);
  protected readonly elegida = signal<number | null>(null);

  protected readonly misiones: readonly Mision[] = [
    {
      id: 'donde',
      titulo: '¿Dónde haces clic derecho?',
      texto:
        'Quieres medir la letra del chip «Activo». Pincha en la página de abajo justo donde harías ' +
        'clic derecho para inspeccionarlo.',
      opciones: [
        {
          label: 'El fondo de la página',
          ok: false,
          porque:
            'Eso selecciona la página entera. Te saldrán los números del lienzo, no los del chip.',
        },
        {
          label: 'El marco de la tarjeta',
          ok: false,
          porque:
            'Seleccionas la tarjeta que envuelve al chip. Leerás su tamaño y su fondo, pero la ' +
            'letra del chip no está ahí: está un nivel más adentro.',
        },
        {
          label: 'La palabra «Activo»',
          ok: true,
          porque:
            'Sobre la letra, siempre. Si señalas el marco lees el marco; si señalas la palabra lees ' +
            'la palabra. Cuando dudes, mira qué línea queda azul en el panel: esa es la que mides.',
        },
      ],
    },
    {
      id: 'menu',
      titulo: 'Se abre el menú. ¿Qué opción?',
      texto: 'Es siempre la misma y está siempre en el mismo sitio. Pínchala.',
      opciones: [
        { label: 'Atrás', ok: false, porque: 'Eso navega. Lo que buscas está al final del menú.' },
        { label: 'Recargar', ok: false, porque: 'Eso recarga. Lo que buscas está al final del menú.' },
        {
          label: 'Guardar como…',
          ok: false,
          porque: 'Eso descarga la página. Lo que buscas está al final del menú.',
        },
        { label: 'Imprimir…', ok: false, porque: 'Casi. Es la de justo debajo.' },
        {
          label: 'Inspeccionar',
          ok: true,
          porque:
            'La última. En algunos navegadores pone «Inspeccionar elemento», pero siempre cierra ' +
            'el menú. Abre el panel con lo que has señalado ya seleccionado.',
        },
      ],
    },
    {
      id: 'pestana',
      titulo: '¿Qué pestaña?',
      texto:
        'El panel trae muchas pestañas arriba. Solo una enseña el código de la página con lo que ' +
        'has seleccionado resaltado. Pínchala.',
      opciones: [
        {
          label: 'Elements',
          ok: true,
          porque:
            'Elements («elementos») es la única que te importa para medir: a la izquierda el ' +
            'código, con tu pieza en azul; a la derecha sus estilos.',
        },
        {
          label: 'Console',
          ok: false,
          porque:
            'La consola sirve para escribir órdenes. La usarás para atajos, pero el código de la ' +
            'página está en Elements.',
        },
        { label: 'Sources', ok: false, porque: 'Ahí viven los ficheros del programa. No es lo tuyo.' },
        { label: 'Network', ok: false, porque: 'Eso es el tráfico de red. No es lo tuyo.' },
        { label: 'Performance', ok: false, porque: 'Eso mide velocidad. No es lo tuyo.' },
      ],
    },
    {
      id: 'etiqueta',
      titulo: '¿Cuál de los dos números es el ancho?',
      texto:
        'Al pasar el ratón por una línea del código, Chrome pinta la pieza en la página y enseña ' +
        'esta etiqueta. Pincha el número que es el ANCHO.',
      opciones: [
        {
          label: '1320.5',
          ok: true,
          porque:
            'Siempre es ancho × alto, como una foto de 30 × 20. El primero es lo ancho. El segundo ' +
            '(1280) es lo alto, y para el caso del ancho no dice nada.',
        },
        {
          label: '1280',
          ok: false,
          porque:
            'Ese es el alto. La etiqueta va siempre ancho × alto, como una foto de 30 × 20: el ' +
            'primer número es el que buscas.',
        },
      ],
    },
    {
      id: 'quien',
      titulo: 'Styles o Computed',
      texto:
        'Quieres saber <strong>quién escribió la regla</strong> del ancho y poder cambiarla ahí ' +
        'mismo para probar. ¿Qué pestaña del panel derecho abres?',
      opciones: [
        {
          label: 'Styles',
          ok: true,
          porque:
            'Styles te dice quién escribió cada instrucción y te deja editarla. Computed solo te ' +
            'da el número final, sin decirte de dónde sale ni dejarte tocarlo. Quédate en Styles; ' +
            'Computed solo para cuando un valor viene de cinco sitios y no sabes cuál gana.',
        },
        {
          label: 'Computed',
          ok: false,
          porque:
            'Computed («calculado») es el resultado final, con todas las cuentas hechas. No te ' +
            'dice quién puso la regla ni te deja cambiarla. Para eso es Styles.',
        },
      ],
    },
    {
      id: 'deshacer',
      titulo: 'Has cambiado tres valores. ¿Cómo vuelves atrás?',
      texto:
        'Has probado cosas en Styles y la página ya no se parece a la original. Quieres dejarla ' +
        'exactamente como estaba.',
      opciones: [
        {
          label: 'Recargar la página (Cmd + R)',
          ok: true,
          porque:
            'Nada de lo que haces en el panel es real: vive solo en tu pantalla. Al recargar, todo ' +
            'vuelve a como lo sirve el servidor. Por eso no puedes romper nada.',
        },
        {
          label: 'Pulsar Cmd + Z varias veces',
          ok: false,
          porque:
            'Deshace la última edición del panel, pero no siempre y no todo. Lo seguro es recargar: ' +
            'nada de lo que tocas en el panel se guarda.',
        },
        {
          label: 'Cerrar el panel del inspector',
          ok: false,
          porque:
            'Cerrar el panel no deshace los cambios; siguen en la página hasta que recargas. Y son ' +
            'inofensivos: nada de eso se guarda en ningún sitio.',
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

  protected elegir(i: number): void {
    const ok = this.mision().opciones[i].ok;
    if (!this.motor.responder(ok)) return;
    this.elegida.set(i);
    this.tiro.emit(ok);
    if (this.motor.terminado()) this.cerrado.emit(this.motor.resultado());
  }

  protected siguiente(): void {
    this.motor.siguiente();
    this.elegida.set(null);
  }

  protected repetir(): void {
    this.motor.reiniciar();
    this.elegida.set(null);
  }

  /** La clase de una opción una vez contestada: la buena en verde, la elegida mala en rojo. */
  protected clase(i: number): string {
    if (!this.motor.contestada()) return '';
    if (i === this.correcta()) return 'es-bien';
    if (i === this.elegida()) return 'es-mal';
    return '';
  }
}
