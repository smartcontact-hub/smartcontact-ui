#!/usr/bin/env node
/**
 * docs:readme-parity — `README.md` y `README.en.md` no pueden derivar.
 *
 * Por qué existe: el repo es público, así que la puerta de entrada se escribe en dos idiomas.
 * Pero `DOCS-INDEX.md` tiene una regla de oro —cada tipo de información tiene UN source of
 * truth, los demás son punteros, **nunca copias**— y un segundo README es, por definición, la
 * copia que esa regla prohíbe. Aquí se permite **solo** mientras una máquina la cruce: la
 * deriva entre dos documentos que dicen lo mismo ya está medida en este repo (el CHECK E de
 * `docs:coherence` nació con el README diciendo 49 componentes y otro doc "~55", con el
 * manifiesto generado en 51; la segunda tardó ocho semanas en cerrarse).
 *
 * Qué compara, y por qué solo esto: la prosa traducida NO es comparable, así que este gate
 * mira únicamente lo que es independiente del idioma y es justo donde duele la deriva:
 *   · SECCIONES — la lista de anclas `<!--sc:sec=clave-->`, en el mismo orden, y una por `##`.
 *   · CÓDIGO — cada tramo `entre backticks` (nombres de gate, paquetes, tokens, rutas).
 *   · CIFRAS — todo número. Un número no se traduce: si uno dice 56 componentes y el otro 51,
 *     uno de los dos miente, y es exactamente el fallo que ya ocurrió.
 *   · ENLACES — todo destino `](…)`, salvo el par cruzado de idioma, que es asimétrico a propósito.
 *   · COMANDOS — cada `npm run …` / `npm i …`, incluidos los de dentro de los bloques de código.
 *
 * Lo que NO exige: que la traducción sea literal. Un párrafo puede redactarse distinto mientras
 * los identificadores, las cifras y la estructura coincidan.
 *
 * Se prueba en rojo con casos fabricados en `scripts/__tests__/readme-parity.test.mjs`.
 *
 * USO  npm run docs:readme-parity   (parte de `npm run verify`)
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const ES = 'README.md';
export const EN = 'README.en.md';

/** El par de enlaces que SÍ debe diferir: cada README apunta al otro idioma. */
const CRUCE = new Set([ES, EN]);

const sinFences = (t) => t.replace(/```[\s\S]*?```/g, '');
const todos = (t, re) => [...t.matchAll(re)].map((m) => m[1] ?? m[0]);

/** Los cinco rasgos independientes del idioma. */
export function extraer(texto) {
  return {
    secciones: todos(texto, /<!--sc:sec=([\w-]+)-->/g),
    codigo: todos(sinFences(texto), /`([^`\n]+)`/g),
    cifras: todos(texto, /\d+(?:\.\d+)*/g),
    enlaces: todos(texto, /\]\(([^)\s]+)\)/g).filter((h) => !CRUCE.has(h)),
    comandos: todos(texto, /npm (?:run [\w:-]+|i https?:\/\/\S+|ci|start)/g),
  };
}

const recuento = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());

/** Devuelve la lista de problemas (vacía = los dos README dicen lo mismo). */
export function revisarParidad(es, en) {
  const problemas = [];
  const a = extraer(es);
  const b = extraer(en);

  // Las secciones van en ORDEN, no como bolsa: una sección movida cambia la lectura.
  if (a.secciones.join(' ') !== b.secciones.join(' '))
    problemas.push(
      `las secciones no coinciden. ${ES}: [${a.secciones.join(', ')}] · ${EN}: [${b.secciones.join(', ')}]. Cada \`##\` lleva su ancla \`<!--sc:sec=clave-->\` y las dos listas van en el mismo orden.`,
    );

  // Un `##` sin ancla deja a este gate ciego justo en la sección nueva, que es cuando hace falta.
  for (const [nombre, texto, anclas] of [
    [ES, es, a.secciones],
    [EN, en, b.secciones],
  ]) {
    const encabezados = (texto.match(/^## /gm) || []).length;
    if (encabezados !== anclas.length)
      problemas.push(
        `${nombre} tiene ${encabezados} secciones \`##\` y ${anclas.length} anclas \`<!--sc:sec=…-->\`. Sin ancla, la sección queda fuera de la comparación.`,
      );
  }

  const CAMPOS = {
    codigo: 'tramo de código',
    cifras: 'cifra',
    enlaces: 'enlace',
    comandos: 'comando',
  };
  for (const [campo, etiqueta] of Object.entries(CAMPOS)) {
    const A = recuento(a[campo]);
    const B = recuento(b[campo]);
    for (const clave of new Set([...A.keys(), ...B.keys()])) {
      const n = A.get(clave) || 0;
      const m = B.get(clave) || 0;
      if (n !== m)
        problemas.push(
          `${etiqueta} \`${clave}\`: ${n} vez/veces en ${ES}, ${m} en ${EN}. Los dos README describen el mismo repo, así que esto solo puede ser deriva.`,
        );
    }
  }
  return problemas;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = resolve(import.meta.dirname, '..');
  const log = (s = '') => process.stdout.write(s + '\n');
  const falta = [ES, EN].find((f) => !existsSync(resolve(root, f)));
  if (falta) {
    log(`✗ falta ${falta}: la puerta de entrada se mantiene en los dos idiomas.`);
    process.exit(1);
  }
  const problemas = revisarParidad(
    readFileSync(resolve(root, ES), 'utf8'),
    readFileSync(resolve(root, EN), 'utf8'),
  );
  log('─'.repeat(60));
  if (problemas.length === 0) {
    log(`✓ README OK — ${ES} y ${EN} coinciden en secciones, código, cifras, enlaces y comandos.`);
    process.exit(0);
  }
  for (const p of problemas) log('  ✗ ' + p);
  log(`✗ ${problemas.length} divergencia(s) entre los dos README. Toca los dos, o ninguno.`);
  process.exit(1);
}
