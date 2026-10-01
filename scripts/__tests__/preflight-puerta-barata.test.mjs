import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  ENV_AVISADA,
  TESTS_CON_RELOJ,
  UMBRAL_CARGA,
  avisarCarga,
  avisoActual,
  avisoDeCarga,
  leerProcesos,
  numCpus,
  parsearPs,
  puertaBarata,
} from '../preflight-puerta-barata.mjs';
import { MAX_PALABRAS_FICHA } from '../memory-shape.mjs';

/*
 * La puerta se prueba CON EL FALLO PUESTO y sin él, sobre una memoria de mentira montada en un
 * temporal: una ficha que se pasa del tope tiene que salir aquí, en milisegundos, y no en el
 * minuto cuatro de la cadena. El caso que lo motivó: 2026-09-11 y 2026-09-12, dos cadenas de 8
 * min muertas en el CHECK N por una ficha que había engordado OTRA sesión.
 */

/** Memoria de mentira con las fichas que se le pasen, y el `MEMORY.md` que exige la forma. */
function memoriaFalsa(fichas) {
  const raiz = mkdtempSync(join(tmpdir(), 'sc-puerta-'));
  const dir = join(raiz, '.claude', 'projects', '-repo', 'memory');
  mkdirSync(dir, { recursive: true });
  const indice = fichas
    .map(({ nombre }) => `- [${nombre}](${nombre}.md) — pista`)
    .join('\n');
  writeFileSync(join(dir, 'MEMORY.md'), `# Memory index\n\n${indice}\n`);
  for (const { nombre, palabras } of fichas) {
    const cuerpo = Array.from({ length: palabras }, (_, i) => `p${i}`).join(' ');
    writeFileSync(
      join(dir, `${nombre}.md`),
      `---\nname: ${nombre}\ndescription: d\nmetadata:\n  type: project\n---\n\n${cuerpo}\n`,
    );
  }
  return { raiz, dir };
}

/* `SC_MEMORY_DIR` es la costura que ya publica `memory-shape.mjs`. Sin ella el test pasaba el
 * directorio falso como `cwd` y `localizarMemoria` devolvía la memoria REAL (o nada): la sonda
 * medía otra cosa y los tres casos salían verdes. Lo cazó el caso rojo, que es para lo que está. */
function conMemoria(dir, fn) {
  const previo = process.env.SC_MEMORY_DIR;
  process.env.SC_MEMORY_DIR = dir;
  try {
    return fn();
  } finally {
    if (previo === undefined) delete process.env.SC_MEMORY_DIR;
    else process.env.SC_MEMORY_DIR = previo;
  }
}

