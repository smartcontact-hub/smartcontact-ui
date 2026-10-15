// @ts-check
/**
 * Lo que una plantilla hace con su contenido, sin Angular (para probarlo con node:test, `scripts/__tests__/templates.test.mjs`).
 *
 * Una plantilla de chat o de correo guarda HTML (lo que escribe el editor, ya saneado: en Voice la plantilla «Imagen» lo
 * guardaba con una imagen en base64 y la tabla lo enseñaba en crudo). Una de WhatsApp guarda el TEXTO de WhatsApp, con sus
 * marcas (`*negrita*`, `_cursiva_`, `~tachado~`): es lo que WhatsApp entiende, y el editor lo enseña como HTML y lo
 * devuelve al guardar.
 */
import { campos } from '../../repositories/state/agenda-contacts.core.mjs';

/** Los canales de una plantilla. */
export const CANALES_DE_PLANTILLA = ['chat', 'email', 'whatsapp'];

/** Las plantillas que caben en una importación. */
export const TOPE_DE_PLANTILLAS = 500;

const ENTIDADES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
const desescapar = (texto) => texto.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (e) => ENTIDADES[e] ?? e);
const escapar = (texto) => texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** ¿Lleva etiquetas HTML? Un texto de antes (sin ellas) se enseña tal cual. */
const llevaHtml = (texto) => /<\/?[a-z][^>]*>/i.test(texto);

/** El texto de un contenido, en una línea: sin etiquetas, con los saltos como espacios. Para la tabla y la búsqueda. */
export function textoPlano(contenido) {
  const sinImagen = String(contenido ?? '').replace(/<(script|style|iframe|object|embed|svg)\b[\s\S]*?<\/\1>/gi, ' ');
  const sinEtiquetas = sinImagen.replace(/<\/(p|li|div|h[1-6])>|<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '');
  return desescapar(sinEtiquetas).replace(/\s+/g, ' ').trim();
}

/** ¿No hay nada escrito? (Quill deja `<p><br></p>` en un editor vacío.) */
export function contenidoVacio(contenido) {
  return textoPlano(contenido) === '';
}

/** Las etiquetas que sobreviven al guardar: las del formato del editor. Ninguna lleva atributos, salvo el enlace. */
const PERMITIDAS = new Set(['p', 'br', 'strong', 'em', 'u', 's', 'a']);
const NORMALIZAR = { b: 'strong', i: 'em', strike: 's', del: 's' };
const SEGURO = /^(https?:|mailto:)/i;

/**
 * El HTML que se guarda: solo las etiquetas del editor (párrafos, negrita, cursiva, subrayado, tachado, enlace), sin
 * atributos —salvo el `href` de un enlace http(s) o mailto—, y sin scripts, estilos, imágenes ni marcos. Lo que el editor
 * no ofrece, no se guarda: se queda su texto.
 */
export function sanearHtml(html) {
  const entrada = String(html ?? '');
  if (!llevaHtml(entrada)) return entrada;
  // Quill escribe `&nbsp;` por cada espacio: un mensaje que no parte las líneas por sus palabras. Un espacio es un espacio.
  const limpio = entrada
    .replace(/<(script|style|iframe|object|embed|svg)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/&nbsp;/g, ' ');
  return limpio.replace(/<(\/?)([a-z][a-z0-9]*)\b([^>]*)>/gi, (_todo, cierra, nombre, atributos) => {
    const etiqueta = NORMALIZAR[nombre.toLowerCase()] ?? nombre.toLowerCase();
    if (!PERMITIDAS.has(etiqueta)) return '';
    if (cierra) return `</${etiqueta}>`;
    if (etiqueta === 'a') {
      const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(atributos);
      const destino = (href?.[1] ?? href?.[2] ?? '').trim();
      return SEGURO.test(destino) ? `<a href="${destino.replace(/"/g, '&quot;')}" rel="noopener noreferrer" target="_blank">` : '<a>';
    }
    return `<${etiqueta}>`;
  });
}

/** El HTML del editor a texto de WhatsApp: `<strong>` → `*…*`, `<em>` → `_…_`, `<s>` → `~…~`; los párrafos, en líneas. */
export function htmlAWhatsApp(html) {
  const marcas = (texto, etiqueta, marca) =>
    texto.replace(new RegExp(`<${etiqueta}>(\\s*)([\\s\\S]*?)(\\s*)</${etiqueta}>`, 'gi'), (_t, antes, dentro, despues) =>
      dentro ? `${antes}${marca}${dentro}${marca}${despues}` : `${antes}${despues}`,
    );
  let texto = sanearHtml(html);
  texto = marcas(texto, 'strong', '*');
  texto = marcas(texto, 'em', '_');
  texto = marcas(texto, 's', '~');
  texto = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(/<\/?p>/gi, '')
    .replace(/<[^>]*>/g, '');
  return desescapar(texto).replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
}

