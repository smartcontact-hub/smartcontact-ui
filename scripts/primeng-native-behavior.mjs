/**
 * ¿Cambia nuestro CSS el COMPORTAMIENTO nativo de una pieza de PrimeNG? La pieza pura de la
 * sección F de `audit-primeng-coupling.mjs`, aparte para probarla con casos fabricados
 * (`scripts/__tests__/audit-primeng-coupling.test.mjs`).
 *
 * POR QUÉ (2026-09-15, DD-113). La regla de Rafa para un componente de primeng.dev es «el nativo
 * tal cual, adaptado con nuestros tokens». Los tokens no cambian cómo se comporta; lo que sí lo
 * cambia es una regla que OCULTA una pieza, le pone o le quita MOVIMIENTO, o la TRANSFORMA. Ese día
 * se coló una: `.p-tablist-active-bar { display: none }` y una marca fija en su lugar, que quitaba
 * el deslizamiento de la raya de `p-tabs` que se ve en primeng.dev. Pasó `verify` entero.
 *
 * Qué cuenta: un bloque cuyo selector nombra una clase `.p-*` y que declara `display: none`,
 * `visibility: hidden`, `transition*`, `animation*` o `transform`. Los que ya existen con motivo
 * viven en la lista del audit; uno nuevo tiene que entrar ahí con su porqué, o el gate se pone rojo.
 */

const CAMBIO = /\b(display\s*:\s*none|visibility\s*:\s*hidden|transition(?:-[a-z]+)?\s*:|animation(?:-[a-z]+)?\s*:|transform\s*:)/g;

const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

/** Selector legible: sin el código TS que lo precede en `css.ts` y con los espacios plegados. */
export const normalizarSelector = (crudo) => crudo.split('`').at(-1).replace(/\s+/g, ' ').trim();

/** Bloques `.p-*` que cambian el comportamiento: `[{ selector, cambios: ['display: none', …] }]`. */
export function cambiosDeComportamiento(texto) {
  const out = [];
  for (const m of sinComentarios(String(texto)).matchAll(/([^{};]*)\{([^{}]*)\}/g)) {
    const selector = normalizarSelector(m[1]);
    if (!/\.p-[a-z]/.test(selector)) continue;
    const cambios = [...m[2].matchAll(CAMBIO)].map((c) => c[1].replace(/\s*:\s*/, ': ').replace(/:\s*$/, ''));
    if (cambios.length) out.push({ selector, cambios });
  }
  return out;
}

/**
 * Permisos sin fila en el catálogo: cada selector permitido tiene que aparecer, entre comillas
 * invertidas, en la sección de `docs/customs-catalog.md` que empieza por `## 8.` (así el desvío se
 * encuentra y se revisa, no vive solo en el gate).
 */
export function permisosSinFila(permitidos, catalogo) {
  const i = String(catalogo).search(/^## 8\. /m);
  const seccion = i < 0 ? '' : catalogo.slice(i).split(/^## (?!8\.)/m)[0];
  return Object.keys(permitidos).filter((sel) => !seccion.includes('`' + sel + '`'));
}

/** Los que no están en la lista de permitidos (clave = selector normalizado). */
export const sinPermiso = (cambios, permitidos) => cambios.filter((c) => !(c.selector in permitidos));
