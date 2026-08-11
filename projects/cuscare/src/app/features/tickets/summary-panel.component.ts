import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

/**
 * Panel "Summary" de una suscripción.
 *
 * El botón `Summary` de la tabla de suscripciones **no abre un modal**: abre una
 * vista a pantalla completa de dos columnas, la superficie más densa de toda la
 * app y la última grande que quedaba sin replicar. Lo cazó Rafa pidiendo mirar
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
  templateUrl: './summary-panel.component.html',
  styleUrl: './summary-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryPanelComponent {
  readonly ticketId = input.required<string>();
  readonly product = input.required<string>();
  readonly closed = output<void>();

  /** El conmutador del periodo. "RECCURING" con dos C es del original. */
  protected readonly periodMode = signal<'RECCURING' | 'DURATION'>('RECCURING');

  /** Secciones desplegables de la derecha; las tres abiertas de inicio. */
  protected readonly open = signal<ReadonlySet<string>>(new Set(['mtmo', 'billing', 'nav']));

  protected toggle(section: string): void {
    this.open.update((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
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

  protected readonly userAgent =
    'Mozilla/5.0 (Linux; Android 15; ExampleTel X1 Build/AP0A.000000.000) AppleWebKit/537.36 (KHTML, like Gecko)';

  protected readonly ip = '10.0.113.4';
}
