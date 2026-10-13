/**
 * Qué revisa la ACCESIBILIDAD de una story, y cómo se cuenta un fallo. PURO: lo comparten el panel del lienzo de
 * sc-docs (`a11y.service.ts`, en el navegador) y la prueba del CI (`e2e/sc-docs-a11y.spec.ts`), para que el número que
 * ves en una ficha y el que vigila el CI salgan de la MISMA regla.
 *
 * Las reglas son las de WCAG 2.2 A y AA que axe sabe comprobar solo. Sin las de «buenas prácticas»: una story es un
 * trozo de página, y reglas como «todo el contenido dentro de un landmark» o «la página tiene un h1» fallarían en
 * todas sin decir nada del componente.
 */
export const OPCIONES_AXE = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
  resultTypes: ['violations'],
};

/** Gravedad de axe, de más a menos: el orden en que se enseñan. */
export const IMPACTOS = ['critical', 'serious', 'moderate', 'minor'];

/** Cómo se llama cada gravedad en la ficha. */
export const IMPACTO_ES = { critical: 'Crítico', serious: 'Grave', moderate: 'Moderado', minor: 'Menor' };

/**
 * Las violaciones de axe, reducidas a lo que se enseña y se compara: la regla, su gravedad, el texto de ayuda y cada
 * elemento que falla con su selector. Ordenadas por gravedad y luego por regla, para que dos pasadas den lo mismo.
 */
export function resumirViolaciones(violations) {
  const rango = (i) => {
    const n = IMPACTOS.indexOf(i ?? 'minor');
    return n === -1 ? IMPACTOS.length : n;
  };
  return [...(violations ?? [])]
    .map((v) => ({
      regla: v.id,
      impacto: v.impact ?? 'minor',
      ayuda: v.help,
      url: v.helpUrl,
      nodos: (v.nodes ?? []).map((n) => ({
        selector: Array.isArray(n.target) ? n.target.map(String).join(' ') : String(n.target ?? ''),
        html: String(n.html ?? '').slice(0, 240),
        resumen: n.failureSummary ?? '',
      })),
    }))
    .sort((a, b) => rango(a.impacto) - rango(b.impacto) || a.regla.localeCompare(b.regla));
}

/** El total que se enseña y se vigila: cada ELEMENTO que falla una regla cuenta uno. */
export function contarFallos(resumen) {
  return resumen.reduce((n, v) => n + v.nodos.length, 0);
}

/**
 * Los elementos de UNA regla agrupados por su motivo: nueve puntos de color que fallan igual se leen como un fallo con
 * nueve elementos, no como nueve párrafos iguales. En el orden en que llegan.
 */
export function agruparNodos(nodos) {
  const grupos = new Map();
  for (const n of nodos ?? []) {
    const g = grupos.get(n.resumen) ?? { resumen: n.resumen, nodos: [] };
    g.nodos.push(n);
    grupos.set(n.resumen, g);
  }
  return [...grupos.values()].map((g) => {
    const cuenta = new Map();
    for (const n of g.nodos) {
      const nombre = n.elemento ?? n.selector;
      cuenta.set(nombre, (cuenta.get(nombre) ?? 0) + 1);
    }
    const elementos = [...cuenta].map(([nombre, veces]) => (veces > 1 ? `${nombre} ×${veces}` : nombre)).join(', ');
    return { resumen: g.resumen, nodos: g.nodos, elementos };
  });
}

/**
 * Lo que la traducción de axe al castellano (4.13) aún no trae y SÍ sale hoy en sc-docs: la zona de toque, el `svg` sin
 * nombre y la barra de progreso sin nombre. Se suma a la suya; lo demás sigue en su inglés hasta que lo traduzcan.
 */
export const AXE_ES_EXTRA = {
  rules: {
    'target-size': {
      description: 'Las zonas de toque tienen tamaño y espacio suficientes',
      help: 'Cada zona de toque mide al menos 24 × 24 px, o deja espacio suficiente alrededor',
    },
    'svg-img-alt': {
      description: 'Los `svg` con rol de imagen tienen un texto alternativo',
      help: 'Un `svg` con rol img, graphics-document o graphics-symbol necesita un texto alternativo',
    },
    'aria-progressbar-name': {
      description: 'Cada barra de progreso ARIA tiene un nombre accesible',
      help: 'Las barras de progreso ARIA necesitan un nombre accesible',
    },
  },
  checks: {
    'target-size': {
      pass: {
        default: 'El control mide lo suficiente (${data.width} × ${data.height} px; el mínimo es ${data.minSize} × ${data.minSize} px)',
        obscured: 'Se ignora: está tapado del todo y no se puede pulsar',
        large: 'La zona supera con creces el mínimo de ${data.minSize} px',
      },
      fail: {
        default: 'La zona de toque es pequeña: ${data.width} × ${data.height} px, y el mínimo es ${data.minSize} × ${data.minSize} px',
        partiallyObscured: 'La zona de toque es pequeña porque algo la tapa en parte: lo que queda mide ${data.width} × ${data.height} px, y el mínimo es ${data.minSize} × ${data.minSize} px',
      },
      incomplete: {
        default: 'Un elemento con tabindex negativo mide ${data.width} × ${data.height} px, menos del mínimo de ${data.minSize} px. ¿Es una zona de toque?',
        contentOverflow: 'No se puede medir bien: su contenido se sale',
        partiallyObscured: 'Un elemento con tabindex negativo queda pequeño porque algo lo tapa en parte (${data.width} × ${data.height} px). ¿Es una zona de toque?',
        partiallyObscuredNonTabbable: 'La zona queda pequeña porque la tapa en parte un vecino con tabindex negativo (${data.width} × ${data.height} px). ¿Es el vecino una zona de toque?',
        tooManyRects: 'No se puede medir: hay demasiados elementos superpuestos',
      },
    },
    'target-offset': {
      pass: {
        default: 'Hay espacio suficiente con sus vecinos: un círculo de ${data.closestOffset} px, y el mínimo es ${data.minOffset} px',
        large: 'La zona supera con creces el mínimo de ${data.minOffset} px',
      },
      fail: 'Le falta espacio con sus vecinos: el círculo que se puede pulsar sin tocar otro mide ${data.closestOffset} px, y el mínimo es ${data.minOffset} px',
      incomplete: {
        default: 'Un elemento con tabindex negativo tiene poco espacio con sus vecinos (${data.closestOffset} px de ${data.minOffset}). ¿Es una zona de toque?',
        nonTabbableNeighbor: 'Le falta espacio con sus vecinos (${data.closestOffset} px de ${data.minOffset}). ¿Es el vecino una zona de toque?',
        tooManyRects: 'No se puede medir: hay demasiados elementos superpuestos',
      },
    },
  },
};

/** La traducción de axe con lo de arriba encima. */
export function localeEs(es) {
  return {
    ...es,
    rules: { ...(es?.rules ?? {}), ...AXE_ES_EXTRA.rules },
    checks: { ...(es?.checks ?? {}), ...AXE_ES_EXTRA.checks },
  };
}
