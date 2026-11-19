import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { ScButtonComponent, ScIconTileComponent, ScTagComponent, type ScSeverity } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { GRUPOS, VEREDICTOS, grupoDe, severidadDe, type Grupo } from './veredictos';

/** Una fila del mapa: una variable de Figma, o un token que solo existe en el tema. */
interface Fila {
  componente: string;
  variable: string;
  token: string;
  usaFigma: string;
  leeWeb: string;
  veredicto: string;
  bloque: string;
  capa: string;
  selector: string;
  accionable: string;
  motivo: string;
  revisado: string;
}

/** Forma de `projects/sc-docs/public/variables/_variables-status.json` (lo deriva
 *  `scripts/variables-map.mjs` desde el crudo medido; el CSV sale de la misma ejecución). */
interface MapaStatus {
  medidoEl: string;
  fuente: { figma: string; web: string };
  total: number;
  componentes: number;
  filas: Fila[];
}

/** Cuántas filas de cada grupo. Es lo que pintan las barras. */
type PorGrupo = Record<Grupo, number>;

/** Las filas de los hallazgos sueltos no son de ningún componente (`scripts/variables-map.mjs`). */
const FUERA = '(fuera de componente)';

/** A partir de cuántos días la página avisa de que la medición se ha quedado vieja. */
const DIAS_VIEJA = 60;

/** Lo que el tema publica y el Kit no modela, agrupado por el final del token. */
const FAMILIAS: Record<string, string> = {
  shadow: 'sombras',
  duration: 'duraciones',
  style: 'estilos de línea',
};

const URL_REPO = 'https://github.com/smartcontact-hub/smartcontact-ui/blob/main/docs';

/** Quién tiene que moverse: una decisión pendiente avisa, una petición fuera informa, lo demás es deuda del Kit. */
function severidadAccionable(etiqueta: string): ScSeverity {
  if (etiqueta.startsWith('Pendiente')) return 'warn';
  if (etiqueta.startsWith('Petición')) return 'info';
  return 'secondary';
}

