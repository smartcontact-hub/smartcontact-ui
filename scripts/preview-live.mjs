#!/usr/bin/env node
/**
 * preview:live — PREVIEW LOCAL INSTANTÁNEO del estado de tokens que hay en Figma.
 *
 * Pensado para Rafa (no-dev): doble-click en un `.command`, sin escribir en la terminal.
 * Es el primer nivel del flujo de 3 (local → preview link → main): aquí experimenta él solo,
 * al instante, sin esperar al CI (~2-5 min) ni perseguir a nadie.
 *
 * Qué hace:
 *   1. Asegura que la librería está compilada (los apps importan @smartcontact-hub/* desde dist).
 *      La PRIMERA vez compila (~2 min); las siguientes arrancan al momento.
 *   2. Baja el `kit-export-dtcg.json` que el plugin empujó a la rama `design-tokens-sync`
 *      (el MISMO export que usa el CI — solo el fichero, sin tocar el índice de git).
 *   3. Regenera las capas CSS de tokens (`@sc-gen:*`) desde ese export.
 *   4. Arranca `ng serve` y abre el navegador. El app sirve las capas DESDE FUENTE, así que
 *      el cambio se ve en cuanto el HMR recarga.
 *   5. VIGILA la rama: si Rafa empuja un cambio nuevo desde Figma, en ~12 s lo baja, regenera
 *      y el navegador se recarga solo. "Cambio instantáneo, no manual."
 *
 * Al cerrar la ventana, restaura los ficheros de token al estado committeado (deja el repo limpio).
 *
 * Uso:
 *   npm run preview:live              # demo de componentes (sc-demo)
 *   npm run preview:live -- supervisor  # la app Supervisor
 */
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { setInterval, clearInterval } from 'node:timers';

const root = resolve(import.meta.dirname, '..');
const BRANCH = 'design-tokens-sync';
const EXPORT = 'projects/design-tokens/scripts/kit-export-dtcg.json';
const LAYERS = 'projects/design-tokens/src/lib/styles/tokens/layers';
const TOKEN_FILES = [
  EXPORT,
  ...['01-primitive', '02-semantic', '03-palette', '04-component', '05-extensions', '07-dark'].map(
    (n) => `${LAYERS}/${n}.css`,
  ),
];
const GENERATORS = ['token-gen.mjs', 'token-gen-component.mjs', 'token-gen-color.mjs'];
const POLL_MS = 12_000;

const arg = (process.argv[2] || 'sc-demo').toLowerCase();
const APP = arg === 'supervisor' ? 'supervisor' : arg === 'agent' ? 'agent' : 'sc-demo';

// PID file (no-trackeado) para el ANTI-ZOMBIE: un solo preview:live a la vez.
const PID_FILE = resolve(root, 'node_modules/.cache/preview-live.pid');

const C = { cyan: '\x1b[36m', dim: '\x1b[2m', yellow: '\x1b[33m', green: '\x1b[32m', reset: '\x1b[0m' };
const log = (m) => process.stdout.write(`${C.cyan}▸ preview:live${C.reset} ${m}\n`);
const warn = (m) => process.stdout.write(`${C.yellow}▸ preview:live${C.reset} ${m}\n`);

// git silencioso; lanza si falla (lo capturamos donde toca). GIT_TERMINAL_PROMPT=0 evita
// que un `fetch` se quede colgado pidiendo credenciales (el repo es público → no hacen falta).
const git = (...args) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
const remoteExportSha = () => git('rev-parse', `origin/${BRANCH}:${EXPORT}`).trim();

// 1) Los apps resuelven @smartcontact-hub/* desde dist/ → la primera vez hay que compilar.
function ensureBuilt() {
  const dist = ['dist/design-tokens', 'dist/ui-smartcontact-icons', 'dist/ui-smartcontact'];
  if (dist.every((d) => existsSync(resolve(root, d)))) return;
  log('primera vez: compilando la librería (~2 min). Las próximas veces arranca al instante…');
  execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
}

// 2) Trae SOLO el export que empujó el plugin (escribe el fichero, sin tocar el índice de git).
//    Devuelve el SHA remoto del export, o null si no se pudo (offline / rama ausente).
function pullExport() {
  try {
    git('fetch', '--quiet', 'origin', BRANCH);
    writeFileSync(resolve(root, EXPORT), git('show', `origin/${BRANCH}:${EXPORT}`));
    return remoteExportSha();
  } catch {
    warn('no pude bajar el export de la rama (¿sin internet?). Sigo con el export local.');
    return null;
  }
}

