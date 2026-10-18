import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  ScButtonComponent,
  ScCheckboxComponent,
  ScFormSectionNavComponent,
  ScIconTileComponent,
  ScInputTextComponent,
  ScProgressBarComponent,
  ScRadioButtonComponent,
  ScTabsComponent,
  ScToggleSwitchComponent,
  type FormNavSection,
  type ScTab,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { CANDIDATOS, type Candidato } from '../color-atencion.data';

/**
 * La muestra del estudio de color: una alta en miniatura hecha con componentes del DS, que la página pinta en un iframe
 * (`?solo=1`, sin el marco de la doc). Lee el candidato de la URL y reescribe las variables EN LA RAÍZ de su propio
 * documento: es lo que haría el cambio de verdad, y por eso vive en un iframe y no en un contenedor de la página (un
 * `--sc-bg-primary` puesto en un contenedor no llega a las `--p-*` de PrimeNG, que se resuelven en la raíz).
 *
 * Dos alcances:
 *  - `boton`: solo el botón principal. Simula las `--sc-cmp-button-primary-*` que generaría el Kit si en Figma
 *    `button/primary` apuntase a un color de la paleta; como aún no existen, escribe las `--p-button-primary-*` que el
 *    preset leería de ellas. Es el único sitio de sc-docs que declara una `--p-*`, y solo dentro de este iframe.
 *  - `variable`: cambia `--sc-bg-primary` y sus tonos, el atajo de dos líneas, y deja ver todo lo que lo lee.
 *
 * Cada pieza se mide al aplicar: su color sin tocar y con el candidato, y su contraste contra lo que tiene debajo.
 */

type Alcance = 'boton' | 'variable';
type Tema = 'claro' | 'oscuro';
type Tipo = 'relleno' | 'texto' | 'grafico';

interface Pieza {
  readonly id: string;
  readonly label: string;
  /** Dónde está el color, dentro de `[data-pieza="<id>"]`; vacío = el propio contenedor. */
  readonly sel: string;
  readonly prop: 'background-color' | 'color' | 'outline-color';
  /** relleno: texto sobre el color (4,5) · texto: el color sobre el fondo (4,5) · gráfico: el color sobre el fondo (3). */
  readonly tipo: Tipo;
}

const PIEZAS: readonly Pieza[] = [
  { id: 'boton', label: 'Botón principal', sel: '.p-button', prop: 'background-color', tipo: 'relleno' },
  { id: 'boton-texto', label: 'Botón de texto', sel: '.p-button', prop: 'color', tipo: 'texto' },
  { id: 'enlace', label: 'Enlace', sel: '', prop: 'color', tipo: 'texto' },
  { id: 'acento', label: 'Frase destacada', sel: '', prop: 'color', tipo: 'texto' },
  { id: 'foco', label: 'Anillo de foco', sel: '', prop: 'outline-color', tipo: 'grafico' },
  { id: 'indice', label: 'Índice: estás aquí', sel: '.form-nav__item--active .form-nav__icon', prop: 'background-color', tipo: 'grafico' },
  { id: 'casilla', label: 'Casilla marcada', sel: '.tri-checkbox__box', prop: 'background-color', tipo: 'grafico' },
  { id: 'interruptor', label: 'Interruptor', sel: '.p-toggleswitch-slider', prop: 'background-color', tipo: 'grafico' },
  { id: 'radio', label: 'Opción elegida', sel: '.p-radiobutton-box', prop: 'background-color', tipo: 'grafico' },
  { id: 'pestana', label: 'Pestaña activa', sel: '.p-tablist-active-bar', prop: 'background-color', tipo: 'grafico' },
  { id: 'progreso', label: 'Barra de progreso', sel: '.p-progressbar-value', prop: 'background-color', tipo: 'grafico' },
  { id: 'mosaico', label: 'Mosaico de icono (el tono de la cifra del resumen)', sel: '.sc-icon-tile', prop: 'background-color', tipo: 'relleno' },
];

/** Cuántas piezas mide la muestra: lo cuenta la página en su índice. */
export const PIEZAS_TOTAL = PIEZAS.length;

interface Lectura {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly cambia: boolean;
  readonly ratio: number | null;
  readonly umbral: number;
}

