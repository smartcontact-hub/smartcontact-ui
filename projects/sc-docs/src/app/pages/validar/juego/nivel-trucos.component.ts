import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';

import { Motor, Resultado } from './juego.types';

interface Opcion {
  readonly label: string;
  readonly ok: boolean;
  readonly porque: string;
}

interface Mision {
  readonly id: 'cero' | 'dispositivo' | 'flechas' | 'casilla' | 'grid' | 'ventana';
  readonly titulo: string;
  readonly texto: string;
  /** Vacío en la misión de las flechas, que se resuelve con el teclado y no eligiendo. */
  readonly opciones: readonly Opcion[];
}

/** Adónde tiene que llegar el valor en la misión de las flechas. */
const META = 560;
const INICIO = 500;

/**
 * Caso 5 · Trucos del oficio.
 *
 * Seis atajos que separan a quien pelea con el inspector de quien lo usa: `$0`, el modo
 * dispositivo para probar cualquier ancho sin tener el monitor, las flechas del teclado sobre un
 * valor, la casilla que apaga una regla sin borrarla, la etiqueta `grid` que pinta las columnas y
 * el ancho de la ventana que Chrome enseña solo.
 *
 * La misión de las flechas no se contesta: se HACE. El campo escucha ↑/↓ (y Shift para saltar de
 * diez en diez), igual que el panel real, y se da por buena cuando el valor llega a la meta. Se
 * puede abandonar, que cuenta como fallo; lo que no se puede es teclear el número, porque
 * entonces no se estaría practicando el gesto.
 */