// 3) Regenera las capas CSS desde el export (es lo que el app sirve desde fuente).
function regenerate() {
  for (const g of GENERATORS) {
    execFileSync(process.execPath, [resolve(root, `scripts/${g}`), '--write'], { cwd: root, stdio: 'inherit' });
  }
}

// Al salir: restaura los ficheros de token al estado committeado (repo limpio) + borra el PID.
let restored = false;
function restore() {
  if (restored) return;
  restored = true;
  try {
    git('checkout', '--', ...TOKEN_FILES);
    log('repo restaurado al estado committeado.');
  } catch {
    /* best-effort */
  }
  try {
    unlinkSync(PID_FILE);
  } catch {
    /* ya no existe */
  }
}

// ── ANTI-ZOMBIE: garantiza UN solo preview:live (los previos re-bajan el export y ensucian) ──
// Mata cualquier OTRA instancia de preview:live antes de arrancar (su propio handler restaura
// sus ficheros). Sin esto se acumulan watch-loops que dejan el export sucio para siempre.
function killPriorInstances() {
  let killed = 0;
  try {
    const out = execFileSync('pgrep', ['-f', 'scripts/preview-live.mjs'], { encoding: 'utf8' });
    for (const line of out.split('\n')) {
      const pid = parseInt(line.trim(), 10);
      if (!pid || pid === process.pid || pid === process.ppid) continue;
      try {
        process.kill(pid, 'SIGTERM');
        killed++;
      } catch {
        /* ya muerto / sin permiso */
      }
    }
  } catch {
    /* pgrep no encontró nada (o no existe en el SO) → nada que matar */
  }
  if (killed) warn(`maté ${killed} preview:live previo(s) (anti-zombie) para no acumular export sucio.`);
}

function writePidFile() {
  try {
    mkdirSync(dirname(PID_FILE), { recursive: true });
    writeFileSync(PID_FILE, String(process.pid));
  } catch {
    /* best-effort */
  }
}

// ── arranque ──────────────────────────────────────────────────────────────────
process.stdout.write(
  `\n${C.cyan}━━ Preview local — ${APP} ━━${C.reset}\n` +
    `${C.dim}  Cambia un token en Figma → Push Tokens → en ~12 s lo verás aquí.\n` +
    `  Para parar: cierra esta ventana.${C.reset}\n\n`,
);

killPriorInstances(); // anti-zombie: un solo preview:live a la vez
writePidFile();
ensureBuilt();
log(`bajando el export de "${BRANCH}" y regenerando los tokens…`);
let lastSha = pullExport();
regenerate();

log(`arrancando ng serve (${APP}); se abrirá el navegador…`);
const ng = spawn(resolve(root, 'node_modules/.bin/ng'), ['serve', APP, '--open'], { cwd: root, stdio: 'inherit' });

// 5) Vigila la rama: cambio nuevo en Figma → baja + regenera → el HMR recarga el navegador.
const poll = setInterval(() => {
  try {
    git('fetch', '--quiet', 'origin', BRANCH);
    const sha = remoteExportSha();
    if (sha && sha !== lastSha) {
      log(`${C.green}cambio nuevo detectado en Figma${C.reset} → regenerando…`);
      lastSha = pullExport();
      regenerate();
      log('listo — mira el navegador.');
    }
  } catch {
    /* fallo transitorio de red: no rompas el servidor, reintenta al siguiente tick */
  }
}, POLL_MS);

function shutdown() {
  clearInterval(poll);
  try {
    ng.kill('SIGTERM');
  } catch {
    /* ya muerto */
  }
  restore();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);
// Red de seguridad: restaura (síncrono) ante CUALQUIER salida del proceso — cierre normal,
// excepción no capturada, etc. (No cubre SIGKILL/cierre forzado de ventana → para ESE caso
// está el guard `tokens:export-clean` en verify + el anti-zombie del próximo arranque.)
process.on('exit', restore);
ng.on('exit', () => {
  clearInterval(poll);
  restore();
  process.exit(0);
});
