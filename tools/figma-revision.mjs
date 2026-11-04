#!/usr/bin/env node
/**
 * Revisión de una página del Figma del Supervisor antes de darla por entregada: imprime el JavaScript que se ejecuta
 * en el fichero (`use_figma` o `figma_execute`, con el Supervisor abierto) y que devuelve tres listas. Las tres tienen
 * que salir vacías.
 *
 *   1. `costuras`: notas para desarrollo que cuentan cómo se montó el Figma («componente local», «limitaciones del
 *      Kit», «se ha compuesto», «Por decidir»…) o nombran cosas que solo existen en este repo (`sc-list-page`, una DD,
 *      una variable `--sc-*`). Una limitación del Kit no va en la entrega: se comprueba y se apunta en
 *      `docs/figma-pendiente.md` (ficha 53).
 *   2. `sinEstilo`: textos de la página fuera de una instancia y sin text style. Cada texto lleva uno de los 14.
 *   3. `menusApretados`: filas de menú cuyo texto tiene el interlineado automático o al 100 %. Así nació el «Recientes»
 *      de Repositorios con filas de 21 en vez de 34.
 *
 * Una página por pasada: con todas a la vez, el servidor de Figma corta la respuesta.
 *
 * Uso:  node tools/figma-revision.mjs "<página>"      (p. ej. "Repositorios", "↳ Tipificaciones")
 */

/** Frases de costura: cómo se hizo el Figma, no qué hace el dev. Medidas en las notas que se limpiaron el 2026-11-04. */
export const COSTURAS = [
  /limitaci[oó]n(es)? del kit/i,
  /kit de figma/i,
  /componentes? locale?s?/i,
  /se ha compuesto/i,
  /candidato a subir/i,
  /no se ha tocado/i,
  /el ds de figma no/i,
  /\bno admite contenido/i,
  /\ben figma,/i,
  /frente al c[oó]digo/i,
  /no tiene variante/i,
  /^por decidir$/i,
  /\bsc-list-page\b/,
  /\bDD-\d+/,
  /--sc-[a-z]/,
];

/** ¿Este texto de nota es una costura? Devuelve el patrón que lo caza, o `null`. */
export function costura(texto) {
  return COSTURAS.find((rx) => rx.test(texto)) ?? null;
}

/** El JavaScript para el fichero. `paginas` va como dato: el script no lee nada de fuera. */
export function scriptDeRevision(pagina) {
  const patrones = COSTURAS.map((rx) => rx.toString()).join(', ');
  return `const COSTURAS = [${patrones}];
const page = figma.root.children.find((p) => p.name.trim() === ${JSON.stringify(pagina.trim())});
if (!page) throw new Error('No hay página ' + ${JSON.stringify(pagina)});
await figma.setCurrentPageAsync(page);
const dentroDeInstancia = (n, tope) => { for (let a = n.parent; a && a !== tope; a = a.parent) if (a.type === 'INSTANCE') return true; return false; };
const costuras = [], sinEstilo = {}, menusApretados = [];
for (const top of page.children) {
  if (!top.findAll) continue;
  for (const t of top.findAll((n) => n.type === 'TEXT')) {
    const pantalla = /^(\\d\\d |Paso )/.test(top.name) || /^\\d\\d /.test(t.parent && t.parent.name || '');
    const doc = !dentroDeInstancia(t, top) || /^Doc\\//.test(t.parent && t.parent.name || '');
    if (doc && !pantalla) { const rx = COSTURAS.find((r) => r.test(t.characters)); if (rx) costuras.push(top.name.slice(0, 30) + ' | ' + t.id + ' | ' + rx + ' | ' + t.characters.slice(0, 120)); }
    if (!dentroDeInstancia(t, top) && !(typeof t.textStyleId === 'string' && t.textStyleId)) {
      const k = t.fontSize === figma.mixed ? 'mixto' : t.fontSize + '/' + (t.lineHeight.unit === 'PIXELS' ? t.lineHeight.value : 'auto');
      (sinEstilo[k] ??= []).length < 3 && sinEstilo[k].push(t.id + ' «' + t.characters.slice(0, 20) + '»');
    }
  }
  for (const fila of top.findAll((n) => n.type === 'INSTANCE' && /^menu-item/.test(n.name))) {
    const t = fila.findOne((n) => n.type === 'TEXT' && n.name === 'Menu Item');
    if (t && t.lineHeight !== figma.mixed && t.lineHeight.unit !== 'PIXELS') menusApretados.push(fila.id + ' ' + Math.round(fila.height) + ' de alto');
  }
}
return { pagina: page.name, costuras, sinEstilo, menusApretados };`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pagina = process.argv[2];
  if (!pagina) {
    console.error('Uso: node tools/figma-revision.mjs "<página del Supervisor>"');
    process.exit(2);
  }
  console.log(scriptDeRevision(pagina));
}
