import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import {
  ScButtonComponent,
  ScDrawerComponent,
  ScMessageComponent,
  ScSkeletonComponent,
  ScTextareaComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { COMPONENT_CATALOG } from '../../pages/components/component-catalog';
import { LanguageService } from '../language.service';
import { markdownAHtml, rutaDeFicha } from './ask-ai-markdown';
import { ASK_ENDPOINT, AskAiService } from './ask-ai.service';
import { AskAiVistaComponent, VistaStory, vistaDeRespuesta } from './ask-ai-vista.component';
import { Escucha, vozDisponible } from './ask-ai-voz';
import {
  Conversacion,
  MAX_CONVERSACIONES,
  MAX_MENSAJES,
  escribirHistorial,
  haceCuanto,
  leerHistorial,
  nuevoId,
} from './ask-ai-historial';

interface Mensaje {
  readonly rol: 'user' | 'assistant';
  readonly texto: string;
  /** Las fichas que leyó para contestar (cabecera `X-Sc-Fichas` del Worker). */
  readonly fichas?: readonly string[];
  readonly cargando?: boolean;
  /** Clave i18n del error, si no pudo contestar. */
  readonly error?: string;
  /**
   * El ejemplo vivo que sale aunque la respuesta no enlace ninguna story: el Playground de la ficha. Lo llevan las
   * respuestas a las preguntas sugeridas, que siempre son sobre el componente abierto. No gasta cupo: es la propia doc.
   */
  readonly vistaPorDefecto?: VistaStory;
}

/** La ficha en texto de cada página: la de su componente, o la de Fundamentos que la cubre. */
function fichaDeRuta(ruta: string): string | null {
  const comp = /^\/components\/([a-z0-9-]+)$/.exec(ruta);
  if (comp) return COMPONENT_CATALOG.some((c) => c.path === comp[1]) ? comp[1] : null;
  if (/^\/fundamentos\/(color|espaciado|tipografia)$/.test(ruta)) return 'tokens';
  if (ruta.startsWith('/fundamentos/patrones')) return 'patrones';
  if (ruta === '/fundamentos/iconos') return 'iconos';
  return null;
}

const NOMBRE_FUNDAMENTO: Readonly<Record<string, string>> = {
  tokens: 'chrome.ask.fichas.tokens',
  patrones: 'chrome.ask.fichas.patrones',
  iconos: 'chrome.ask.fichas.iconos',
};

/**
 * El panel de «Pregunta a la IA», como el «Ask PrimeNG» de primeng.dev: contesta con la doc. Al abrirlo vacío propone
 * tres preguntas sobre la página en la que estás; cada pregunta manda el nombre de su ficha y el Worker la lee (ver
 * `workers/sc-docs-ask/`). La conversación sigue al navegar: el panel vive en el marco, no en la página.
 *
 * Lo monta `AskAiComponent` (el botón flotante) con `@defer` la primera vez que se abre: así ni este código ni lo que
 * arrastra (DOMPurify, el campo, el cajón) pesan en la carga de cada ficha.
 */
@Component({
  selector: 'app-ask-ai-panel',
  imports: [
    RouterLink,
    AskAiVistaComponent,
    TranslatePipe,
    ScButtonComponent,
    ScDrawerComponent,
    ScMessageComponent,
    ScSkeletonComponent,
    ScTextareaComponent,
    ScIconComponent,
  ],
  templateUrl: './ask-ai-panel.component.html',
  styleUrl: './ask-ai-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskAiPanelComponent {
  /** La ruta abierta, sin consulta: decide la ficha y las preguntas sugeridas. */
  readonly ruta = input.required<string>();

  protected readonly ask = inject(AskAiService);
  private readonly translate = inject(TranslateService);
  private readonly lang = inject(LanguageService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);

  // ── Conversaciones guardadas (ask-ai-historial.ts) ──
  private readonly guardado = leerHistorial<Mensaje>();
  protected readonly conversaciones = signal<readonly Conversacion<Mensaje>[]>(this.guardado.conversaciones);
  /** La conversación que se está viendo; `null` mientras es nueva y aún no tiene ninguna respuesta guardada. */
  protected readonly activa = signal<string | null>(this.guardado.activa);
  /** ¿Se ve la lista de conversaciones en vez del hilo? */
  protected readonly verHistorial = signal(false);

  protected readonly mensajes = signal<readonly Mensaje[]>(
    this.guardado.conversaciones.find((c) => c.id === this.guardado.activa)?.mensajes ?? [],
  );
  protected readonly borrador = signal('');
  protected readonly ocupado = computed(() => this.mensajes().some((m) => m.cargando));
  private peticion: AbortController | null = null;

  private readonly hilo = viewChild<ElementRef<HTMLElement>>('hilo');
  private readonly campo = viewChild(ScTextareaComponent);

  // ── Hablar (ask-ai-voz.ts) ──
  /** ¿Sabe este navegador pasar voz a texto? Si no (Firefox), el micrófono no sale. */
  protected readonly vozDisponible = vozDisponible;
  protected readonly escuchando = signal(false);
  /** Clave i18n de por qué no se pudo escuchar (sin permiso, sin micrófono, no se oyó nada…). */
  protected readonly errorVoz = signal<string | null>(null);
  private escucha: Escucha | null = null;

  constructor() {
    // Cerrar el panel corta la escucha sin enviar nada; y lo mismo si el componente desaparece.
    effect(() => {
      if (!this.ask.abierto()) this.cancelarEscucha();
    });
    inject(DestroyRef).onDestroy(() => this.cancelarEscucha());
  }

  /**
   * El micrófono: la primera pulsación empieza a escuchar (el navegador pide permiso la primera vez) y lo que entiende va
   * apareciendo en la caja; al callarte se envía solo. Pulsarlo otra vez deja de escuchar y envía lo que lleve.
   */
  protected alternarVoz(): void {
    if (this.escucha) {
      this.escucha.parar();
      return;
    }
    if (this.ocupado()) return;
    const previo = this.borrador().trim();
    const unir = (oido: string): string => [previo, oido].filter(Boolean).join(' ');
    this.errorVoz.set(null);
    try {
      this.escucha = new Escucha({
        idioma: this.lang.current() === 'en' ? 'en' : 'es',
        alOir: (texto) => this.ponerEnCaja(unir(texto)),
        alTerminar: (texto, error) => {
          this.escucha = null;
          this.escuchando.set(false);
          if (texto) this.enviar(unir(texto));
          else if (error) this.errorVoz.set(error);
        },
      });
      this.escuchando.set(true);
    } catch {
      this.escucha = null;
      this.errorVoz.set('chrome.ask.voz.error.otro');
    }
  }

  private cancelarEscucha(): void {
    this.escucha?.cancelar();
    this.escucha = null;
    this.escuchando.set(false);
  }

  /** Escribe en la caja por los dos lados, como `vaciar()`: el enlace `[value]` solo no siempre llega. */
  private ponerEnCaja(texto: string): void {
    this.borrador.set(texto);
    this.campo()?.value.set(texto);
  }

  protected readonly ficha = computed(() => fichaDeRuta(this.ruta()));

  /** De qué va la página: el nombre del componente («Button»), el del Fundamento, o la doc entera. */
  protected readonly tema = computed(() => {
    const f = this.ficha();
    if (!f) return null;
    if (NOMBRE_FUNDAMENTO[f]) return { clave: NOMBRE_FUNDAMENTO[f] };
    return { texto: COMPONENT_CATALOG.find((c) => c.path === f)?.label ?? f };
  });

  /** Tres preguntas para empezar, como las de primeng.dev: sobre el componente abierto o, fuera de una ficha, generales. */
  protected readonly sugerencias = computed(() => {
    this.lang.current();
    const t = this.tema();
    const nombre = t?.texto ?? (t?.clave ? (this.translate.instant(t.clave) as string) : null);
    const claves =
      t?.texto && nombre
        ? ['chrome.ask.sug.uso', 'chrome.ask.sug.props', 'chrome.ask.sug.cuando']
        : ['chrome.ask.sug.aviso', 'chrome.ask.sug.color', 'chrome.ask.sug.importar'];
    return claves.map((c) => this.translate.instant(c, { tema: nombre }) as string);
  });

  protected nombreFicha(ficha: string): string {
    const clave = NOMBRE_FUNDAMENTO[ficha];
    if (clave) return this.translate.instant(clave) as string;
    return COMPONENT_CATALOG.find((c) => c.path === ficha)?.label ?? ficha;
  }

  protected readonly rutaDeFicha = rutaDeFicha;

  /** La respuesta partida: la story que enseñar (si enlaza una) y el texto sin la línea que solo era ese enlace. */
  protected partir(texto: string): { vista: VistaStory | null; texto: string } {
    return vistaDeRespuesta(texto);
  }

  /** La ficha de componente de la respuesta: la de la story que enseña o, si no, la primera que leyó. */
  protected fichaDe(m: Mensaje, vista: VistaStory | null): string | null {
    const ficha = vista?.ficha ?? m.fichas?.[0] ?? null;
    return ficha && COMPONENT_CATALOG.some((c) => c.path === ficha) ? ficha : null;
  }

  /** «Abrir en el Playground»: la ficha, bajando hasta la story de la respuesta (o hasta el Playground si no hay). */
  protected abrirPlayground(ficha: string, vista: VistaStory | null): void {
    const historia = vista?.ficha === ficha ? vista.historia : 'playground';
    const queryParams = vista?.ficha === ficha && vista.args ? { historia, args: vista.args } : { historia };
    void this.router.navigate(['/components', ficha], { queryParams });
  }

  /** El índice de la respuesta recién copiada: su botón dice «Copiado» un momento. */
  protected readonly copiada = signal<number | null>(null);

  protected copiarRespuesta(indice: number, texto: string): void {
    void navigator.clipboard.writeText(texto).then(() => {
      this.copiada.set(indice);
      setTimeout(() => this.copiada.update((i) => (i === indice ? null : i)), 1500);
    });
  }

  protected html(texto: string): SafeHtml {
    // El HTML sale de `markdownAHtml`, que escapa todo y lo pasa por DOMPurify: aquí solo se le deja pasar entero
    // (el saneador de Angular quitaría el botón de copiar de los bloques de código).
    return this.sanitizer.bypassSecurityTrustHtml(markdownAHtml(texto, this.translate.instant('chrome.ask.copiar') as string));
  }

  /** `sugerida`: viene de una de las tres preguntas de arriba; su respuesta trae siempre el Playground de la ficha. */
  protected enviar(texto = this.borrador(), sugerida = false): void {
    const pregunta = texto.trim();
    if (!pregunta || this.ocupado()) return;
    this.errorVoz.set(null);
    this.verHistorial.set(false);
    const historial = this.mensajes()
      .filter((m) => !m.error && !m.cargando && m.texto)
      .map((m) => ({ role: m.rol, content: m.texto }));
    this.vaciar();
    const ficha = this.ficha();
    const vistaPorDefecto: VistaStory | undefined =
      sugerida && ficha && COMPONENT_CATALOG.some((c) => c.path === ficha)
        ? { ficha, historia: 'playground', args: '' }
        : undefined;
    this.mensajes.update((ms) => [
      ...ms,
      { rol: 'user', texto: pregunta },
      { rol: 'assistant', texto: '', cargando: true, vistaPorDefecto },
    ]);
    this.bajar();
    void this.pedir(pregunta, historial);
  }

  /** Enter manda; Mayúsculas+Enter, salto de línea. */
  protected alTeclear(evento: KeyboardEvent): void {
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.isComposing) {
      evento.preventDefault();
      this.enviar();
    }
  }

  protected parar(): void {
    this.peticion?.abort();
  }

  /** Empieza otra conversación. La de ahora ya está en la lista (se guarda con cada respuesta): no se pierde. */
  protected nueva(): void {
    this.parar();
    this.mensajes.set([]);
    this.activa.set(null);
    this.verHistorial.set(false);
    this.vaciar();
    this.persistir();
  }

  protected abrirConversacion(c: Conversacion<Mensaje>): void {
    this.parar();
    this.mensajes.set(c.mensajes);
    this.activa.set(c.id);
    this.verHistorial.set(false);
    this.persistir();
    this.bajar(true);
  }

  protected borrarConversacion(id: string): void {
    this.conversaciones.update((cs) => cs.filter((c) => c.id !== id));
    if (this.activa() === id) {
      this.parar();
      this.mensajes.set([]);
      this.activa.set(null);
    }
    // Sin ninguna, el botón de la lista desaparece: la lista no puede quedarse abierta sin forma de salir.
    if (!this.conversaciones().length) this.verHistorial.set(false);
    this.persistir();
  }

  /** «hace 5 min, 3 preguntas»: lo que se lee bajo el título de cada conversación de la lista. */
  protected detalleConversacion(c: Conversacion<Mensaje>): string {
    const preguntas = c.mensajes.filter((m) => m.rol === 'user').length;
    const cuantas = this.translate.instant(
      preguntas === 1 ? 'chrome.ask.historial.unaPregunta' : 'chrome.ask.historial.preguntas',
      { n: preguntas },
    ) as string;
    const cuando =
      haceCuanto(c.actualizada, this.lang.current()) ?? (this.translate.instant('chrome.ask.historial.ahora') as string);
    return `${cuando}, ${cuantas}`;
  }

  /**
   * Guarda la conversación de ahora al frente de la lista. Se llama al cerrar cada respuesta (también si falla o se
   * para): así lo guardado nunca lleva una respuesta a medias marcada como «cargando».
   */
  private guardar(): void {
    const mensajes = this.mensajes()
      .filter((m) => !m.cargando || m.texto)
      .map((m) => (m.cargando ? { ...m, cargando: false } : m))
      .slice(-MAX_MENSAJES);
    if (!mensajes.length) return;
    const id = this.activa() ?? nuevoId();
    const primera = mensajes.find((m) => m.rol === 'user')?.texto ?? '';
    const conversacion: Conversacion<Mensaje> = {
      id,
      titulo: primera.length > 80 ? primera.slice(0, 79) + '…' : primera,
      mensajes,
      actualizada: Date.now(),
    };
    this.activa.set(id);
    this.conversaciones.update((cs) => [conversacion, ...cs.filter((c) => c.id !== id)].slice(0, MAX_CONVERSACIONES));
    this.persistir();
  }

  private persistir(): void {
    escribirHistorial({ activa: this.activa(), conversaciones: this.conversaciones() });
  }

  /**
   * Vacía el campo en los dos lados. Solo con `borrador` no basta: si se escribe y se pulsa Enter antes de que Angular
   * pinte, el enlace `[value]` nunca vio el texto, pasa de «» a «» y el campo se queda lleno (medido escribiendo y
   * pulsando Enter seguidos).
   */
  private vaciar(): void {
    this.borrador.set('');
    this.campo()?.value.set('');
  }

  /** El botón «Copiar» de cada bloque de código: llega en el HTML de la respuesta, así que se escucha aquí. */
  protected alPulsarHilo(evento: MouseEvent): void {
    const boton = (evento.target as HTMLElement).closest('.ask-md__copiar');
    const codigo = boton?.parentElement?.querySelector('code')?.textContent;
    if (!boton || codigo == null) return;
    void navigator.clipboard.writeText(codigo).then(() => {
      const rotulo = boton.textContent;
      boton.textContent = this.translate.instant('chrome.ask.copiado') as string;
      setTimeout(() => (boton.textContent = rotulo), 1500);
    });
  }

  private async pedir(pregunta: string, historial: { role: string; content: string }[]): Promise<void> {
    this.peticion = new AbortController();
    let texto = '';
    try {
      const r = await fetch(ASK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta, ficha: this.ficha(), idioma: this.lang.current(), historial }),
        signal: this.peticion.signal,
      });
      if (!r.ok || !r.body) {
        const cuerpo = (await r.json().catch(() => ({}))) as { error?: string };
        const clave = cuerpo.error === 'cupo' ? 'cupo' : r.status === 429 ? 'rapido' : 'fallo';
        this.cerrarUltimo({ texto: '', error: 'chrome.ask.error.' + clave });
        return;
      }
      const fichas = (r.headers.get('X-Sc-Fichas') ?? '').split(',').filter(Boolean);
      this.cambiarUltimo({ fichas });

      const lector = r.body.pipeThrough(new TextDecoderStream()).getReader();
      let resto = '';
      for (;;) {
        const { value, done } = await lector.read();
        if (done) break;
        resto += value;
        const lineas = resto.split('\n');
        resto = lineas.pop() ?? '';
        for (const linea of lineas) texto += trozo(linea);
        this.cambiarUltimo({ texto });
        this.bajar();
      }
      texto += trozo(resto);
      this.cerrarUltimo({ texto });
    } catch (e) {
      const parado = e instanceof DOMException && e.name === 'AbortError';
      this.cerrarUltimo(parado ? { texto } : { texto, error: texto ? undefined : 'chrome.ask.error.red' });
    } finally {
      this.peticion = null;
    }
  }

  private cambiarUltimo(cambio: Partial<Mensaje>): void {
    this.mensajes.update((ms) => [...ms.slice(0, -1), { ...ms[ms.length - 1], ...cambio }]);
  }

  private cerrarUltimo(cambio: Partial<Mensaje>): void {
    this.cambiarUltimo({ ...cambio, cargando: false });
    this.guardar();
  }

  /** Sigue la respuesta mientras llega, salvo que hayas subido a leer algo de antes. */
  private bajar(siempre = false): void {
    const caja = this.hilo()?.nativeElement.closest('.p-drawer-content');
    if (!caja) return;
    const cerca = caja.scrollHeight - caja.scrollTop - caja.clientHeight < 160;
    // Al abrir una conversación guardada, al final siempre: es donde se quedó. Tras pintarla, por eso dos fotogramas.
    if (cerca || siempre)
      requestAnimationFrame(() => requestAnimationFrame(() => caja.scrollTo({ top: caja.scrollHeight })));
  }
}

/**
 * Una línea del stream del Worker (`data: {…}`). Workers AI responde con dos formatos según el modelo: el suyo
 * (`response`) y el de OpenAI (`choices[0].delta.content`). El razonamiento (`reasoning_content`) no se enseña.
 */
function trozo(linea: string): string {
  if (!linea.startsWith('data:')) return '';
  const datos = linea.slice(5).trim();
  if (!datos || datos === '[DONE]') return '';
  try {
    const j = JSON.parse(datos) as { response?: string; choices?: { delta?: { content?: string | null } }[] };
    return j.choices?.[0]?.delta?.content ?? j.response ?? '';
  } catch {
    return '';
  }
}