@Component({
  selector: 'app-nivel-trucos',
  templateUrl: './nivel-trucos.component.html',
  styleUrl: './nivel-trucos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NivelTrucosComponent {
  readonly tiro = output<boolean>();
  readonly cerrado = output<Resultado>();

  protected readonly motor = new Motor(6);
  protected readonly elegida = signal<number | null>(null);
  /** El valor del campo de la misión de las flechas. */
  protected readonly valor = signal(INICIO);
  protected readonly meta = META;
  /** Cuántas pulsaciones ha hecho; enseña la pista de Shift si va de una en una. */
  protected readonly pulsaciones = signal(0);

  protected readonly misiones: readonly Mision[] = [
    {
      id: 'cero',
      titulo: 'Medir sin saber cómo se llama',
      texto:
        'Tienes el chip seleccionado en Elements y pasas a la pestaña Console. Quieres su ancho ' +
        'exacto, pero no sabes cómo se llama la pieza. ¿Qué escribes?',
      opciones: [
        {
          label: '$0.getBoundingClientRect().width',
          ok: true,
          porque:
            '<code>$0</code> significa «lo que tengo seleccionado ahora mismo en Elements». No hay ' +
            'que saber el nombre de nada: seleccionas, escribes esto, Enter, y sale el ancho.',
        },
        {
          label: 'chip.width',
          ok: false,
          porque:
            'La consola no sabe qué es «chip». Lo que sí sabe es qué tienes seleccionado: eso es ' +
            '<code>$0</code>. Con <code>$0.getBoundingClientRect().width</code> no hace falta nombre.',
        },
        {
          label: 'document.ancho',
          ok: false,
          porque:
            'Eso no existe. El truco es <code>$0</code>: «lo que tengo seleccionado». Escribes ' +
            '<code>$0.getBoundingClientRect().width</code> y te da el ancho de la pieza marcada.',
        },
      ],
    },
    {
      id: 'dispositivo',
      titulo: 'Probar un monitor que no tienes',
      texto:
        'Trabajas en un portátil y quieres ver la página exactamente como la vería alguien con un ' +
        'monitor de 1366 de ancho. ¿Qué haces?',
      opciones: [
        {
          label: 'Cmd + Shift + M, y escribo 1366 en la cajita de ancho',
          ok: true,
          porque:
            'Es el modo dispositivo del inspector. Aparece una barra encima de la página con dos ' +
            'cajitas, ancho y alto: escribes 1366 y la página se comporta como en ese monitor. Vale ' +
            'para 1920, 1280, lo que quieras. Sin ese modo estarías estrechando la ventana a ojo.',
        },
        {
          label: 'Estrecho la ventana del navegador hasta que me parezca',
          ok: false,
          porque:
            'A ojo no sabes a qué ancho estás. El inspector tiene un modo para esto: ' +
            '<strong>Cmd + Shift + M</strong> abre una barra con dos cajitas donde escribes el ' +
            'ancho exacto, 1366 o el que sea.',
        },
        {
          label: 'Cambio la resolución de la pantalla en Ajustes del Mac',
          ok: false,
          porque:
            'Funciona, pero te desmonta el escritorio y no escala igual. El inspector lo hace sin ' +
            'tocar nada: <strong>Cmd + Shift + M</strong> y escribes 1366 en la cajita de ancho.',
        },
      ],
    },
    {
      id: 'flechas',
      titulo: 'Encontrar el número probando',
      texto:
        'En Styles has puesto <code>min-width: 500px</code> y quieres ver cómo queda a 560. Pincha ' +
        'en el valor de abajo y <strong>llévalo a 560 solo con las flechas del teclado</strong>. ' +
        'No se puede teclear el número.',
      opciones: [],
    },
    {
      id: 'casilla',
      titulo: 'Ver qué hace una regla',
      texto:
        'Hay una instrucción en Styles y no sabes qué cambia en la página. Quieres comprobarlo ' +
        'sin borrarla ni tener que volver a escribirla.',
      opciones: [
        {
          label: 'Desmarco su casilla y miro qué se mueve',
          ok: true,
          porque:
            'Cada instrucción de Styles tiene una casilla a la izquierda. Al desmarcarla, la regla ' +
            'se apaga y ves qué se mueve. La vuelves a marcar y todo vuelve. Es la forma de saber ' +
            'qué hace una línea sin leerla: verlo.',
        },
        {
          label: 'La borro y, si hace falta, la vuelvo a escribir',
          ok: false,
          porque:
            'No hace falta. A la izquierda de cada instrucción hay una casilla: desmarcarla la ' +
            'apaga sin borrarla, y volver a marcarla la enciende. Cero riesgo de escribirla mal.',
        },
        {
          label: 'Cambio su valor a 0',
          ok: false,
          porque:
            'Un 0 no es «apagado», es otro valor, y puede cambiar cosas distintas. Lo limpio es ' +
            'desmarcar la casilla de la izquierda de la instrucción: se apaga tal cual, y se vuelve ' +
            'a encender igual.',
        },
      ],
    },
    {
      id: 'grid',
      titulo: 'Ver las columnas pintadas',
      texto:
        'Quieres ver encima de la página dónde empieza y acaba cada columna y cuánto mide la ' +
        'separación entre ellas, sin sumar números.',
      opciones: [
        {
          label: 'Pincho la etiqueta gris «grid» que hay al lado de la línea',
          ok: true,
          porque:
            'Junto a la línea del código que organiza las columnas aparece una etiqueta gris que ' +
            'pone <code>grid</code>. Al pincharla, Chrome pinta las columnas con líneas moradas y la ' +
            'separación con una banda a rayas. Lo mismo pasa con <code>flex</code>.',
        },
        {
          label: 'Hago una captura y mido encima con una regla',
          ok: false,
          porque:
            'No hace falta: al lado de la línea del código hay una etiqueta gris que pone ' +
            '<code>grid</code>. Pincharla pinta las columnas y la separación encima de la página, ' +
            'con sus medidas.',
        },
        {
          label: 'Busco «gap» en Computed y me lo imagino',
          ok: false,
          porque:
            'Eso te da el número, no el dibujo. Para verlo pintado, pincha la etiqueta gris ' +
            '<code>grid</code> que hay junto a la línea del código: columnas en morado, separación ' +
            'a rayas.',
        },
      ],
    },
    {
      id: 'ventana',
      titulo: 'Saber cuánto mide tu ventana',
      texto:
        'Estás probando cómo se ve la página al estrechar la ventana y quieres saber en qué ancho ' +
        'estás exactamente, sin escribir nada.',
      opciones: [
        {
          label: 'Con el panel abierto, estrecho la ventana: Chrome lo pinta arriba a la derecha',
          ok: true,
          porque:
            'Mientras el inspector está abierto, al cambiar el tamaño de la ventana Chrome enseña ' +
            'durante un segundo, arriba a la derecha de la página, algo como <code>1460 × 792</code>. ' +
            'Ancho × alto, como siempre. Sin escribir nada.',
        },
        {
          label: 'Miro la resolución del monitor en Ajustes',
          ok: false,
          porque:
            'La resolución del monitor no es el ancho de la ventana (la barra lateral, el zoom y el ' +
            'propio panel se lo comen). Con el inspector abierto, al estrechar la ventana Chrome ' +
            'pinta el ancho real arriba a la derecha.',
        },
        {
          label: 'Cuento los píxeles en una captura de pantalla',
          ok: false,
          porque:
            'Chrome ya te lo dice: con el inspector abierto, al cambiar el tamaño de la ventana ' +
            'aparece arriba a la derecha el ancho × alto durante un segundo.',
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
  /** El «porqué» de la misión de las flechas, que no tiene opciones. */
  protected readonly porqueFlechas = computed(() =>
    this.motor.estado()
      ? 'Con las flechas el valor sube y baja de uno en uno, y con Shift de diez en diez. Así ' +
        'encuentras el número bueno mirando la página, en vez de calculándolo. Vale en cualquier ' +
        'valor numérico de Styles.'
      : 'No pasa nada. El truco: pincha el número, y ↑ o ↓ lo mueven de uno en uno; con Shift, de ' +
        'diez en diez. Para 60 de diferencia, seis pulsaciones con Shift.',
  );

  protected elegir(i: number): void {
    const ok = this.mision().opciones[i].ok;
    if (!this.motor.responder(ok)) return;
    this.elegida.set(i);
    this.tiro.emit(ok);
    this.comprobarCierre();
  }

  /** La misión de las flechas: el campo escucha el teclado como el panel real. */
  protected tecla(e: KeyboardEvent): void {
    if (this.motor.contestada()) return;
    const paso = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.valor.update((v) => v + (e.key === 'ArrowUp' ? paso : -paso));
      this.pulsaciones.update((n) => n + 1);
      if (this.valor() === META) {
        this.motor.responder(true);
        this.tiro.emit(true);
        this.comprobarCierre();
      }
      return;
    }
    // Se deja pasar el foco (Tab) y poco más; teclear el número es justo lo que no se practica.
    if (e.key !== 'Tab' && e.key !== 'Escape') e.preventDefault();
  }

  protected rendirse(): void {
    if (!this.motor.responder(false)) return;
    this.tiro.emit(false);
    this.comprobarCierre();
  }

  protected siguiente(): void {
    this.motor.siguiente();
    this.elegida.set(null);
  }

  protected repetir(): void {
    this.motor.reiniciar();
    this.elegida.set(null);
    this.valor.set(INICIO);
    this.pulsaciones.set(0);
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
