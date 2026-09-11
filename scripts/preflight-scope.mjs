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
const pasos = [
  "npm run guard:lockfile",
  "npm run verify",
  "npm run build:docs",
];
for (const a of appsTocadas) {
  pasos.push(`npx ng build ${a} --configuration production`);
}
/* Las baselines visuales (2 min) solo miran el CATÁLOGO de sc-docs, así que en el carril
 * acotado se corren solo si el cambio puede haberlo movido: la propia app o el DS que pinta
 * sus componentes. Un cambio en `supervisor` no puede tocarlas. En `preflight` entero van
 * siempre (DD-62). */
const tocaCatalogo = ficheros.some(
  (f) =>
    f.startsWith("projects/sc-docs/") ||
    f.startsWith("projects/ui-smartcontact/") ||
    f.startsWith("projects/design-tokens/") ||
    f.startsWith("e2e/components.spec")
);
if (tocaCatalogo) {
  pasos.push("npm run e2e:visual");
}
const buildsSaltados = APPS.filter(
  (a) => !appsTocadas.includes(a) && a !== "sc-docs"
);

console.log("\nCARRIL ACOTADO. Se corre:");
for (const p of pasos) {
  console.log(`    ${p}`);
}
console.log("\n⚠️ SE SALTA, y esto es lo que estás aceptando:");
for (const b of buildsSaltados) {
  console.log(`    npx ng build ${b}  (sin cambios bajo projects/${b}/)`);
}
if (!tocaCatalogo) {
  console.log("    npm run e2e:visual  (el cambio no toca sc-docs ni el DS)");
}
console.log("    (las suites e2e de APP no van en ningún carril: las corre el CI; si tocaste una, córrela a mano)");
console.log(
  "\nSi dudas, corre `npm run preflight` entero. Esto es un atajo, no un sustituto.\n"
);

if (process.argv.includes("--run")) {
  for (const p of pasos) {
    console.log(`\n▶ ${p}`);
    execSync(p, { stdio: "inherit" });
  }
  // Carril acotado en verde: marca el árbol para el hook de push (LEARNINGS #7). La marca dice
  // QUÉ carril pasó; lo que se saltó quedó impreso arriba.
  execSync("node scripts/preflight-mark.mjs preflight:scope", { stdio: "inherit" });
}
