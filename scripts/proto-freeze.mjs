/*
 * CONGELAR UN PROTOTIPO · el enlace que se pega en Jira o Confluence no puede apuntar a algo vivo.
 * ================================================================================================
 *
 * El problema. Los cinco sitios sirven `main`: la URL de producción SIEMPRE enseña lo último.
 * Cuando ese enlace viaja a un ticket, el desarrollador que lo abre semanas después ve una
 * pantalla que ya no es la que especifica su ticket, y no tiene forma de saberlo. El prototipo
 * deja de ser una referencia y pasa a ser una fuente de dudas.
 *
 * Lo que NO se hace, y por qué. Mantener una rama viva por entrega se pudre: hay que rebasarla,
 * resolver conflictos y decidir qué entra, para siempre. Y apuntar el PROYECTO de Cloudflare a
 * una rama de feature deja el sitio huérfano en cuanto esa rama se borra al mergear (pasó con
 * `feat/cuscare` y con `agent-mini`).
 *
 * Lo que sí. Tres piezas, y ninguna necesita mantenimiento:
 *
 *   1. Una ETIQUETA git `proto/<TICKET>`. Es el registro durable: apunta a un commit exacto y no
 *      caduca ni aunque se borre todo lo demás.
 *   2. Una RAMA `proto/<ticket>` creada desde esa etiqueta y que NO SE TOCA NUNCA. Cloudflare le
 *      da su preview solo, y esa URL sirve ese build para siempre. Una rama que nadie mergea ni
 *      actualiza no da conflictos: su coste de mantenimiento es cero, y si algún día estorba se
 *      borra y la etiqueta sigue estando.
 *   3. Una FILA en `docs/PROTOTIPOS.md`. Es lo que se enlaza desde Confluence o Jira, no la URL
 *      viva: así el lector ve de qué fecha es lo que está mirando y qué cubre.
 *
 * `--check` (en la cadena `verify`) es lo que impide que la tabla mienta: cada fila tiene que
 * tener su etiqueta, y cada etiqueta `proto/*` su fila. Una tabla de versiones desincronizada es
 * peor que no tenerla, porque se sigue leyendo como si valiera.
 *
 * USO
 *   npm run proto          congela una versión: pregunta tres cosas y lo hace todo
 *   npm run proto:check    lo que corre en `verify`
 *
 * Un solo comando y sin flags que memorizar, porque esto se usa una vez cada entrega y quien lo
 * usa no es quien lo escribió. Los flags (`-- --ticket … --app … --que …`) siguen valiendo para
 * cuando lo llame un script o un agente, y saltan las preguntas correspondientes.
 */
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const TABLA = resolve(root, 'docs/PROTOTIPOS.md');
const log = (s = '') => process.stdout.write(s + '\n');

/** Los cinco sitios y el nombre de su proyecto en Cloudflare Pages (de donde sale la URL). */
export const SITIOS = {
  supervisor: 'sc-supervisor',
  agent: 'sc-agent',
  cuscare: 'sc-cuscare',
  'sc-docs': 'sc-doc',
  'agent-mini': 'agent-mini',
};

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

/** Etiquetas `proto/*` que existen hoy en el repo. */
export function etiquetas() {
  const salida = git('tag', '--list', 'proto/*');
  return salida ? salida.split('\n').map((t) => t.trim()).filter(Boolean) : [];
}

/**
 * Filas de la tabla, parseadas. Una fila es
 * `| TICKET | fecha | app | `proto/TICKET` | URL | qué cubre |`
 */
