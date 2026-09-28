import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { clearTimeout } from 'node:timers';
import { fileURLToPath } from 'node:url';

import { esRunner } from '../playwright-reuse-guard.mjs';

// El guardián de «otra cadena viva» cuenta procesos cuya línea de comandos menciona «playwright
// test». Se prueba EN ROJO con lo que lo engañó el 2026-09-09 (shells de otra sesión con un bucle
// de espera que nombra a Playwright) y EN VERDE con un runner de verdad (LEARNINGS 2).

test('un runner de verdad es un proceso node', () => {
  assert.ok(esRunner('node'));
  assert.ok(esRunner('/Users/x/.nvm/versions/node/v22.23.2/bin/node'));
  assert.ok(esRunner('node22'));
});

test('rojo: un shell que HABLA de Playwright (bucle de espera ajeno) no es una ejecución viva', () => {
  assert.equal(esRunner('/bin/zsh'), false);
  assert.equal(esRunner('sh'), false);
  assert.equal(esRunner('bash'), false);
  assert.equal(esRunner('sleep'), false);
});

test('sin dato de comando no se exonera (mejor un aviso de más que un verde falso)', () => {
  assert.ok(esRunner(''));
  assert.ok(esRunner(undefined));
});

/*
 * LA RAMA `CI` DE `reuseOnlyOwnServer`, CON PLAYWRIGHT DE VERDAD.
 *
 * Medido el 2026-09-28: `CI=1 npm run e2e` en local se quedaba en «El puerto 4280 está ocupado
 * (pid N). Espero a que se libere…» una vez POR WORKER, sin correr un test, hasta el techo de 25
 * minutos. El pid era el `ng serve` que había arrancado esa misma ejecución: Playwright evalúa el
 * config otra vez en cada worker, cuando su propio servidor ya escucha, y la espera no distinguía
 * «una sesión hermana tiene el puerto» de «lo tengo yo».
 *
 * Por qué una suite de juguete y no una función con el entorno inyectado: lo que había que saber
 * es si el worker VE su condición de worker cuando evalúa el config, y eso lo contesta Playwright,
 * no el test. Un `TEST_WORKER_INDEX` puesto a mano daría el verde por decreto (LEARNINGS 1 y 2).
 * Aquí la suite importa el guardián real y la lanza el mismo CLI que `npm run e2e`; el servidor es
 * un `http` mínimo, así que no hace falta ni navegador ni `ng serve`.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const GUARDIAN = join(RAIZ, 'scripts/playwright-reuse-guard.mjs');
// El CLI directo y no `.bin/playwright`: su línea de comandos no dice «playwright test», así que
// el guardián de OTRA sesión que corra `verify` a la vez no confunde estos tests con una cadena viva.
const CLI = join(RAIZ, 'node_modules/@playwright/test/cli.js');
const HAY_LSOF = spawnSync('lsof', ['-v']).error?.code !== 'ENOENT';
const ESPERA = /Espero a que se libere/;

const SERVIDOR = `import { createServer } from 'node:http';
// Si quien lo lanzó muere (un test cortado por timeout), no se queda de huérfano en el puerto.
const padre = process.ppid;
setInterval(() => process.ppid !== padre && process.exit(0), 250);
setTimeout(() => process.exit(0), 120_000);
createServer((_, res) => res.end('ok')).listen(Number(process.env.SC_PUERTO), () => console.log('listo'));
`;

/** Un árbol con config, dos specs y su servidor, como el del repo pero de juguete. */
function montaSuite() {
  const dir = mkdtempSync(join(tmpdir(), 'sc-reuse-guard-'));
  symlinkSync(join(RAIZ, 'node_modules'), join(dir, 'node_modules'), 'dir');
  mkdirSync(join(dir, 'tests'));
  for (const f of ['a', 'b']) {
    writeFileSync(
      join(dir, 'tests', `${f}.spec.mjs`),
      `import { test } from '@playwright/test';\ntest('${f}-1', () => {});\ntest('${f}-2', () => {});\n`,
    );
  }
  writeFileSync(join(dir, 'servidor.mjs'), SERVIDOR);
  writeFileSync(
    join(dir, 'playwright.config.ts'),
    [
      `import { defineConfig } from '@playwright/test';`,
      `import { reuseOnlyOwnServer } from ${JSON.stringify(GUARDIAN)};`,
      `const PUERTO = Number(process.env['SC_PUERTO']);`,
      `export default defineConfig({`,
      `  testDir: 'tests',`,
      `  workers: 2,`,
      `  fullyParallel: true,`,
      `  reporter: 'list',`,
      `  webServer: {`,
      `    command: 'node servidor.mjs',`,
      '    url: `http://localhost:${PUERTO}`,',
      `    reuseExistingServer: reuseOnlyOwnServer(PUERTO),`,
      `    timeout: 30_000,`,
      `  },`,
      `});`,
    ].join('\n'),
  );
  return dir;
}

async function puertoLibre() {
  const srv = createServer();
  await new Promise((ok) => srv.listen(0, ok));
  const { port } = /** @type {import('node:net').AddressInfo} */ (srv.address());
  await new Promise((ok) => srv.close(ok));
  return port;
}

