#!/usr/bin/env node
/**
 * ¿DE QUÉ TIPO SON LAS CORRECCIONES DEL USUARIO? — resumen del registro de `correction-capture`.
 *
 *   npm run correcciones                      todo el registro
 *   npm run correcciones -- --dias 30         solo los últimos 30 días
 *   npm run correcciones -- --tipo espaciado  lista entera de un tipo, para mirarla a ojo
 *   npm run correcciones -- --json            la cuenta, para otra herramienta
 *
 * Por qué existe (2026-09-27): para saber qué le cuesta más al usuario —si la agrupación y el aire
 * son lo que más corrige, la revisión previa de DD-123 va bien dirigida; si no, hay que mirar otra
 * cosa—. El registro ya existía (`correcciones.jsonl`, en la carpeta del proyecto de Claude, fuera del
 * repo, así que esto se corre en la máquina donde se trabaja); lo que faltaba era contarlo por tipo.
 *
 * QUÉ CUENTA, Y CÓMO. Cada corrección cae en los tipos cuyas palabras contiene (`TIPOS`); puede caer
 * en varios, y la que no casa con ninguno va a «sin tipo». Es una clasificación por palabras, no por
 * significado: sirve para ver el reparto, y `--tipo` enseña las frases para comprobarlo a mano.
 * QUÉ NO VE. Solo lo que el hook apuntó: los mensajes que SUENAN a corrección (sus `PATRONES`). Una
 * queja dicha como pregunta no está en el registro, y por tanto tampoco aquí.
 */
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { correcciones, leer, rutaRegistro } from './hooks/correction-capture.mjs';

/** Tipos, en el orden en que se enseñan. Las palabras van sin tildes opcionales donde varían. */
export const TIPOS = {
  espaciado: {
    nombre: 'espaciado y alineación',
    re: /\b(espacio|espaciad|aire|hueco|margen|m[aá]rgenes|padding|gap|separaci|separad|pegad|juntit|apelotonad|apretad|respir|aline|descuadr|torcid|centrad|desplazad|altura|ancho|densidad|compact)/i,
  },
  color: {
    nombre: 'color y contraste',
    // Sin «fondo», «rojo» ni «verde»: «revísalo a fondo» o «el CI en rojo» no hablan de color.
    re: /\b(colou?r|contraste|gris|oscuro|borde|sombra|azul|naranja|amarillo|cyan|opacidad)/i,
  },
  texto: {
    nombre: 'texto y copy',
    re: /\b(texto|copy|t[ií]tulo|subt[ií]tulo|etiqueta|palabra|frase|redacci|traducci|idioma|ingl[eé]s|may[uú]scul|tilde|em dash|lenguaje)/i,
  },
  tipografia: {
    nombre: 'tipografía',
    re: /\b(fuente|tipograf|negrita|semibold|font|letra)/i,
  },
  comportamiento: {
    nombre: 'comportamiento',
    re: /\b(clic|click|pulsa|abre|abrir|cierra|scroll|hover|foco|teclado|funciona|no va\b|roto|bug|carga|guarda|arrastr)/i,
  },
  proceso: {
    nombre: 'proceso de trabajo',
    re: /\b(push|preflight|gate|test|commit|rama|pull request|pr\b|ci\b|pregunt|mide|medir|medido|verific|comprueba|hand-?off|learnings|worktree|merge|fusiona|despliega|deploy)/i,
  },
};

/** Los tipos de un texto (ids de `TIPOS`); vacío si no casa con ninguno. */
export const tiposDe = (texto) => Object.entries(TIPOS).filter(([, t]) => t.re.test(String(texto || ''))).map(([id]) => id);

/** Cuenta por tipo sobre las correcciones (las entradas de ruta no cuentan). */
export function resumir(entradas) {
  const lista = correcciones(entradas);
  const cuenta = Object.fromEntries([...Object.keys(TIPOS), 'sin_tipo'].map((k) => [k, []]));
  for (const e of lista) {
    const tipos = tiposDe(e.prompt);
    if (!tipos.length) cuenta.sin_tipo.push(e);
    for (const t of tipos) cuenta[t].push(e);
  }
  const desde = lista.length ? lista.map((e) => e.ts).sort()[0] : null;
  return { total: lista.length, desde, cuenta };
}

const linea = (e) => `  ${String(e.ts).slice(0, 10)}  ${String(e.prompt).replace(/\s+/g, ' ').slice(0, 110)}`;

export function informe({ total, desde, cuenta }, ruta) {
  if (!total) return `Sin correcciones en el registro (${ruta ?? 'no hay carpeta de proyecto de Claude'}).`;
  const pct = (n) => `${Math.round((100 * n) / total)} %`.padStart(5);
  const filas = [...Object.entries(TIPOS).map(([id, t]) => [t.nombre, cuenta[id]]), ['sin tipo', cuenta.sin_tipo]];
  const out = [
    `Registro: ${ruta} · ${total} correcciones desde ${String(desde).slice(0, 10)}`,
    'Por tipo (una corrección puede caer en varios):',
    ...filas.map(([nombre, es]) => `  ${nombre.padEnd(24)} ${String(es.length).padStart(4)}  ${pct(es.length)}`),
  ];
  if (cuenta.espaciado.length) out.push('', 'Las de espaciado y alineación, las más recientes:', ...cuenta.espaciado.slice(-5).map(linea));
  out.push(
    '',
    'Ojo: el registro solo guarda lo que SUENA a corrección (patrones de scripts/hooks/correction-capture.mjs).',
    'Para ver las frases de un tipo: npm run correcciones -- --tipo <espaciado|color|texto|tipografia|comportamiento|proceso|sin_tipo>',
  );
  return out.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const valor = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const dias = Number(valor('--dias')) || Infinity;
  const ruta = rutaRegistro(process.cwd());
  const r = resumir(leer(ruta, dias === Infinity ? Infinity : dias * 24));
  const tipo = valor('--tipo');
  if (tipo) {
    if (!r.cuenta[tipo]) {
      console.error(`tipo «${tipo}» no existe: ${Object.keys(r.cuenta).join(', ')}`);
      process.exit(2);
    }
    console.log(r.cuenta[tipo].map(linea).join('\n') || '(ninguna)');
    return;
  }
  if (args.includes('--json')) {
    const json = { registro: ruta, total: r.total, desde: r.desde, porTipo: Object.fromEntries(Object.entries(r.cuenta).map(([k, v]) => [k, v.length])) };
    console.log(JSON.stringify(json, null, 2));
    return;
  }
  console.log(informe(r, ruta));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
