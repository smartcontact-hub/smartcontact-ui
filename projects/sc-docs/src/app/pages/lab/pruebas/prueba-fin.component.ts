import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ScButtonComponent, ScSelectButtonComponent, ScTextareaComponent } from '@smartcontact-hub/components';

import { claveDelNombre, codigoDeResultado, decodificar, limpiarNombre, type Resultado } from './prueba.core.mjs';

const ORDINALES = ['La primera', 'La segunda', 'La tercera', 'La cuarta'];

/**
 * EL FINAL DE UNA PRUEBA CON USUARIOS (DD-256). El Supervisor vuelve aquí con lo medido en el enlace (`?r=`); la
 * persona dice con qué versión se quedaría y por qué, y copia su resultado (un código `SCP1.…`) para mandarlo. Nada se
 * envía solo: no hay servidor, y así ningún dato sale del navegador sin que la persona lo decida.
 *
 * Las versiones se nombran por su orden («la primera que usaste»), no por su nombre en el plan, que ya las juzga.
 *
 * Si la persona escribió su nombre en la puerta, lo recoge de la sesión de la pestaña y lo mete en su código.
 */
@Component({
  selector: 'app-prueba-fin',
  imports: [ScButtonComponent, ScSelectButtonComponent, ScTextareaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="puerta">
      @if (medido(); as r) {
        <article class="puerta__tarjeta" aria-labelledby="prueba-fin-titulo">
          <p class="puerta__ante sc-text-caption-semibold">Prueba terminada</p>
          <h1 id="prueba-fin-titulo" class="sc-text-h2-semibold">Ya está. Gracias{{ nombre() ? ', ' + nombre() : '' }}.</h1>

          @if (opciones().length > 1) {
            <div class="campo">
              <p id="prueba-fin-pref" class="sc-text-body-semibold">Si tuvieras que hacerlo de verdad, ¿con cuál te quedarías?</p>
              <sc-selectbutton
                ariaLabelledBy="prueba-fin-pref"
                [options]="opciones()"
                optionLabel="label"
                optionValue="value"
                [value]="preferida()"
                (valueChange)="preferida.set($any($event))"
              />
            </div>
            <sc-textarea label="¿Por qué? (si quieres)" [rows]="3" fluid [value]="porque()" (valueChange)="porque.set($event)" />
          }

          <p class="sc-text-body-regular">Copia tu resultado y mándaselo a quien te pasó el enlace, por el chat de siempre.</p>
          <div class="puerta__pie">
            <sc-button variant="secondary" appearance="text" icon="download" label="Descargar" (clicked)="descargar(r)" />
            <sc-button [icon]="copiado() ? 'check' : 'content_copy'" [label]="copiado() ? 'Copiado' : 'Copiar resultado'" (clicked)="copiar(r)" />
          </div>
        </article>
      } @else {
        <article class="puerta__tarjeta">
          <h1 class="sc-text-h2-semibold">No ha llegado ningún resultado</h1>
          <p class="sc-text-body-regular">El enlace vino cortado. Avisa a quien te pasó la prueba.</p>
        </article>
      }
    </div>
  `,
  styles: `
    .puerta { min-block-size: 100dvh; display: grid; place-items: center; padding: var(--sc-spacing-2); background: var(--sc-bg-secondary-subtle); }
    .puerta__tarjeta { inline-size: min(36rem, 100%); display: flex; flex-direction: column; gap: var(--sc-spacing-1-5); padding: var(--sc-spacing-2-5); background: var(--sc-bg-surface); border: 1px solid var(--sc-border-subtle); border-radius: var(--sc-radius-xl); }
    .puerta__tarjeta h1, .puerta__tarjeta p { margin: 0; text-wrap: pretty; }
    .puerta__tarjeta h1 { color: var(--sc-text-heading); }
    .puerta__tarjeta p { color: var(--sc-text-primary); }
    .puerta__ante { color: var(--sc-text-secondary); margin-block-end: calc(-1 * var(--sc-spacing-1)); }
    .campo { display: flex; flex-direction: column; gap: var(--sc-spacing-0-5); }
    .puerta__pie { display: flex; align-items: center; justify-content: flex-end; gap: var(--sc-spacing-0-5); }
  `,
})
export class PruebaFinComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap);
  private readonly query = toSignal(this.route.queryParamMap);

  /** Lo que midió el Supervisor, si llegó entero y es de esta prueba. */
  protected readonly medido = computed<Resultado | null>(() => {
    const crudo = this.query()?.get('r');
    if (!crudo) return null;
    try {
      const r = decodificar(crudo) as Resultado;
      return r && r.v === 1 && r.prueba === this.params()?.get('id') && Array.isArray(r.pasos) ? r : null;
    } catch {
      return null;
    }
  });

  /** Las versiones por el orden en que las usó, más «me da igual». */
  protected readonly opciones = computed(() => {
    const r = this.medido();
    if (!r) return [];
    return [
      ...r.orden.map((id, i) => ({ label: ORDINALES[i] ?? `La ${i + 1}.ª`, value: id })),
      { label: 'Me da igual', value: '' },
    ];
  });

  /** El nombre que dejó en la puerta, si quiso. */
  protected readonly nombre = computed(() => {
    const r = this.medido();
    if (!r) return '';
    try {
      return limpiarNombre(sessionStorage.getItem(claveDelNombre(r.prueba, r.participante)));
    } catch {
      return '';
    }
  });

  protected readonly preferida = signal<string | null>(null);
  protected readonly porque = signal('');
  protected readonly copiado = signal(false);

  /** El resultado completo: lo medido, la preferencia y el nombre, si lo hay. */
  private completo(r: Resultado): Resultado {
    const pref = this.preferida();
    const nombre = this.nombre();
    return {
      ...r,
      preferencia: { version: pref ? pref : null, porque: this.porque().trim() },
      ...(nombre ? { nombre } : {}),
    };
  }

  protected async copiar(r: Resultado): Promise<void> {
    try {
      await navigator.clipboard.writeText(codigoDeResultado(this.completo(r)));
      this.copiado.set(true);
    } catch {
      // Sin portapapeles (navegador antiguo o permiso denegado): queda «Descargar».
    }
  }

  protected descargar(r: Resultado): void {
    const datos = new Blob([JSON.stringify(this.completo(r), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(datos);
    a.download = `prueba-${r.prueba}-${r.participante}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

}
