#!/usr/bin/env node
/**
 * ACELERADOR de `preflight`, con la boca muy grande sobre lo que se salta.
 *
 * `preflight` tarda ~10 min y **7 de esos 10 son las tres suites e2e**. Pero dos de ellas
 * conducen apps —`supervisor` y `cuscare`— que un cambio confinado a `projects/agent` no
 * puede romper: ninguna suite toca la app `agent`.
 *
 * Esto mira QUÉ has tocado y decide si hace falta la cadena entera:
 *
 *   · si el cambio roza código COMPARTIDO (las libs del DS, los tokens, la config de la
 *     raíz, los scripts, los e2e) -> **cadena completa**, sin discusión;
 *   · si se queda en UNA app -> se salta las suites de las OTRAS apps y sus builds.
 *
 * ⚠️ NO sustituye a `preflight`, y por eso imprime **siempre** lo que deja fuera. Un carril
 * rápido que no dice lo que no corrió es como el que en s30 cambiaba `npm run e2e` por
 * `e2e:structure` y ejecutaba 1 test de 68 mientras el gate salía verde.
 *
 * Uso:  node scripts/preflight-scope.mjs          (imprime el plan)
 *       node scripts/preflight-scope.mjs --run    (además lo ejecuta)
 */
import { execSync, execFileSync } from "node:child_process";

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

const APPS = ["agent", "supervisor", "cuscare", "sc-docs"];

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

// Carril acotado: verify + los builds de las apps tocadas + las suites que SÍ las cubren.
const suitePorApp = { supervisor: "e2e:supervisor", cuscare: "e2e:cuscare" };
const pasos = [
  "npm run guard:lockfile",
  "npm run verify",
  "npm run build:docs",
];
for (const a of appsTocadas) {
  pasos.push(`npx ng build ${a} --configuration production`);
}
pasos.push("CI=1 npm run e2e");
const suites = appsTocadas.map((a) => suitePorApp[a]).filter(Boolean);
pasos.push(...suites.map((s) => `npm run ${s}`));

const saltadas = Object.values(suitePorApp).filter((s) => !suites.includes(s));
const buildsSaltados = APPS.filter(
  (a) => !appsTocadas.includes(a) && a !== "sc-docs"
);

console.log("\nCARRIL ACOTADO. Se corre:");
for (const p of pasos) {
  console.log(`    ${p}`);
}
console.log("\n⚠️ SE SALTA, y esto es lo que estás aceptando:");
for (const s of saltadas) {
  console.log(`    npm run ${s}  (ninguna app tocada la usa)`);
}
for (const b of buildsSaltados) {
  console.log(`    npx ng build ${b}  (sin cambios bajo projects/${b}/)`);
}
if (
  !appsTocadas.includes("agent") &&
  ficheros.some((f) => f.startsWith("projects/agent/"))
) {
  console.log(
    "    (agent no tiene suite e2e: su red es tools/, no Playwright)"
  );
}
console.log(
  "\nSi dudas, corre `npm run preflight` entero. Esto es un atajo, no un sustituto.\n"
);

if (process.argv.includes("--run")) {
  for (const p of pasos) {
    console.log(`\n▶ ${p}`);
    execSync(p, { stdio: "inherit" });
  }
}
