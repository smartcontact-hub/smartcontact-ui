import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';

/*
 * Ilustración del acceso con movimiento (propuesta de Claude Design, 2026-09-14).
 *
 * Pinta la imagen en un <canvas> WebGL con un shader que la ondula despacio (tres octavas
 * de seno más una respiración global) y deja una estela donde se mueve el puntero. Debajo
 * queda la imagen real: sin WebGL, con el contexto perdido, con el shader sin compilar o al
 * imprimir, se ve la imagen fija de siempre.
 */

const VERT = `attribute vec2 a;varying vec2 v;
void main(){v=a*0.5+0.5;gl_Position=vec4(a,0.,1.);}`;

/* `amp` va en unidades UV: 0.045 son ~64 px de desplazamiento a 1440 de ancho. */
const FRAG = `precision mediump float;
varying vec2 v; uniform sampler2D tex;
uniform float t, amp; uniform vec2 sc, of; uniform vec3 ptr;
uniform vec3 tr[8];
const float LIFE = 1.0;
void main(){
  vec2 uv = vec2(v.x, 1.0 - v.y);
  vec2 toP = uv - ptr.xy;
  float near = exp(-dot(toP, toP) * 9.0) * ptr.z;
  float ring = sin(length(toP) * 22.0 - t * 2.1);
  float w1 = sin(uv.x*3.1 + t*0.40) * sin(uv.y*2.3 - t*0.31);
  float w2 = sin(uv.y*6.4 - t*0.54 + 1.7) * sin(uv.x*1.9 + t*0.20);
  float w3 = sin((uv.x + uv.y)*11.0 + t*0.75);
  vec2 d = vec2(w1 + w2*0.55 + w3*0.22, w2*0.85 - w1*0.5 + w3*0.3) * amp;
  d += vec2(sin(t*0.11), cos(t*0.085)) * amp * 0.9;
  d += (normalize(toP + 0.0001) * ring * 0.55 + toP * 1.4) * near * amp * 0.6;
  for (int i = 0; i < 8; i++) {
    float age = t - tr[i].z;
    if (tr[i].z > 0.0 && age > 0.0 && age < LIFE) {
      vec2 to = uv - tr[i].xy;
      float r = length(to);
      float k = 1.0 - age / LIFE;
      float env = exp(-r * r * 70.0) * k * k;
      d += normalize(to + 0.0001) * sin(r * 22.0 - age * 5.5) * env * amp * 0.85;
    }
  }
  gl_FragColor = texture2D(tex, clamp((uv + d)*sc + of, 0.0005, 0.9995));
}`;

type Uniform = 't' | 'amp' | 'sc' | 'of' | 'ptr' | 'tr';

/** Lo que el navegador puede contar del equipo; ninguno de los dos existe en todos. */
interface NavigatorHints {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
}

