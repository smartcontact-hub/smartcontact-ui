import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ScButtonComponent, ScCustomModalComponent, ScSelectButtonComponent } from '@smartcontact-hub/components';

import type { ResultadoDePaso } from './prueba-arranque';
import { PruebaService } from './prueba.service';

/** La escala de facilidad de una pregunta (SEQ): de 1, muy difícil, a 7, muy fácil. */
const ESCALA = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ label: String(n), value: n }));

const MODERADOR: readonly { label: string; value: NonNullable<ResultadoDePaso['moderador']> }[] = [
  { label: 'Sí', value: 'si' },
  { label: 'A medias', value: 'medias' },
  { label: 'No', value: 'no' },
];

/**
 * LO QUE VE LA PERSONA EN UNA PRUEBA (DD-256). Tres momentos, y ninguno enseña el reloj ni los clics:
 *
 *   leer        la tarea en un modal: se lee con calma y el tiempo empieza al pulsar «Empezar».
 *   trabajando  una barra pequeña abajo a la izquierda, fuera del trabajo: ver la tarea otra vez, pedir ayuda y
 *               «He terminado».
 *   valorar     una pregunta, cómo de fácil le ha resultado (1 a 7), y, si la rama no corrige sola, si lo consiguió,
 *               que marca quien modera.
 *
 * Se descarga solo cuando hay una prueba en marcha (`@defer` en `app.component.html`). Sus clics no cuentan
 * (`data-prueba`).
 */
