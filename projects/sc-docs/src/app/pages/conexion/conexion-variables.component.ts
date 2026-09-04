import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

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
  porVeredicto: Record<string, number>;
  revisadas: number;
  atadas: number;
  pendientes: number;
  faltaDibujarlo: number;
  filas: Fila[];
}

/** Los veredictos, en el orden en que interesa leerlos, con la explicación en una línea.
 *  El texto es el mismo que el de `docs/conexion-variables.md`. Los seis primeros salen
 *  solos del cruce; los tres últimos solo los pone una revisión a mano, porque hace falta
 *  abrir el nodo o el CSS para verlos. Los nueve suman el total. */
const VEREDICTOS: readonly { nombre: string; tono: string; que: string; aMano?: boolean }[] = [
  {
    nombre: 'conectada',
    tono: 'ok',
    que: 'La usa una capa de Figma y la lee el CSS de PrimeNG. La cadena entera está enganchada.',
  },
  {
    nombre: 'Figma no la usa',
    tono: 'aviso',
    que: 'El valor viaja igual, porque el tema se genera desde las variables. Lo que puede desviarse es el dibujo.',
  },
  {
    nombre: 'espejismo',
    tono: 'malo',
    que: 'Figma la usa y PrimeNG no la lee nunca. Se ve bien en el Kit y no llega a la pantalla.',
  },
  {
    nombre: 'muerta',
    tono: 'malo',
    que: 'No la usa nadie por ningún lado. Ocupa sitio en el modelo y no pinta nada.',
  },
  {
    nombre: 'solo web',
    tono: 'neutro',
    que: 'El tema publica el token y Figma no lo modela: sombras, estilos de línea, duraciones y la paleta cruda.',
  },
  {
    nombre: 'solo Figma',
    tono: 'neutro',
    que: 'Auxiliar de dibujo, sin token detrás. No tiene que viajar.',
  },
  {
    nombre: 'mal apuntada',
    tono: 'malo',
    aMano: true,
    que: 'Sí está atada, pero a la variable equivocada: la del estado vecino, la de otro componente o una de la librería remota. El cruce la da por buena porque hay enlace; solo se ve abriendo el nodo.',
  },
  {
    nombre: 'muerta en el tema',
    tono: 'malo',
    aMano: true,
    que: 'El tema publica el token y el componente lee otro canal distinto. Hay dos modelos para lo mismo y el del tema no manda.',
  },
  {
    nombre: 'conectada por el primitivo',
    tono: 'aviso',
    aMano: true,
    que: 'Dos variables con nombres distintos apuntan al mismo primitivo, así que hoy coinciden. No está roto, pero si se mueve una y no la otra, el dibujo y la web divergen.',
  },
];

/** Los veredictos que piden mirar algo: la variable existe y aun así no llega bien.
 *  «Figma no la usa» no entra: el valor viaja igual, lo que puede desviarse es el dibujo. */
const A_MIRAR = new Set(['espejismo', 'muerta', 'mal apuntada', 'muerta en el tema']);

/**
 * Mapa de conexión de variables: para cada variable de los 18 componentes que publica el
 * showcase del consumidor, si está enganchada en Figma y si el CSS de PrimeNG la lee.
 *
 * La página solo PINTA. El dato es un artefacto generado: la medición (puente de Figma +
 * navegador) escribe `public/variables/_variables-raw.json`, y `npm run variables:map`
 * deriva de ahí este JSON y `docs/conexion-variables.csv` en la misma ejecución, así que
 * la página y el Excel no pueden divergir. Mismo patrón que la galería de uso real.
 */
@Component({
  selector: 'app-conexion-variables',
  imports: [],
  templateUrl: './conexion-variables.component.html',
  styleUrl: './conexion-variables.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConexionVariablesComponent {
  protected readonly status = signal<MapaStatus | null>(null);
  protected readonly error = signal(false);

  /** Componente abierto en el acordeón. `null` = solo el resumen. */
  protected readonly abierto = signal<string | null>(null);
  /** Filtro por veredicto dentro del componente abierto. `null` = todos. */
  protected readonly filtro = signal<string | null>(null);

  protected readonly veredictos = VEREDICTOS;

  protected readonly cuenta = computed(() => this.status()?.porVeredicto ?? {});

  /** Los que salen solos del cruce, y los que solo pone una revisión a mano. */
  protected readonly delCruce = VEREDICTOS.filter((v) => !v.aMano);
  protected readonly deRevision = VEREDICTOS.filter((v) => v.aMano);

  /** Resumen por componente: lo que se ve sin abrir nada. */
  protected readonly resumen = computed(() => {
    const filas = this.status()?.filas ?? [];
    const m = new Map<
      string,
      { componente: string; total: number; conectada: number; problema: number; revisadas: number }
    >();
    for (const f of filas) {
      const c = f.componente || '(sin componente)';
      const fila = m.get(c) ?? { componente: c, total: 0, conectada: 0, problema: 0, revisadas: 0 };
      fila.total++;
      if (f.veredicto === 'conectada') fila.conectada++;
      if (A_MIRAR.has(f.veredicto)) fila.problema++;
      if (f.revisado) fila.revisadas++;
      m.set(c, fila);
    }
    return [...m.values()].sort((a, b) => a.componente.localeCompare(b.componente));
  });

  /** Las filas del componente abierto, ya filtradas por veredicto. */
  protected readonly filasAbiertas = computed(() => {
    const comp = this.abierto();
    if (!comp) return [];
    const v = this.filtro();
    return (this.status()?.filas ?? []).filter(
      (f) => (f.componente || '(sin componente)') === comp && (!v || f.veredicto === v),
    );
  });

  /** Lo que se ató en la última pasada y lo que quedó esperando una decisión. */
  protected readonly atadas = computed(() =>
    (this.status()?.filas ?? []).filter((f) => f.accionable === 'HECHO'),
  );
  protected readonly pendientes = computed(() =>
    (this.status()?.filas ?? []).filter((f) => f.accionable.startsWith('PENDIENTE')),
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

  /** Clase de tono para pintar el veredicto siempre igual, en la tabla y en la leyenda. */
  protected tono(veredicto: string): string {
    return VEREDICTOS.find((v) => v.nombre === veredicto)?.tono ?? 'malo';
  }
}
