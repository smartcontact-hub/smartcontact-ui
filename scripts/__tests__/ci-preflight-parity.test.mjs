import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { extractCiCommands, checkParity } from "../ci-preflight-parity.mjs";

// El gate anti-drift: preflight (package.json) debe correr lo mismo que ci.yml. Se
// prueba EN VERDE con los ficheros reales y EN ROJO con drift fabricado a mano — un
// gate que solo se ha visto pasar no prueba que sepa fallar (LEARNINGS 2).

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const realYml = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const realPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

test("el repo REAL está en paridad: preflight ≡ ci.yml", () => {
  const preflight = realPkg.scripts?.preflight;
  assert.ok(preflight, "falta el script `preflight` en package.json");
  const { ok, missing, extra } = checkParity(realYml, preflight);
  assert.deepEqual(missing, [], "ci.yml tiene pasos que preflight no corre");
  assert.deepEqual(extra, [], "preflight corre pasos que ci.yml no");
  assert.ok(ok);
});

test("extractCiCommands: parsea block scalar `|` y descarta infra", () => {
  const yml = [
    "    steps:",
    "      - run: npm ci",
    "      - name: build",
    "        run: npx ng build supervisor --configuration production",
    "      - name: e2e smoke",
    "        run: |",
    "          npx playwright install --with-deps chromium",
    "          npm run e2e",
    "      # un comentario a la altura del step no debe colarse",
    "      - run: npm run e2e:cuscare",
  ].join("\n");
  const cmds = extractCiCommands(yml);
  assert.ok(
    cmds.includes("npx ng build supervisor --configuration production")
  );
  assert.ok(
    cmds.includes("npm run e2e"),
    "el comando del block scalar sí entra"
  );
  assert.ok(cmds.includes("npm run e2e:cuscare"));
  // `npm ci` YA cuenta: dejó de ser infra irreplicable el 2026-08-26, cuando se vio que
  // preflight no miraba el primer paso del CI y se colaron seis pushes en rojo. Ahora entra
  // como comando y LOCAL_SUBSTITUTIONS lo mapea a `guard:lockfile`.
  assert.ok(
    cmds.includes("npm ci"),
    "npm ci cuenta y se sustituye por su equivalente local"
  );
  assert.ok(
    !cmds.some((c) => c.startsWith("npx playwright install")),
    "el install es infra"
  );
  assert.ok(
    !cmds.some((c) => c.startsWith("#")),
    "un comentario no es un comando"
  );
});

test("extractCiCommands descarta `npm run build` (setup del DS) pero NO `build:docs`", () => {
  const yml = [
    "      - run: npm ci",
    "      - name: Build DS",
    "        run: npm run build",
    "      - run: npm run e2e:supervisor",
  ].join("\n");
  const cmds = extractCiCommands(yml);
  // `npm run build` construye el DS; en preflight lo hace `verify`, así que aquí es
  // setup, no un paso a replicar. Los jobs de e2e en paralelo lo rehacen y no debe
  // romper la paridad.
  assert.ok(
    !cmds.includes("npm run build"),
    "`npm run build` es setup, no un gate"
  );
  assert.ok(cmds.includes("npm run e2e:supervisor"));
  // pero `build:docs` SÍ es un gate propio (build de sc-docs): NO se filtra.
  assert.ok(
    extractCiCommands("      - run: npm run build:docs").includes(
      "npm run build:docs"
    ),
    "build:docs no es setup, es un paso real"
  );
});

test("DRIFT: un paso NUEVO en el CI que preflight no corre → lo caza (missing)", () => {
  const yml = "      - run: npm run verify\n      - run: npm run e2e:newapp";
  const { ok, missing } = checkParity(yml, "npm run verify");
  assert.equal(ok, false);
  assert.deepEqual(missing, ["npm run e2e:newapp"]);
});

test("DRIFT inverso: preflight corre algo que el CI no → lo caza (extra)", () => {
  const yml = "      - run: npm run verify";
  const { ok, extra } = checkParity(
    yml,
    "npm run verify && npm run e2e:orphan"
  );
  assert.equal(ok, false);
  assert.deepEqual(extra, ["npm run e2e:orphan"]);
});

test("la sustitución local vale: CI `npm run e2e` ≡ preflight `CI=1 npm run e2e`", () => {
  const yml = "      - run: npm run verify\n      - run: npm run e2e";
  const { ok, missing, extra } = checkParity(
    yml,
    "npm run verify && CI=1 npm run e2e"
  );
  assert.deepEqual(missing, []);
  assert.deepEqual(extra, []);
  assert.ok(ok);
});

test("y NO vale correr un subconjunto: `e2e:structure` ya no cuela como el smoke", () => {
  const yml = "      - run: npm run verify\n      - run: npm run e2e";
  const { ok, missing, extra } = checkParity(
    yml,
    "npm run verify && npm run e2e:structure"
  );
  assert.equal(ok, false);
  assert.deepEqual(missing, ["CI=1 npm run e2e"]);
  assert.deepEqual(extra, ["npm run e2e:structure"]);
});

// `preflight:fast` es un carril alterno (sirve el build estático en vez de `ng serve`),
// pero DEBE correr los mismos pasos que el CI, o se convierte en el atajo que ejecuta de
// menos. No es un `&&`-chain: extrae sus `paso('...')` y comprueba que no falta ninguno.
test("el repo REAL: preflight:fast corre lo mismo que ci.yml", () => {
  const fast = readFileSync(join(root, "scripts/preflight-fast.mjs"), "utf8");
  const comandos = [...fast.matchAll(/paso\(\s*['"]([^'"]+)['"]/g)].map(
    (m) => m[1]
  );
  assert.ok(
    comandos.length > 0,
    "no se extrajo ningún `paso(...)` de preflight-fast.mjs"
  );
  const { missing } = checkParity(realYml, comandos.join(" && "));
  assert.deepEqual(
    missing,
    [],
    "preflight:fast se saltó un paso que el CI sí corre"
  );
});