test('la puerta barata caza una ficha de memoria pasada de tope ANTES de arrancar la cadena', () => {
  const { raiz, dir } = memoriaFalsa([{ nombre: 'gorda', palabras: MAX_PALABRAS_FICHA + 40 }]);
  try {
    const problemas = conMemoria(dir, () => puertaBarata(process.cwd()));
    assert.equal(problemas.length, 1, 'la ficha pasada tenía que salir');
    assert.match(problemas[0], /gorda\.md/);
    assert.match(problemas[0], new RegExp(`el tope es ${MAX_PALABRAS_FICHA}`));
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('con la memoria en su sitio, la puerta se abre y no dice nada', () => {
  const { raiz, dir } = memoriaFalsa([{ nombre: 'normal', palabras: 30 }]);
  try {
    assert.deepEqual(conMemoria(dir, () => puertaBarata(process.cwd())), []);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('sin memoria local (CI u otra máquina) la puerta se abre en vez de fallar', () => {
  const vacio = mkdtempSync(join(tmpdir(), 'sc-sin-memoria-'));
  rmSync(vacio, { recursive: true, force: true }); // la ruta ya no existe: ese es el caso
  assert.deepEqual(conMemoria(vacio, () => puertaBarata(process.cwd())), []);
});

/*
 * EL AVISO DE MÁQUINA SATURADA (2026-09-29).
 *
 * Medido el 2026-09-28/29 en el Mac del mantenedor: carga de 205 a 330 durante horas, por procesos de
 * fuera del repo (un servicio de Codex y varios renderizadores de Chrome y Comet al ~100 % de CPU y
 * con días vivos; 850 procesos). `npm run verify` tardó unas 9 h y cayó en dos tests con reloj que no
 * tenían nada que ver con el cambio; el `preflight:scope` de otra sesión llevaba más de 14 h. Nadie lo
 * supo hasta horas después: ni `node -e` contestaba en menos de un minuto.
 *
 * Lo que se prueba es un AVISO, no un gate: una pasada que sale verde bajo carga sigue valiendo, así
 * que la carga alta no puede convertirse en un rojo ni parar la cadena. Todo se inyecta (carga, CPUs,
 * procesos), como `estadoRebase` inyecta sus tres hechos; y lo que el mundo real contesta mejor que un
 * doble (`ps`, npm, el árbol de procesos de `preflight:scope`) se prueba con el mundo real.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PUERTA = join(RAIZ, 'scripts/preflight-puerta-barata.mjs');
const SCOPE = join(RAIZ, 'scripts/preflight-scope.mjs');

// 205 procesos listos en 10 CPUs son 20,5 por CPU. Los 10 núcleos son los del Mac que citan DD-116 y
// `scripts/en-paralelo.mjs`.
const INCIDENTE = { carga: [205.4, 250.1, 310.8], cpus: 10 };

const PROCESOS = [
  { pid: 4021, cpu: 102.3, etime: '03-04:12:33', comando: '/Applications/Comet.app/Contents/MacOS/Comet Helper (Renderer)' },
  { pid: 4177, cpu: 99.8, etime: '02:11:09', comando: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome Helper (Renderer)' },
  { pid: 5230, cpu: 97.4, etime: '12-00:00:41', comando: '/opt/servicio/Codex Service' },
  { pid: 5301, cpu: 61, etime: '01:00:02', comando: 'node' },
  { pid: 5302, cpu: 55.5, etime: '00:59:58', comando: 'esbuild' },
  { pid: 6001, cpu: 12.5, etime: '00:10:00', comando: 'sextoQueNoSale' },
  { pid: 6002, cpu: 3, etime: '00:01:00', comando: 'septimoQueNoSale' },
];
const nombre = (comando) => comando.split('/').pop();
const literal = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SATURADA = { loadavg: () => INCIDENTE.carga, cpus: () => INCIDENTE.cpus, procesos: () => PROCESOS };
const SANA = { loadavg: () => [0.3, 0.2, 0.2], cpus: () => 10, procesos: () => [] };

// ── parsearPs: la salida de `ps -Ao pid,%cpu,etime,comm` ─────────────────────────────────────────

// Forma de la salida de `ps` de macOS según `man ps` (no verificada en un Mac desde aquí): cabecera,
// `comm` con la RUTA entera y con espacios, y el tiempo vivo con días. A propósito sin ordenar.
const PS_MACOS = [
  '  PID  %CPU     ELAPSED COMM',
  ' 4177  99.8    02:11:09 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome Helper (Renderer)',
  ' 4021 102.3 03-04:12:33 /Applications/Comet.app/Contents/MacOS/Comet Helper (Renderer)',
  '    1   0.0 40-01:02:03 /sbin/launchd',
  '  611   3.1 12-00:00:41 /usr/sbin/coreaudiod',
].join('\n');

test('parsearPs: lee la forma de macOS (ruta con espacios, días en el tiempo vivo) y ordena por %CPU', () => {
  const r = parsearPs(PS_MACOS);
  assert.deepEqual(r.map((p) => p.pid), [4021, 4177, 611, 1]);
  assert.equal(r[0].cpu, 102.3);
  assert.equal(r[0].etime, '03-04:12:33');
  assert.equal(r[0].comando, '/Applications/Comet.app/Contents/MacOS/Comet Helper (Renderer)');
});

test('parsearPs: la coma decimal de otro idioma no descarta la fila', () => {
  const [p] = parsearPs('  PID  %CPU ELAPSED COMM\n 4021 102,3 03:00 Comet');
  assert.equal(p?.cpu, 102.3);
});

test('parsearPs: no cuenta la cabecera, las líneas vacías, a `ps` mismo ni a quien se le pide excluir', () => {
  const r = parsearPs(`${PS_MACOS}\n\n  999  99.0 00:00:01 /bin/ps\n`, { excluir: [4177] });
  assert.deepEqual(r.map((p) => p.pid), [4021, 611, 1]);
});

// ── avisoDeCarga: función pura de la carga, las CPUs y los procesos ─────────────────────────────

test('avisoDeCarga: bajo el umbral no dice nada, y en el umbral exacto sí (es inclusivo)', () => {
  const cpus = 4;
  assert.equal(avisoDeCarga({ carga: [UMBRAL_CARGA * cpus - 0.1, 0, 0], cpus }), null);
  assert.match(avisoDeCarga({ carga: [UMBRAL_CARGA * cpus, 0, 0], cpus }), /SATURADA/);
});

test('avisoDeCarga: manda la carga de 1 minuto; con la de 5 y 15 altas y la de 1 ya baja, no avisa', () => {
  assert.equal(avisoDeCarga({ carga: [1, 300, 300], cpus: 10 }), null);
});

test('avisoDeCarga: el umbral cae entre lo normal y el incidente medido', () => {
  assert.ok(UMBRAL_CARGA > 1, 'una tarea lista por CPU es una máquina ocupada, no saturada');
  assert.ok(avisoDeCarga(INCIDENTE), 'con el incidente (20,5 por CPU) tiene que avisar');
  assert.ok(UMBRAL_CARGA < INCIDENTE.carga[0] / INCIDENTE.cpus);
});

test('avisoDeCarga: con el incidente real dice la carga, las CPUs y los procesos listos por CPU', () => {
  const t = avisoDeCarga({ ...INCIDENTE, consumidores: PROCESOS });
  assert.match(t, /MÁQUINA SATURADA/);
  assert.match(t, /205\.4 \/ 250\.1 \/ 310\.8/);
  assert.match(t, /10 CPUs/);
  assert.match(t, /20\.5 procesos listos por CPU/);
});

test('avisoDeCarga: nombra a los cinco que más consumen (aunque lleguen desordenados), y a los demás no', () => {
  const t = avisoDeCarga({ ...INCIDENTE, consumidores: [...PROCESOS].reverse() });
  for (const p of PROCESOS.slice(0, 5)) {
    const linea = `pid\\s+${p.pid}\\s+${literal(p.cpu.toFixed(1))} %\\s+${literal(p.etime)}\\s+${literal(nombre(p.comando))}`;
    assert.match(t, new RegExp(linea), `falta el proceso ${p.pid}`);
  }
  assert.doesNotMatch(t, /sextoQueNoSale|septimoQueNoSale/);
});

test('avisoDeCarga: dice que los tests con reloj pueden caer con CUALQUIER cambio y apunta a los dos', () => {
  const t = avisoDeCarga({ ...INCIDENTE, consumidores: PROCESOS });
  assert.match(t, /CUALQUIER cambio/);
  for (const { fichero, motivo } of TESTS_CON_RELOJ) {
    assert.ok(t.includes(fichero), `falta ${fichero}`);
    assert.ok(t.includes(motivo), `falta el motivo de ${fichero}`);
  }
  assert.match(t, /estadoDelArbol/);
  assert.match(t, /4 s/);
  assert.match(t, /90 s/);
});

test('avisoDeCarga: dice que NO bloquea y qué hacer si uno de esos tests cae', () => {
  const t = avisoDeCarga({ ...INCIDENTE, consumidores: PROCESOS });
  assert.match(t, /no bloquea/i);
  assert.match(t, /repítelo solo/);
});

test('TESTS_CON_RELOJ: los dos punteros del aviso existen y nombran una prueba que sigue en su fichero', () => {
  assert.deepEqual(TESTS_CON_RELOJ.map((t) => t.fichero).sort(), [
    'scripts/__tests__/playwright-reuse-guard.test.mjs',
    'scripts/__tests__/stop-guard.test.mjs',
  ]);
  for (const { fichero, ancla } of TESTS_CON_RELOJ) {
    const ruta = join(RAIZ, fichero);
    assert.ok(existsSync(ruta), `${fichero} no existe`);
    assert.ok(readFileSync(ruta, 'utf8').includes(ancla), `${fichero} ya no contiene «${ancla}»: el aviso apunta a algo que se movió`);
  }
});

test('avisoDeCarga: sin dato fiable no avisa ni revienta (CPUs a 0, NaN, carga vacía, Windows)', () => {
  const casos = [
    [[300, 0, 0], 0], // 300 / 0 = Infinity: el falso aviso de una máquina que no sabe cuántas CPUs tiene
    [[300, 0, 0], Number.NaN],
    [[300, 0, 0], -2],
    [[Number.NaN, 0, 0], 4],
    [undefined, 4],
    [[], 4],
    [[0, 0, 0], 4], // lo que `os.loadavg()` devuelve en Windows
  ];
  for (const [carga, cpus] of casos) assert.equal(avisoDeCarga({ carga, cpus }), null, `${JSON.stringify(carga)} / ${cpus}`);
});

test('avisoDeCarga: si no se pudo leer `ps`, avisa igual y lo dice', () => {
  for (const consumidores of [undefined, []]) {
    const t = avisoDeCarga({ ...INCIDENTE, consumidores });
    assert.match(t, /MÁQUINA SATURADA/);
    assert.match(t, /no pude leer `ps`/);
  }
});

// ── numCpus, avisoActual y avisarCarga: lo que mide y lo que imprime ─────────────────────────────

test('numCpus: si os.cpus() viene vacío usa availableParallelism, y sin ninguno dice 0 (nunca se divide por él)', () => {
  assert.equal(numCpus({ cpus: () => new Array(10).fill({}), availableParallelism: () => 4 }), 10);
  assert.equal(numCpus({ cpus: () => [], availableParallelism: () => 6 }), 6);
  assert.equal(numCpus({ cpus: () => [] }), 0);
  assert.ok(numCpus() >= 1, 'en esta máquina, de verdad');
});

test('avisoActual: con la máquina sana no cuesta nada: ni siquiera se pide la lista de procesos', () => {
  const t = avisoActual({
    ...SANA,
    procesos: () => {
      throw new Error('`ps` no debía llamarse');
    },
  });
  assert.equal(t, null);
});

test('avisoActual: saturada, pide los procesos y compone el aviso con ellos', () => {
  const t = avisoActual(SATURADA);
  assert.match(t, /MÁQUINA SATURADA/);
  assert.match(t, /Comet Helper \(Renderer\)/);
});

test('avisoActual: si `ps` falla, el aviso sale igual, sin lista', () => {
  const t = avisoActual({
    ...SATURADA,
    procesos: () => {
      throw new Error('sin ps');
    },
  });
  assert.match(t, /MÁQUINA SATURADA/);
  assert.match(t, /no pude leer `ps`/);
});

function escritor() {
  const salidas = [];
  return { escribir: (t) => salidas.push(t), salidas };
}

test('avisarCarga: saturada imprime UNA vez, devuelve true y deja la marca para que el `preverify` no lo repita', () => {
  const { escribir, salidas } = escritor();
  const env = {};
  assert.equal(avisarCarga({ ...SATURADA, escribir, env }), true);
  assert.equal(salidas.length, 1);
  assert.match(salidas[0], /MÁQUINA SATURADA/);
  assert.equal(env[ENV_AVISADA], '1');
  assert.equal(avisarCarga({ ...SATURADA, escribir, env }), false, 'con la marca puesta, calla');
  assert.equal(salidas.length, 1);
});

test('avisarCarga: con la máquina sana no imprime ni deja marca', () => {
  const { escribir, salidas } = escritor();
  const env = {};
  assert.equal(avisarCarga({ ...SANA, escribir, env }), false);
  assert.deepEqual(salidas, []);
  assert.equal(env[ENV_AVISADA], undefined);
});

test('avisarCarga: no lanza nunca — si medir falla o escribir falla, no dice nada y no bloquea', () => {
  const { escribir, salidas } = escritor();
  const rota = () => {
    throw new Error('boom');
  };
  assert.equal(avisarCarga({ loadavg: rota, cpus: () => 4, escribir, env: {} }), false);
  assert.equal(avisarCarga({ ...SATURADA, escribir: rota, env: {} }), false);
  assert.deepEqual(salidas, []);
});

test('leerProcesos: si `ps` falla o no contesta, devuelve la lista vacía en vez de lanzar', () => {
  const ejecutar = () => {
    throw new Error('ENOENT');
  };
  assert.deepEqual(leerProcesos({ ejecutar }), []);
});

test('leerProcesos: pide a `ps` lo mismo en todas las plataformas y con LC_ALL=C, y lee lo que devuelve', () => {
  let visto;
  const ejecutar = (cmd, args, opciones) => {
    visto = { cmd, args, lc: opciones.env.LC_ALL };
    return PS_MACOS;
  };
  const r = leerProcesos({ ejecutar, excluir: [] });
  assert.deepEqual(visto, { cmd: 'ps', args: ['-Ao', 'pid,%cpu,etime,comm'], lc: 'C' });
  assert.equal(r[0].pid, 4021);
});

// ── `ps` de verdad ───────────────────────────────────────────────────────────────────────────────

const HAY_PS = spawnSync('ps', ['-o', 'pid=', '-p', '1']).error?.code !== 'ENOENT';

test(
  'leerProcesos: con `ps` de verdad ve un proceso vivo y devuelve la lista ordenada por %CPU',
  { skip: !HAY_PS && 'sin `ps` en esta máquina' },
  () => {
    // Un proceso que existe y se va solo a los 20 s, aunque quien lo lanzó muera. No hace falta que
    // queme CPU: aquí se prueba que el comando es válido en ESTE `ps` y que se lee, no cuánto marca
    // (con la máquina saturada, un quemador recién nacido marca poco y el test se pondría rojo justo
    // cuando la carga es alta).
    const durmiente = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 20_000)'], { stdio: 'ignore' });
    try {
      const procs = leerProcesos({ excluir: [process.pid], timeoutMs: 60_000 });
      const suyo = procs.find((p) => p.pid === durmiente.pid);
      assert.ok(suyo, `el proceso ${durmiente.pid} no sale en la lista (${procs.length} filas)`);
      assert.equal(typeof suyo.cpu, 'number');
      assert.match(suyo.comando, /node/);
      assert.match(suyo.etime, /^(\d+-)?(\d+:)?\d+:\d+$/);
      for (let i = 1; i < procs.length; i++) assert.ok(procs[i - 1].cpu >= procs[i].cpu, 'orden descendente por %CPU');
    } finally {
      durmiente.kill('SIGKILL');
    }
  },
);

// ── El cableado, con procesos de verdad ──────────────────────────────────────────────────────────

/** El entorno del padre sin lo que decide el resultado: la marca del aviso, la memoria real y `GIT_*`. */
function entornoLimpio(extra = {}) {
  const env = { ...process.env, NO_COLOR: '1', SC_MEMORY_DIR: join(tmpdir(), 'sc-sin-memoria-inexistente') };
  // La marca del aviso también: si este test corre dentro de `preflight:scope`, el padre la habría puesto.
  for (const k of Object.keys(env)) if (k.startsWith('GIT_') || k === ENV_AVISADA) delete env[k];
  return { ...env, ...extra };
}

/**
 * Un módulo para `--import` que hace creer al proceso que la máquina está en el incidente. Sin costura
 * en producción: el código lee `os.loadavg()` y `os.cpus()` en cada llamada, no al importar.
 */
function preludioSaturado() {
  const dir = mkdtempSync(join(tmpdir(), 'sc-carga-'));
  const f = join(dir, 'saturada.mjs');
  writeFileSync(
    f,
    [
      "import os from 'node:os';",
      'os.loadavg = () => [205.4, 250.1, 310.8];',
      'os.cpus = () => new Array(10).fill({});',
      'os.availableParallelism = () => 10;',
    ].join('\n'),
  );
  return { dir, importa: `--import=${pathToFileURL(f).href}` };
}

test('el CLI que lanza `preverify` avisa por stderr con la máquina saturada y sale con 0', () => {
  const { dir, importa } = preludioSaturado();
  try {
    const r = spawnSync(process.execPath, [importa, PUERTA, '--carga'], { env: entornoLimpio(), encoding: 'utf8', timeout: 180_000 });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stderr, /MÁQUINA SATURADA/);
    assert.match(r.stderr, /20\.5 procesos listos por CPU/);
    assert.equal(r.stdout, '');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('el CLI calla si el padre ya avisó (la marca), y sin --carga solo dice cómo se usa', () => {
  const { dir, importa } = preludioSaturado();
  try {
    const conMarca = spawnSync(process.execPath, [importa, PUERTA, '--carga'], {
      env: entornoLimpio({ [ENV_AVISADA]: '1' }),
      encoding: 'utf8',
      timeout: 180_000,
    });
    assert.equal(conMarca.status, 0);
    assert.equal(conMarca.stderr, '');
    const sinFlag = spawnSync(process.execPath, [importa, PUERTA], { env: entornoLimpio(), encoding: 'utf8', timeout: 180_000 });
    assert.equal(sinFlag.status, 0);
    assert.doesNotMatch(sinFlag.stderr, /SATURADA/);
    assert.match(sinFlag.stderr, /uso: node scripts\/preflight-puerta-barata\.mjs --carga/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('el CLI avisa también si se lo llama por un enlace simbólico: una carpeta enlazada no lo deja mudo', () => {
  // `import.meta.url` viene con los enlaces resueltos y `argv[1]` no: comparados a pelo, el CLI se
  // quedaba sin hacer nada, y un aviso que calla sin que nadie se entere es peor que no tenerlo.
  const { dir, importa } = preludioSaturado();
  const enlace = join(dir, 'enlace.mjs');
  symlinkSync(PUERTA, enlace);
  try {
    const r = spawnSync(process.execPath, [importa, enlace, '--carga'], { env: entornoLimpio(), encoding: 'utf8', timeout: 180_000 });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stderr, /MÁQUINA SATURADA/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('el CLI con la carga REAL de esta máquina sale con 0, avise o no', () => {
  const r = spawnSync(process.execPath, [PUERTA, '--carga'], { env: entornoLimpio(), encoding: 'utf8', timeout: 180_000 });
  assert.equal(r.status, 0, r.stderr);
  if (r.stderr) assert.match(r.stderr, /MÁQUINA SATURADA/, 'si dice algo, es el aviso');
});

/** git sin las variables que un hook exporta (`GIT_DIR`…): un repo temporal no debe caer sobre el de verdad. */
function git(cwd, ...args) {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (k.startsWith('GIT_')) delete env[k];
  execFileSync('git', args, { cwd, env, stdio: 'ignore' });
}

/** Un repo con `origin` y una rama con un cambio en `scripts/`: el carril de la cadena COMPLETA, que corre `npm run preflight`. */
function repoConCambioCompartido(cadena) {
  const raiz = mkdtempSync(join(tmpdir(), 'sc-scope-'));
  const trabajo = join(raiz, 'trabajo');
  git(raiz, 'init', '-q', '--bare', '-b', 'main', 'origin.git');
  git(raiz, 'init', '-q', '-b', 'main', 'trabajo');
  git(trabajo, 'config', 'user.email', 'x@y.z');
  git(trabajo, 'config', 'user.name', 'x');
  writeFileSync(join(trabajo, 'LEEME.md'), 'base');
  git(trabajo, 'add', '-A');
  git(trabajo, 'commit', '-q', '-m', 'base');
  git(trabajo, 'remote', 'add', 'origin', '../origin.git');
  git(trabajo, 'push', '-q', 'origin', 'main');
  git(trabajo, 'checkout', '-q', '-b', 'rama');
  mkdirSync(join(trabajo, 'scripts'));
  writeFileSync(join(trabajo, 'scripts', 'toque.txt'), 'x');
  writeFileSync(join(trabajo, 'package.json'), JSON.stringify({ name: 't', version: '1.0.0', scripts: { preflight: cadena } }));
  git(trabajo, 'add', '-A');
  git(trabajo, 'commit', '-q', '-m', 'cambio');
  return { raiz, trabajo };
}

test('preflight-scope --run avisa ANTES de arrancar la cadena, la arranca igual, y el eslabón de dentro no lo repite', () => {
  const { dir, importa } = preludioSaturado();
  // El `preflight` de juguete hace lo que `verify`: su primer eslabón es el CLI del `preverify`.
  const { raiz, trabajo } = repoConCambioCompartido(`echo CADENA-ARRANCADA && node ${JSON.stringify(PUERTA)} --carga && echo CADENA-SIGUE`);
  try {
    // NODE_OPTIONS (y no `--import` en la línea) para que TODA la descendencia crea que la máquina está
    // saturada: si el eslabón de dentro no callara por la marca, saldría un segundo aviso.
    const r = spawnSync('sh', ['-c', `node ${JSON.stringify(SCOPE)} --run 2>&1`], {
      cwd: trabajo,
      env: entornoLimpio({ NODE_OPTIONS: importa }),
      encoding: 'utf8',
      timeout: 180_000,
    });
    const salida = r.stdout;
    assert.equal(r.status, 0, salida);
    assert.equal((salida.match(/MÁQUINA SATURADA/g) ?? []).length, 1, `el aviso tenía que salir UNA vez:\n${salida}`);
    const aviso = salida.indexOf('MÁQUINA SATURADA');
    const arranca = salida.indexOf('CADENA-ARRANCADA');
    assert.ok(aviso >= 0 && arranca > aviso, `el aviso va ANTES de arrancar la cadena:\n${salida}`);
    assert.ok(salida.includes('CADENA-SIGUE'), 'y la cadena sigue: un aviso no bloquea');
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('npm corre `preverify` antes de `verify`, también cuando otro script lo llama con `npm run`', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-npm-pre-'));
  try {
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 't', version: '1.0.0', scripts: { preverify: 'echo PRE', verify: 'echo VERIFY', preflight: 'npm run verify' } }),
    );
    const r = spawnSync('npm', ['run', 'preflight', '--silent'], { cwd: dir, env: entornoLimpio(), encoding: 'utf8', timeout: 180_000 });
    assert.deepEqual(
      r.stdout.trim().split('\n'),
      ['PRE', 'VERIFY'],
      'con esta configuración de npm (¿ignore-scripts?) `preverify` no corre, y el aviso de `verify` no saldría nunca',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('package.json: `verify` arranca con el aviso, por su gancho `preverify`', () => {
  const pkg = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.preverify, 'node scripts/preflight-puerta-barata.mjs --carga');
  assert.ok(existsSync(PUERTA));
});