/** Marca de WhatsApp (`*`, `_` o `~`) a su etiqueta: solo entre límites de palabra y sin espacios por dentro. */
function conMarca(linea, simbolo, etiqueta) {
  const s = `\\${simbolo}`;
  const patron = new RegExp(`(^|[\\s(])${s}([^\\s${s}](?:[^${s}]*[^\\s${s}])?)${s}(?=$|[\\s.,;:!?)])`, 'g');
  return linea.replace(patron, `$1<${etiqueta}>$2</${etiqueta}>`);
}

/** El texto de WhatsApp al HTML del editor: las marcas pasan a `<strong>`, `<em>` y `<s>`, y cada línea, a un párrafo. */
export function whatsAppAHtml(texto) {
  return String(texto ?? '')
    .split(/\r?\n/)
    .map((linea) => {
      if (!linea.trim()) return '<p><br></p>';
      let html = escapar(linea);
      html = conMarca(html, '*', 'strong');
      html = conMarca(html, '_', 'em');
      html = conMarca(html, '~', 's');
      return `<p>${html}</p>`;
    })
    .join('');
}

/** Texto de antes (sin etiquetas) a párrafos, sin leer marcas de WhatsApp. */
function textoAParrafos(texto) {
  return texto
    .split(/\r?\n/)
    .map((linea) => (linea.trim() ? `<p>${escapar(linea)}</p>` : '<p><br></p>'))
    .join('');
}

/** Lo que se enseña en el editor: el HTML guardado, o el texto de antes (sin etiquetas) hecho párrafos, o el de WhatsApp. */
export function contenidoParaEditor(contenido, canal) {
  const texto = String(contenido ?? '');
  if (canal === 'whatsapp') return whatsAppAHtml(texto);
  if (!texto.trim()) return '';
  return llevaHtml(texto) ? texto : textoAParrafos(texto);
}

/** Lo que se guarda desde el editor: el texto de WhatsApp con sus marcas, o el HTML saneado. */
export function contenidoParaGuardar(html, canal) {
  return canal === 'whatsapp' ? htmlAWhatsApp(html) : sanearHtml(html);
}

/** El canal de una celda de CSV: por su código o por su nombre en cualquier idioma. */
const CANAL_DE_CSV = { chat: 'chat', email: 'email', 'e-mail': 'email', correo: 'email', courriel: 'email', whatsapp: 'whatsapp' };

/** La primera línea de la plantilla (en cualquiera de los cuatro idiomas): su cabecera, que no cuenta. */
const CABECERA = /^(t[ií]tulo|title|titre)$/i;

/**
 * Lo que entra desde un CSV: una línea por plantilla, `título;canal;contenido`, con `;` si lo lleva la primera línea y,
 * si no, `,`. Los saltos de línea del contenido se escriben `\n`. Una línea sin título, con un canal que no es chat, email
 * o WhatsApp, o sin contenido, es un error con su número de línea; un título que ya existe (sin mirar mayúsculas), o que
 * se repite en el archivo, se salta y se cuenta; lo que pasaría del tope se cuenta en `sobran`.
 */
export function parsearPlantillasCsv(texto, existentes, tope = TOPE_DE_PLANTILLAS) {
  const resultado = { nuevas: [], errores: [], repetidas: 0, sobran: 0 };
  const vistos = new Set(existentes.map((t) => t.title.trim().toLowerCase()));
  const sitio = Math.max(0, tope - existentes.length);
  let separador = null;
  String(texto ?? '')
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .forEach((linea, i) => {
      if (!linea.trim()) return;
      const primera = separador === null;
      separador ??= linea.includes(';') ? ';' : ',';
      const [title = '', canal = '', cuerpo = ''] = campos(linea, separador);
      if (primera && CABECERA.test(title)) return;
      if (!title) return void resultado.errores.push({ linea: i + 1, motivo: 'titulo' });
      const type = CANAL_DE_CSV[canal.trim().toLowerCase()];
      if (!type) return void resultado.errores.push({ linea: i + 1, motivo: 'canal' });
      const body = cuerpo.replace(/\\n/g, '\n').trim();
      if (!body) return void resultado.errores.push({ linea: i + 1, motivo: 'contenido' });
      const clave = title.toLowerCase();
      if (vistos.has(clave)) return void resultado.repetidas++;
      if (resultado.nuevas.length >= sitio) return void resultado.sobran++;
      vistos.add(clave);
      // El contenido de un chat o un correo es HTML: el texto del archivo entra como párrafos. El de WhatsApp, tal cual.
      resultado.nuevas.push({ title, type, body: type === 'whatsapp' ? body : textoAParrafos(body) });
    });
  return resultado;
}

/** La plantilla del archivo: la cabecera (ya en el idioma de la app), con `;` y BOM para que Excel abra las tildes. */
export function plantillaDePlantillasCsv(cabecera) {
  return `﻿${cabecera.join(';')}\r\n`;
}
