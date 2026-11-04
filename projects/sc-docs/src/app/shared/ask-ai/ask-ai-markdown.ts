import createDOMPurify from 'dompurify';

/**
 * El Markdown que devuelve el asistente, a HTML. Solo lo que el modelo usa de verdad: párrafos, listas, títulos cortos,
 * negrita, `código`, bloques ``` y enlaces. Sin dependencias nuevas: todo se escapa primero y luego pasa por DOMPurify,
 * que ya es del repo.
 *
 * Las tablas (las de propiedades de una ficha) salen como tabla de verdad y con su scroll: en texto eran una sopa de
 * barras verticales.
 *
 * Los enlaces a la doc se quedan DENTRO de la doc: `ia/button.md` (la ficha en texto) y `https://sc-doc.pages.dev/#/…`
 * pasan a la ruta `#/…`, la página para personas, sin salir a producción cuando se mira en local.
 */

const DOM_PURIFY = typeof window === 'undefined' ? null : createDOMPurify(window);

/** Las fichas de Fundamentos tienen su página fuera de `/components`. */
const RUTA_DE_FICHA: Readonly<Record<string, string>> = {
  tokens: '/fundamentos/color',
  patrones: '/fundamentos/patrones',
  iconos: '/fundamentos/iconos',
};

export function rutaDeFicha(ficha: string): string {
  return RUTA_DE_FICHA[ficha] ?? `/components/${ficha}`;
}

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function destino(url: string): { href: string; fuera: boolean } | null {
  const ficha = /^(?:\.\/|\/)?ia\/([a-z0-9-]+)\.md$/.exec(url);
  if (ficha) return { href: '#' + rutaDeFicha(ficha[1]), fuera: false };
  const doc = /^(?:https:\/\/sc-doc\.pages\.dev\/?)?(#\/.*)$/.exec(url);
  if (!doc) return /^https?:\/\//.test(url) ? { href: url, fuera: true } : null;
  // Las fichas de Fundamentos tienen su página fuera de `/components`, aunque el modelo las enlace ahí.
  const fundamento = /^#\/components\/(tokens|patrones|iconos)$/.exec(doc[1]);
  return { href: fundamento ? '#' + rutaDeFicha(fundamento[1]) : doc[1], fuera: false };
}

/** Lo de dentro de una línea: `código`, **negrita** y [enlaces](url). Recibe texto YA escapado. */
function enLinea(texto: string): string {
  const codigos: string[] = [];
  let salida = texto.replace(/`([^`]+)`/g, (_, c: string) => {
    // Pequeño (Caption): una palabra de código dentro de una frase no debe pesar más que la frase.
    codigos.push(`<code class="sc-text-caption-regular">${c}</code>`);
    return `\u0000${codigos.length - 1}\u0000`;
  });
  salida = salida
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (todo, rotulo: string, url: string) => {
      const d = destino(url.replace(/&amp;/g, '&'));
      if (!d) return rotulo;
      const href = escapar(d.href);
      return d.fuera
        ? `<a href="${href}" target="_blank" rel="noopener">${rotulo}</a>`
        : `<a href="${href}">${rotulo}</a>`;
    })
    // Una dirección pelada también es enlace (el modelo a veces no la envuelve). Solo tras un espacio o al empezar: así
    // no toca las que ya están dentro de un `href="…"` de arriba.
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:])/g, (todo, antes: string, url: string) => {
      const d = destino(url.replace(/&amp;/g, '&'));
      if (!d) return todo;
      const href = escapar(d.href);
      return d.fuera
        ? `${antes}<a href="${href}" target="_blank" rel="noopener">${url}</a>`
        : `${antes}<a href="${href}">${url}</a>`;
    });
  // eslint-disable-next-line no-control-regex
  return salida.replace(/\u0000(\d+)\u0000/g, (_, i: string) => codigos[Number(i)]);
}

/** `copiar`: el rótulo del botón de copiar de cada bloque de código (el componente escucha sus clics). */
export function markdownAHtml(md: string, copiar: string): string {
  const lineas = md.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let parrafo: string[] = [];
  let lista: { tipo: 'ul' | 'ol'; items: string[] } | null = null;
  let tabla: string[][] = [];

  const cerrarParrafo = (): void => {
    if (parrafo.length) html.push(`<p>${enLinea(escapar(parrafo.join(' ')))}</p>`);
    parrafo = [];
  };
  const cerrarLista = (): void => {
    if (lista) html.push(`<${lista.tipo}>${lista.items.map((i) => `<li>${i}</li>`).join('')}</${lista.tipo}>`);
    lista = null;
  };
  const cerrarTabla = (): void => {
    if (tabla.length) {
      const [cabecera, ...filas] = tabla;
      const th = cabecera.map((c) => `<th>${enLinea(escapar(c))}</th>`).join('');
      const tr = filas.map((f) => `<tr>${f.map((c) => `<td>${enLinea(escapar(c))}</td>`).join('')}</tr>`).join('');
      html.push(`<div class="ask-md__tabla"><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`);
    }
    tabla = [];
  };

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    const valla = /^\s*```\s*([\w+-]*)\s*$/.exec(linea);
    if (valla) {
      cerrarParrafo();
      cerrarLista();
      cerrarTabla();
      const codigo: string[] = [];
      i++;
      // Un bloque aún abierto (la respuesta llega a trozos) se pinta igual, hasta donde haya llegado.
      while (i < lineas.length && !/^\s*```\s*$/.test(lineas[i])) codigo.push(lineas[i++]);
      const lengua = valla[1] ? `<span class="ask-md__lengua sc-text-caption-regular">${escapar(valla[1])}</span>` : '';
      const boton = `<button type="button" class="ask-md__copiar sc-text-caption-regular">${escapar(copiar)}</button>`;
      html.push(`<div class="ask-md__codigo">${lengua}${boton}<pre><code class="sc-text-caption-regular">${escapar(codigo.join('\n'))}</code></pre></div>`);
      continue;
    }
    // Una fila de tabla: `| a | b |`. La de guiones (`|---|---|`) solo separa la cabecera y no se pinta.
    if (/^\s*\|.*\|\s*$/.test(linea)) {
      cerrarParrafo();
      cerrarLista();
      if (!/^\s*\|[\s|:-]+\|\s*$/.test(linea)) tabla.push(linea.trim().slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|')));
      continue;
    }
    cerrarTabla();
    const titulo = /^#{1,6}\s+(.*)$/.exec(linea);
    const vineta = /^\s*[-*]\s+(.*)$/.exec(linea);
    const numero = /^\s*\d+[.)]\s+(.*)$/.exec(linea);
    if (!linea.trim()) {
      cerrarParrafo();
      cerrarLista();
    } else if (titulo) {
      cerrarParrafo();
      cerrarLista();
      html.push(`<p class="ask-md__titulo">${enLinea(escapar(titulo[1]))}</p>`);
    } else if (vineta || numero) {
      cerrarParrafo();
      const tipo = vineta ? 'ul' : 'ol';
      if (lista && lista.tipo !== tipo) cerrarLista();
      lista ??= { tipo, items: [] };
      lista.items.push(enLinea(escapar((vineta ?? numero)![1])));
    } else {
      cerrarLista();
      parrafo.push(linea.trim());
    }
  }
  cerrarParrafo();
  cerrarLista();
  cerrarTabla();

  const crudo = html.join('');
  return DOM_PURIFY ? DOM_PURIFY.sanitize(crudo, { ADD_ATTR: ['target'] }) : crudo;
}
