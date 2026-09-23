#!/usr/bin/env node
/**
 * ACELERADOR de `preflight`, con la boca muy grande sobre lo que se salta.
 *
 * Desde DD-60 (2026-09-09) `preflight` ya no corre las suites e2e (viven en el CI, obligatorio
 * y paralelo): son gates estáticos + los builds AOT de las apps, ~8 min. Este carril mira QUÉ
 * has tocado y decide si hacen falta todos los builds:
 *
 *   · si el cambio roza código COMPARTIDO (las libs del DS, los tokens, la config de la
 *     raíz, los scripts, los e2e) -> **cadena completa**, sin discusión;
 *   · si se queda en UNA app -> se salta los builds AOT de las OTRAS apps.
 *
 * ⚠️ NO sustituye a `preflight`, y por eso imprime **siempre** lo que deja fuera. Un carril
 * rápido que no dice lo que no corrió es como el que en s30 cambiaba `npm run e2e` por
 * `e2e:structure` y ejecutaba 1 test de 68 mientras el gate salía verde.
 *
 * Uso:  node scripts/preflight-scope.mjs          (imprime el plan)
 *       node scripts/preflight-scope.mjs --run    (además lo ejecuta)
 */
import { execSync, execFileSync } from "node:child_process";
import { medirRebase } from "./preflight-rebase.mjs";
import { puertaBarata } from "./preflight-puerta-barata.mjs";
import { enParalelo } from "./en-paralelo.mjs";

// Antes de mirar qué cambió, y antes de gastar un minuto: ¿la rama lleva `origin/main`? Un
// preflight sobre una rama rezagada mide un árbol que nunca se pushea tal cual (2026-09-11: dos
// cadenas de 8 min tiradas porque main avanzó entre el preflight y el push). El fetch de aquí
// deja además `origin/main` fresco para el `git diff` de abajo.
{
  const rebase = medirRebase(process.cwd());
  if (rebase.aviso) console.log(`⚠️ ${rebase.aviso}`);
  if (!rebase.ok) {
    console.error(`\n✗ ${rebase.motivo}\n`);
    if (process.argv.includes("--run")) process.exit(2);
    console.log("(solo se imprime el plan; con --run esto habría parado aquí)\n");
  }
}

/** Tocar cualquiera de estas obliga a la cadena completa. */
const COMPARTIDO = [
  /^projects\/ui-smartcontact/,
  /^projects\/design-tokens/,
  /^scripts\//,
  /^e2e\//,
  /^package(-lock)?\.json$/,
  /^tsconfig/,
  /^playwright.*\.config\.ts$/,
  /^\.github\//,
  /^eslint\.config\.js$/,
];

/** Lo que NO afecta a ningún runtime. */
const INOCUO = [
  /^findings\//,
  /^docs\//,
  /^\.cache\//,
  /^tools\//,
  /^[^/]*\.md$/,
];

const APPS = ["agent", "agent-mini", "supervisor", "cuscare", "sc-docs"];

function cambios() {
  const salida = execSync("git status --porcelain", { encoding: "utf8" });
  const sinCommitear = salida
    .split("\n")
    .map((l) => l.slice(3).trim())
    .filter(Boolean);
  let contraMain = [];
  try {
    contraMain = execSync("git diff --name-only origin/main..HEAD", {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);
  } catch {
    /* sin remoto: nos quedamos con lo que haya sin commitear */
  }
  return [...new Set([...sinCommitear, ...contraMain])];
}

const ficheros = cambios();
if (ficheros.length === 0) {
  console.log(
    "No hay cambios contra `origin/main`. No hay nada que verificar."
  );
  process.exit(0);
}

const compartidos = ficheros.filter((f) => COMPARTIDO.some((re) => re.test(f)));
const relevantes = ficheros.filter((f) => !INOCUO.some((re) => re.test(f)));
const appsTocadas = APPS.filter((a) =>
  ficheros.some((f) => f.startsWith(`projects/${a}/`))
);

const completo = compartidos.length > 0;

console.log(
  `\nficheros cambiados: ${ficheros.length} (${relevantes.length} con efecto en runtime)`
);
if (appsTocadas.length) {
  console.log(`apps tocadas: ${appsTocadas.join(", ")}`);
}

/* La PUERTA BARATA va antes de cualquier cadena: lo que se puede comprobar en milisegundos no
 * se descubre en el minuto cuatro. Ver `preflight-puerta-barata.mjs`. */
if (process.argv.includes("--run")) {
  const problemas = puertaBarata(process.cwd());
  if (problemas.length) {
    console.log("\n✘ La cadena NO arranca: hay algo que se comprueba en 2 s y falla.\n");
    for (const q of problemas) console.log(`    · ${q}`);
    console.log(
      "\n  Esto lo mide `docs:coherence` (CHECK N) en el minuto cuatro de la cadena; aquí sale ya." +
        "\n  ⚠️ La memoria es COMPARTIDA entre sesiones: si la engordó otra, mira su fecha antes de" +
        "\n     recortarla, y si lleva rato parada, recórtala tú — su ficha bloquea TU preflight.\n",
    );
    process.exit(1);
  }
}

if (completo) {
  console.log("\nCADENA COMPLETA — hay cambios en código compartido:");
  for (const f of compartidos.slice(0, 8)) {
    console.log(`    ${f}`);
  }
  if (compartidos.length > 8) {
    console.log(`    …y ${compartidos.length - 8} más`);
  }
  console.log("\n    npm run preflight\n");
  if (process.argv.includes("--run")) {
    execFileSync("npm", ["run", "preflight"], { stdio: "inherit" });
  }
  process.exit(0);
}

// Carril acotado: verify + los builds de las apps tocadas. Las suites e2e las corre el CI (DD-60).
// Como en `preflight`: el DS lo construye `verify`, y luego sc-docs y las apps tocadas compilan a
// la vez (`en-paralelo.mjs`).
const pasos = ["npm run guard:lockfile", "npm run verify"];
const builds = ["npm run build:docs:app"];
for (const a of appsTocadas) {
  if (a !== "sc-docs") builds.push(`npx ng build ${a} --configuration production`);
}
const buildsSaltados = APPS.filter(
  (a) => !appsTocadas.includes(a) && a !== "sc-docs"
);

console.log("\nCARRIL ACOTADO. Se corre:");
for (const p of pasos) {
  console.log(`    ${p}`);
}
console.log(`    en paralelo: ${builds.join(" · ")}`);
console.log("\n⚠️ SE SALTA, y esto es lo que estás aceptando:");
for (const b of buildsSaltados) {
  console.log(`    npx ng build ${b}  (sin cambios bajo projects/${b}/)`);
}
console.log("    (ninguna suite e2e va en ningún carril, tampoco las capturas de sc-docs: las corre el CI; si tocaste una, córrela a mano)");
console.log(
  "\nSi dudas, corre `npm run preflight` entero. Esto es un atajo, no un sustituto.\n"
);

if (process.argv.includes("--run")) {
  for (const p of pasos) {
    console.log(`\n▶ ${p}`);
    execSync(p, { stdio: "inherit" });
  }
  console.log(`\n▶ en paralelo: ${builds.join(" · ")}`);
  if (!(await enParalelo(builds))) process.exit(1);
  // Carril acotado en verde: marca el árbol para el hook de push (LEARNINGS #7). La marca dice
  // QUÉ carril pasó; lo que se saltó quedó impreso arriba.
  execSync("node scripts/preflight-mark.mjs preflight:scope", { stdio: "inherit" });
}
