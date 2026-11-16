import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
import { ScButtonComponent, ScInputTextComponent, ScSelectButtonComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { ResultadoAccionService } from '@core/services/resultado-accion.service';
import { MISIONES, type Mision } from './cal-misiones';
import { CalPapelComponent } from './cal-papel.component';
import { CalPruebaService, reloj, type Variante } from './cal-prueba.service';

/** Las pantallas donde vive la prueba: el hub de Repositorios y las dos secciones nuevas. */
const EN_PRUEBA = /^\/admin\/(repositorios|calendarios|horarios)(\/|\?|$)/;

/**
 * PROTOTIPO DE DISCOVERY: la barra del modo prueba. Abajo a la izquierda, junto al menú y fuera del trabajo: quien modera
 * prepara la sesión (prototipo, misión, participante), la persona lee la misión y trabaja, y al terminar se ve el
 * resultado corregido día a día. Sus clics no cuentan (`data-prueba`).
 */
@Component({
  selector: 'sc-cal-prueba',
  imports: [CalPapelComponent, ScButtonComponent, ScIconComponent, ScInputTextComponent, ScSelectButtonComponent, TooltipModule],
  host: { 'data-prueba': '', '[class.oculta]': '!visible()' },
  template: `
    @if (abierta() || prueba.ultima()) {
      <section class="panel" aria-label="Modo prueba">
        @if (prueba.ultima(); as s) {
          <header class="panel__cabecera">
            <span class="sc-text-caption-semibold panel__antetitulo">Resultado, misión {{ s.mision }} en {{ s.variante }}{{ s.participante ? ', ' + s.participante : '' }}</span>
            <sc-button size="sm" variant="secondary" appearance="text" icon="close" ariaLabel="Cerrar el resultado" (clicked)="cerrarResultado()" />
          </header>
          @if (s.resultado; as r) {
            <p class="titular sc-text-title-semibold" [class.titular--ok]="r.bien === r.total">{{ r.titular }}</p>
            <dl class="cifras">
              <div><dt class="sc-text-caption-regular">Tiempo</dt><dd class="sc-text-body-semibold">{{ duracion(s) }}</dd></div>
              <div><dt class="sc-text-caption-regular">Clics</dt><dd class="sc-text-body-semibold">{{ s.clics }}</dd></div>
              <div><dt class="sc-text-caption-regular">Saltos de pantalla</dt><dd class="sc-text-body-semibold">{{ s.saltos }}</dd></div>
              <div><dt class="sc-text-caption-regular">Ayudas</dt><dd class="sc-text-body-semibold">{{ s.ayudas }}</dd></div>
            </dl>
            <ul class="puntos" role="list">
              @for (p of r.puntos; track p.texto) {
                <li class="punto sc-text-body-regular" [class.punto--mal]="!p.ok">
                  <sc-icon [name]="p.ok ? 'check_circle' : 'cancel'" size="sm" />
                  <span>{{ p.texto }}</span>
                </li>
              }
            </ul>
            @if (r.fallos.length) {
              <details class="fallos">
                <summary class="sc-text-body-semibold">{{ r.fallos.length === 1 ? 'El día que no sale' : 'Los ' + r.fallos.length + ' días que no salen' }}</summary>
                <ul class="fallos__lista" role="list">
                  @for (f of r.fallos.slice(0, 12); track f.fecha) {
                    <li class="sc-text-caption-regular">
                      <span class="sc-text-caption-semibold">{{ f.fecha }}.</span>
                      Pedía {{ f.esperado }}. Hay {{ f.hay }}.
                    </li>
                  }
                </ul>
                @if (r.fallos.length > 12) {
                  <p class="sc-text-caption-regular pista">Y {{ r.fallos.length - 12 }} más.</p>
                }
              </details>
            }
          }
          <footer class="panel__pie">
            <sc-button size="sm" variant="secondary" appearance="outlined" icon="content_copy" [label]="copiarTexto()" (clicked)="copiar()" />
            <sc-button size="sm" variant="primary" label="Preparar otra" (clicked)="otra()" />
          </footer>
        } @else {
          <header class="panel__cabecera">
            <span class="sc-text-body-semibold">Modo prueba</span>
            <sc-button size="sm" variant="secondary" appearance="text" icon="close" ariaLabel="Cerrar el modo prueba" (clicked)="abierta.set(false)" />
          </header>
          <div class="campos">
            <div class="field">
              <span class="field__label sc-text-caption-semibold" id="prueba-variante">Prototipo</span>
              <sc-selectbutton size="sm" ariaLabelledBy="prueba-variante" [options]="variantes" optionLabel="label" optionValue="value" [allowEmpty]="false" [value]="prueba.variante()" (valueChange)="prueba.variante.set($any($event))" />
            </div>
            <div class="field">
              <span class="field__label sc-text-caption-semibold" id="prueba-mision">Misión</span>
              <sc-selectbutton size="sm" ariaLabelledBy="prueba-mision" [options]="misiones" optionLabel="label" optionValue="value" [allowEmpty]="false" [value]="prueba.mision()" (valueChange)="prueba.mision.set($any($event))" />
            </div>
            <div class="field campos__ancho">
              <sc-inputtext inputId="prueba-participante" size="sm" fluid label="Participante" placeholder="Por ejemplo, P3" [value]="prueba.participante()" (valueChange)="prueba.participante.set($event)" />
            </div>
          </div>
          <p class="enunciado sc-text-body-regular">{{ mision().enunciado }}</p>
          <p class="pista sc-text-caption-regular">Al empezar se reinician los datos de la misión y se va a Repositorios.</p>
          <footer class="panel__pie">
            @if (prueba.historial().length) {
              <sc-button size="sm" variant="secondary" appearance="text" icon="content_copy" [label]="copiarTexto()" (clicked)="copiar()" />
            }
            @if (prueba.mision() === 2) {
              <sc-button size="sm" variant="secondary" appearance="outlined" icon="description" label="Ver el papel" (clicked)="papel.set(true)" />
            }
            <sc-button size="sm" variant="primary" icon="play_arrow" label="Empezar" (clicked)="empezar()" />
          </footer>
        }
      </section>
    }

    @if (prueba.activa(); as s) {
      @if (enunciadoVisible()) {
        <section class="panel panel--mision" aria-labelledby="prueba-mision-titulo">
          <header class="panel__cabecera">
            <span class="sc-text-caption-semibold panel__antetitulo" id="prueba-mision-titulo">Misión {{ s.mision }}</span>
          </header>
          <p class="enunciado sc-text-subtitle-semibold">{{ misionDe(s.mision).enunciado }}</p>
          @if (misionDe(s.mision).nota; as nota) {
            <p class="pista sc-text-caption-regular">{{ nota }}</p>
          }
          <footer class="panel__pie">
            @if (s.mision === 2) {
              <sc-button size="sm" variant="secondary" appearance="outlined" icon="description" label="Ver el papel" (clicked)="papel.set(true)" />
            }
            <sc-button size="sm" variant="primary" label="Entendido" (clicked)="enunciadoVisible.set(false)" />
          </footer>
        </section>
      }
      <div class="pastilla pastilla--activa" role="toolbar" aria-label="Prueba en marcha">
        <span class="punto-vivo" aria-hidden="true"></span>
        <span class="pastilla__reloj sc-text-body-semibold" aria-live="off">{{ tiempo() }}</span>
        <sc-button size="sm" variant="secondary" appearance="text" [label]="'Misión ' + s.mision" [pTooltip]="enunciadoVisible() ? 'Ocultar la misión' : 'Ver la misión'" tooltipPosition="top" tooltipEvent="both" (clicked)="enunciadoVisible.update((v) => !v)" />
        @if (s.mision === 2) {
          <sc-button size="sm" variant="secondary" appearance="text" icon="description" label="El papel" (clicked)="papel.set(true)" />
        }
        <span class="separador" aria-hidden="true"></span>
        <sc-button size="sm" variant="secondary" appearance="text" icon="front_hand" [label]="s.ayudas ? 'Ayuda (' + s.ayudas + ')' : 'Ayuda'" pTooltip="Apunta que ha pedido ayuda" tooltipPosition="top" tooltipEvent="both" (clicked)="prueba.pedirAyuda()" />
        <sc-button size="sm" variant="secondary" appearance="text" icon="close" ariaLabel="Cancelar la prueba" pTooltip="Cancelar sin guardar" tooltipPosition="top" tooltipEvent="both" (clicked)="prueba.cancelar()" />
        <sc-button size="sm" variant="primary" icon="flag" label="Terminar" (clicked)="terminar()" />
      </div>
    } @else if (!abierta() && !prueba.ultima()) {
      <div class="pastilla">
        <sc-button size="sm" variant="secondary" appearance="text" icon="science" [label]="'Modo prueba, prototipo ' + prueba.variante()" (clicked)="abierta.set(true)" />
      </div>
    }

    @if (papel()) {
      <sc-cal-papel (cerrado)="papel.set(false)" />
    }
  `,
  styles: `
    :host {
      position: fixed;
      inset-block-end: var(--sc-spacing-1);
      inset-inline-start: var(--sc-sidebar-width);
      margin-inline-start: var(--sc-spacing-1);
      z-index: var(--sc-z-fixed);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--sc-spacing-0-75);
      pointer-events: none;
    }
    :host(.oculta) { display: none; }
    .panel, .pastilla { pointer-events: auto; background: var(--sc-bg-elevated); border: 1px solid var(--sc-border-subtle); box-shadow: var(--sc-shadow-popover); }
    .panel { inline-size: 30rem; max-block-size: 70vh; overflow-y: auto; display: flex; flex-direction: column; gap: var(--sc-spacing-1); padding: var(--sc-spacing-1-25) var(--sc-spacing-1-5) var(--sc-spacing-1-5); border-radius: var(--sc-radius-lg); }
    .panel--mision { inline-size: 34rem; }
    .panel__cabecera { display: flex; align-items: center; justify-content: space-between; gap: var(--sc-spacing-1); min-block-size: var(--sc-spacing-2); color: var(--sc-text-heading); }
    .panel__antetitulo { color: var(--sc-text-secondary); }
    .panel__pie { display: flex; flex-wrap: wrap; gap: var(--sc-spacing-0-5); justify-content: flex-end; padding-block-start: var(--sc-spacing-0-5); }
    .campos { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--sc-spacing-1) var(--sc-spacing-1-5); align-items: end; }
    .campos__ancho { grid-column: 1 / -1; }
    .enunciado { margin: 0; color: var(--sc-text-primary); text-wrap: pretty; }
    .pista { margin: 0; color: var(--sc-text-secondary); }
    .titular { margin: 0; color: var(--sc-text-danger); font-variant-numeric: tabular-nums; }
    .titular--ok { color: var(--sc-text-success); }
    .cifras { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--sc-spacing-0-5); margin: 0; }
    .cifras div { display: flex; flex-direction: column; gap: var(--sc-spacing-0-125); padding: var(--sc-spacing-0-5) var(--sc-spacing-0-75); border-radius: var(--sc-radius-md); background: var(--sc-bg-subtle); }
    .cifras dt { color: var(--sc-text-secondary); }
    .cifras dd { margin: 0; color: var(--sc-text-heading); font-variant-numeric: tabular-nums; }
    .puntos { display: flex; flex-direction: column; gap: var(--sc-spacing-0-5); margin: 0; padding: 0; list-style: none; }
    .punto { display: flex; gap: var(--sc-spacing-0-5); align-items: flex-start; color: var(--sc-text-primary); }
    .punto sc-icon { color: var(--sc-text-success); margin-block-start: var(--sc-spacing-0-125); }
    .punto--mal sc-icon { color: var(--sc-text-danger); }
    .fallos summary { cursor: pointer; color: var(--sc-text-heading); }
    .fallos__lista { display: flex; flex-direction: column; gap: var(--sc-spacing-0-5); margin: var(--sc-spacing-0-75) 0 0; padding: 0; list-style: none; color: var(--sc-text-primary); }
    .pastilla { display: flex; align-items: center; gap: var(--sc-spacing-0-25); padding: var(--sc-spacing-0-25) var(--sc-spacing-0-25) var(--sc-spacing-0-25) var(--sc-spacing-0-75); border-radius: var(--sc-radius-full); }
    .pastilla:not(.pastilla--activa) { padding-inline-start: var(--sc-spacing-0-25); }
    .pastilla__reloj { min-inline-size: var(--sc-spacing-3); color: var(--sc-text-heading); font-variant-numeric: tabular-nums; }
    .punto-vivo { inline-size: var(--sc-spacing-0-5); block-size: var(--sc-spacing-0-5); border-radius: var(--sc-radius-full); background: var(--sc-bg-danger); }
    .separador { inline-size: 1px; align-self: stretch; margin: var(--sc-spacing-0-25) var(--sc-spacing-0-25); background: var(--sc-border-subtle); }
    @media (prefers-reduced-motion: no-preference) {
      .punto-vivo { animation: latido 1.6s ease-in-out infinite; }
      @keyframes latido { 50% { opacity: 0.35; } }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalPruebaComponent {
  protected readonly prueba = inject(CalPruebaService);
  private readonly router = inject(Router);
  private readonly resultado = inject(ResultadoAccionService);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly visible = computed(() => EN_PRUEBA.test(this.url()));

  protected readonly abierta = signal(false);
  protected readonly papel = signal(false);
  /** La misión se enseña al empezar; tras recargar a mitad de prueba no vuelve a tapar la pantalla. */
  protected readonly enunciadoVisible = signal(false);

  protected readonly variantes: readonly { value: Variante; label: string }[] = [
    { value: 'A', label: 'A, separado' },
    { value: 'B', label: 'B, junto' },
  ];
  protected readonly misiones: readonly { value: Mision; label: string }[] = [
    { value: 1, label: '1, festivo' },
    { value: 2, label: '2, posventa' },
  ];
  protected readonly mision = computed(() => MISIONES[this.prueba.mision()]);
  protected readonly copiarTexto = computed(() => {
    const n = this.prueba.historial().length;
    return n === 1 ? 'Copiar la sesión' : `Copiar las ${n} sesiones`;
  });
  protected readonly tiempo = computed(() => {
    const s = this.prueba.activa();
    return s ? reloj(this.prueba.ahora() - s.inicio) : '';
  });

  protected misionDe(m: Mision): (typeof MISIONES)[Mision] {
    return MISIONES[m];
  }

  protected duracion(s: { inicio: number; fin: number | null }): string {
    return reloj((s.fin ?? s.inicio) - s.inicio);
  }

  protected empezar(): void {
    this.abierta.set(false);
    this.enunciadoVisible.set(true);
    this.prueba.empezar();
  }

  protected terminar(): void {
    this.enunciadoVisible.set(false);
    this.prueba.terminar();
  }

  protected cerrarResultado(): void {
    this.prueba.ultima.set(null);
  }

  protected otra(): void {
    this.prueba.ultima.set(null);
    this.abierta.set(true);
  }

  protected copiar(): void {
    const texto = this.prueba.csv();
    void navigator.clipboard?.writeText(texto).then(
      () => this.resultado.contar('Sesiones copiadas. Pégalas en una hoja de cálculo'),
      () => this.resultado.contar('No se han podido copiar'),
    );
  }
}