/** El entorno del padre sin nada que decida la rama del guardián, más lo que pida el caso. */
function entorno(puerto, extra) {
  const env = { ...process.env, FORCE_COLOR: '0', SC_PUERTO: String(puerto) };
  for (const k of ['CI', 'GITHUB_ACTIONS', 'TEST_WORKER_INDEX', 'TEST_PARALLEL_INDEX', 'NODE_TEST_CONTEXT']) delete env[k];
  return { ...env, ...extra };
}

/** Lanza el runner y resuelve con su salida (y su código) al terminar o al cortarlo. */
function corre(dir, env, { corteMs = 90_000, cortaSi } = {}) {
  return new Promise((ok) => {
    const pw = spawn(process.execPath, [CLI, 'test', '-c', 'playwright.config.ts'], { cwd: dir, env });
    let salida = '';
    let cortado = null;
    const corta = (motivo) => {
      cortado ??= motivo;
      pw.kill('SIGKILL');
    };
    const reloj = setTimeout(corta, corteMs, `cortado a los ${corteMs / 1000} s`);
    const lee = (d) => {
      salida += d;
      if (cortaSi?.test(salida)) corta(`visto ${cortaSi}`);
    };
    pw.stdout.on('data', lee);
    pw.stderr.on('data', lee);
    pw.on('close', (status) => {
      clearTimeout(reloj);
      ok({ status, salida, cortado });
    });
  });
}

/** Un servidor de otra sesión (otro directorio) ocupando el puerto. */
async function servidorAjeno(puerto) {
  const dir = mkdtempSync(join(tmpdir(), 'sc-reuse-guard-ajeno-'));
  writeFileSync(join(dir, 'servidor.mjs'), SERVIDOR);
  const srv = spawn(process.execPath, ['servidor.mjs'], { cwd: dir, env: { ...process.env, SC_PUERTO: String(puerto) } });
  await new Promise((ok, ko) => {
    srv.stdout.on('data', (d) => String(d).includes('listo') && ok());
    srv.on('exit', (c) => ko(new Error(`el servidor ajeno murió al arrancar (código ${c})`)));
  });
  return { apaga: () => (srv.kill(), rmSync(dir, { recursive: true, force: true })) };
}

describe('la rama CI de reuseOnlyOwnServer, con Playwright de verdad', { concurrency: true }, () => {
  test('rojo: con CI=1 en local, los workers NO esperan al servidor de su propia ejecución', async () => {
    const dir = montaSuite();
    try {
      const r = await corre(dir, entorno(await puertoLibre(), { CI: '1' }));
      assert.equal(r.cortado, null, `la suite se quedó colgada (${r.cortado}):\n${r.salida}`);
      assert.doesNotMatch(r.salida, ESPERA);
      assert.equal(r.status, 0, r.salida);
      assert.match(r.salida, /4 passed/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test(
    'con el puerto de una sesión hermana, el que espera es el proceso principal, antes de lanzar nada',
    { skip: !HAY_LSOF && 'sin lsof no se puede ver quién escucha' },
    async () => {
      const dir = montaSuite();
      const puerto = await puertoLibre();
      const ajeno = await servidorAjeno(puerto);
      try {
        const r = await corre(dir, entorno(puerto, { CI: '1' }), { corteMs: 60_000, cortaSi: ESPERA });
        assert.match(r.salida, /El puerto \d+ está ocupado \(pid \d+\)\. Espero a que se libere/);
        // Con el fallo, «Running 4 tests» salía ANTES de la espera: esperaban los workers.
        assert.doesNotMatch(r.salida, /Running \d+ tests?/);
      } finally {
        ajeno.apaga();
        rmSync(dir, { recursive: true, force: true });
      }
    },
  );

  test('en GitHub Actions, un puerto ocupado sigue siendo un fallo SECO, sin espera', async () => {
    const dir = montaSuite();
    const puerto = await puertoLibre();
    const ajeno = await servidorAjeno(puerto);
    try {
      const r = await corre(dir, entorno(puerto, { CI: 'true', GITHUB_ACTIONS: 'true' }), { corteMs: 60_000 });
      assert.equal(r.cortado, null, r.salida);
      assert.doesNotMatch(r.salida, ESPERA);
      assert.notEqual(r.status, 0);
      assert.match(r.salida, /is already used/);
    } finally {
      ajeno.apaga();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('rojo: sin lsof no se sabe quién escucha, y eso no es motivo para esperar 25 minutos', async () => {
    const dir = montaSuite();
    // Un PATH con `node` y nada más: `lsof` no está, como en un contenedor mínimo.
    const bin = join(dir, 'bin');
    mkdirSync(bin);
    symlinkSync(process.execPath, join(bin, 'node'));
    try {
      const r = await corre(dir, entorno(await puertoLibre(), { CI: '1', PATH: bin }));
      assert.equal(r.cortado, null, `la suite se quedó colgada (${r.cortado}):\n${r.salida}`);
      // Sin esto el verde no diría nada: con `lsof` a mano y el puerto libre, tampoco se espera.
      assert.match(r.salida, /Sin `lsof` no puedo ver quién escucha/);
      assert.doesNotMatch(r.salida, ESPERA);
      assert.equal(r.status, 0, r.salida);
      assert.match(r.salida, /4 passed/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
