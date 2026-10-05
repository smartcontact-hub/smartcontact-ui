import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';

import { I18n, TrPipe } from '../../core/i18n/i18n';

/** Un rótulo del diccionario y su valor de ejemplo. */
type Campo = Readonly<{ clave: string; valor: string }>;

/** El mismo conjunto con `clave` puesta si no estaba, o quitada si estaba. */
function alternar(prev: ReadonlySet<string>, clave: string): ReadonlySet<string> {
  const next = new Set(prev);
  if (!next.delete(clave)) next.add(clave);
  return next;
}

/**
 * Panel "Summary" de una suscripción.
 *
 * El botón `Summary` de la tabla de suscripciones **no abre un modal**: abre una
 * vista a pantalla completa de dos columnas, la superficie más densa de toda la
 * app y la última grande que quedaba sin replicar. Salió en revisión, al mirar
 * qué hacían Summary y Nav.
 *
 * Estructura medida en la real (@1460×792, ticket ya `Resolved`, sólo lectura):
 *
 *   · **columna izquierda 360px** sobre `#f4f6fc` — servicio, precio en verde
 *     grande, periodo con conmutador RECCURING/DURATION, tarjeta de suscripción
 *     sobre `#e0e6f7`, ficha de cliente y "Subs Info" con User Agent e IP
 *   · **columna derecha 1008.8px** — tira de estado con dos tarjetas de color
 *     (Charges verde `#3eb584` · Refunded rojo `#e84343`, 148×75) y tres
 *     bloques desplegables: **MO/MT** (SMS enviados), **Charges** y
 *     **Navigation** (las URLs por las que pasó el cliente)
 *
 * Dos erratas del original que se replican tal cual: **RECCURING** (con dos
 * C) y **Unsubsribed** (sin la segunda `c`).
 *
 * ⚠️ Los datos son INVENTADOS. La vista real muestra el teléfono del cliente,
 * su IP, su User Agent completo y las URLs por las que navegó — de lo más
 * sensible de toda la aplicación. Aquí se replica la FORMA, nada más.
 */
