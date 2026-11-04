/**
 * Hablar en vez de escribir, con el reconocimiento de voz DEL NAVEGADOR (Web Speech API): no pasa por el Worker ni por
 * Workers AI, así que no gasta cupo. El permiso del micrófono lo pide el propio navegador la primera vez.
 *
 * Dónde funciona: Chrome, Edge y Safari. Firefox no lo trae: ahí `vozDisponible()` es falso y el botón no sale. En
 * Chrome el audio lo transcribe el servicio de Google; Safari lo hace en el dispositivo.
 *
 * Se resuelve al usarlo, no al cargar el módulo: así una prueba puede poner un reconocedor falso antes de abrir el panel.
 */

interface Alternativa {
  readonly transcript: string;
}

interface Resultado {
  readonly isFinal: boolean;
  readonly 0: Alternativa;
}

interface EventoResultado {
  readonly resultIndex: number;
  readonly results: ArrayLike<Resultado>;
}

interface Reconocedor {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: EventoResultado) => void) | null;
  onerror: ((e: { readonly error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type ConstructorReconocedor = new () => Reconocedor;

function constructor(): ConstructorReconocedor | null {
  const w = globalThis as unknown as {
    SpeechRecognition?: ConstructorReconocedor;
    webkitSpeechRecognition?: ConstructorReconocedor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function vozDisponible(): boolean {
  return constructor() !== null;
}

/** El error del navegador, a la clave i18n de lo que se le dice a la persona. `null`: no hay nada que decir. */
function claveDeError(error: string): string | null {
  switch (error) {
    case 'aborted':
      return null;
    case 'not-allowed':
    case 'service-not-allowed':
      return 'chrome.ask.voz.error.permiso';
    case 'no-speech':
      return 'chrome.ask.voz.error.silencio';
    case 'audio-capture':
      return 'chrome.ask.voz.error.micro';
    case 'network':
      return 'chrome.ask.voz.error.red';
    default:
      return 'chrome.ask.voz.error.otro';
  }
}

export interface EscuchaOpciones {
  /** `es` o `en`: el idioma en el que se habla, el de la doc. */
  readonly idioma: 'es' | 'en';
  /** Cada vez que cambia lo que lleva entendido (lo seguro y lo provisional, juntos). */
  readonly alOir: (texto: string) => void;
  /** Al callarse: lo entendido de seguro (vacío si no entendió nada) y, si falló, la clave i18n del motivo. */
  readonly alTerminar: (texto: string, error: string | null) => void;
}

/** Una escucha: empieza al crearla y termina sola cuando la persona se calla, o con `parar()`. */
export class Escucha {
  private readonly reconocedor: Reconocedor;
  private terminada = false;

  constructor(opciones: EscuchaOpciones) {
    const Reconocedor = constructor();
    if (!Reconocedor) throw new Error('Este navegador no reconoce voz');
    const r = new Reconocedor();
    r.lang = opciones.idioma === 'en' ? 'en-US' : 'es-ES';
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;

    let seguro = '';
    let error: string | null = null;
    r.onresult = (e) => {
      let provisional = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const trozo = e.results[i][0].transcript;
        if (e.results[i].isFinal) seguro += trozo;
        else provisional += trozo;
      }
      opciones.alOir((seguro + provisional).trim());
    };
    r.onerror = (e) => {
      error = claveDeError(e.error);
    };
    r.onend = () => {
      if (this.terminada) return;
      this.terminada = true;
      opciones.alTerminar(seguro.trim(), error);
    };
    this.reconocedor = r;
    r.start();
  }

  /** Deja de escuchar y se queda con lo entendido hasta ahora. */
  parar(): void {
    this.reconocedor.stop();
  }

  /** Corta sin enviar nada (al cerrar el panel). */
  cancelar(): void {
    this.terminada = true;
    this.reconocedor.abort();
  }
}