const v = (paso: string): string => `var(--sc-color-${paso}) !important`;

function cssDe(c: Candidato, tema: Tema, alcance: Alcance, acento: boolean): string {
  if (c.id === 'hoy') return '';
  const par = tema === 'claro' ? c.claro : c.oscuro;
  const reglas: string[] = [];
  if (alcance === 'boton') {
    reglas.push(
      `--p-button-primary-background:${v(par.fondo)}`,
      `--p-button-primary-border-color:${v(par.fondo)}`,
      `--p-button-primary-hover-background:${v(par.pasar)}`,
      `--p-button-primary-hover-border-color:${v(par.pasar)}`,
      `--p-button-primary-active-background:${v(par.pulsar)}`,
      `--p-button-primary-active-border-color:${v(par.pulsar)}`,
      `--p-button-primary-color:${v(par.texto)}`,
      `--p-button-primary-hover-color:${v(par.texto)}`,
      `--p-button-primary-active-color:${v(par.texto)}`,
    );
  } else {
    reglas.push(
      `--sc-bg-primary:${v(par.fondo)}`,
      `--sc-bg-primary-hover:${v(par.pasar)}`,
      `--sc-bg-primary-active:${v(par.pulsar)}`,
      `--sc-text-on-primary:${v(par.texto)}`,
    );
  }
  if (acento) {
    const a = tema === 'claro' ? c.acento.claro : c.acento.oscuro;
    reglas.push(`--sc-text-accent:${v(a)}`, `--sc-text-link:${v(a)}`, `--sc-border-focus:${v(a)}`);
  }
  return `:root{${reglas.join(';')}}`;
}

/* ── Color: cualquier valor CSS → rgba, pasando por un canvas (como `e2e/shared/color.ts`). ── */
let lienzo: CanvasRenderingContext2D | null = null;
function rgba(valor: string): Rgba {
  lienzo ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!lienzo) return [0, 0, 0, 1];
  lienzo.clearRect(0, 0, 1, 1);
  lienzo.fillStyle = '#000';
  lienzo.fillStyle = valor;
  lienzo.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = lienzo.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}
type Rgb = [number, number, number];
type Rgba = [number, number, number, number];
const sobre = (c: Rgba, fondo: Rgba): Rgb => [
  c[0] * c[3] + fondo[0] * (1 - c[3]),
  c[1] * c[3] + fondo[1] * (1 - c[3]),
  c[2] * c[3] + fondo[2] * (1 - c[3]),
];
const lin = (x: number): number => ((x /= 255) <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]: Rgb): number => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
function wcag(a: Rgb, b: Rgb): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const hex = ([r, g, b]: Rgb): string =>
  '#' + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');