@Component({
  selector: 'app-summary-panel',
  standalone: true,
  imports: [TrPipe],
  templateUrl: './summary-panel.component.html',
  styleUrl: './summary-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryPanelComponent {
  private readonly i18n = inject(I18n);

  readonly ticketId = input.required<string>();
  readonly product = input.required<string>();

  /**
   * Por dónde se entró.
   *
   * **"Nav" no abre otra cosa: abre ESTE MISMO panel**, pero desplegado por la
   * sección Navigation. Comprobado midiendo el bloque `used` en la real: 67px
   * (plegado) entrando por Summary y **1153px** entrando por Nav. Dos botones
   * distintos, una sola vista.
   */
  readonly focus = input<'summary' | 'nav'>('summary');

  readonly closed = output<void>();

  /** El conmutador del periodo. "RECCURING" con dos C es del original. */
  protected readonly periodMode = signal<'RECCURING' | 'DURATION'>('RECCURING');

  /**
   * Las DOCE periodicidades del original, por su código de una letra.
   *
   * En el original el valor es `{{ offer.number }}` más un `[ngSwitch]` sobre `offer.period`, que
   * es una letra. Aquí se replica el mapa entero aunque la oferta de ejemplo use una sola: la
   * pantalla pintaba «1 Week» como TEXTO FIJO, sin dato detrás.
   *
   * ⚠️ Los rótulos salen del DICCIONARIO, no de la plantilla del original: la suya pide
   * `SERVICE.DAY30/DAY60/DAY90/DAY5/DAY180/DAY360` y el diccionario define `DAYS30/…`, así que
   * esos seis salen en la app real como la ruta cruda de la clave. Es un bug suyo y no se
   * replica, igual que `…TABLE.NONE` o `QEUE`.
   */
  protected static readonly PERIODOS: Readonly<Record<string, string>> = {
    d: 'Day',
    w: 'Week',
    m: 'Month',
    q: 'Quarter',
    b: 'Bi Annual',
    y: 'Year',
    t: '30 Days',
    n: '60 Days',
    u: '90 Days',
    e: '5 Days',
    v: '180 Days',
    z: '360 Days',
  };

  /**
   * Los seis rótulos de días YA llevan su número dentro («30 Days»), así que anteponer el de la
   * oferta daba «30 30 Days». Lo cazó el e2e con la SEGUNDA suscripción; con una sola no habría
   * salido, porque la primera es `1 w` y ahí el número sí hace falta.
   *
   * En el original esto no se ve nunca: su plantilla pide `SERVICE.DAY30` y el diccionario define
   * `DAYS30`, así que los seis salen como la ruta cruda de la clave. Es un bug suyo, no se
   * replica (como `…TABLE.NONE` o `QEUE`), y el modelo correcto es este.
   */
  private static readonly PERIODOS_CON_NUMERO = new Set(['t', 'n', 'u', 'e', 'v', 'z']);

  /** Cuántas unidades y de qué periodo, como llega la oferta en el original. */
  readonly periodo = input<{ numero: number; codigo: string }>({ numero: 1, codigo: 'w' });

  /**
   * «1 Week», «30 Days»… Un código que no esté en la tabla se enseña tal cual, no se inventa.
   * El rótulo se traduce aquí dentro para que siga al idioma.
   */
  protected readonly periodoLegible = computed(() => {
    const { numero, codigo } = this.periodo();
    const rotulo = SummaryPanelComponent.PERIODOS[codigo];
    const etiqueta = rotulo ? this.i18n.t(rotulo) : codigo;
    return SummaryPanelComponent.PERIODOS_CON_NUMERO.has(codigo) ? etiqueta : `${numero} ${etiqueta}`;
  });

  /**
   * Secciones desplegables de la derecha.
   *
   * Entrando por "Nav" la de Navigation viene abierta sí o sí — es su razón de
   * ser. El estado de las otras dos varió entre observaciones en la app real
   * (parece recordar lo último que se plegó), así que se dejan abiertas: es lo
   * que se vio la primera vez y lo que enseña más.
   */
  protected readonly open = signal<ReadonlySet<string>>(new Set(['mtmo', 'billing', 'nav']));

  /** Ancla de la sección Navigation, para traerla a la vista al entrar por Nav. */
  private readonly navSection = viewChild<ElementRef<HTMLElement>>('navSection');

  constructor() {
    afterNextRender(() => {
      if (this.focus() === 'nav') {
        this.navSection()?.nativeElement.scrollIntoView({ block: 'start' });
      }
      // Medir obliga a maquetar, y maquetar pide la fuente que aún no esté: por eso se mide ya y otra vez cuando
      // han llegado las fuentes. La columna mide 360px fijos, así que nada más mueve el corte de líneas.
      this.medirSubsInfo();
      void document.fonts.ready.then(() => this.medirSubsInfo());
    });
  }

  protected toggle(section: string): void {
    this.open.update((prev) => alternar(prev, section));
  }

  protected isOpen(section: string): boolean {
    return this.open().has(section);
  }

  /* ── Datos de ejemplo (inventados, con la forma de los reales) ───────────*/

  protected readonly mtmo = [
    {
      date: '11-08-2026 13:09:06',
      sms: 'PLAYWEEZ. Disfruta en http://play.example-mobi.com User: 34600222333, Pass: 0000. 4,5 Eur/sem (IVA incl.) Renov. Autom. 900000000 ayuda.example.com',
      status: 'delivered',
      type: 'welcome',
      destiny: '+34600222333',
    },
    {
      date: '11-08-2026 13:20:46',
      sms: 'La baja del servicio Playweez se ha realizado correctamente. Desde 11/08/2026 no recibira mas cargos por este concepto. +info: 900000000',
      status: 'delivered',
      type: 'cancellation',
      destiny: '+34600222333',
    },
  ];

  protected readonly charges = [
    {
      date: '11 Aug 2026',
      time: '13:09:05',
      subscriptionId: '00000000-0000-4000-8000-000000000000',
      amount: '4.5 €',
      state: 'refundable',
    },
  ];

  protected readonly navigation = [
    {
      time: '13:08:48',
      date: '11-08-2026',
      url: 'https://promo.example-mobi.com/lp_futbol?cp_id=00000000&ag_id=&cr_id=&ad_id=00000000&pla=&ext_code=Example',
      type: 'first_hit',
    },
    {
      time: '13:08:49',
      date: '11-08-2026',
      url: 'https://promo.example-mobi.com/lp_futbol/subscribe?cp_id=00000000',
      type: 'landing',
    },
  ];

  /**
   * «Subs Info»: los DIEZ campos del original, en SU orden.
   *
   * El orden no se dedujo: el bundle sin minificar lo lleva escrito en un comentario —
   * *User Agent → IP → Placement → URL → Carrier → Device → Device OS → Connection → Banner →
   * Campaign*— y son diez bloques `subInfo-container`, cada uno con su `*ngIf` sobre un campo de
   * `navData`. ⚠️ El hand-off decía ONCE; contados en su fuente son diez.
   *
   * Cada uno se pinta solo si tiene valor, como en el original. Los valores son INVENTADOS con la
   * forma de los reales (dominios `example.*` de la RFC 2606, IP de rango privado): la vista real
   * enseña el teléfono, la IP y las URLs por las que navegó el cliente, de lo más sensible de la
   * aplicación.
   */
  protected readonly subsInfo: readonly Campo[] = [
    {
      clave: 'User Agent',
      valor:
        'Mozilla/5.0 (Linux; Android 15; ExampleTel X1 Build/AP0A.000000.000) AppleWebKit/537.36 (KHTML, like Gecko)',
    },
    { clave: 'IP', valor: '10.0.113.4' },
    { clave: 'Placement', valor: 'lp_futbol_home_top' },
    { clave: 'URL', valor: 'https://promo.example-mobi.com/lp_futbol?cp_id=00000000&ext_code=Example' },
    { clave: 'Carrier', valor: 'ExampleTel ES' },
    { clave: 'Device', valor: 'ExampleTel X1' },
    { clave: 'Device/OS', valor: 'Android 15' },
    { clave: 'Connection', valor: 'wifi' },
    { clave: 'Banner', valor: 'bn_futbol_300x250' },
    { clave: 'Campaign', valor: 'CP-000000 · Playweez Fútbol' },
  ];

  /**
   * «Expand all» era un botón MUERTO: estaba pintado y no hacía nada. En el original conmuta
   * `subInfoExpandAll`, y cada valor largo se recorta hasta que se despliega. Sus rótulos salen
   * del diccionario del original: «Expand all» / «Collapse» (no «Collapse all»).
   */
  protected readonly subsInfoDesplegado = signal(false);

  protected alternarSubsInfo(): void {
    this.subsInfoDesplegado.update((v) => !v);
    // «Collapse» pliega TODO, también lo que se abrió uno a uno.
    this.abiertos.set(new Set());
  }

  /**
   * «Show more»: en el original cada valor largo lleva el suyo, que aparece SOLO si el texto desborda y abre solo ese
   * valor. Rótulo de cerrar («Show less») y sitio del botón, sin verificar contra el original.
   */
  protected readonly abiertos = signal<ReadonlySet<string>>(new Set());

  /** Los valores que no caben en su línea: solo esos llevan «Show more». */
  protected readonly noCaben = signal<ReadonlySet<string>>(new Set());

  private readonly valores = viewChildren<ElementRef<HTMLElement>>('valor');

  protected alternarCampo(clave: string): void {
    this.abiertos.update((prev) => alternar(prev, clave));
  }

  /**
   * Se compara el alto natural del texto (`scrollHeight`, el mismo recortado que abierto) con la línea que enseña
   * plegado (`-webkit-line-clamp: 1` en `.sum__boxv`), así que la respuesta no cambia al abrir o cerrar y el botón no
   * parpadea.
   */
  private medirSubsInfo(): void {
    const noCaben = new Set<string>();
    for (const { nativeElement: el } of this.valores()) {
      if (el.scrollHeight > parseFloat(getComputedStyle(el).lineHeight) + 1) noCaben.add(el.dataset['clave'] ?? '');
    }
    this.noCaben.set(noCaben);
  }

  /**
   * Bajo Contact, el original pinta cuatro filas más, cada una solo si tiene valor (un `*ngIf` por fila). Rótulos y
   * orden son los del hand-off de CusCare, SIN VERIFICAR contra el original, que solo está en el portátil; su
   * castellano, tampoco (salen igual, como «Msisdn»). Los valores son inventados, con forma de identificador.
   */
  protected readonly clienteExtra: readonly Campo[] = [
    { clave: 'Alias', valor: 'playweez_000000' },
    { clave: 'AccountId', valor: 'ACC-00000000' },
    { clave: 'ExternalId', valor: 'EXT-00000000' },
    { clave: 'OperationId', valor: 'OP-00000000' },
  ];
}
