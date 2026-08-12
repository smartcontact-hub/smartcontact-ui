import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ARBOL_COLUMNAS,
  COLUMNAS_PREVIEW,
  ENTIDADES,
  RANGOS,
  TITULO_INFORME,
} from '../../data/reports.data';

/**
 * Constructor de informes — réplica de `statssm/#/private/main-menu-selection`.
 *
 * Es la pantalla que Rafa intentaba capturar (`Captura … 13.03.37` en el
 * fichero de Figma "Informes"): la que sale al elegir un informe en el diálogo
 * del `+`. Cuatro bloques:
 *
 *   Entidades (picklist doble)   |  Fechas (presets + calendario)
 *   Columnas (árbol marcable)    |  Previsualización (25 columnas)
 *
 * El calendario está CONGELADO en agosto de 2026 con el 12 marcado, que es lo
 * que muestran las capturas de referencia. No es un date-picker vivo: la
 * réplica documenta una pantalla, no reimplementa su lógica.
 */
@Component({
  selector: 'sc-report-builder-page',
  templateUrl: './report-builder.page.html',
  styleUrl: './report-builder.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportBuilderPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /**
   * `withComponentInputBinding` no está activo en esta app, así que el
   * parámetro se lee del snapshot (mismo patrón que el resto de features).
   */
  private readonly tipo = this.route.snapshot.paramMap.get('tipo') ?? 'servicios-conversacion';

  protected readonly titulo = TITULO_INFORME[this.tipo] ?? 'Informe de Servicios - Conversación';

  /**
   * "Reporte gráfico" NO es el mismo constructor con otro título: es otra ruta
   * (`#/private/graphics`, componente `app-graphics-selection`) con otro
   * layout. Sólo pide Entidades y Fechas — ni Columnas ni Previsualización — y
   * dentro de Entidades hay UNA lista, no el picklist de dos. La de rangos pasa
   * de 170 a 511 px de ancho porque ya no comparte fila con nada más.
   */
  protected readonly esGraficos = this.tipo === 'servicios-grafico';

  /** El botón cambia de rótulo y de ancho (99.4 → 121.2 medido). */
  protected readonly cta = this.esGraficos ? 'Crear Gráficos' : 'Crear Tabla';

  protected readonly rangos = RANGOS;
  protected readonly arbol = ARBOL_COLUMNAS;
  protected readonly columnas = COLUMNAS_PREVIEW;

  /* ── Entidades ─────────────────────────────────────────────────────── */
  protected readonly filtroOrigen = signal('');
  protected readonly filtroDestino = signal('');
  protected readonly disponibles = signal<readonly string[]>(ENTIDADES);
  protected readonly elegidas = signal<readonly string[]>([]);
  protected readonly noActivos = signal(false);

  protected readonly origenVisible = computed(() => {
    const q = this.filtroOrigen().trim().toLowerCase();
    return q ? this.disponibles().filter((e) => e.toLowerCase().includes(q)) : this.disponibles();
  });

  protected readonly destinoVisible = computed(() => {
    const q = this.filtroDestino().trim().toLowerCase();
    return q ? this.elegidas().filter((e) => e.toLowerCase().includes(q)) : this.elegidas();
  });

  /** Selección marcada dentro de cada lista (clic simple, como el original). */
  protected readonly marcadasOrigen = signal<ReadonlySet<string>>(new Set());
  protected readonly marcadasDestino = signal<ReadonlySet<string>>(new Set());

  protected alternar(lado: 'origen' | 'destino', valor: string): void {
    const señal = lado === 'origen' ? this.marcadasOrigen : this.marcadasDestino;
    const copia = new Set(señal());
    if (copia.has(valor)) copia.delete(valor);
    else copia.add(valor);
    señal.set(copia);
  }

  /** Las cuatro flechas: « ‹ › » — mover todo / mover lo marcado. */
  protected transferir(accion: 'todo-derecha' | 'derecha' | 'izquierda' | 'todo-izquierda'): void {
    if (accion === 'todo-derecha') {
      this.elegidas.set([...this.elegidas(), ...this.disponibles()]);
      this.disponibles.set([]);
    } else if (accion === 'todo-izquierda') {
      this.disponibles.set([...this.disponibles(), ...this.elegidas()]);
      this.elegidas.set([]);
    } else if (accion === 'derecha') {
      const m = this.marcadasOrigen();
      if (!m.size) return;
      this.elegidas.set([...this.elegidas(), ...this.disponibles().filter((e) => m.has(e))]);
      this.disponibles.set(this.disponibles().filter((e) => !m.has(e)));
    } else {
      const m = this.marcadasDestino();
      if (!m.size) return;
      this.disponibles.set([...this.disponibles(), ...this.elegidas().filter((e) => m.has(e))]);
      this.elegidas.set(this.elegidas().filter((e) => !m.has(e)));
    }
    this.marcadasOrigen.set(new Set());
    this.marcadasDestino.set(new Set());
  }

  protected filtrar(lado: 'origen' | 'destino', ev: Event): void {
    const valor = (ev.target as HTMLInputElement).value;
    if (lado === 'origen') this.filtroOrigen.set(valor);
    else this.filtroDestino.set(valor);
  }

  /* ── Fechas ────────────────────────────────────────────────────────── */
  protected readonly rangoElegido = signal('Hoy');

  /** Agosto 2026 tal y como lo pinta el original: 6 filas, lunes primero. */
  protected readonly semanas: readonly (readonly { dia: number; fuera: boolean }[])[] = (() => {
    const filas: { dia: number; fuera: boolean }[][] = [];
    // 1 de agosto de 2026 cae en sábado → la fila arranca en el 27 de julio.
    let dia = 27;
    let mes: 'prev' | 'actual' | 'sig' = 'prev';
    for (let f = 0; f < 6; f++) {
      const fila: { dia: number; fuera: boolean }[] = [];
      for (let c = 0; c < 7; c++) {
        fila.push({ dia, fuera: mes !== 'actual' });
        dia++;
        if (mes === 'prev' && dia > 31) {
          dia = 1;
          mes = 'actual';
        } else if (mes === 'actual' && dia > 31) {
          dia = 1;
          mes = 'sig';
        }
      }
      filas.push(fila);
    }
    return filas;
  })();

  protected esHoy(celda: { dia: number; fuera: boolean }): boolean {
    return !celda.fuera && celda.dia === 12;
  }

  /* ── Columnas ──────────────────────────────────────────────────────── */
  protected readonly todasColumnas = signal(true);

  /* ── Previsualización ──────────────────────────────────────────────── */
  protected readonly agrupacion = signal('Totales');
  protected readonly ocultarVacios = signal(false);
  /** Cuatro filas de muestra rellenas con "X", igual que el original. */
  protected readonly filasPreview = [0, 1, 2, 3];

  protected cerrar(): void {
    void this.router.navigate(['/informes']);
  }
}
