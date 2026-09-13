import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { ScSkeletonComponent, ScTagComponent } from '@smartcontact-hub/components';

import { AURA_FICHAS } from './aura-fichas';

type Motivo = 'primeone' | 'kit' | 'accesibilidad' | 'sin-motivo' | 'comentado' | 'igual';

interface Esquema {
  readonly aura: string;
  readonly sc: string;
  readonly kit: string | null;
  readonly primeOne: string | null;
  readonly reason: Motivo;
  readonly detail: string;
  readonly originFile: string | null;
  readonly notes: readonly string[];
}

interface Fila {
  readonly key: string;
  readonly category: string;
  readonly same: boolean;
  readonly paints: readonly string[];
  readonly light: Esquema;
  readonly dark: Esquema;
}

interface Causa {
  readonly reason: Motivo;
  readonly note: string | null;
  readonly count: number;
  readonly examples: readonly { readonly key: string; readonly aura: string; readonly primeOne: string | null; readonly kit: string | null; readonly sc: string }[];
}

interface Regla {
  readonly selectors: readonly string[];
  readonly media: readonly string[];
  readonly decls: readonly { readonly prop: string; readonly value: string; readonly light: string }[];
  readonly source: { readonly file: string; readonly name: string | null; readonly line: number | null; readonly comments: readonly string[] };
}

interface FichaDatos {
  readonly component: string;
  readonly meta: { readonly kitExport: string; readonly presetCommit: string; readonly aura: string; readonly primeng: string };
  readonly totals: { readonly keys: number; readonly changed: number; readonly byReason: Record<string, number> };
  readonly measures: readonly Fila[];
  readonly color: readonly { readonly variant: string; readonly count: number; readonly light: readonly Causa[]; readonly dark: readonly Causa[]; readonly rows: readonly Fila[] }[];
  readonly behaviour: readonly Regla[];
  readonly wrapper: { readonly primeInputsNotExposed: readonly string[] } | null;
}

/** Bloque de `css.ts` con sus reglas, para leerlas juntas con su porqué. */
interface BloqueCss {
  readonly name: string;
  readonly line: number | null;
  comment: string | null;
  readonly rules: readonly Regla[];
}

/* El motivo es el ESLABÓN donde nace la diferencia: Aura (código) → PrimeOne (Figma de
 * PrimeTek) → nuestro Kit → nuestro código. */
const MOTIVO: Record<Motivo, { readonly label: string; readonly severity: 'info' | 'success' | 'warn' | 'secondary' | 'contrast' }> = {
  primeone: { label: 'Heredado de PrimeOne', severity: 'secondary' },
  kit: { label: 'Nuestro Kit', severity: 'info' },
  accesibilidad: { label: 'Nuestro código, por contraste', severity: 'success' },
  'sin-motivo': { label: 'Nuestro código, sin motivo', severity: 'warn' },
  comentado: { label: 'Explicado en nuestro código', severity: 'secondary' },
  igual: { label: 'Igual', severity: 'secondary' },
};

const VARIANTE: Record<string, string> = {
  primary: 'Primario',
  secondary: 'Secundario',
  success: 'Éxito',
  info: 'Info',
  warn: 'Aviso',
  help: 'Ayuda',
  danger: 'Peligro',
  contrast: 'Contraste',
  plain: 'Plano',
  link: 'Enlace',
  general: 'Común a todos',
};

/* Los bloques de `css.ts` se nombran por lo que hacen, no por su constante. */
const BLOQUE: Record<string, { readonly titulo: string; readonly motivo: Motivo }> = {
  mdControlSelectors: { titulo: 'Letra e interlineado de los controles', motivo: 'kit' },
  smControlSelectors: { titulo: 'Letra e interlineado de los controles', motivo: 'kit' },
  lgControlSelectors: { titulo: 'Letra e interlineado de los controles', motivo: 'kit' },
  buttonMotionCss: { titulo: 'Respuesta al pulsar', motivo: 'comentado' },
  presetCss: { titulo: 'Icono sin interlineado propio', motivo: 'sin-motivo' },
};

/**
 * Ficha «nuestra capa sobre Aura»: qué le hace falta a un `p-*` de primeng.dev para llegar a
 * nuestro `sc-*`. PROTOTIPO (2026-09-13) para decidir formato y sitio con Rafa.
 *
 * Los datos NO se escriben aquí: los genera `node tools/aura-diff.mjs <componente> --docs
 * projects/sc-docs/public/aura/<componente>.json`, que empaqueta Aura y nuestro preset y compara
 * el CSS de variables clave a clave. Aquí solo se ordena para leer.
 */
