import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { extractCiCommands, checkParity, ciOnlyRancios, CI_ONLY } from "../ci-preflight-parity.mjs";

// El gate anti-drift: preflight (package.json) debe correr lo mismo que ci.yml. Se
// prueba EN VERDE con los ficheros reales y EN ROJO con drift fabricado a mano — un
// gate que solo se ha visto pasar no prueba que sepa fallar (LEARNINGS 2).

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const realYml = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const realPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

test("el repo REAL está en paridad: preflight ≡ ci.yml menos CI_ONLY, y CI_ONLY no está rancia", () => {
  const preflight = realPkg.scripts?.preflight;
  assert.ok(preflight, "falta el script `preflight` en package.json");
  const { ok, missing, extra } = checkParity(realYml, preflight);
  assert.deepEqual(missing, [], "ci.yml tiene pasos que preflight no corre (y no están en CI_ONLY)");
  assert.deepEqual(extra, [], "preflight corre pasos que ci.yml no");
  assert.ok(ok);
  assert.deepEqual(ciOnlyRancios(realYml), [], "CI_ONLY cita pasos que ci.yml ya no corre");
  for (const c of CI_ONLY) assert.ok(!preflight.includes(c), `${c} es CI_ONLY y sigue en preflight`);
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

test("CI_ONLY: los e2e corren en el CI y NO en preflight, y eso no es drift (DD-60)", () => {
  const yml = "      - run: npm run verify\n      - run: npm run e2e\n      - run: npm run e2e:supervisor";
  const { ok, missing, extra } = checkParity(yml, "npm run verify");
  assert.deepEqual(missing, []);
  assert.deepEqual(extra, []);
  assert.ok(ok);
});

test("y sigue sin valer un subconjunto: `e2e:structure` en preflight es un paso que el CI no corre", () => {
  const yml = "      - run: npm run verify\n      - run: npm run e2e";
  const { ok, extra } = checkParity(yml, "npm run verify && npm run e2e:structure");
  assert.equal(ok, false);
  assert.deepEqual(extra, ["npm run e2e:structure"]);
});

test("un e2e NUEVO en el CI que no esté en CI_ONLY sigue siendo drift (missing)", () => {
  const yml = "      - run: npm run verify\n      - run: npm run e2e:otra-app";
  const { ok, missing } = checkParity(yml, "npm run verify");
  assert.equal(ok, false);
  assert.deepEqual(missing, ["npm run e2e:otra-app"]);
});

test("CI_ONLY rancia: un paso de la lista que ci.yml ya no corre se denuncia", () => {
  const yml = "      - run: npm run verify\n      - run: npm run e2e";
  assert.deepEqual(ciOnlyRancios(yml), ["npm run e2e:supervisor", "npm run e2e:cuscare"]);
  assert.deepEqual(ciOnlyRancios(realYml), []);
});

test('la marca de preflight (solo local) no cuenta como paso extra, pero otro paso local sí', () => {
  const base = realPkg.scripts.preflight;
  assert.ok(checkParity(realYml, base).ok);
  const conMarcaDoble = base + ' && node scripts/preflight-mark.mjs preflight:scope';
  assert.ok(checkParity(realYml, conMarcaDoble).ok, 'preflight-mark no es un gate: se filtra');
  const conGateLocal = base + ' && npm run typecheck';
  assert.deepEqual(checkParity(realYml, conGateLocal).extra, ['npm run typecheck'], 'un gate local de más sí es drift');
});