@Component({
  selector: 'app-color-atencion-muestra',
  imports: [
    ScButtonComponent,
    ScCheckboxComponent,
    ScFormSectionNavComponent,
    ScIconComponent,
    ScIconTileComponent,
    ScInputTextComponent,
    ScProgressBarComponent,
    ScRadioButtonComponent,
    ScTabsComponent,
    ScToggleSwitchComponent,
  ],
  templateUrl: './muestra.component.html',
  styleUrl: './muestra.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorAtencionMuestraComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap);

  protected readonly candidato = computed(
    () => CANDIDATOS.find((c) => c.id === this.params()?.get('c')) ?? CANDIDATOS[0],
  );
  protected readonly tema = computed<Tema>(() => (this.params()?.get('tema') === 'oscuro' ? 'oscuro' : 'claro'));
  protected readonly alcance = computed<Alcance>(() => (this.params()?.get('alcance') === 'variable' ? 'variable' : 'boton'));
  protected readonly acento = computed(() => this.params()?.get('acento') === '1');

  protected readonly lecturas = signal<readonly Lectura[]>([]);
  protected readonly cambian = computed(() => this.lecturas().filter((l) => l.cambia).length);
  protected readonly fallan = computed(() => this.lecturas().filter((l) => l.ratio !== null && l.ratio < l.umbral).length);

  protected readonly secciones: FormNavSection[] = [
    { id: 'general', labelKey: 'General', icon: 'tune' },
    { id: 'configuracion', labelKey: 'Configuración', icon: 'settings' },
    { id: 'recursos', labelKey: 'Recursos', icon: 'inventory_2' },
    { id: 'grupos', labelKey: 'Grupos asignados', icon: 'group' },
  ];
  protected readonly pestanas: ScTab[] = [
    { value: 'resumen', label: 'Resumen' },
    { value: 'actividad', label: 'Actividad' },
  ];
  protected readonly tipoAgente = signal<unknown>('navegador');

  private readonly estilo = document.createElement('style');
  private readonly temaPrevio = document.documentElement.classList.contains('sc-dark');
  private listo = false;

  constructor() {
    this.estilo.dataset['colorAtencion'] = '';
    document.head.appendChild(this.estilo);
    /* Sin transiciones: la lectura de cada pieza es la del color final, no la de medio camino. */
    const quieto = document.createElement('style');
    quieto.textContent = '*,*::before,*::after{transition:none!important;animation-duration:0s!important}';
    document.head.appendChild(quieto);

    effect(() => {
      const css = cssDe(this.candidato(), this.tema(), this.alcance(), this.acento());
      document.documentElement.classList.toggle('sc-dark', this.tema() === 'oscuro');
      if (this.listo) this.medir(css);
      else this.estilo.textContent = css;
    });

    afterNextRender(() => {
      this.listo = true;
      // Las piezas de PrimeNG pintan su estado al primer ciclo: se mide en el siguiente cuadro.
      requestAnimationFrame(() => this.medir(this.estilo.textContent ?? ''));
      this.avisarAlto();
    });

    inject(DestroyRef).onDestroy(() => {
      this.estilo.remove();
      quieto.remove();
      document.documentElement.classList.toggle('sc-dark', this.temaPrevio);
    });
  }

  /** Lee cada pieza sin el candidato y con él. Todo en el mismo turno: sin transiciones, el estilo se resuelve al leer. */
  private medir(css: string): void {
    this.estilo.textContent = '';
    const antes = this.leer();
    this.estilo.textContent = css;
    const ahora = this.leer();
    this.lecturas.set(
      ahora.map((l, i) => ({ ...l, cambia: l.color !== antes[i].color })),
    );
    this.avisarAlto();
  }

  private leer(): Lectura[] {
    const raiz = this.host.nativeElement;
    const fondoDe = (el: Element): Rgba => {
      for (let n: Element | null = el.parentElement; n; n = n.parentElement) {
        const c = rgba(getComputedStyle(n).backgroundColor);
        if (c[3] > 0.99) return c;
      }
      return rgba(getComputedStyle(document.body).backgroundColor);
    };
    return PIEZAS.map((p) => {
      const caja = raiz.querySelector(`[data-pieza="${p.id}"]`);
      const el = caja && p.sel ? caja.querySelector(p.sel) : caja;
      if (!el) return { id: p.id, label: p.label, color: '—', cambia: false, ratio: null, umbral: 0 };
      const estilo = getComputedStyle(el);
      const fondo = fondoDe(el);
      const color = sobre(rgba(estilo.getPropertyValue(p.prop)), fondo);
      const solido: Rgba = [color[0], color[1], color[2], 1];
      const ratio =
        p.tipo === 'relleno' ? wcag(sobre(rgba(estilo.color), solido), color) : wcag(color, [fondo[0], fondo[1], fondo[2]]);
      return {
        id: p.id,
        label: p.label,
        color: hex(color),
        cambia: false,
        ratio: Math.round(ratio * 100) / 100,
        umbral: p.tipo === 'grafico' ? 3 : 4.5,
      };
    });
  }

  /** La página ajusta el alto del iframe a lo que mide esto: sin barra de scroll dentro. */
  private avisarAlto(): void {
    if (window.parent === window) return;
    requestAnimationFrame(() =>
      window.parent.postMessage({ tipo: 'color-atencion-alto', alto: document.documentElement.scrollHeight }, location.origin),
    );
  }

  protected umbralTxt(n: number): string {
    return String(n).replace('.', ',');
  }

  protected fmt(n: number | null): string {
    return n === null ? '—' : n.toFixed(2).replace('.', ',');
  }
}
