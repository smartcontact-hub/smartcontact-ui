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
 *   npm run proto:check                                        # lo que corre en verify
 *   npm run proto:freeze -- --ticket SISMAC-3780 --app supervisor --que "Contact Center · Agentes"
 *
 * El congelado NO pushea: deja la etiqueta y la rama LOCALES e imprime los dos comandos, porque
 * un push sobre este árbol exige su preflight (LEARNINGS #7) y esto no es quien para saltárselo.
 */
import { execFileSync } from 'node:child_process';
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
const arg = (nombre) => {
  const i = process.argv.indexOf('--' + nombre);
  return i > -1 ? process.argv[i + 1] : null;
};
const ticket = arg('ticket');
const app = arg('app');
const que = arg('que');

if (!ticket || !app || !que) {
  log('Uso: npm run proto:freeze -- --ticket SISMAC-3780 --app supervisor --que "Contact Center · Agentes"');
  log('');
  log('Apps: ' + Object.keys(SITIOS).join(' · '));
  process.exit(1);
}
if (!SITIOS[app]) {
  log(`✘ "${app}" no es una de las cinco apps: ${Object.keys(SITIOS).join(', ')}`);
  process.exit(1);
}
if (!/^[A-Z][A-Z0-9]*-\d+$/.test(ticket)) {
  log(`✘ "${ticket}" no parece un ticket (se espera algo como SISMAC-3780).`);
  process.exit(1);
}

if (git('status', '--porcelain')) {
  log('✘ El árbol tiene cambios sin commitear. Se congela un commit, no un borrador.');
  process.exit(1);
}

const etiqueta = 'proto/' + ticket;
const rama = ramaDe(ticket);
const url = urlDe(ticket, app);
const hoy = new Date().toISOString().slice(0, 10);
const sha = git('rev-parse', '--short', 'HEAD');

if (etiquetas().includes(etiqueta)) {
  log(`✘ ${etiqueta} ya existe. Una versión congelada no se re-congela: si el ticket cambió de`);
  log('  alcance, congela el siguiente con su propio ticket.');
  process.exit(1);
}

git('tag', etiqueta);
git('branch', rama, etiqueta);

let md = readFileSync(TABLA, 'utf8');
const fila = `| ${ticket} | ${hoy} | ${app} | \`${etiqueta}\` | [${url.replace('https://', '')}](${url}) | ${que} |`;
const marca = '<!-- proto:freeze inserta aquí, más reciente primero -->';
md = md.replace(marca, marca + '\n' + fila);
writeFileSync(TABLA, md);

log(`✔ Congelado ${ticket} sobre ${sha}`);
log('');
log(`  etiqueta  ${etiqueta}`);
log(`  rama      ${rama}   (no la toques nunca más)`);
log(`  URL       ${url}`);
log(`  tabla     docs/PROTOTIPOS.md, fila añadida`);
log('');
log('  Falta publicarlo. Commitea la tabla y luego:');
log(`      git push origin ${etiqueta}`);
log(`      git push origin ${rama}`);
log('');
log('  Cloudflare construye el preview al recibir la rama; la URL tarda un par de minutos');
log('  en responder (un 404 recién pusheado suele ser la cola, no un fallo).');