export function filas(md) {
  const out = [];
  for (const linea of md.split('\n')) {
    const m = /^\|\s*([A-Z][A-Z0-9]*-\d+)\s*\|/.exec(linea);
    if (!m) continue;
    const celdas = linea.split('|').slice(1, -1).map((c) => c.trim());
    out.push({
      ticket: celdas[0],
      fecha: celdas[1],
      app: celdas[2],
      etiqueta: (celdas[3] || '').replace(/`/g, ''),
      url: (celdas[4] || '').replace(/^\[.*\]\(|\)$/g, ''),
      que: celdas[5],
      linea,
    });
  }
  return out;
}

/** El nombre de rama que Cloudflare convierte en subdominio: minúsculas y sin `/`. */
export const ramaDe = (ticket) => 'proto/' + ticket.toLowerCase();
export const urlDe = (ticket, app) =>
  `https://proto-${ticket.toLowerCase()}.${SITIOS[app]}.pages.dev`;

// ── modo --check ─────────────────────────────────────────────────────────────────
if (process.argv.includes('--check')) {
  const problemas = [];
  const md = existsSync(TABLA) ? readFileSync(TABLA, 'utf8') : '';
  const registradas = filas(md);
  const tags = etiquetas();

  log('PROTOTIPOS · la tabla de versiones congeladas cuadra con las etiquetas');
  log('='.repeat(70));
  if (!registradas.length && !tags.length) {
    log('  (todavía no hay ninguna versión congelada)');
  }
  for (const f of registradas) {
    const tieneTag = tags.includes(f.etiqueta);
    const urlEsperada = SITIOS[f.app] ? urlDe(f.ticket, f.app) : null;
    const urlOk = urlEsperada ? f.url === urlEsperada : false;
    log(`  ${tieneTag && urlOk ? '✔' : '✘'} ${f.ticket.padEnd(14)} ${f.etiqueta.padEnd(22)} ${f.app}`);
    if (!tieneTag) problemas.push(`${f.ticket}: la tabla nombra \`${f.etiqueta}\` y esa etiqueta no existe`);
    if (!SITIOS[f.app]) problemas.push(`${f.ticket}: "${f.app}" no es una de las cinco apps`);
    else if (!urlOk) problemas.push(`${f.ticket}: la URL debería ser ${urlEsperada} y pone ${f.url || '(nada)'}`);
  }
  for (const t of tags) {
    if (!registradas.some((f) => f.etiqueta === t))
      problemas.push(`${t}: la etiqueta existe y no tiene fila en docs/PROTOTIPOS.md`);
  }
  log('='.repeat(70));

  if (problemas.length) {
    log('');
    log(`✘ ${problemas.length} desajuste(s) entre la tabla y el repo.`);
    for (const p of problemas) log(`    ${p}`);
    log('');
    log('  Una tabla de versiones desincronizada se sigue leyendo como si valiera.');
    process.exit(1);
  }
  log('');
  log(`✔ ${registradas.length} versión(es) congelada(s), todas con su etiqueta y su URL.`);
  process.exit(0);
}

// ── modo congelar ────────────────────────────────────────────────────────────────
/*
 * PREGUNTA, no exige que te acuerdes. La versión con flags existía primero
 * (`--ticket … --app … --que …`) y Rafa dio con el problema en cuanto la vio: «¿cómo me voy a
 * aprender esos comandos?». Nadie memoriza tres flags y un `--` obligatorio para algo que se usa
 * una vez cada entrega, y un comando que no te sabes es un comando que no usas.
 *
 * Así que `npm run proto` no lleva argumentos: pregunta tres cosas, enseña lo que va a hacer y
 * pide un sí. Los flags siguen aceptándose para cuando lo llame un script o un agente.
 */
const arg = (nombre) => {
  const i = process.argv.indexOf('--' + nombre);
  return i > -1 ? process.argv[i + 1] : null;
};

const APPS = Object.keys(SITIOS);

if (git('status', '--porcelain')) {
  log('✘ Hay cambios sin guardar en el repo.');
  log('  Se congela un commit, no un borrador: guarda o descarta lo que tengas y vuelve.');
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const preguntar = async (texto, validar) => {
  for (;;) {
    const r = (await rl.question(texto)).trim();
    const problema = validar(r);
    if (!problema) return r;
    log('   ' + problema);
  }
};

let ticket = arg('ticket');
let app = arg('app');
let que = arg('que');

const malTicket = (t) => (/^[A-Z][A-Z0-9]*-\d+$/.test(t) ? null : 'Se espera algo como SISMAC-3780.');

if (!ticket || !app || !que) {
  log('');
  log('CONGELAR UNA VERSIÓN DEL PROTOTIPO');
  log('Tres preguntas y listo. Ctrl+C para salir sin hacer nada.');
  log('');

  ticket = ticket ?? (await preguntar('1. ¿Qué ticket? (p. ej. SISMAC-3780)  ', malTicket));

  if (!app) {
    log('');
    log('2. ¿Qué sitio?');
    APPS.forEach((a, n) => log(`     ${n + 1}) ${a.padEnd(11)} ${SITIOS[a]}.pages.dev`));
    const elegido = await preguntar('   Número (Enter = 1, supervisor)  ', (r) =>
      r === '' || (Number(r) >= 1 && Number(r) <= APPS.length) ? null : `Del 1 al ${APPS.length}.`,
    );
    app = APPS[(elegido === '' ? 1 : Number(elegido)) - 1];
  }

  if (!que) {
    log('');
    que = await preguntar('3. ¿Qué cubre? (una línea, la verás en la tabla)  ', (r) =>
      r.length ? null : 'Escribe algo: es lo que leerá quien abra el enlace.',
    );
  }
}

if (!SITIOS[app]) {
  rl.close();
  log(`✘ "${app}" no es uno de los cinco sitios: ${APPS.join(', ')}`);
  process.exit(1);
}
if (malTicket(ticket)) {
  rl.close();
  log(`✘ ${malTicket(ticket)}`);
  process.exit(1);
}

const etiqueta = 'proto/' + ticket;
const rama = ramaDe(ticket);
const url = urlDe(ticket, app);
const hoy = new Date().toISOString().slice(0, 10);
const sha = git('rev-parse', '--short', 'HEAD');
const ramaActual = git('rev-parse', '--abbrev-ref', 'HEAD');

if (etiquetas().includes(etiqueta)) {
  rl.close();
  log(`✘ ${ticket} ya está congelado. Una versión congelada no se re-congela: si el ticket`);
  log('  cambió de alcance, congela el siguiente con su propio ticket.');
  process.exit(1);
}

log('');
log('Esto es lo que voy a hacer:');
log('');
log(`  congelar  ${ramaActual} · ${sha}`);
log(`  ticket    ${ticket}`);
log(`  sitio     ${app}`);
log(`  URL       ${url}`);
log(`  cubre     ${que}`);
if (ramaActual !== 'main') {
  log('');
  log(`  ⚠ Estás en "${ramaActual}", no en main. Normalmente se congela lo que YA está`);
  log('    entregado. Si es a propósito, adelante.');
}
log('');

const sí = await preguntar('¿Lo hago? (s/n)  ', (r) =>
  /^[snSN]$/.test(r) ? null : 'Escribe s o n.',
);
if (/^[nN]$/.test(sí)) {
  rl.close();
  log('Nada hecho.');
  process.exit(0);
}

git('tag', etiqueta);
git('branch', rama, etiqueta);

let md = readFileSync(TABLA, 'utf8');
const fila = `| ${ticket} | ${hoy} | ${app} | \`${etiqueta}\` | [${url.replace('https://', '')}](${url}) | ${que} |`;
const marca = '<!-- proto:freeze inserta aquí, más reciente primero -->';
md = md.replace(marca, marca + '\n' + fila);
writeFileSync(TABLA, md);

log('');
log(`✔ Congelado sobre ${sha}: etiqueta, rama y fila en docs/PROTOTIPOS.md.`);
log('');

const publicar = await preguntar('¿Lo publico ya? (s/n)  ', (r) =>
  /^[snSN]$/.test(r) ? null : 'Escribe s o n.',
);
rl.close();

if (/^[nN]$/.test(publicar)) {
  log('');
  log('Queda todo local. Cuando quieras publicarlo:');
  log(`    git push origin ${etiqueta} && git push origin ${rama}`);
  process.exit(0);
}

log('');
try {
  execFileSync('git', ['push', 'origin', etiqueta], { cwd: root, stdio: 'inherit' });
  execFileSync('git', ['push', 'origin', rama], { cwd: root, stdio: 'inherit' });
} catch {
  log('');
  log('✘ El push falló (mira el mensaje de git arriba). La etiqueta y la rama están creadas');
  log('  aquí, así que cuando se arregle basta con:');
  log(`    git push origin ${etiqueta} && git push origin ${rama}`);
  process.exit(1);
}

log('');
log('✔ Publicado. En un par de minutos responde:');
log('');
log(`    ${url}`);
log('');
log('  Esa es la que se pega en Jira y en Confluence. Un 404 recién publicado suele ser la');
log('  cola de Cloudflare, no un fallo: espera un poco y recarga.');
log('');
log('  Falta una cosa: `docs/PROTOTIPOS.md` tiene la fila nueva sin guardar. Entra en tu');
log('  próximo PR, o pídemelo y la subo.');