/** «a, b y c»: la lista como se dice. */
const enumerar = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`);

const vacio = (): PorGrupo => ({ llega: 0, dibujo: 0, fuera: 0, 'no-llega': 0 });
const pct = (n: number, de: number) => (de ? Math.round((n / de) * 100) : 0);

/**
 * Mapa de conexión de variables: para cada variable de los componentes que publica el showcase
 * del consumidor, si está enganchada en Figma y si el CSS de PrimeNG la lee.
 *
 * La página solo PINTA, y no escribe a mano ni una cifra: todas salen del JSON. El dato es un
 * artefacto generado (la medición escribe `public/variables/_variables-raw.json` y
 * `npm run variables:map` deriva este JSON y `docs/conexion-variables.csv` en la misma
 * ejecución). Lo que significa cada veredicto vive en `veredictos.ts`; cómo se mide, en
 * `docs/conexion-variables.md`. Ni una cosa ni la otra se repite aquí.
 */
@Component({
  selector: 'app-conexion-variables',
  imports: [ScButtonComponent, ScIconComponent, ScIconTileComponent, ScTagComponent],
  templateUrl: './conexion-variables.component.html',
  styleUrl: './conexion-variables.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConexionVariablesComponent {
  protected readonly status = signal<MapaStatus | null>(null);
  protected readonly error = signal(false);

  /** Componente abierto. `null` = solo las tarjetas. */
  protected readonly abierto = signal<string | null>(null);
  /** Filtro por veredicto dentro del componente abierto. `null` = todos. */
  protected readonly filtro = signal<string | null>(null);
  /** Las tarjetas de «Lo que queda abierto» que se leen enteras. */
  protected readonly leidas = signal<ReadonlySet<string>>(new Set());

  protected readonly grupos = GRUPOS;
  protected readonly severidadDe = severidadDe;
  protected readonly urlMetodo = `${URL_REPO}/conexion-variables.md`;
  protected readonly urlCsv = `${URL_REPO}/conexion-variables.csv`;

  private readonly filas = computed(() => this.status()?.filas ?? []);

  /** Cuándo se midió y si conviene repetirlo. La medición es manual: nada la refresca sola. */
  protected readonly frescura = computed(() => {
    const s = this.status();
    if (!s) return null;
    const medido = new Date(`${s.medidoEl}T00:00:00`);
    const dias = Math.max(0, Math.floor((Date.now() - medido.getTime()) / 86_400_000));
    const fecha = medido.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    return { fecha, dias, vieja: dias > DIAS_VIEJA };
  });

  /**
   * Las tres cifras de la cadena. Las dos primeras miran desde Figma (de sus variables, cuántas
   * dibuja el Kit y cuántas lee PrimeNG); la tercera mira desde la web (de lo que lee el CSS,
   * cuánto sale del Kit) y dice qué es el resto.
   */
  protected readonly cadena = computed(() => {
    const deComponente = this.filas().filter((f) => f.componente !== FUERA);
    const variables = deComponente.filter((f) => f.variable);
    const leidas = deComponente.filter((f) => f.token && f.leeWeb === 'sí');
    const delKit = leidas.filter((f) => f.variable).length;

    const resto = new Map<string, number>();
    for (const f of leidas) {
      if (f.variable) continue;
      const familia = FAMILIAS[f.token.split('-').pop() ?? ''] ?? 'otros';
      resto.set(familia, (resto.get(familia) ?? 0) + 1);
    }

    const dibuja = variables.filter((f) => f.usaFigma === 'sí').length;
    const lee = variables.filter((f) => f.leeWeb === 'sí').length;
    return {
      variables: variables.length,
      dibuja: { n: dibuja, pct: pct(dibuja, variables.length) },
      lee: { n: lee, pct: pct(lee, variables.length) },
      web: { n: delKit, de: leidas.length, pct: pct(delKit, leidas.length) },
      resto: enumerar([...resto].sort((a, b) => b[1] - a[1]).map(([familia, n]) => `${n} ${familia}`)),
    };
  });

  /** Todas las filas por grupo: la barra grande de la leyenda. */
  protected readonly porGrupo = computed(() => {
    const g = vacio();
    for (const f of this.filas()) g[grupoDe(f.veredicto)]++;
    return g;
  });

  /** La leyenda: cada grupo con sus veredictos y cuántas filas tiene cada uno. */
  protected readonly leyenda = computed(() => {
    const cuenta = new Map<string, number>();
    for (const f of this.filas()) cuenta.set(f.veredicto, (cuenta.get(f.veredicto) ?? 0) + 1);
    return GRUPOS.map((g) => ({
      ...g,
      n: this.porGrupo()[g.id],
      veredictos: VEREDICTOS.filter((v) => v.grupo === g.id).map((v) => ({ ...v, n: cuenta.get(v.nombre) ?? 0 })),
    }));
  });

  /** Una tarjeta por componente. Primero los que tienen algo que no llega; luego, por nombre. */
  protected readonly componentes = computed(() => {
    const m = new Map<string, { nombre: string; total: number; grupos: PorGrupo }>();
    for (const f of this.filas()) {
      const c = m.get(f.componente) ?? { nombre: f.componente, total: 0, grupos: vacio() };
      c.total++;
      c.grupos[grupoDe(f.veredicto)]++;
      m.set(f.componente, c);
    }
    return [...m.values()]
      .map((c) => ({ ...c, etiqueta: c.nombre === FUERA ? 'Fuera de componente' : c.nombre }))
      .sort((a, b) => b.grupos['no-llega'] - a.grupos['no-llega'] || a.nombre.localeCompare(b.nombre));
  });

  /** Los veredictos que tiene el componente abierto, para los filtros. */
  protected readonly filtrosAbierto = computed(() => {
    const comp = this.abierto();
    const cuenta = new Map<string, number>();
    for (const f of this.filas()) {
      if (f.componente === comp) cuenta.set(f.veredicto, (cuenta.get(f.veredicto) ?? 0) + 1);
    }
    return [...cuenta].map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n);
  });

  /** Las filas del componente abierto, ya filtradas por veredicto. */
  protected readonly filasAbiertas = computed(() => {
    const comp = this.abierto();
    const v = this.filtro();
    return this.filas().filter((f) => f.componente === comp && (!v || f.veredicto === v));
  });

  /**
   * Lo que espera una decisión: todo accionable que no sea «no» ni «HECHO». El accionable viene
   * en mayúsculas y con un matiz entre paréntesis («FIGMA (el valor ya viaja bien)»): se parte
   * en etiqueta y matiz para que no grite.
   */
  protected readonly abiertas = computed(() =>
    this.filas()
      .filter((f) => f.accionable && f.accionable !== 'no' && f.accionable !== 'HECHO')
      .map((f) => {
        const [, quien = f.accionable, matiz = ''] = /^([^(]+?)\s*(?:\((.*)\))?$/.exec(f.accionable) ?? [];
        const etiqueta = quien.charAt(0) + quien.slice(1).toLowerCase();
        return {
          clave: `${f.componente}|${f.variable}`,
          componente: f.componente === FUERA ? 'Fuera de componente' : f.componente,
          variable: f.variable,
          etiqueta,
          matiz,
          severidad: severidadAccionable(etiqueta),
          motivo: f.motivo,
        };
      }),
  );

  constructor() {
    fetch('/variables/_variables-status.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: MapaStatus) => this.status.set(data))
      .catch(() => this.error.set(true));
  }

  protected abrir(componente: string): void {
    this.abierto.update((cur) => (cur === componente ? null : componente));
    this.filtro.set(null);
  }

  protected filtrar(veredicto: string): void {
    this.filtro.update((cur) => (cur === veredicto ? null : veredicto));
  }

  protected leer(clave: string): void {
    this.leidas.update((s) => {
      const n = new Set(s);
      if (n.has(clave)) n.delete(clave);
      else n.add(clave);
      return n;
    });
  }

  /** El ancho de un tramo de barra, en porcentaje del total. */
  protected ancho(n: number, total: number): string {
    return `${total ? (n / total) * 100 : 0}%`;
  }
}