@Component({
  selector: 'app-aura-ficha',
  imports: [ScSkeletonComponent, ScTagComponent],
  templateUrl: './aura-ficha.component.html',
  styleUrl: './aura-ficha.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuraFichaComponent {
  /** Segmento de la ruta (`/aura/boton`). sc-docs no activa `withComponentInputBinding`. */
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  protected readonly componente = computed(() => this.params()?.get('componente') ?? '');

  protected readonly ficha = computed(() => AURA_FICHAS[this.componente()] ?? null);
  protected readonly datos = signal<FichaDatos | null>(null);
  protected readonly fallo = signal(false);
  protected readonly motivo = MOTIVO;
  /* El CSS de comportamiento no pasa por Figma: su motivo se dice con otras palabras. */
  protected readonly motivoCss: Record<Motivo, { readonly label: string; readonly severity: 'info' | 'success' | 'warn' | 'secondary' | 'contrast' }> = {
    ...MOTIVO,
    kit: { label: 'Lo pide Figma', severity: 'info' },
    comentado: { label: 'Comportamiento', severity: 'secondary' },
    'sin-motivo': { label: 'Sin motivo escrito', severity: 'warn' },
  };
  protected readonly variante = VARIANTE;

  protected readonly sinMotivo = computed(() => {
    const d = this.datos();
    if (!d) return [];
    const out: { readonly donde: string; readonly que: string }[] = [];
    for (const m of d.measures) {
      if (m.light.reason === 'sin-motivo') {
        out.push({ donde: m.key, que: `Aura ${m.light.aura}, nuestro código ${m.light.sc}. ${m.light.kit ? `El Kit dice ${m.light.kit}.` : 'Ni PrimeOne ni el Kit la dibujan.'}` });
      }
    }
    for (const g of d.color) {
      for (const [esquema, causas] of [['claro', g.light], ['oscuro', g.dark]] as const) {
        const c = causas.find((x) => x.reason === 'sin-motivo');
        if (!c) continue;
        const e = c.examples[0];
        out.push({
          donde: `${VARIANTE[g.variant] ?? g.variant} · ${esquema}`,
          que: `${c.count} ${c.count === 1 ? 'clave' : 'claves'}. Por ejemplo ${e.key}: el Kit dice ${e.kit ?? 'nada'} (PrimeOne ${e.primeOne ?? 'nada'}) y nuestro código pinta ${e.sc}.`,
        });
      }
    }
    for (const b of this.bloques()) {
      if (BLOQUE[b.name]?.motivo === 'sin-motivo') out.push({ donde: `css.ts:${b.line}`, que: `${b.rules.map((r) => r.selectors.join(', ')).join(' · ')} no lleva comentario que diga por qué.` });
    }
    return out;
  });

  /** Cada eslabón con cuántas claves nacen en él: la respuesta a «¿de dónde viene esto?». */
  protected readonly eslabones = computed(() => {
    const r = this.datos()?.totals.byReason ?? {};
    return [
      { motivo: 'primeone' as Motivo, n: r['primeone'] ?? 0, que: 'PrimeTek dibuja en PrimeOne (su Figma) algo distinto de lo que publica en primeng.dev. Lo heredamos al copiar PrimeOne.' },
      { motivo: 'kit' as Motivo, n: r['kit'] ?? 0, que: 'Lo cambiamos nosotros en el Kit: la marca. Nuestro código lo sigue.' },
      { motivo: 'accesibilidad' as Motivo, n: r['accesibilidad'] ?? 0, que: 'Nuestro código se aparta del Kit a propósito, y lo deja escrito, para pasar contraste.' },
      { motivo: 'sin-motivo' as Motivo, n: r['sin-motivo'] ?? 0, que: 'Nuestro código se aparta del Kit y nadie ha dejado escrito por qué.' },
    ];
  });

  protected readonly bloques = computed<readonly BloqueCss[]>(() => {
    const d = this.datos();
    if (!d) return [];
    // Se agrupa por lo que HACE (md, sm y lg son una sola decisión), y un bloque sin motivo no
    // cita comentario: el que tuviera encima habla de otra cosa (en `presetCss`, de su firma).
    const map = new Map<string, BloqueCss & { rules: Regla[] }>();
    for (const r of d.behaviour) {
      const name = r.source.name ?? '¿?';
      const titulo = this.tituloBloque(name);
      if (!map.has(titulo)) map.set(titulo, { name, line: r.source.line, comment: null, rules: [] });
      const b = map.get(titulo)!;
      if (!b.comment && this.motivoBloque(name) !== 'sin-motivo') b.comment = r.source.comments[0] ?? null;
      b.rules.push(r);
    }
    return [...map.values()];
  });

  constructor() {
    effect(() => {
      const f = this.ficha();
      this.datos.set(null);
      this.fallo.set(false);
      if (!f) return;
      fetch(`aura/${f.componente}.json`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d: FichaDatos) => this.datos.set(d))
        .catch(() => this.fallo.set(true));
    });
  }

  protected tituloBloque(name: string): string {
    return BLOQUE[name]?.titulo ?? name;
  }

  protected motivoBloque(name: string): Motivo {
    return BLOQUE[name]?.motivo ?? 'comentado';
  }

  /** Texto con `código` entre comillas invertidas: los trozos impares van en `<code>`. */
  protected trozos(texto: string): readonly string[] {
    return texto.split('`');
  }

  /** ¿Es un color pintable? Para la muestra; lo demás se escribe. */
  protected esColor(v: string | null): boolean {
    return !!v && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v);
  }
}
