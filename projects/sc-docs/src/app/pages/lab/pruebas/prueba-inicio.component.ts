import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ScButtonComponent, ScInputTextComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { claveDelNombre, ENSAYO, enlaceDelPrimerPaso, limpiarNombre, NOMBRE_MAX, sesionDe } from './prueba.core.mjs';
import { pruebaPorId } from './pruebas.data';

/**
 * LA PUERTA DE UNA PRUEBA CON USUARIOS (DD-256): lo primero que ve cada persona al abrir su enlace
 * (`/#/prueba/<id>/P3`). Le dice qué va a pasar y qué se apunta, y al pulsar «Empezar» la manda a la primera versión
 * con su sesión en el enlace. Sin cabecera ni lateral del sitio (`app.component.ts`, `solo`): es para alguien que no
 * sabe qué es sc-docs.
 *
 * No nombra las versiones a propósito: «Separado» o «Junto» ya cuentan lo que se espera de cada una.
 *
 * El nombre es opcional: si la persona lo escribe, sale en la sala junto a su P y en el CSV. Se guarda en la sesión de
 * esta pestaña (`claveDelNombre`) mientras va y vuelve del Supervisor, que nunca lo ve, y el final lo mete en su código.
 * El ensayo no lo pide: es de quien modera.
 */
