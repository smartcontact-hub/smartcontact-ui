/**
 * LA PUERTA BARATA DEL PREFLIGHT — lo que cuesta milisegundos no se descubre en el minuto cuatro.
 *
 * De dónde sale (2026-09-11 y 2026-09-12, dos veces el mismo día): una cadena de 8 minutos murió
 * en el CHECK N de `docs:coherence` porque una ficha de la MEMORIA del agente medía más de 250
 * palabras. Esa comprobación no lee nada del build ni de los tokens: son unos milisegundos de
 * `readdir` sobre un directorio que está FUERA del repo. Corría en el paso 33 de 38 sólo porque
 * vive dentro de `docs:coherence`, que sí depende de los generadores de tokens.
 *
 * Y hay una segunda razón, más fea, para adelantarla: la memoria es estado COMPARTIDO entre
 * sesiones. Cualquier chat abierto puede engordar una ficha y tumbarte una cadena que no tiene
 * nada que ver con lo tuyo. Enterarte en el segundo 2 te deja esperar o recortar; enterarte en el
 * minuto 4 te cuesta la cadena entera dos veces.
 *
 * Qué NO es: no sustituye al gate. `docs:coherence` sigue comprobándolo dentro de `verify` y en el
 * CI, que es donde tiene que estar. Esto solo lo adelanta para quien lanza la cadena en local.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────────
 * LA SEGUNDA COSA QUE SE VE EN MILISEGUNDOS: SI LA MÁQUINA ESTÁ SATURADA (2026-09-29).
 *
 * Medido el 2026-09-28/29 en el Mac del mantenedor: carga de 205 a 330 durante horas (`uptime`), por
 * procesos de fuera del repo —un servicio de Codex y varios renderizadores de Chrome y Comet al ~100 %
 * de CPU y con días vivos; 850 procesos—. `npm run verify` tardó unas 9 h y cayó en `test:unit` por dos
 * tests con reloj que no tenían nada que ver con el cambio: `estadoDelArbol` de `stop-guard.test.mjs`,
 * cuyos `git` llevan `timeout: 4000` (pasado, devuelve `{ seguro: null }`), y la suite de juguete de
 * `playwright-reuse-guard.test.mjs`, que se corta a los 90 s. El `preflight:scope` de otra sesión
 * llevaba más de 14 h. Nadie lo supo hasta horas después: ni `node -e` contestaba en menos de un minuto.
 *
 * Así que la cadena lo dice al ARRANCAR y en voz alta: la carga, quién la consume y qué tests pueden
 * caer con cualquier cambio. Lo que NO hace es bloquear (decisión de producto, 2026-09-29): una pasada
 * que sale verde con la máquina así sigue valiendo, y negarse a correr dejaría al mantenedor sin cadena
 * justo cuando más la espera. Por eso vive AL LADO de la puerta y no dentro de ella: `puertaBarata`
 * devuelve PROBLEMAS y con uno la cadena no arranca; el aviso se imprime y la cadena arranca igual.
 *
 * DÓNDE SE DISPARA. En `preflight-scope.mjs`, bajo `--run` y antes de la puerta; y como `preverify` de
 * `package.json`, que npm corre antes de `verify` aunque lo llame otro script (`preflight`) o alguien lo
 * teclee a mano: el `verify` de 9 h se lanzó directo, sin pasar por la puerta. `preflight-scope` deja
 * `ENV_AVISADA` en el entorno y el `preverify` de dentro calla, para no decir lo mismo dos veces.
 *
 * EL UMBRAL, MEDIDO. `UMBRAL_CARGA` = 4 procesos listos por CPU: `os.loadavg()[0] / os.cpus().length`.
 *   · Reposo, en el contenedor donde se midió (Linux, 4 CPUs): carga 0,01–0,10, o sea 0,03 por CPU. El
 *     reposo del Mac no se puede medir desde allí; en una línea se lee:
 *     `node -e "const o=require('os');console.log(o.loadavg()[0]/o.cpus().length)"`.
 *   · Con K quemadores de CPU (razón K/4) todo se estira casi en proporción a la razón: `node -e 0` pasa de
 *     32 ms a 128 (razón 4) y a 538 (razón 16); los dos ficheros de test, de 1,3 s y 2,2 s en reposo a
 *     5,3 y 8,7 s (razón 4) y a 19,7 y 27,6 s (razón 16). Con razón 4 una cadena de 8 minutos ya tarda
 *     más de media hora: es lo mínimo que uno quiere que le avisen.
 *   · Esa curva NO predice los rojos del Mac. Allí cayeron con 20–33 por CPU (205–330 en los 10 núcleos
 *     que citan DD-116 y `en-paralelo.mjs`) y aquí, con razón 16, ninguno de los dos cae: harían falta
 *     ~40 para el corte de 90 s y ~1000 para el `timeout: 4000`. La saturación real degradó mucho más que
 *     el reparto de CPU, así que el umbral sale del hueco entre lo normal (a partir de 1 por CPU, una
 *     máquina ocupada) y lo medido allí, no de esta curva. 4 queda por encima de lo ocupado y cinco veces
 *     por debajo del incidente.
 */
import { execFileSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { cliente as clienteDeGithub, ddsAnadidas } from "./github.mjs";

export { ddsAnadidas };
import { localizarMemoria, leerMemoria, revisarMemoria } from "./memory-shape.mjs";

/**
 * Los problemas que se pueden ver SIN construir nada. Devuelve la lista (vacía = puerta abierta).
 *
 * `localizarMemoria` puede no encontrar nada (CI, otra máquina): ahí no hay nada que mirar y la
 * puerta se abre — igual que hace el CHECK N, que se omite en vez de fallar.
 */
export function puertaBarata(cwd = process.cwd()) {
  const dir = localizarMemoria(cwd);
  if (!dir || !existsSync(dir)) return [];
  return revisarMemoria(leerMemoria(dir)).map((p) => `memoria (${dir}) — ${p}`);
}

// ── Los ficheros generados, al día ───────────────────────────────────────────────────────────────

/**
 * LA TERCERA COSA QUE SE VE EN UN SEGUNDO: los ficheros GENERADOS al día (2026-10-04). El preflight de #325 se relanzó
 * tres veces porque, tras minutos de cadena, `verify` paró en `audit:components`, `audit:doc-snippets` y `usage:check`,
 * que tardan menos de un segundo entre los tres (medido: 0,6 + 0,1 + 0,1 s). Leen fuentes, no el build: pueden ir antes.
 * Como la memoria, no sustituyen al gate: siguen en `verify` y en el CI.
 */
export const GENERADOS = [
  { script: "scripts/component-audit.mjs", args: ["check"], arreglo: "node scripts/component-audit.mjs --write" },
  {
    script: "scripts/audit-doc-snippets.mjs",
    args: [],
    arreglo: "cada entrada pública nueva, en un ejemplo o un knob de su página (npm run audit:doc-snippets dice cuál)",
  },
  { script: "scripts/usage-status.mjs", args: ["check"], arreglo: "node scripts/usage-status.mjs --write" },
];

const correrNode = (g, cwd) => {
  // Un árbol sin esa herramienta (el repo de juguete de las pruebas) no tiene nada que regenerar.
  if (!existsSync(join(cwd, g.script))) return true;
  try {
    execFileSync(process.execPath, [g.script, ...g.args], { cwd, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

/** Los generados que no están al día, cada uno con su arreglo. `correr` se inyecta en las pruebas. */
export function generadosAlDia({ cwd = process.cwd(), correr = correrNode } = {}) {
  return GENERADOS.filter((g) => !correr(g, cwd)).map(
    (g) => `${[g.script, ...g.args].join(" ")} no está al día → ${g.arreglo}`
  );
}

// ── El aviso de máquina saturada ─────────────────────────────────────────────────────────────────

/** Procesos listos por CPU (`os.loadavg()[0] / os.cpus().length`) desde los que se avisa; inclusivo. */
export const UMBRAL_CARGA = 4;

/** La marca con la que un eslabón le dice a los de dentro «ya avisé»: `preflight-scope` → el `preverify`. */
export const ENV_AVISADA = "SC_CARGA_AVISADA";

/** Cuántos procesos se nombran: cinco caben en pantalla y bastan para ver quién es. */
const MAX_CONSUMIDORES = 5;

/**
 * Los tests cuyo verde depende del reloj: con la máquina saturada pueden caer con cualquier cambio.
 * `ancla` es un trozo del nombre que la prueba tiene en su fichero, y un test comprueba que sigue ahí:
 * un puntero que apunta a algo que se movió manda a buscar donde ya no está (LEARNINGS #17).
 */
export const TESTS_CON_RELOJ = [
  {
    fichero: "scripts/__tests__/stop-guard.test.mjs",
    ancla: "estadoDelArbol: lo mide del repo de verdad",
    motivo:
      "«estadoDelArbol: lo mide del repo de verdad…»: sus git llevan `timeout: 4000` (4 s) y, pasado, devuelve { seguro: null }",
  },
  {
    fichero: "scripts/__tests__/playwright-reuse-guard.test.mjs",
    ancla: "la rama CI de reuseOnlyOwnServer",
    motivo: "su suite de juguete de Playwright se corta a los 90 s",
  },
];

const REGLA = "━".repeat(72);
const nombreDe = (comando) => String(comando).split("/").pop();

/** ¿Está la máquina por encima del umbral? Sin dato fiable (CPUs a 0, NaN, `[0,0,0]` de Windows), no. */
const saturada = (carga1, cpus, umbral) =>
  Number.isFinite(carga1) && Number.isFinite(cpus) && cpus >= 1 && carga1 / cpus >= umbral;

// Una fila de `ps -Ao pid,%cpu,etime,comm`. `comm` es lo último y puede llevar espacios (en macOS es la
// ruta entera: «…/Google Chrome Helper (Renderer)»), y `%cpu` sale con coma decimal en algunos idiomas.
const FILA_PS = /^\s*(\d+)\s+(\d+(?:[.,]\d+)?)\s+(\S+)\s+(.+?)\s*$/;

/**
 * La salida de `ps -Ao pid,%cpu,etime,comm` como lista de `{ pid, cpu, etime, comando }`, ordenada por
 * %CPU descendente. Ordena aquí y no se fía del `ps`: el `-r` de macOS ordena por CPU, pero en Linux
 * (procps) `-r` significa «solo los que están corriendo» y no ordena nada.
 */
export function parsearPs(texto, { excluir = [] } = {}) {
  const fuera = new Set(excluir);
  const filas = [];
  for (const linea of String(texto ?? "").split("\n")) {
    const m = FILA_PS.exec(linea); // la cabecera («PID %CPU …») no empieza por un número: no casa
    if (!m) continue;
    const pid = Number(m[1]);
    const comando = m[4];
    if (fuera.has(pid) || nombreDe(comando) === "ps") continue;
    filas.push({ pid, cpu: Number(m[2].replace(",", ".")), etime: m[3], comando });
  }
  return filas.sort((a, b) => b.cpu - a.cpu || a.pid - b.pid);
}

/**
 * Los procesos vivos por %CPU, de `ps` de verdad. Lista vacía si `ps` no está o no contesta a tiempo: el
 * aviso sale igual, sin la lista, porque con la máquina ahogada es justo cuando `ps` tarda.
 *
 * `LC_ALL=C` para que `%cpu` salga con punto. Por defecto no cuenta a este proceso ni a su padre (el
 * `npm` que lo lanza), que en un `ps` de Linux —%CPU de toda su vida— salen altos por acabar de nacer.
 */
export function leerProcesos({ ejecutar = execFileSync, excluir = [process.pid, process.ppid], timeoutMs = 5000 } = {}) {
  try {
    const salida = ejecutar("ps", ["-Ao", "pid,%cpu,etime,comm"], {
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
      env: { ...process.env, LC_ALL: "C" },
    });
    return parsearPs(salida, { excluir });
  } catch {
    return [];
  }
}

/** Cuántas CPUs tiene la máquina; 0 si no hay forma de saberlo (nunca se divide por él: `saturada` lo mira). */
export function numCpus(o = os) {
  const n = o.cpus().length;
  if (n >= 1) return n;
  return typeof o.availableParallelism === "function" ? o.availableParallelism() : 0;
}

/**
 * El aviso, o `null` si no hay nada que avisar (o no hay dato). Función pura de los hechos que se le
 * pasan —carga a 1/5/15 min, CPUs y procesos—, como `estadoRebase`, para poder probarla con el incidente
 * fabricado. Manda la carga de 1 minuto: es la de AHORA, y una de 5 o 15 altas con la de 1 ya baja es una
 * máquina que se está recuperando.
 */
export function avisoDeCarga({ carga, cpus, consumidores = [], umbral = UMBRAL_CARGA } = {}) {
  const [l1, l5, l15] = Array.isArray(carga) ? carga : [];
  if (!saturada(l1, cpus, umbral)) return null;
  const uno = (x) => (Number.isFinite(x) ? x.toFixed(1) : "?");
  const top = [...(consumidores ?? [])].sort((a, b) => b.cpu - a.cpu).slice(0, MAX_CONSUMIDORES);
  const lineas = [
    REGLA,
    `⚠️  MÁQUINA SATURADA: ${uno(l1 / cpus)} procesos listos por CPU (el aviso salta desde ${umbral}).`,
    `    Carga a 1 / 5 / 15 min: ${uno(l1)} / ${uno(l5)} / ${uno(l15)} en ${cpus} CPUs.`,
    "",
  ];
  if (top.length) {
    lineas.push("    Quién la consume (`ps`, por %CPU):");
    for (const p of top)
      lineas.push(
        `      pid ${String(p.pid).padStart(6)}  ${p.cpu.toFixed(1).padStart(6)} %  ${String(p.etime).padEnd(11)}  ${nombreDe(p.comando)}`,
      );
  } else {
    lineas.push("    Quién la consume: no pude leer `ps`. Míralo tú: `ps -Ao pid,%cpu,etime,comm -r | head`.");
  }
  lineas.push("", "    Con la máquina así, estos tests con reloj pueden salir rojos con CUALQUIER cambio:");
  for (const t of TESTS_CON_RELOJ) lineas.push(`      · ${t.fichero} — ${t.motivo}.`);
  lineas.push(
    "",
    "    Esto NO bloquea: una pasada que sale verde bajo carga sigue valiendo, y la cadena sigue.",
    "    Si cae uno de esos tests, repítelo solo con la máquina libre antes de tocar código (LEARNINGS #5):",
    "      node --test <fichero>",
    REGLA,
  );
  return lineas.join("\n");
}

/**
 * Mide la máquina y compone el aviso (o `null`). Todo se inyecta. Se lee `os` en CADA llamada y no al
 * importar: así un test puede sustituir `os.loadavg` en un proceso hijo sin ninguna costura aquí.
 * En una máquina sana cuesta una lectura de `os`: `ps` solo se llama si hay algo que avisar.
 */
export function avisoActual({
  loadavg = () => os.loadavg(),
  cpus = () => numCpus(),
  procesos = () => leerProcesos(),
  umbral = UMBRAL_CARGA,
} = {}) {
  const carga = loadavg();
  const n = cpus();
  if (!saturada(carga?.[0], n, umbral)) return null;
  let consumidores = [];
  try {
    consumidores = procesos();
  } catch {
    /* el aviso sale igual, sin lista */
  }
  return avisoDeCarga({ carga, cpus: n, consumidores, umbral });
}

function escribirEnStderr(texto) {
  // Amarillo y negrita solo con una terminal delante y si nadie pidió lo contrario (NO_COLOR): en un log,
  // texto plano.
  const color = process.stderr.isTTY && !process.env.NO_COLOR;
  process.stderr.write(`${color ? `\x1b[1;33m${texto}\x1b[0m` : texto}\n`);
}

/**
 * Imprime el aviso si toca y deja `ENV_AVISADA` para que los eslabones de dentro no lo repitan. Devuelve
 * si imprimió. NO LANZA NUNCA y no decide nada sobre la cadena: un aviso que falla no puede tumbar la
 * cadena que venía a avisar.
 */
export function avisarCarga({ escribir = escribirEnStderr, env = process.env, ...medidas } = {}) {
  try {
    if (env[ENV_AVISADA]) return false;
    const aviso = avisoActual(medidas);
    if (!aviso) return false;
    escribir(aviso);
    env[ENV_AVISADA] = "1";
    return true;
  } catch {
    return false;
  }
}

/* ─── EL TERCER AVISO: OTRO PR ABIERTO TOCA TUS LEDGERS (LEARNINGS #21, 2026-10-05) ──────────────────────────────
 *
 * Un ledger compartido (`DECISIONS`, `LEARNINGS`, `inventory`, los hand-offs y `AGENTS`) que tocan dos PRs abiertos a
 * la vez se pisa en silencio al fundir el segundo: el conflicto, si sale, sale en GitHub y tarde (roto el 2026-09-15
 * con #196). `main-drift-guard` mira lo que YA entró en `main`; esto mira lo que va a entrar. Como la carga, avisa y no
 * bloquea: dos PRs pueden tocar el mismo hand-off sin pisarse, y el orden de fundir lo decide quien funde. Sin red o
 * sin `gh`, calla. */

/** Los ledgers de LEARNINGS #21, por ruta desde la raíz. */
export const LEDGERS = [/^docs\/DECISIONS\.md$/, /^LEARNINGS\.md$/, /^docs\/inventory\.md$/, /^docs\/handoff\/[^/]+$/, /^AGENTS\.md$/];

export const esLedger = (fichero) => LEDGERS.some((re) => re.test(fichero));

/** Los PRs abiertos de OTRAS ramas que tocan alguno de tus ledgers, con los que comparten. Pura. */
export function cruceDeLedgers({ mios = [], prs = [], rama = "" } = {}) {
  const misLedgers = new Set(mios.filter(esLedger));
  return prs
    .filter((pr) => pr.headRefName !== rama)
    .map((pr) => ({ number: pr.number, rama: pr.headRefName, ficheros: (pr.ficheros ?? []).filter((f) => misLedgers.has(f)) }))
    .filter((c) => c.ficheros.length > 0);
}

/** El aviso, o `null` sin cruce. Pura. */
export function avisoDeLedgers(cruces = []) {
  if (!cruces.length) return null;
  const lineas = [REGLA, "⚠️  OTRO PR ABIERTO TOCA TUS LEDGERS (LEARNINGS #21): el segundo en fundirse se pisa en silencio.", ""];
  for (const c of cruces) lineas.push(`    #${c.number} (${c.rama}): ${c.ficheros.join(", ")}`);
  lineas.push("", "    Esto NO bloquea. Antes de fundir, trae `main` con el otro ya dentro y relee esos ficheros.", REGLA);
  return lineas.join("\n");
}

/**
 * Pregunta a GitHub y avisa si hay cruce; devuelve si escribió. NO LANZA NUNCA. Si la rama no toca ningún ledger, no
 * pregunta nada: una llamada por PR abierto solo se paga cuando hay algo que cruzar.
 */
export function avisarLedgers({ mios = [], rama = "", cliente, escribir = escribirEnStderr } = {}) {
  try {
    if (!mios.some(esLedger)) return false;
    const gh = cliente ?? clienteDeGithub();
    const prs = gh
      .prsAbiertos(() => false)
      .filter((pr) => pr.headRefName !== rama)
      .map((pr) => ({ ...pr, ficheros: gh.ficherosDePr(pr.number) }));
    const aviso = avisoDeLedgers(cruceDeLedgers({ mios, prs, rama }));
    if (!aviso) return false;
    escribir(aviso);
    return true;
  } catch {
    return false;
  }
}

/* EL NÚMERO DE DD, frente a los PR abiertos. El 2026-10-05 tres PR abiertos usaron DD-172 a la vez: cada uno miró
 * `main`, y en `main` el 172 estaba libre. Como el de ledgers, avisa sin bloquear y calla sin red (DD-175). */

/** Tus DD que ya usa otro PR abierto, y el siguiente libre (el mayor de `main` y de los PR, más uno); `null` si no chocan. Pura. */
export function choqueDeDds({ mias = [], maxMain = 0, prs = [], rama = "" } = {}) {
  const otros = prs.filter((pr) => pr.headRefName !== rama);
  const choques = mias
    .map((dd) => ({ dd, prs: otros.filter((pr) => (pr.dds ?? []).includes(dd)).map((pr) => pr.number) }))
    .filter((c) => c.prs.length > 0);
  if (!choques.length) return null;
  const siguiente = Math.max(maxMain, ...otros.flatMap((pr) => pr.dds ?? [])) + 1;
  return { choques, siguiente };
}

/** El aviso del choque, listo para imprimir. Pura. */
export function avisoDeDds({ choques, siguiente }) {
  const lineas = [REGLA, "⚠️  OTRO PR ABIERTO YA USA TU NÚMERO DE DD: al fundir el segundo, habrá dos con el mismo número.", ""];
  for (const c of choques) lineas.push(`    DD-${c.dd}: también en ${c.prs.map((n) => `#${n}`).join(", ")}`);
  lineas.push("", `    Esto NO bloquea. El siguiente libre, mirando main y los PR abiertos: DD-${siguiente}.`, REGLA);
  return lineas.join("\n");
}

/** Pregunta a GitHub y avisa si tus DD chocan; devuelve si escribió. NO LANZA NUNCA; sin DD propia no pregunta. */
export function avisarDds({ mias = [], maxMain = 0, rama = "", cliente, escribir = escribirEnStderr } = {}) {
  try {
    if (!mias.length) return false;
    const gh = cliente ?? clienteDeGithub();
    const prs = gh
      .prsAbiertos(() => false)
      .filter((pr) => pr.headRefName !== rama)
      .map((pr) => ({ ...pr, dds: gh.ddsDePr(pr.number) }));
    const choque = choqueDeDds({ mias, maxMain, prs, rama });
    if (!choque) return false;
    escribir(avisoDeDds(choque));
    return true;
  } catch {
    return false;
  }
}

/** Las DD que añade tu rama respecto a `origin/main`, y la mayor de `origin/main`. Sin git legible, nada. */
export function ddsDeRama(cwd = process.cwd()) {
  try {
    const g = (args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });
    const base = g(["merge-base", "HEAD", "origin/main"]).trim();
    const mias = ddsAnadidas(g(["diff", base, "--", "docs/DECISIONS.md"]));
    const enMain = [...g(["show", "origin/main:docs/DECISIONS.md"]).matchAll(/^## DD-(\d+)\b/gm)].map((m) => Number(m[1]));
    return { mias, maxMain: Math.max(0, ...enMain) };
  } catch {
    return { mias: [], maxMain: 0 };
  }
}

// `realpathSync` porque `import.meta.url` viene con los enlaces simbólicos resueltos y `argv[1]` no: en una
// carpeta enlazada el CLI se quedaría mudo, que es justo lo que un aviso no puede hacer sin que nadie se entere.
const esPrincipal = () => {
  try {
    return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
};

if (esPrincipal()) {
  // Lo lanza npm como `preverify`: solo avisa, y pase lo que pase sale con 0.
  if (process.argv.includes("--carga")) avisarCarga();
  else console.error("uso: node scripts/preflight-puerta-barata.mjs --carga   (avisa si la máquina está saturada; nunca falla)");
}
