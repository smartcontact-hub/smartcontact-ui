#!/usr/bin/env node
/**
 * `preflight` RÁPIDO — mismos gates, sin el `ng serve`.
 *
 * `preflight` normal tarda ~8,5 min, y la MITAD es que cada suite e2e arranca su propio
 * `ng serve` (build de DESARROLLO, lento). Esto construye las apps en PRODUCCIÓN una vez
 * —lo que el CI ya hace igual—, las sirve estáticas con fallback de SPA, y apunta las
 * suites ahí con `SC_*_URL`. Medido el 2026-08-26:
 *
 *     supervisor   ng serve serie 216s  ->  estático serie   98s
 *     cuscare      ng serve serie 122s  ->  estático //x4     41s
 *
 * NO sacrifica ningún gate: corre `verify`, `guard:lockfile`, los tres builds de prod y
 * las tres suites COMPLETAS. Lo único que cambia es CÓMO se sirven las apps a Playwright,
 * y eso está cubierto por el guardián de build rancio (`asegurarBuildFresco`) más que el
 * `ng serve`, porque aquí el build es explícito y anterior a los tests.
 *
 * ⚠️ Sirve el build que acaba de compilar. Si editas código DESPUÉS de lanzarlo, estás
 * midiendo el de antes — igual que con `ng serve` sin HMR. Es de un tiro, sobre árbol
 * final, como manda LEARNINGS 7.
 *
 * Uso:  npm run preflight:fast
 */
import { execSync, spawn } from "node:child_process";
import { join } from "node:path";

const paso = (cmd, env = {}) => {
  console.log(`\n\x1b[36m▶ ${cmd}\x1b[0m`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
};

const servidores = [];
function servir(dir, port) {
  const p = spawn(
    "node",
    [join("scripts", "spa-server.mjs"), dir, String(port)],
    {
      stdio: "ignore",
    }
  );
  servidores.push(p);
}
function matar() {
  for (const s of servidores) {
    try {
      s.kill();
    } catch {
      /* ya muerto */
    }
  }
}
process.on("exit", matar);
process.on("SIGINT", () => {
  matar();
  process.exit(1);
});

try {
  paso("npm run guard:lockfile");
  paso("npm run verify");
  paso("npm run build:docs");
  paso("npx ng build supervisor --configuration production");
  paso("npx ng build agent --configuration production");
  paso("npx ng build cuscare --configuration production");

  servir("dist/supervisor/browser", 4505);
  servir("dist/cuscare/browser", 4515);
  // un respiro para que los dos escuchen
  execSync("sleep 2");

  paso("CI=1 npm run e2e"); // el smoke usa sc-docs, que ya levanta su propio server rápido
  paso("npm run e2e:supervisor", {
    SC_SUPERVISOR_URL: "http://localhost:4505",
  });
  paso("npm run e2e:cuscare", { SC_CUSCARE_URL: "http://localhost:4515" });

  console.log(
    "\n\x1b[32m✓ preflight:fast en verde — mismos gates, sin el ng serve.\x1b[0m"
  );
} finally {
  matar();
}