@Component({
  selector: 'app-prueba-inicio',
  imports: [ScButtonComponent, ScIconComponent, ScInputTextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="puerta">
      @if (plan(); as p) {
        <article class="puerta__tarjeta" aria-labelledby="prueba-inicio-titulo">
          <div class="sello" aria-hidden="true">
            <span class="sello__rayo"></span>
            <span class="sello__rayo"></span>
            <span class="sello__rayo"></span>
            <sc-icon class="sello__pulgar" name="thumb_up" filled [size]="32" />
          </div>
          <p class="puerta__ante sc-text-caption-semibold">Prueba de una pantalla del Supervisor</p>
          <h1 id="prueba-inicio-titulo" class="sc-text-h2-semibold">Gracias por echarnos una mano</h1>
          <p class="sc-text-body-regular">
            @if (p.versiones.length > 1) {
              Vas a probar {{ p.versiones.length }} versiones de la misma pantalla con
            } @else {
              Vas a probar una pantalla con
            }
            {{ pasos() }} tareas cortas, unos {{ p.minutos }} minutos. Cada tarea empieza con lo que hay que hacer;
            cuando acabes, pulsa «He terminado».
          </p>
          <ul class="puerta__lista sc-text-body-regular" role="list">
            <li>Se prueba la pantalla, no a ti. Si algo no se entiende, es cosa del diseño.</li>
            <li>Mientras trabajas se apuntan el tiempo, los clics y las pantallas que abres. Ni cámara ni voz.</li>
            <li>Nada sale de tu navegador: al final copias un código y se lo mandas a quien te pasó el enlace.</li>
          </ul>
          @if (esEnsayo()) {
            <div class="puerta__pie">
              <span class="puerta__quien sc-text-caption-regular">Ensayo: no cuenta</span>
              <sc-button icon="play_arrow" label="Empezar" (clicked)="empezar()" />
            </div>
          } @else {
            <div class="puerta__pie puerta__pie--nombre">
              <sc-inputtext
                class="puerta__nombre"
                label="Tu nombre (si quieres)"
                [helperText]="'Si no, saldrás como ' + participante() + '. Solo lo ve quien te pasó el enlace.'"
                autocomplete="given-name"
                [maxlength]="maximo"
                fluid
                [(value)]="nombre"
                (keydown.enter)="empezar()"
              />
              <sc-button icon="play_arrow" label="Empezar" (clicked)="empezar()" />
            </div>
          }
        </article>
      } @else {
        <article class="puerta__tarjeta">
          <h1 class="sc-text-h2-semibold">Este enlace de prueba no existe</h1>
          <p class="sc-text-body-regular">Pide a quien te lo pasó que te lo mande otra vez.</p>
        </article>
      }
    </div>
  `,
  styles: `
    .puerta { min-block-size: 100dvh; display: grid; place-items: center; padding: var(--sc-spacing-2); background: var(--sc-bg-secondary-subtle); }
    .puerta__tarjeta { inline-size: min(36rem, 100%); display: flex; flex-direction: column; gap: var(--sc-spacing-1); padding: var(--sc-spacing-2-5); background: var(--sc-bg-surface); border: 1px solid var(--sc-border-subtle); border-radius: var(--sc-radius-xl); }
    .puerta__tarjeta h1, .puerta__tarjeta p { margin: 0; text-wrap: pretty; }
    .puerta__tarjeta h1 { color: var(--sc-text-heading); }
    .puerta__tarjeta p { color: var(--sc-text-primary); }
    .puerta__ante { color: var(--sc-text-secondary); }
    .puerta__lista { margin: 0; padding-inline-start: var(--sc-spacing-1-25); display: flex; flex-direction: column; gap: var(--sc-spacing-0-5); color: var(--sc-text-secondary); }
    .puerta__pie { display: flex; align-items: center; justify-content: space-between; gap: var(--sc-spacing-1); padding-block-start: var(--sc-spacing-1); }
    /* El botón se alinea con la caja del nombre, no con su ayuda. */
    .puerta__pie--nombre { align-items: flex-start; }
    .puerta__pie--nombre sc-button { margin-block-start: var(--sc-spacing-1-75); }
    .puerta__nombre { flex: 1; min-inline-size: 0; }
    .puerta__quien { color: var(--sc-text-secondary); }

    /* Un pulgar arriba que entra con un saludo: sube, cabecea dos veces y suelta tres destellos. Decorado. */
    .sello { position: relative; display: grid; place-items: center; inline-size: var(--sc-spacing-5); block-size: var(--sc-spacing-5); margin-block-end: var(--sc-spacing-0-5); border-radius: var(--sc-radius-full); background: var(--sc-bg-primary-subtle); color: var(--sc-bg-primary); }
    .sello__pulgar { transform-origin: 35% 85%; }
    .sello__rayo { position: absolute; inset-block-start: 12%; inset-inline-start: 64%; inline-size: var(--sc-spacing-0-25); block-size: var(--sc-spacing-0-75); border-radius: var(--sc-radius-full); background: currentColor; opacity: 0; transform-origin: 50% 300%; }
    .sello__rayo:nth-child(1) { rotate: 10deg; }
    .sello__rayo:nth-child(2) { rotate: 45deg; }
    .sello__rayo:nth-child(3) { rotate: 80deg; }
    @media (prefers-reduced-motion: no-preference) {
      .sello__pulgar { animation: sello-saludo 1300ms cubic-bezier(0.3, 0, 0.2, 1) 200ms both; }
      .sello__rayo { animation: sello-destello 700ms ease-out 650ms both; }
      .sello:hover .sello__pulgar { animation-name: sello-otra; }
    }
    @keyframes sello-saludo {
      0% { transform: translateY(40%) rotate(-35deg) scale(0.4); opacity: 0; }
      30% { transform: translateY(0) rotate(8deg) scale(1.08); opacity: 1; }
      45% { transform: rotate(-10deg) scale(1); }
      60% { transform: rotate(6deg); }
      75% { transform: rotate(-4deg); }
      100% { transform: none; }
    }
    @keyframes sello-otra {
      0%, 100% { transform: none; }
      25% { transform: rotate(-10deg); }
      50% { transform: rotate(6deg); }
      75% { transform: rotate(-4deg); }
    }
    @keyframes sello-destello {
      0% { opacity: 0; scale: 1 0.2; translate: 0 30%; }
      40% { opacity: 1; scale: 1 1; translate: 0 0; }
      100% { opacity: 0; scale: 1 0.6; translate: 0 -40%; }
    }
  `,
})
export class PruebaInicioComponent {
  /** De la ruta (`prueba/:id/:participante`). */
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  protected readonly participante = computed(() => this.params()?.get('participante') ?? 'P1');
  protected readonly esEnsayo = computed(() => this.participante() === ENSAYO);

  protected readonly nombre = signal('');
  protected readonly maximo = NOMBRE_MAX;

  protected readonly plan = computed(() => pruebaPorId(this.params()?.get('id')));
  protected readonly pasos = computed(() => {
    const p = this.plan();
    return p ? p.tareas.length * p.versiones.length : 0;
  });

  protected empezar(): void {
    const p = this.plan();
    if (!p) return;
    const quien = this.participante();
    this.recordarNombre(p.id, quien);
    const fin = `${location.origin}${location.pathname}#/prueba/${p.id}/${quien}/fin`;
    location.assign(enlaceDelPrimerPaso(sesionDe(p, quien, fin)));
  }

  /** Vacío también borra: si la persona vuelve a entrar y ya no quiere que salga, no sale. */
  private recordarNombre(prueba: string, quien: string): void {
    const nombre = this.esEnsayo() ? '' : limpiarNombre(this.nombre());
    try {
      if (nombre) sessionStorage.setItem(claveDelNombre(prueba, quien), nombre);
      else sessionStorage.removeItem(claveDelNombre(prueba, quien));
    } catch {
      // Datos bloqueados: la prueba sigue y sale como P1.
    }
  }
}