@Component({
  selector: 'sc-login-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img #img [src]="src()" alt="" width="2400" height="1683" decoding="async" fetchpriority="high" />
    <canvas #cv aria-hidden="true"></canvas>
  `,
  /* Aquí y no en la hoja de la página: la encapsulación de Angular no deja que la página
   * alcance la imagen y el canvas de este componente. */
  styles: `
    :host {
      display: block;
      overflow: hidden;
    }

    img,
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    img {
      object-fit: cover;
      object-position: left center;
    }

    canvas {
      display: block;
    }

    /* Sin WebGL el canvas se marca \`hidden\`; el \`display: block\` de arriba le ganaría
     * al del navegador. */
    canvas[hidden] {
      display: none;
    }

    @media print {
      canvas {
        display: none;
      }
    }
  `,
})
export class LoginArtComponent implements AfterViewInit {
  readonly src = input.required<string>();
  /** Amplitud en unidades UV. 0.045 ≈ 64 px a 1440 de ancho. */
  readonly amplitude = input(0.045);

  private readonly img = viewChild.required<ElementRef<HTMLImageElement>>('img');
  private readonly cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');

  private gl?: WebGLRenderingContext;
  private u = {} as Record<Uniform, WebGLUniformLocation | null>;
  private tex: WebGLTexture | null = null;
  private prog: WebGLProgram | null = null;
  private buf: WebGLBuffer | null = null;
  private raf?: number;
  private time = 0;
  private ready = false;
  private visible = true;
  private slow = false;
  private calm = 1;
  private idle?: ReturnType<typeof setTimeout>;
  private readonly ptr = { x: 0.5, y: 0.5, w: 0, tx: 0.5, ty: 0.5, tw: 0 };
  /** Rastro del puntero: 8 puntos × (x, y, instante en que se dejó). */
  private readonly trail = new Float32Array(24);
  private trailAt = 0;
  private last?: [number, number];
  private readonly motionOff = matchMedia('(prefers-reduced-motion: reduce)');
  /** Todo lo que se escucha fuera del canvas cuelga de aquí y se suelta de una vez. */
  private readonly listeners = new AbortController();
  private readonly observers: { disconnect(): void }[] = [];

  constructor() {
    /* Cambio de tema: la imagen recarga y su `load` vuelve a subir la textura. Solo cuenta
     * un cambio DE VERDAD: la primera ejecución del efecto puede llegar después de la
     * subida inicial, y marcarla como no lista dejaría el canvas vacío para siempre. */
    let previous: string | undefined;
    effect(() => {
      const next = this.src();
      if (previous !== undefined && next !== previous) this.ready = false;
      previous = next;
    });

    inject(DestroyRef).onDestroy(() => {
      this.stop();
      clearTimeout(this.idle);
      this.listeners.abort();
      for (const o of this.observers) o.disconnect();
      this.gl?.deleteTexture(this.tex);
      this.gl?.deleteProgram(this.prog);
      this.gl?.deleteBuffer(this.buf);
    });
  }

  ngAfterViewInit(): void {
    const c = this.cv().nativeElement;
    if (!this.buildGl()) {
      c.hidden = true; // reserva: se ve la imagen fija y no pasa nada más
      return;
    }
    const { signal } = this.listeners;

    const el = this.img().nativeElement;
    el.addEventListener('load', () => this.upload(), { signal });
    if (el.complete && el.naturalWidth) this.upload();

    const resize = new ResizeObserver(() => this.resize());
    resize.observe(c);
    const seen = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.sync();
    });
    seen.observe(c);
    this.observers.push(resize, seen);

    document.addEventListener('visibilitychange', this.onWake, { signal });
    this.motionOff.addEventListener('change', this.onWake, { signal });
    requestAnimationFrame(() => this.resize());

    /* Contexto perdido (suspensión, cambio de GPU, presión de memoria): se reconstruyen
     * solo los objetos GL; listeners y observers siguen siendo estos. */
    c.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault();
        this.ready = false;
        this.sync();
      },
      { signal },
    );
    c.addEventListener(
      'webglcontextrestored',
      () => {
        if (this.buildGl()) this.upload();
      },
      { signal },
    );

    /* La estela se escucha en `.login`, no en el canvas: la marca y el panel están por
     * encima y se comerían los eventos en casi toda la superficie. */
    const host = (c.closest('.login') as HTMLElement | null) ?? document.body;
    host.addEventListener('pointermove', (e) => this.onPointer(e, c), { passive: true, signal });
    host.addEventListener('pointerleave', () => (this.ptr.tw = 0), { passive: true, signal });

    /* Mientras se escribe en el formulario, media amplitud. */
    host.addEventListener('focusin', () => (this.calm = 0.5), { signal });
    host.addEventListener('focusout', () => (this.calm = 1), { signal });
  }

  private onPointer(e: PointerEvent, c: HTMLCanvasElement): void {
    if (this.motionOff.matches) return;
    const r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    this.ptr.tx = x;
    this.ptr.ty = y;
    this.ptr.tw = 1;
    /* Un punto de rastro cada 4 % de recorrido: ni huecos ni saturación. */
    const dx = x - (this.last?.[0] ?? 9);
    const dy = y - (this.last?.[1] ?? 9);
    if (dx * dx + dy * dy > 0.0016) {
      const i = (this.trailAt = (this.trailAt + 1) % 8) * 3;
      this.trail[i] = x;
      this.trail[i + 1] = y;
      this.trail[i + 2] = this.time || 0.001;
      this.last = [x, y];
    }
    clearTimeout(this.idle);
    this.idle = setTimeout(() => (this.ptr.tw = 0), 900);
  }

  /** Programa, buffer y textura. Seguro de re-ejecutar: borra los anteriores. */
  private buildGl(): boolean {
    const c = this.cv().nativeElement;
    const gl = this.gl ?? c.getContext('webgl', { antialias: false, alpha: true }) ?? undefined;
    if (!gl) return false;
    this.gl = gl;
    gl.deleteProgram(this.prog);
    gl.deleteBuffer(this.buf);
    gl.deleteTexture(this.tex);

    const shader = (kind: number, source: string): WebGLShader | null => {
      const s = gl.createShader(kind);
      if (!s) return null;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = shader(gl.VERTEX_SHADER, VERT);
    const fs = shader(gl.FRAGMENT_SHADER, FRAG);
    const p = gl.createProgram();
    if (!vs || !fs || !p) return false;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    /* Un shader que no compila en esta GPU deja la imagen fija, no un canvas vacío. */
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return false;
    gl.useProgram(p);
    this.prog = p;

    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    this.u = {
      t: gl.getUniformLocation(p, 't'),
      amp: gl.getUniformLocation(p, 'amp'),
      sc: gl.getUniformLocation(p, 'sc'),
      of: gl.getUniformLocation(p, 'of'),
      ptr: gl.getUniformLocation(p, 'ptr'),
      tr: gl.getUniformLocation(p, 'tr[0]'),
    };

    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return true;
  }

  private readonly onWake = (): void => this.sync();

  /** 1,5x normal; 1x con ahorro de datos, poca memoria o si se midió por debajo de 45 fps. */
  private ratio(): number {
    const hints = navigator as Navigator & NavigatorHints;
    const weak =
      hints.connection?.saveData === true ||
      (hints.deviceMemory !== undefined && hints.deviceMemory <= 4);
    return Math.min(devicePixelRatio || 1, this.slow || weak ? 1 : 1.5);
  }

  private upload(): void {
    const gl = this.gl;
    const el = this.img().nativeElement;
    if (!gl || !el.naturalWidth) return;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el);
    this.ready = true;
    this.resize();
    this.sync();
  }

  private resize(): void {
    const gl = this.gl;
    const c = this.cv().nativeElement;
    /* Sin tamaño aún no se puede fijar el lienzo: se espera al observer (si no, 1x1). */
    if (!gl || !c.clientWidth || !c.clientHeight) return;
    const dpr = this.ratio();
    c.width = Math.round(c.clientWidth * dpr);
    c.height = Math.round(c.clientHeight * dpr);
    gl.viewport(0, 0, c.width, c.height);
    const el = this.img().nativeElement;
    const imageAspect = (el.naturalWidth || 2400) / (el.naturalHeight || 1683);
    const boxAspect = c.clientWidth / c.clientHeight;
    /* Lo mismo que `object-fit: cover` + `object-position: left center` de la imagen. */
    const sy = boxAspect > imageAspect ? imageAspect / boxAspect : 1;
    const sx = boxAspect > imageAspect ? 1 : boxAspect / imageAspect;
    gl.uniform2f(this.u.sc, sx, sy);
    gl.uniform2f(this.u.of, 0, boxAspect > imageAspect ? (1 - sy) / 2 : 0);
    this.draw();
  }

  private draw(): void {
    const gl = this.gl;
    const c = this.cv().nativeElement;
    if (!gl || !this.ready) return;
    if (c.clientWidth && Math.round(c.clientWidth * this.ratio()) !== c.width) {
      this.resize();
      return;
    }
    const p = this.ptr;
    p.x += (p.tx - p.x) * 0.08;
    p.y += (p.ty - p.y) * 0.08;
    p.w += (p.tw - p.w) * 0.05;
    /* Con menos movimiento el fotograma quieto es la imagen SIN deformar. */
    const still = this.motionOff.matches;
    gl.uniform1f(this.u.t, this.time);
    gl.uniform1f(this.u.amp, still ? 0 : this.amplitude() * this.calm);
    gl.uniform3f(this.u.ptr, p.x, p.y, still ? 0 : p.w);
    gl.uniform3fv(this.u.tr, this.trail);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Un único sitio decide si el bucle corre: fuera de pantalla, pestaña oculta o menos
   * movimiento dejan un fotograma quieto. */
  private sync(): void {
    const live = this.ready && this.visible && !document.hidden && !this.motionOff.matches;
    if (!live) {
      this.stop();
      this.draw();
      return;
    }
    if (this.raf) return;
    const origin = performance.now() / 1000 - this.time;
    let frames = 0;
    let mark = performance.now();
    const loop = (now: number): void => {
      this.time = now / 1000 - origin;
      this.draw();
      if (!this.slow && ++frames === 60) {
        if (frames / ((now - mark) / 1000) < 45) {
          this.slow = true;
          this.resize();
        }
        frames = 0;
        mark = now;
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = undefined;
  }
}