@Component({
  selector: 'sc-prueba-capa',
  imports: [ScButtonComponent, ScCustomModalComponent, ScSelectButtonComponent],
  host: { 'data-prueba': '' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (prueba.paso(); as paso) {
      @switch (prueba.actual().fase) {
        @case ('leer') {
          <sc-custom-modal
            [visible]="true"
            [title]="paso.titulo"
            [subtitle]="'Tarea ' + prueba.numero() + ' de ' + prueba.total()"
            [showCloseButton]="false"
            width="36rem"
          >
            <div class="cuerpo">
              <p class="enunciado sc-text-subtitle-regular">{{ paso.enunciado }}</p>
              @if (paso.nota) {
                <p class="pista sc-text-body-regular">{{ paso.nota }}</p>
              }
              @if (prueba.numero() === 1) {
                <p class="pista sc-text-body-regular">
                  Cuando acabes, pulsa «He terminado», abajo a la izquierda. Si te atascas, «Necesito ayuda». Lo que
                  se prueba es la pantalla, no tú.
                </p>
              }
            </div>
            <div scCustomModalFooter class="pie">
              <sc-button size="sm" variant="secondary" appearance="text" label="Salir de la prueba" (clicked)="prueba.abandonar()" />
              <sc-button size="sm" icon="play_arrow" label="Empezar" (clicked)="prueba.empezar()" />
            </div>
          </sc-custom-modal>
        }

        @case ('trabajando') {
          @if (verTarea()) {
            <section class="tarea" aria-labelledby="prueba-tarea-titulo">
              <h2 id="prueba-tarea-titulo" class="sc-text-body-semibold">{{ paso.titulo }}</h2>
              <p class="sc-text-body-regular">{{ paso.enunciado }}</p>
              @if (paso.nota) {
                <p class="pista sc-text-caption-regular">{{ paso.nota }}</p>
              }
            </section>
          }
          <!-- pieza nueva: DD-256, la barra del modo prueba flota sobre cualquier pantalla de cualquier rama y no es de la app; sc-bulk-action-bar, la barra flotante que hay, cuenta una selección y no encaja. -->
          <div class="barra" role="toolbar" aria-label="Prueba en marcha">
            <span class="barra__paso sc-text-body-semibold">Tarea {{ prueba.numero() }} de {{ prueba.total() }}</span>
            <sc-button
              size="sm"
              variant="secondary"
              appearance="text"
              [icon]="verTarea() ? 'visibility_off' : 'description'"
              [label]="verTarea() ? 'Ocultar la tarea' : 'Ver la tarea'"
              (clicked)="verTarea.update((v) => !v)"
            />
            <sc-button
              size="sm"
              variant="secondary"
              appearance="text"
              icon="front_hand"
              [label]="apuntado() ? 'Apuntado' : 'Necesito ayuda'"
              (clicked)="ayuda()"
            />
            <sc-button size="sm" icon="flag" label="He terminado" (clicked)="terminar()" />
          </div>
        }

        @case ('valorar') {
          <sc-custom-modal
            [visible]="true"
            title="¿Cómo de fácil o difícil te ha resultado?"
            [subtitle]="'Tarea ' + prueba.numero() + ' de ' + prueba.total()"
            [showCloseButton]="false"
            width="36rem"
          >
            <div class="cuerpo">
              <div class="escala">
                <sc-selectbutton
                  fluid
                  ariaLabel="Facilidad, de 1 (muy difícil) a 7 (muy fácil)"
                  [options]="escala"
                  optionLabel="label"
                  optionValue="value"
                  [allowEmpty]="false"
                  [value]="facilidad()"
                  (valueChange)="facilidad.set($any($event))"
                />
                <div class="escala__extremos sc-text-caption-regular" aria-hidden="true">
                  <span>Muy difícil</span>
                  <span>Muy fácil</span>
                </div>
              </div>
              @if (!prueba.corrigeSola()) {
                <div class="moderador">
                  <p id="prueba-moderador" class="sc-text-caption-semibold">Para quien modera: ¿lo ha conseguido?</p>
                  <sc-selectbutton
                    size="sm"
                    ariaLabelledBy="prueba-moderador"
                    [options]="opcionesModerador"
                    optionLabel="label"
                    optionValue="value"
                    [value]="moderador()"
                    (valueChange)="moderador.set($any($event))"
                  />
                </div>
              }
            </div>
            <div scCustomModalFooter class="pie">
              <sc-button size="sm" variant="secondary" appearance="text" label="Volver a la tarea" (clicked)="volver()" />
              <sc-button
                size="sm"
                [label]="prueba.ultimo() ? 'Terminar' : 'Siguiente tarea'"
                [disabled]="facilidad() === null"
                (clicked)="siguiente()"
              />
            </div>
          </sc-custom-modal>
        }
      }
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
    }
    .cuerpo { display: flex; flex-direction: column; gap: var(--sc-spacing-1-5); }
    .enunciado { margin: 0; color: var(--sc-text-primary); text-wrap: pretty; }
    .pista { margin: 0; color: var(--sc-text-secondary); text-wrap: pretty; }
    .pie { display: flex; gap: var(--sc-spacing-0-5); justify-content: space-between; inline-size: 100%; }
    .escala { display: flex; flex-direction: column; gap: var(--sc-spacing-0-5); }
    .escala__extremos { display: flex; justify-content: space-between; color: var(--sc-text-secondary); }
    .moderador { display: flex; flex-direction: column; gap: var(--sc-spacing-0-5); padding-block-start: var(--sc-spacing-1); border-block-start: 1px solid var(--sc-border-subtle); }
    .moderador p { margin: 0; color: var(--sc-text-secondary); }
    .barra, .tarea { background: var(--sc-bg-elevated); border: 1px solid var(--sc-border-subtle); box-shadow: var(--sc-shadow-popover); }
    .barra { display: flex; align-items: center; gap: var(--sc-spacing-0-25); padding: var(--sc-spacing-0-25) var(--sc-spacing-0-25) var(--sc-spacing-0-25) var(--sc-spacing-1); border-radius: var(--sc-radius-full); }
    .barra__paso { color: var(--sc-text-primary); padding-inline-end: var(--sc-spacing-0-5); white-space: nowrap; }
    .tarea { inline-size: 28rem; max-inline-size: calc(100vw - var(--sc-spacing-2)); display: flex; flex-direction: column; gap: var(--sc-spacing-0-5); padding: var(--sc-spacing-1) var(--sc-spacing-1-25); border-radius: var(--sc-radius-lg); }
    .tarea h2, .tarea p { margin: 0; }
    .tarea h2 { color: var(--sc-text-heading); }
    .tarea p { color: var(--sc-text-primary); text-wrap: pretty; }
  `,
})
export class PruebaCapaComponent {
  protected readonly prueba = inject(PruebaService);
  protected readonly escala = ESCALA;
  protected readonly opcionesModerador = MODERADOR;
  protected readonly verTarea = signal(false);
  protected readonly apuntado = signal(false);
  protected readonly facilidad = signal<number | null>(null);
  protected readonly moderador = signal<ResultadoDePaso['moderador']>(null);

  protected ayuda(): void {
    this.prueba.pedirAyuda();
    this.apuntado.set(true);
    setTimeout(() => this.apuntado.set(false), 2000);
  }

  protected terminar(): void {
    this.verTarea.set(false);
    this.facilidad.set(null);
    this.moderador.set(null);
    this.prueba.terminar();
  }

  protected volver(): void {
    this.prueba.volverATrabajar();
  }

  protected siguiente(): void {
    const f = this.facilidad();
    if (f === null) return;
    this.prueba.siguiente(f, this.moderador());
  }
}
